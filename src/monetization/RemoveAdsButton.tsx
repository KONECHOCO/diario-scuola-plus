import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Sparkles } from 'lucide-react'
import { useT } from '../i18n/useT'
import { getAdsDiagnostics, rewardedEnabled, showRewardedForAdFree } from './ads'
import {
  getAdFreeUntil,
  getRemoveAdsPrice,
  isPurchased,
  purchaseRemoveAds,
  purchasesEnabled,
  refreshEntitlement,
  restoreRemoveAds,
  subscribePremium,
} from './premium'

/**
 * "Remove ads" purchase, "Restore purchases" (required by App Review) and the
 * opt-in rewarded video for a temporary ad-free window.
 * `card` renders the full promo card (dashboard, settings).
 */
export function RemoveAdsButton({ card = false }: { card?: boolean }) {
  const { t, intl } = useT()
  const purchased = useSyncExternalStore(subscribePremium, isPurchased)
  const adFreeUntil = useSyncExternalStore(subscribePremium, getAdFreeUntil)
  const price = useSyncExternalStore(subscribePremium, getRemoveAdsPrice)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>()
  // Long-press (2 s) on "Restore purchases" shows the ad-stack log: the only
  // way to see why ads don't show on a TestFlight build without Xcode.
  const [diagnostics, setDiagnostics] = useState<string>()
  const pressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const startPress = () => {
    pressTimer.current = setTimeout(() => setDiagnostics((d) => (d ? undefined : getAdsDiagnostics())), 2_000)
  }
  const endPress = () => clearTimeout(pressTimer.current)

  useEffect(() => {
    void refreshEntitlement()
  }, [])

  if (!purchasesEnabled) return null
  if (purchased) {
    return card ? null : <p className="text-sm text-center text-green-600">✓ {t('ads_owned')}</p>
  }

  async function run(action: () => Promise<boolean>, failure: string) {
    setBusy(true)
    setMessage(undefined)
    try {
      if (!(await action())) setMessage(failure)
    } catch (error) {
      // User cancellation lands here too; don't shout about it.
      const text = String((error as Error)?.message ?? error)
      if (!/cancel/i.test(text)) setMessage(t('ads_failed'))
    } finally {
      setBusy(false)
    }
  }

  const untilLabel = adFreeUntil
    ? t('ads_until', { time: new Date(adFreeUntil).toLocaleTimeString(intl, { hour: '2-digit', minute: '2-digit' }) })
    : undefined

  const buttons = (
    <div className="flex flex-col gap-2">
      <button type="button" disabled={busy} className="btn-primary w-full py-3" onClick={() => run(purchaseRemoveAds, t('ads_failed'))}>
        {t('ads_buy')}{price ? ` · ${price}` : ''}
      </button>
      {untilLabel ? (
        <p className="text-sm text-center text-green-600">✓ {untilLabel}</p>
      ) : rewardedEnabled ? (
        <button type="button" disabled={busy} className="btn-secondary w-full text-sm" onClick={() => run(showRewardedForAdFree, t('ads_no_video'))}>
          ▶ {t('ads_watch')}
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy}
        className="text-xs text-gray-500 underline py-1 select-none"
        onClick={() => run(restoreRemoveAds, t('ads_not_found'))}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onContextMenu={(event) => event.preventDefault()}
      >
        {t('ads_restore')}
      </button>
      {message ? <p className="text-xs text-center text-gray-500">{message}</p> : null}
      {diagnostics ? <pre className="text-[11px] whitespace-pre-wrap break-all p-2 rounded-lg bg-gray-100 dark:bg-gray-800 select-text">{diagnostics}</pre> : null}
    </div>
  )

  if (!card) return buttons
  return (
    <div className="card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white flex-shrink-0">
          <Sparkles size={20} />
        </div>
        <div>
          <p className="font-semibold">{t('pro_title')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('pro_desc')}</p>
        </div>
      </div>
      {buttons}
    </div>
  )
}
