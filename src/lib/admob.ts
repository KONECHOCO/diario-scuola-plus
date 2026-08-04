import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob'
import { Capacitor } from '@capacitor/core'

const TEST_BANNER = 'ca-app-pub-3940256099942544/2934735716'
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/4411468910'

const PROD_BANNER = import.meta.env.VITE_ADMOB_BANNER_ID || TEST_BANNER
const PROD_INTERSTITIAL = import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || TEST_INTERSTITIAL

export const ADMOB_BANNER_ID = import.meta.env.DEV ? TEST_BANNER : PROD_BANNER
export const ADMOB_INTERSTITIAL_ID = import.meta.env.DEV ? TEST_INTERSTITIAL : PROD_INTERSTITIAL

let initialized = false

export async function initAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return

  await AdMob.initialize({ testingDevices: [] })
  initialized = true
}

export async function showBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  const options: BannerAdOptions = {
    adId: ADMOB_BANNER_ID,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: !!import.meta.env.DEV,
  }

  await AdMob.showBanner(options)
}

export async function hideBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await AdMob.hideBanner()
  } catch {
    // banner non presente, ignora
  }
}

export async function removeBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await AdMob.removeBanner()
  } catch {
    // banner non presente, ignora
  }
}
