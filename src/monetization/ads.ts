import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from '@capacitor-community/admob'
import { UnityAds } from 'capacitor-unity-ads'
import { monetizationConfig } from './config'
import {
  grantTemporaryAdFree,
  isAdFree,
  isPurchased,
  refreshEntitlement,
  subscribePremium,
} from './premium'

// Ads stack:
//  - Unity Ads (direct SDK): full-screen video on every cold start, then at
//    most one interstitial every INTERSTITIAL_INTERVAL_MS, shown only when the
//    user changes section (never while typing, recording or in a Pomodoro),
//    and the opt-in rewarded video (→ REWARDED_AD_FREE_MS without ads).
//  - AdMob: bottom banner only (non-personalized unless tracking is allowed).
//    Keeping AdMob out of full-screen ads avoids its "ads on app open" policy.
// Nothing is shown while the user is ad-free (purchase or rewarded window).
//
// Env (Codemagic): VITE_UNITY_GAME_ID[_IOS|_ANDROID], VITE_UNITY_*_PLACEMENT_ID[_IOS|_ANDROID],
// VITE_ADMOB_BANNER_ID[_IOS|_ANDROID], VITE_ADS_TEST_MODE.

const INTERSTITIAL_INTERVAL_MS = 5 * 60_000
// If the launch video isn't ready by then, skip it rather than interrupting
// the user once they've started using the app.
const LAUNCH_AD_TIMEOUT_MS = 8_000
// A stuck SDK must never hold back the banner or the rest of the app.
const SDK_INIT_TIMEOUT_MS = 10_000
export const REWARDED_AD_FREE_MS = 30 * 60_000

const platform = Capacitor.getPlatform()
const env = import.meta.env
const pick = (ios?: string, android?: string, shared?: string) =>
  ((platform === 'ios' ? ios : android) || shared)?.trim() || undefined
const suffix = platform === 'ios' ? 'iOS' : 'Android'

const gameId = pick(env.VITE_UNITY_GAME_ID_IOS, env.VITE_UNITY_GAME_ID_ANDROID, env.VITE_UNITY_GAME_ID)
const interstitialPlacementId =
  pick(
    env.VITE_UNITY_INTERSTITIAL_PLACEMENT_ID_IOS,
    env.VITE_UNITY_INTERSTITIAL_PLACEMENT_ID_ANDROID,
    env.VITE_UNITY_INTERSTITIAL_PLACEMENT_ID,
  ) ?? `Interstitial_${suffix}`
const rewardedPlacementId = pick(
  env.VITE_UNITY_REWARDED_PLACEMENT_ID_IOS,
  env.VITE_UNITY_REWARDED_PLACEMENT_ID_ANDROID,
  env.VITE_UNITY_REWARDED_PLACEMENT_ID,
)
const bannerAdId = pick(env.VITE_ADMOB_BANNER_ID_IOS, env.VITE_ADMOB_BANNER_ID_ANDROID, env.VITE_ADMOB_BANNER_ID)
const isTesting = env.VITE_ADS_TEST_MODE !== 'false'

let bootPromise: Promise<boolean> | undefined
let admobReady = false
let interstitialShowing = false
let lastFullScreenAt = 0
let bannerShown = false
let launchDone = false
let personalizedAllowed = false
const pausedBy = new Set<string>()
const diagnostics: string[] = []

/** Short ad-stack log, shown by the hidden panel in RemoveAdsButton (TestFlight debugging). */
export function getAdsDiagnostics() {
  return [
    `gameId=${gameId ?? '-'} inter=${interstitialPlacementId} reward=${rewardedPlacementId ?? '-'}`,
    `banner=${bannerAdId ?? '-'} test=${isTesting} adFree=${isAdFree()} purchased=${isPurchased()}`,
    ...diagnostics,
  ].join('\n')
}

function note(message: string, error?: unknown) {
  const detail = error === undefined ? '' : `: ${String((error as Error)?.message ?? error)}`
  diagnostics.push(`${new Date().toLocaleTimeString()} ${message}${detail}`)
  if (diagnostics.length > 30) diagnostics.shift()
  if (error !== undefined) console.warn('[ads]', message, error)
}

export const adsEnabled = Capacitor.isNativePlatform() && Boolean(gameId || bannerAdId)
export const rewardedEnabled = Capacitor.isNativePlatform() && Boolean(gameId && rewardedPlacementId)

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

/** Called on every section change: shows an interstitial if 5 minutes have passed. */
export async function showInterstitialAfterNavigation() {
  if (!gameId || !launchDone || pausedBy.size > 0 || isAdFree()) return
  if (Date.now() - lastFullScreenAt < INTERSTITIAL_INTERVAL_MS) return
  if (!(await bootstrapAds())) return
  await showInterstitial()
}

/**
 * Opt-in rewarded video. Resolves true once the user watched it to the end;
 * that grants the temporary ad-free window.
 */
export async function showRewardedForAdFree() {
  if (!rewardedPlacementId || !gameId || !(await bootstrapAds())) return false

  try {
    const { loaded } = await UnityAds.isRewardedVideoLoaded()
    if (!loaded) {
      note('rewarded not loaded on tap')
      void loadRewarded()
      return false
    }
    const { success } = await UnityAds.showRewardedVideo()
    if (success) grantTemporaryAdFree(REWARDED_AD_FREE_MS)
    lastFullScreenAt = Date.now()
    return success
  } catch (error) {
    note('rewarded show failed', error)
    return false
  } finally {
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
  // Paying users: never touch the ad SDKs at all.
  if (isPurchased() || (await refreshEntitlementQuickly())) {
    note('purchased: ads off')
    return false
  }

  // AdMob first: consent form and ATT prompt must come before Unity starts.
  await initializeAdMob()
  await initializeUnity()

  subscribePremium(() => {
    if (isAdFree()) void removeBanner()
    else void restoreAds()
  })

  void showLaunchAd()
  return true
}

async function initializeAdMob() {
  if (!bannerAdId) return
  // Google-certified consent (UMP) for EEA/UK users. A consent error (e.g. no
  // message configured in AdMob) must not stop the banner.
  try {
    const consent = await AdMob.requestConsentInfo()
    note(`consent ${consent.status}`)
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
    await AdMob.initialize({ initializeForTesting: isTesting })
    await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error) => note('banner no fill', error?.message ?? error?.code))
    await AdMob.addListener(BannerAdPluginEvents.Loaded, () => note('banner loaded'))
    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      // Keep page content (and the bottom tab bar) above the native banner.
      document.documentElement.style.setProperty('--ad-banner-height', `${size.height}px`)
    })
    admobReady = true
    note('admob ready')
  } catch (error) {
    note('admob init failed', error)
  }
}

async function initializeUnity() {
  if (!gameId) return
  try {
    await withTimeout(UnityAds.initialize({ gameId, testMode: isTesting }), SDK_INIT_TIMEOUT_MS)
    note('unity ready')
    void loadInterstitial()
    void loadRewarded()
  } catch (error) {
    note('unity init failed', error)
  }
}

// The store answer usually arrives in well under a second; don't hold the
// ad SDKs hostage if it doesn't.
function refreshEntitlementQuickly() {
  return Promise.race([refreshEntitlement(), wait(1_500).then(() => false)])
}

async function showLaunchAd() {
  if (gameId && !isAdFree()) {
    const deadline = Date.now() + LAUNCH_AD_TIMEOUT_MS
    let ready = false
    while (!ready && Date.now() < deadline) {
      ready = await UnityAds.isInterstitialLoaded()
        .then((r) => r.loaded)
        .catch(() => false)
      if (!ready) await wait(250)
    }
    if (ready && !isAdFree()) await showInterstitial()
    else if (!ready) note('launch video not ready in time')
  }
  // The 5-minute interval starts now, whether or not the launch video played.
  lastFullScreenAt = Date.now()
  launchDone = true
  // Banner after the launch video so the two don't load at the same time.
  if (!isAdFree()) await createBanner()
}

async function showInterstitial() {
  if (interstitialShowing) return
  interstitialShowing = true
  try {
    const { loaded } = await UnityAds.isInterstitialLoaded()
    if (!loaded) return
    await UnityAds.showInterstitial()
    lastFullScreenAt = Date.now()
    note('interstitial shown')
  } catch (error) {
    note('interstitial show failed', error)
  } finally {
    interstitialShowing = false
    void loadInterstitial()
  }
}

async function createBanner() {
  if (!bannerAdId || !admobReady || bannerShown) return
  bannerShown = true

  try {
    await AdMob.showBanner({
      adId: bannerAdId,
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

async function loadInterstitial() {
  if (!gameId || isAdFree()) return
  try {
    await UnityAds.loadInterstitial({ placementId: interstitialPlacementId })
    note('interstitial loaded')
  } catch (error) {
    note('interstitial load failed', error)
  }
}

async function loadRewarded() {
  if (!gameId || !rewardedPlacementId || isPurchased()) return
  try {
    await UnityAds.loadRewardedVideo({ placementId: rewardedPlacementId })
    note('rewarded loaded')
  } catch (error) {
    note('rewarded load failed', error)
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

// Rewarded window expired: bring banner and interstitials back.
async function restoreAds() {
  if (!launchDone) return
  await createBanner()
  await loadInterstitial()
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
