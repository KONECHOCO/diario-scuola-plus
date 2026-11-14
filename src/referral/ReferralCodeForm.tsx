import { useState } from 'react'
import { Gift, Check, Loader2 } from 'lucide-react'
import { useT } from '../i18n/useT'
import type { Key } from '../i18n/core'
import { useReferral, setReferralCode, canEnterCode } from './index'

/** "Hai un codice invito?" (programma ambasciatori). Renders nothing when it is not needed. */
export function ReferralCodeForm({ compact = false }: { compact?: boolean }) {
  const { t } = useT()
  const ref = useReferral()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(!compact)

  if (!ref.enabled || (!ref.code && !canEnterCode(ref))) return null

  if (ref.code) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-sm">
        <Check size={18} className="text-primary-600 shrink-0" />
        <span>{t('ref_applied')} <b className="font-mono tracking-wider">{ref.code}</b></span>
      </div>
    )
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full text-center text-sm text-primary-600 py-1">
        {t('ref_question')}
      </button>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || busy) return
    setBusy(true)
    setError('')
    const res = await setReferralCode(value)
    setBusy(false)
    if (res !== 'ok') setError(t(`ref_${res}` as Key))
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {!compact && <h3 className="font-semibold flex items-center gap-2"><Gift size={18} /> {t('ref_title')}</h3>}
      {compact && <label className="label">{t('ref_title')}</label>}
      <div className="flex gap-2">
        <input
          className="input flex-1 min-w-0 font-mono tracking-wider"
          value={value}
          onChange={e => { setValue(e.target.value.toUpperCase()); setError('') }}
          placeholder={t('ref_placeholder')}
          maxLength={20}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <button type="submit" disabled={busy || !value.trim()} className="btn-primary px-4 disabled:opacity-40 flex items-center">
          {busy ? <Loader2 size={16} className="animate-spin" /> : t('ref_apply')}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-400">{t('ref_hint')}</p>
    </form>
  )
}
