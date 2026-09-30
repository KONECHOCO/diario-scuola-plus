import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { hapticSuccess } from '../lib/native'
import { SCALES, SCALE_IDS, scaleRangeLabel } from '../lib/grades'
import { useT } from '../i18n/useT'
import type { Key } from '../i18n/core'
import { GraduationCap, ChevronRight } from 'lucide-react'
import type { GradeScaleId, SchoolLevel } from '../types'

const STEPS: { title: Key; description: Key; emoji: string }[] = [
  { title: 'ob1_t', description: 'ob1_d', emoji: '🎓' },
  { title: 'ob2_t', description: 'ob2_d', emoji: '📚' },
  { title: 'ob3_t', description: 'ob3_d', emoji: '🧠' },
  { title: 'ob4_t', description: 'ob4_d', emoji: '✨' },
]
const LEVELS: SchoolLevel[] = ['elementare', 'media', 'superiore', 'universita']

export function Onboarding() {
  const { updateProfile, profiles, settings, updateSettings } = useDiaryStore()
  const { t } = useT()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [school, setSchool] = useState('')
  const [className, setClassName] = useState('')
  const [level, setLevel] = useState<SchoolLevel>('superiore')

  const finish = () => {
    const profile = profiles[0]
    if (profile) {
      updateProfile(profile.id, {
        name: name.trim() || t('default_student'),
        school: school.trim(),
        className: className.trim(),
        level,
      })
    }
    updateSettings({ onboardingComplete: true })
    hapticSuccess()
  }

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col safe-top safe-bottom overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 text-center">
        <div className="text-6xl mb-6">{current.emoji}</div>
        <h1 className="text-2xl font-bold mb-3">{t(current.title, { app: t('app_name') })}</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">{t(current.description)}</p>

        {isLast && (
          <div className="w-full max-w-sm mt-8 space-y-3 text-start">
            <div>
              <label className="label">{t('your_name')}</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={t('name_ph')} />
            </div>
            <div>
              <label className="label">{t('school')}</label>
              <input className="input" value={school} onChange={e => setSchool(e.target.value)} placeholder={t('school_ph')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('class')}</label>
                <input className="input" value={className} onChange={e => setClassName(e.target.value)} placeholder={t('class_ph')} />
              </div>
              <div>
                <label className="label">{t('level')}</label>
                <select className="input" value={level} onChange={e => setLevel(e.target.value as SchoolLevel)}>
                  {LEVELS.map(l => <option key={l} value={l}>{t(`lvl_${l}` as Key)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">{t('grade_scale')}</label>
              <select
                className="input"
                value={settings.gradeScale}
                onChange={e => {
                  const id = e.target.value as GradeScaleId
                  updateSettings({ gradeScale: id, passMark: SCALES[id].defaultPass })
                }}
              >
                {SCALE_IDS.map(id => <option key={id} value={id}>{scaleRangeLabel(SCALES[id])}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="px-8 pb-8">
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary-600' : 'w-1.5 bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        <button
          onClick={() => isLast ? finish() : setStep(s => s + 1)}
          className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
        >
          {isLast ? (
            <><GraduationCap size={20} /> {t('start_btn')}</>
          ) : (
            <>{t('continue')} <ChevronRight size={18} className="rtl:rotate-180" /></>
          )}
        </button>

        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="w-full text-center text-sm text-gray-400 mt-3 py-2">
            {t('back')}
          </button>
        )}
      </div>
    </div>
  )
}
