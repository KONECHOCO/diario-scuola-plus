import { Capacitor } from '@capacitor/core'
import { NativePurchases, PURCHASE_TYPE, type Transaction } from '@capgo/native-purchases'
import { monetizationConfig } from './config'

// Ad-free state:
//  - purchased: "Remove ads" one-time purchase. Cached in localStorage so
//    paying users never see the launch ad while the store is still answering;
//    the store is re-checked on every launch (refunds revoke it).
//  - temporary: granted by watching a rewarded video (see ads.ts).
const PURCHASE_CACHE_KEY = 'monetization.adFree'
const TEMP_UNTIL_KEY = 'monetization.adFreeUntil'
const productId = monetizationConfig.removeAdsProductId

type Listener = () => void
const listeners = new Set<Listener>()

let purchased = readStorage(PURCHASE_CACHE_KEY) === '1'
let tempUntil = Number(readStorage(TEMP_UNTIL_KEY) || 0)
let priceString: string | undefined
let refreshPromise: Promise<boolean> | undefined
let expiryTimer: ReturnType<typeof setTimeout> | undefined

export const purchasesEnabled = Capacitor.isNativePlatform()

scheduleTempExpiry()

export function isPurchased() {
  return purchased
}

export function isAdFree() {
  return purchased || tempUntil > Date.now()
}

/** Epoch ms until which the rewarded-video ad-free window lasts (0 if none). */
export function getAdFreeUntil() {
  return tempUntil > Date.now() ? tempUntil : 0
}

export function getRemoveAdsPrice() {
  return priceString
}

export function subscribePremium(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function grantTemporaryAdFree(ms: number) {
  tempUntil = Date.now() + ms
  writeStorage(TEMP_UNTIL_KEY, String(tempUntil))
  scheduleTempExpiry()
  notify()
}

/** Checks the store once per launch; resolves to the purchased state. */
export function refreshEntitlement() {
  if (!purchasesEnabled) return Promise.resolve(purchased)
  refreshPromise ??= loadEntitlement()
  return refreshPromise
}

export async function purchaseRemoveAds() {
  const transaction = await NativePurchases.purchaseProduct({
    productIdentifier: productId,
    productType: PURCHASE_TYPE.INAPP,
    isConsumable: false,
    autoAcknowledgePurchases: true,
  })
  if (isValid(transaction)) setPurchased(true)
  return purchased
}

export async function restoreRemoveAds() {
  await NativePurchases.restorePurchases()
  refreshPromise = loadEntitlement()
  return refreshPromise
}

async function loadEntitlement() {
  void loadPrice()
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP })
    setPurchased(purchases.some((p) => p.productIdentifier === productId && isValid(p)))
  } catch (error) {
    // Offline or store unavailable: keep the cached state.
    console.warn('[premium] Verifica acquisti fallita', error)
  }
  return purchased
}

async function loadPrice() {
  try {
    const { product } = await NativePurchases.getProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.INAPP,
    })
    priceString = product.priceString
    notify()
  } catch (error) {
    console.warn('[premium] Prodotto non disponibile', error)
  }
}

function isValid(transaction: Transaction) {
  if (Capacitor.getPlatform() === 'android') return transaction.purchaseState === '1'
  return !transaction.revocationDate
}

function setPurchased(value: boolean) {
  if (purchased === value) return
  purchased = value
  if (value) writeStorage(PURCHASE_CACHE_KEY, '1')
  else writeStorage(PURCHASE_CACHE_KEY, undefined)
  notify()
}

function scheduleTempExpiry() {
  if (expiryTimer) clearTimeout(expiryTimer)
  const remaining = tempUntil - Date.now()
  if (remaining > 0) expiryTimer = setTimeout(notify, remaining + 250)
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | undefined) {
  try {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage unavailable: the store check still runs on every launch.
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}
