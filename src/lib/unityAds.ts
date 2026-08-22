import { UnityAds } from 'capacitor-unity-ads'
import { Capacitor } from '@capacitor/core'

const UNITY_GAME_ID_ANDROID = import.meta.env.VITE_UNITY_GAME_ID_ANDROID || '800360436'
const UNITY_GAME_ID_IOS = import.meta.env.VITE_UNITY_GAME_ID_IOS || '800360437'
const INTERSTITIAL_PLACEMENT = Capacitor.getPlatform() === 'ios' ? 'Interstitial_iOS' : 'Interstitial_Android'

export const USE_UNITY_ADS = import.meta.env.VITE_USE_UNITY_ADS === 'true'

let initialized = false
let shownThisSession = false

export async function initUnityAds(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return
  initialized = true

  const gameId = Capacitor.getPlatform() === 'ios' ? UNITY_GAME_ID_IOS : UNITY_GAME_ID_ANDROID
  await UnityAds.initialize({ gameId, testMode: !!import.meta.env.DEV })
  await UnityAds.loadInterstitial({ placementId: INTERSTITIAL_PLACEMENT })
}

export async function showInterstitialOnce(): Promise<void> {
  if (!Capacitor.isNativePlatform() || shownThisSession) return
  shownThisSession = true

  try {
    const { loaded } = await UnityAds.isInterstitialLoaded()
    if (loaded) {
      await UnityAds.showInterstitial()
    }
  } catch {
    // ad non disponibile, ignora
  }
}
