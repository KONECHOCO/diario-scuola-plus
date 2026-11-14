import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import {
  AdMob,
  AdmobConsentStatus,
  AppOpenAdPluginEvents,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  MaxAdContentRating,
  RewardAdPluginEvents,
} from '@capacitor-community/admob'
import { monetizationConfig } from './config'
import { attachAdMobListeners } from '../referral'
import {
  grantTemporaryAdFree,
  isAdFree,
  isPurchased,
  refreshEntitlement,
  subscribePremium,
} from './premium'

// Ads stack — AdMob only (same scheme as OmniTransit):
//  - App Open ad at every cold start (interstitial as fallback if it isn't ready).
//  - App Open ad when coming back after RESUME_MIN_BACKGROUND_MS in background.
//  - Interstitial every INTERSTITIAL_EVERY_N_ACTIONS section changes, at least
//    MIN_GAP_MS after the previous full-screen ad. Never while recording or
//    during a Pomodoro (pauseInterstitials).
//  - Bottom banner.
//  - Opt-in rewarded video → REWARDED_AD_FREE_MS without ads.
// Nothing is shown to Pro users or during a rewarded ad-free window.
//
// Env (Codemagic): VITE_ADMOB_{BANNER,APP_OPEN,INTERSTITIAL,REWARDED}_ID[_IOS|_ANDROID], VITE_ADS_TEST_MODE.

const INTERSTITIAL_EVERY_N_ACTIONS = 2
const MIN_GAP_MS = 45_000
const RESUME_MIN_BACKGROUND_MS = 20_000
// If no launch ad is ready by then, skip it rather than interrupting the user.
const LAUNCH_AD_TIMEOUT_MS = 8_000
// A stuck SDK must never hold back the rest of the app.
const SDK_INIT_TIMEOUT_MS = 10_000
// Safety net if a "closed" event never arrives.
const FULLSCREEN_MAX_MS = 3 * 60_000
export const REWARDED_AD_FREE_MS = 30 * 60_000

const platform = Capacitor.getPlatform()
const env = import.meta.env
const pick = (ios?: string, android?: string, shared?: string) =>
  ((platform === 'ios' ? ios : android) || shared)?.trim() || undefined

const isTesting = env.VITE_ADS_TEST_MODE !== 'false'

// Google's official test units (https://developers.google.com/admob/android/test-ads):
// used whenever test mode is on, so real units are never clicked during development.
const TEST_IDS = {
  android: {
    banner: 'ca-app-pub-3940256099942544/9214589741',
    appOpen: 'ca-app-pub-3940256099942544/9257395921',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
  ios: {
    banner: 'ca-app-pub-3940256099942544/2435281174',
    appOpen: 'ca-app-pub-3940256099942544/5575463023',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
  },
}
const REAL_IDS = {
  banner: pick(env.VITE_ADMOB_BANNER_ID_IOS, env.VITE_ADMOB_BANNER_ID_ANDROID, env.VITE_ADMOB_BANNER_ID),
  appOpen: pick(env.VITE_ADMOB_APP_OPEN_ID_IOS, env.VITE_ADMOB_APP_OPEN_ID_ANDROID, env.VITE_ADMOB_APP_OPEN_ID),
  interstitial: pick(env.VITE_ADMOB_INTERSTITIAL_ID_IOS, env.VITE_ADMOB_INTERSTITIAL_ID_ANDROID, env.VITE_ADMOB_INTERSTITIAL_ID),
  rewarded: pick(env.VITE_ADMOB_REWARDED_ID_IOS, env.VITE_ADMOB_REWARDED_ID_ANDROID, env.VITE_ADMOB_REWARDED_ID),
}
const AD_IDS: Partial<typeof REAL_IDS> = isTesting ? TEST_IDS[platform === 'ios' ? 'ios' : 'android'] : REAL_IDS

let bootPromise: Promise<boolean> | undefined
let admobReady = false
let appOpenLoaded = false
let interstitialLoaded = false
let rewardedLoaded = false
let fullScreenShowing = false
let fullScreenTimer: ReturnType<typeof setTimeout> | undefined
let lastFullScreenAt = 0
let actionCount = 0
let backgroundedAt = 0
let bannerShown = false
let launchDone = false
let personalizedAllowed = false
const pausedBy = new Set<string>()
const diagnostics: string[] = []

/** Short ad-stack log, shown by the hidden panel in RemoveAdsButton (long press on "Restore purchases"). */
export function getAdsDiagnostics() {
  return [
    `banner=${AD_IDS.banner ?? '-'}`,
    `appOpen=${AD_IDS.appOpen ?? '-'} loaded=${appOpenLoaded}`,
    `inter=${AD_IDS.interstitial ?? '-'} loaded=${interstitialLoaded}`,
    `reward=${AD_IDS.rewarded ?? '-'} loaded=${rewardedLoaded}`,
    `ready=${admobReady} test=${isTesting} adFree=${isAdFree()} pro=${isPurchased()}`,
    ...diagnostics,
  ].join('\n')
}

function note(message: string, error?: unknown) {
  const detail = error === undefined ? '' : `: ${String((error as Error)?.message ?? error)}`
  diagnostics.push(`${new Date().toLocaleTimeString()} ${message}${detail}`)
  if (diagnostics.length > 40) diagnostics.shift()
  if (error !== undefined) console.warn('[ads]', message, error)
}

export const adsEnabled = Capacitor.isNativePlatform() && Boolean(AD_IDS.banner || AD_IDS.appOpen || AD_IDS.interstitial)
export const rewardedEnabled = Capacitor.isNativePlatform() && Boolean(AD_IDS.rewarded)

export function bootstrapAds() {
  if (!adsEnabled) return Promise.resolve(false)

  bootPromise ??= initializeAds()
  return bootPromise
}

/**
 * Pauses interstitials while something must not be interrupted (a running
 * Pomodoro, an audio recording). Pass the same reason to resume.
 */
export function pauseInterstitials(reason: string, paused: boolean) {
  if (paused) pausedBy.add(reason)
  else pausedBy.delete(reason)
}

/** Called on every section change: an interstitial every N changes, spaced by MIN_GAP_MS. */
export async function showInterstitialAfterNavigation() {
  if (!launchDone || pausedBy.size > 0 || isAdFree()) return
  actionCount += 1
  if (actionCount < INTERSTITIAL_EVERY_N_ACTIONS) return
  if (Date.now() - lastFullScreenAt < MIN_GAP_MS) return
  if (await showInterstitial()) actionCount = 0
}

/**
 * Opt-in rewarded video. Resolves true once the user watched it to the end;
 * that grants the temporary ad-free window.
 */
export async function showRewardedForAdFree() {
  if (!rewardedEnabled || !(await bootstrapAds()) || !admobReady) return false
  if (!rewardedLoaded) {
    note('rewarded not loaded on tap')
    void loadRewarded()
    return false
  }

  rewardedLoaded = false
  fullScreenShowing = true
  let earned = false
  const handles = [await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => (earned = true))]
  try {
    const closed = new Promise<void>((resolve) => {
      void AdMob.addListener(RewardAdPluginEvents.Dismissed, () => resolve()).then((h) => handles.push(h))
      void AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => resolve()).then((h) => handles.push(h))
      setTimeout(resolve, FULLSCREEN_MAX_MS)
    })
    await AdMob.showRewardVideoAd()
    await closed
    if (earned) grantTemporaryAdFree(REWARDED_AD_FREE_MS)
    note(`rewarded closed, earned=${earned}`)
    return earned
  } catch (error) {
    note('rewarded failed', error)
    return false
  } finally {
    handles.forEach((h) => void h.remove())
    fullScreenEnded()
    void loadRewarded()
  }
}

export async function showPrivacyOptions() {
  if (!(await bootstrapAds()) || !admobReady) return

  try {
    await AdMob.showPrivacyOptionsForm()
  } catch (error) {
    note('privacy options unavailable', error)
  }
}

async function initializeAds() {
  // Paying users: never touch the ad SDK at all.
  if (isPurchased() || (await refreshEntitlementQuickly())) {
    note('pro: ads off')
    return false
  }

  await initializeAdMob()
  if (!admobReady) return false

  subscribePremium(() => {
    if (isAdFree()) void removeBanner()
    else void restoreAds()
  })

  void CapApp.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      // A full-screen ad can pause the app (separate activity on Android): not a real background.
      if (!fullScreenShowing) backgroundedAt = Date.now()
      return
    }
    const away = backgroundedAt ? Date.now() - backgroundedAt : 0
    backgroundedAt = 0
    if (away >= RESUME_MIN_BACKGROUND_MS) void showResumeAd()
  })

  void showLaunchAd()
  return true
}

async function initializeAdMob() {
  // Google-certified consent (UMP) for EEA/UK users. A consent error (e.g. no
  // message configured in AdMob) must not stop the ads.
  try {
    const consent = await AdMob.requestConsentInfo()
    note(`consent ${consent.status} canRequestAds=${consent.canRequestAds}`)
    if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm()
    }
  } catch (error) {
    note('consent failed', error)
  }
  try {
    // App Tracking Transparency only for apps whose App Privacy declares tracking.
    if (monetizationConfig.requestTracking && platform === 'ios') {
      await AdMob.requestTrackingAuthorization().catch(() => undefined)
      const { status } = await AdMob.trackingAuthorizationStatus().catch(() => ({ status: 'denied' as const }))
      personalizedAllowed = status === 'authorized'
    }
    // Students from 13 up: only ads rated for teens.
    await withTimeout(
      AdMob.initialize({ initializeForTesting: isTesting, maxAdContentRating: MaxAdContentRating.Teen }),
      SDK_INIT_TIMEOUT_MS,
    )
    // Ambassador program: counts ads seen by invited users (no-op for everyone else).
    attachAdMobListeners(AdMob, { BannerAdPluginEvents, AppOpenAdPluginEvents, InterstitialAdPluginEvents, RewardAdPluginEvents })
    await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => note('banner no fill', error?.message ?? error?.code))
    await AdMob.addListener(BannerAdPluginEvents.Loaded, () => note('banner loaded'))
    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      // Keep page content (and the bottom tab bar) above the native banner.
      document.documentElement.style.setProperty('--ad-banner-height', `${size.height}px`)
    })
    await AdMob.addListener(AppOpenAdPluginEvents.Closed, () => {
      fullScreenEnded('app open closed')
      void loadAppOpen()
    })
    await AdMob.addListener(AppOpenAdPluginEvents.FailedToShow, () => {
      fullScreenEnded('app open failed to show')
      void loadAppOpen()
    })
    await AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      fullScreenEnded('interstitial closed')
      void loadInterstitial()
    })
    await AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
      fullScreenEnded('interstitial failed to show')
      void loadInterstitial()
    })
    admobReady = true
    note('admob ready')
    void loadInterstitial()
    void loadRewarded()
  } catch (error) {
    note('admob init failed', error)
  }
}

// The store answer usually arrives in well under a second; don't hold the
// ad SDK hostage if it doesn't.
function refreshEntitlementQuickly() {
  return Promise.race([refreshEntitlement(), wait(1_500).then(() => false)])
}

async function showLaunchAd() {
  if (!isAdFree()) {
    // App Open first; the interstitial is the fallback if App Open has no fill in time.
    await Promise.race([loadAppOpen(), wait(LAUNCH_AD_TIMEOUT_MS)])
    let shown = !isAdFree() && (await showAppOpen())
    if (!shown && !isAdFree()) {
      const deadline = Date.now() + 2_000
      while (!interstitialLoaded && Date.now() < deadline) await wait(250)
      shown = await showInterstitial()
    }
    if (!shown) note('launch ad: no fill in time')
  }
  launchDone = true
  // Banner after the launch ad so the two don't load at the same time.
  if (!isAdFree()) await createBanner()
}

async function showResumeAd() {
  if (!launchDone || pausedBy.size > 0 || isAdFree()) return
  if (Date.now() - lastFullScreenAt < MIN_GAP_MS) return
  if (!appOpenLoaded) {
    void loadAppOpen()
    return
  }
  await showAppOpen()
}

async function showAppOpen() {
  if (fullScreenShowing || !appOpenLoaded) return false
  appOpenLoaded = false
  fullScreenStarted()
  try {
    await AdMob.showAppOpen()
    note('app open shown')
    return true
  } catch (error) {
    fullScreenEnded()
    note('app open show failed', error)
    void loadAppOpen()
    return false
  }
}

async function showInterstitial() {
  if (fullScreenShowing || !interstitialLoaded || isAdFree()) return false
  interstitialLoaded = false
  fullScreenStarted()
  try {
    await AdMob.showInterstitial()
    note('interstitial shown')
    return true
  } catch (error) {
    fullScreenEnded()
    note('interstitial show failed', error)
    void loadInterstitial()
    return false
  }
}

function fullScreenStarted() {
  fullScreenShowing = true
  lastFullScreenAt = Date.now()
  clearTimeout(fullScreenTimer)
  fullScreenTimer = setTimeout(() => fullScreenEnded('full-screen timeout'), FULLSCREEN_MAX_MS)
}

function fullScreenEnded(message?: string) {
  if (message) note(message)
  clearTimeout(fullScreenTimer)
  if (fullScreenShowing) {
    fullScreenShowing = false
    // The gap counts from the end of the ad, not from its start.
    lastFullScreenAt = Date.now()
  }
}

async function loadAppOpen() {
  if (!admobReady || !AD_IDS.appOpen || appOpenLoaded || isAdFree()) return
  try {
    await AdMob.loadAppOpen({ adId: AD_IDS.appOpen })
    appOpenLoaded = true
    note('app open loaded')
  } catch (error) {
    note('app open no fill', error)
  }
}

async function loadInterstitial() {
  if (!admobReady || !AD_IDS.interstitial || interstitialLoaded || isAdFree()) return
  try {
    await AdMob.prepareInterstitial({ adId: AD_IDS.interstitial, isTesting, npa: !personalizedAllowed })
    interstitialLoaded = true
    note('interstitial loaded')
  } catch (error) {
    note('interstitial no fill', error)
    // A "no fill" now can be a fill in a minute.
    setTimeout(() => void loadInterstitial(), 60_000)
  }
}

async function loadRewarded() {
  if (!admobReady || !AD_IDS.rewarded || rewardedLoaded || isPurchased()) return
  try {
    await AdMob.prepareRewardVideoAd({ adId: AD_IDS.rewarded, isTesting, npa: !personalizedAllowed })
    rewardedLoaded = true
    note('rewarded loaded')
  } catch (error) {
    note('rewarded no fill', error)
    setTimeout(() => void loadRewarded(), 120_000)
  }
}

async function createBanner() {
  if (!AD_IDS.banner || !admobReady || bannerShown) return
  bannerShown = true

  try {
    await AdMob.showBanner({
      adId: AD_IDS.banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting,
      // Non-personalized unless the user allowed tracking (apps with requestTracking).
      npa: !personalizedAllowed,
    })
    note('banner requested')
  } catch (error) {
    bannerShown = false
    note('banner failed', error)
  }
}

async function removeBanner() {
  if (!bannerShown) return
  bannerShown = false
  document.documentElement.style.setProperty('--ad-banner-height', '0px')
  try {
    await AdMob.removeBanner()
  } catch (error) {
    note('banner not removed', error)
  }
}

// Rewarded window expired: bring banner and full-screen ads back.
async function restoreAds() {
  if (!launchDone) return
  await createBanner()
  void loadInterstitial()
  void loadAppOpen()
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    wait(ms).then(() => {
      throw new Error(`timeout after ${ms} ms`)
    }),
  ])
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
