import { useState, useRef } from 'react'
import { useDiaryStore, localDate } from '../store/useDiaryStore'
import { LANGS, generateId, type DayOfWeek, type GradeScaleId, type LangCode, type SchoolLevel, type WeekKind } from '../types'
import { SCALES, SCALE_IDS, scaleRangeLabel } from '../lib/grades'
import { anchorFor, weekKindOf } from '../lib/timetable'
import { requestNotificationPermission, isNative } from '../lib/native'
import { syncAllNotifications } from '../lib/notifications'
import { readFileText, shareTextFile } from '../lib/files'
import { useT } from '../i18n/useT'
import { LANG_NAMES, type Key } from '../i18n/core'
import { Toggle } from '../components/ui/Common'
import { GradeInput, parseGrade } from '../components/ui/GradeInput'
import { RemoveAdsButton } from '../monetization/RemoveAdsButton'
import { adsEnabled, showPrivacyOptions } from '../monetization/ads'
import { Download, Upload, Trash2, User, Bell, Moon, Sun, Shield, FileText, ExternalLink, Globe, GraduationCap, Plus, X } from 'lucide-react'
import { addDays, startOfWeek } from 'date-fns'

const APP_VERSION = '2.0'
const STORAGE_KEY = 'diario-scuola-plus'
const LEVELS: SchoolLevel[] = ['elementare', 'media', 'superiore', 'universita']
// Legal pages are also bundled in the app (public/); in the native app they
// open in the browser from the GitHub Pages site.
const SITE = 'https://konechoco.github.io/diario-scuola-plus'

export function ImpostazioniPage() {
  const { settings, updateSettings, profiles, activeProfileId, updateProfile, resetData } = useDiaryStore()
  const { t, fmt, scale, lang } = useT()
  const fileRef = useRef<HTMLInputElement>(null)
  const profile = profiles.find(p => p.id === activeProfileId)
  const [profileForm, setProfileForm] = useState({
    name: profile?.name ?? '',
    school: profile?.school ?? '',
    className: profile?.className ?? '',
    level: profile?.level ?? 'superiore' as SchoolLevel,
    avatar: profile?.avatar ?? '🎓',
  })
  const [profileSaved, setProfileSaved] = useState(false)
  const [pass, setPass] = useState(String(settings.passMark))
  const [period, setPeriod] = useState({ name: '', start: localDate() })

  const toggleDark = () => {
    const dark = !settings.darkMode
    updateSettings({ darkMode: dark })
    document.documentElement.classList.toggle('dark', dark)
  }

  const saveProfile = () => {
    if (profile) updateProfile(profile.id, profileForm)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  const setScale = (id: GradeScaleId) => {
    updateSettings({ gradeScale: id, passMark: SCALES[id].defaultPass })
    setPass(String(SCALES[id].defaultPass))
  }

  const exportData = async () => {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return
    await shareTextFile(`diario-scuola-plus-backup-${localDate()}.json`, data, 'application/json', t('export_backup'))
  }

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await readFileText(file))
      if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) throw new Error('not a backup')
      if (!confirm(t('import_confirm'))) return
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      window.location.reload()
    } catch {
      alert(t('invalid_file'))
    }
  }

  const enableNotifications = async () => {
    const granted = await requestNotificationPermission()
    updateSettings({ notifications: granted })
    if (granted) syncAllNotifications()
  }

  const addPeriod = () => {
    if (!period.name || !period.start) return
    updateSettings({ periods: [...settings.periods, { id: generateId(), ...period }].sort((a, b) => a.start.localeCompare(b.start)) })
    setPeriod({ name: '', start: localDate() })
  }

  const avatars = ['🎓', '📚', '✏️', '🌟', '🚀', '💡', '🎯', '🏆']
  const firstDay = startOfWeek(new Date(), { weekStartsOn: 0 })
  const currentWeek = weekKindOf(new Date(), settings.rotationAnchor)
  const legalUrl = (page: string) => (isNative ? `${SITE}/${page}` : `/${page}`)

  return (
    <div className="max-w-2xl space-y-6">
      <RemoveAdsButton card />

      <div className="card">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Globe size={18} /> {t('language')}</h3>
        <select className="input" value={settings.language} onChange={e => updateSettings({ language: e.target.value as LangCode | 'auto' })}>
          <option value="auto">{t('lang_auto')} — {LANG_NAMES[lang]}</option>
          {LANGS.map(code => <option key={code} value={code}>{LANG_NAMES[code]}</option>)}
        </select>
      </div>

      <div className="card">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><User size={18} /> {t('profile')}</h3>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {avatars.map(a => (
              <button
                key={a}
                onClick={() => setProfileForm(f => ({ ...f, avatar: a }))}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center ${profileForm.avatar === a ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-100 dark:bg-gray-800'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('name')}</label>
              <input className="input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('class')}</label>
              <input className="input" value={profileForm.className} onChange={e => setProfileForm(f => ({ ...f, className: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('school')}</label>
              <input className="input" value={profileForm.school} onChange={e => setProfileForm(f => ({ ...f, school: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('level')}</label>
              <select className="input" value={profileForm.level} onChange={e => setProfileForm(f => ({ ...f, level: e.target.value as SchoolLevel }))}>
                {LEVELS.map(l => <option key={l} value={l}>{t(`lvl_${l}` as Key)}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveProfile} className="btn-primary">{profileSaved ? t('saved') : t('save_profile')}</button>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><GraduationCap size={18} /> {t('school_setup')}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('grade_scale')}</label>
              <select className="input" value={settings.gradeScale} onChange={e => setScale(e.target.value as GradeScaleId)}>
                {SCALE_IDS.map(id => <option key={id} value={id}>{scaleRangeLabel(SCALES[id])}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('pass_mark')}</label>
              <GradeInput
                scale={scale}
                value={pass}
                onChange={v => {
                  setPass(v)
                  const n = parseGrade(scale, v)
                  if (n !== null) updateSettings({ passMark: n })
                }}
              />
            </div>
          </div>
          <div>
            <label className="label">{t('week_start')}</label>
            <select className="input capitalize" value={settings.weekStartsOn} onChange={e => updateSettings({ weekStartsOn: Number(e.target.value) as DayOfWeek })}>
              {[1, 0, 6].map(d => <option key={d} value={d}>{fmt(addDays(firstDay, d), 'EEEE')}</option>)}
            </select>
          </div>
          <div className="-mx-3">
            <Toggle on={settings.saturday} onClick={() => updateSettings({ saturday: !settings.saturday })} label={t('saturday')} />
            <Toggle on={settings.rotation} onClick={() => updateSettings({ rotation: !settings.rotation })} label={t('rotation')} />
          </div>
          {settings.rotation ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">{t('this_week_is')}</span>
              {(['A', 'B'] as WeekKind[]).map(w => (
                <button
                  key={w}
                  onClick={() => updateSettings({ rotationAnchor: anchorFor(w) })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentWeek === w ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                  {t('week_n', { w })}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">{t('rotation_help')}</p>
          )}

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm font-medium mb-1">{t('periods')}</p>
            <p className="text-xs text-gray-400 mb-3">{t('periods_help')}</p>
            <div className="space-y-2 mb-3">
              {settings.periods.map(p => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{p.name}</span>
                  <span className="text-gray-400">{p.start}</span>
                  <button onClick={() => updateSettings({ periods: settings.periods.filter(x => x.id !== p.id) })} className="p-1 text-gray-400 hover:text-red-500" aria-label={t('delete')}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" value={period.name} placeholder={t('period_name_ph')} onChange={e => setPeriod(p => ({ ...p, name: e.target.value }))} />
              <input type="date" className="input w-auto" value={period.start} onChange={e => setPeriod(p => ({ ...p, start: e.target.value }))} />
              <button onClick={addPeriod} disabled={!period.name} className="btn-primary px-3" aria-label={t('add_period')}><Plus size={18} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">{t('appearance')}</h3>
        <div className="-mx-3">
          <Toggle on={settings.darkMode} onClick={toggleDark} label={t('dark_mode')} icon={settings.darkMode ? <Moon size={18} /> : <Sun size={18} />} />
          <Toggle
            on={settings.notifications}
            onClick={() => settings.notifications ? updateSettings({ notifications: false }) : enableNotifications()}
            label={t('reminders')}
            icon={<Bell size={18} />}
          />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4">{t('pomodoro_timer')}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('focus_min')}</label>
            <input type="number" inputMode="numeric" className="input" value={settings.pomodoroFocus} onChange={e => updateSettings({ pomodoroFocus: parseInt(e.target.value) || 25 })} />
          </div>
          <div>
            <label className="label">{t('break_min')}</label>
            <input type="number" inputMode="numeric" className="input" value={settings.pomodoroBreak} onChange={e => updateSettings({ pomodoroBreak: parseInt(e.target.value) || 5 })} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">{t('backup')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('backup_help')}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportData} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={16} /> {t('export_backup')}
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm">
            <Upload size={16} /> {t('import_backup')}
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={importData} />
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold flex items-center gap-2 mb-4"><Shield size={18} /> {t('legal')}</h3>
        <div className="space-y-1">
          <a href={legalUrl('privacy-policy.html')} target="_blank" rel="noopener" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
            <span className="flex items-center gap-2"><FileText size={16} /> {t('privacy')}</span>
            <ExternalLink size={14} className="text-gray-400" />
          </a>
          <a href={legalUrl('terms.html')} target="_blank" rel="noopener" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
            <span className="flex items-center gap-2"><FileText size={16} /> {t('terms')}</span>
            <ExternalLink size={14} className="text-gray-400" />
          </a>
          {adsEnabled && (
            <button onClick={() => void showPrivacyOptions()} className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-start">
              <Shield size={16} /> {t('privacy_ads')}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-3">{t('privacy_note')}</p>
      </div>

      <div className="card border-red-200 dark:border-red-900">
        <h3 className="font-semibold text-red-600 mb-2">{t('danger')}</h3>
        <p className="text-sm text-gray-500 mb-3">{t('reset_help')}</p>
        <button
          onClick={() => { if (confirm(t('reset_confirm'))) { resetData(); window.location.reload() } }}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          <Trash2 size={16} /> {t('reset')}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        {t('app_name')} · {t('version_n', { v: APP_VERSION })}
      </p>
    </div>
  )
}
