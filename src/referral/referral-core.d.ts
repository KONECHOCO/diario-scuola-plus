// Types for referral-core.js (programma ambasciatori Ikonet)
export interface ReferralState {
  enabled: boolean
  code: string | null
  registered: boolean
  firstSeen: number
}
export type SetCodeResult = 'ok' | 'invalid' | 'expired' | 'network'

export function configureReferral(cfg: { api: string; key: string; appId: string; appVersion?: string; prefix?: string }): void
export function getReferralState(): ReferralState
export function subscribeReferral(cb: () => void): () => void
export function canEnterCode(s?: ReferralState): boolean
export function initReferral(): Promise<void>
export function applyInstallReferrer(raw: string | null | undefined): Promise<boolean>
export function setReferralCode(raw: string): Promise<SetCodeResult>
export function trackImpression(valueMicros?: number): void
export function trackRevenue(valueMicros?: number): void
export function trackClick(): void
export function trackPurchase(): void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function attachAdMobListeners(AdMob: any, events: Record<string, any>): void
