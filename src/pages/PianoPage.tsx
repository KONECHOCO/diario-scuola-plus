import { useEffect, useMemo, useState } from 'react'
import { useDiaryStore, localDate } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import type { Key } from '../i18n/core'
import { hapticSuccess } from '../lib/native'
import { takePlanExamId } from './EsamiPage'
import { Route, Brain, Repeat, Timer, Lightbulb, Moon, Layers, CheckCircle2 } from 'lucide-react'
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'

// Offline study planner: spreads the preparation of an exam over the days
// left (learn → flashcards → practice → review → mock test → light review),
// then turns it into daily goals.

const MAX_PLAN_DAYS = 30
const PHASES: Key[] = ['phase_learn', 'phase_cards', 'phase_practice', 'phase_review']

interface PlanDay {
  date: string
  phase: Key
  minutes: number
}

export function buildPlan(examDate: string, minutesPerDay: number, today = new Date()): PlanDay[] {
  const total = differenceInCalendarDays(parseISO(examDate), today)
  const n = Math.min(MAX_PLAN_DAYS, total)
  if (n <= 0) return []
  const start = addDays(parseISO(examDate), -n)
  return Array.from({ length: n }, (_, i) => {
    const date = localDate(addDays(start, i))
    if (i === n - 1) return { date, phase: 'phase_final' as Key, minutes: Math.max(15, Math.round(minutesPerDay / 2)) }
    if (n >= 4 && i === n - 2) return { date, phase: 'phase_mock' as Key, minutes: minutesPerDay }
    // Remaining days before the mock test, spread over the phases in order.
    const k = n >= 4 ? n - 2 : n - 1
    const phases: Key[] = k >= 4 ? PHASES : k === 3 ? ['phase_learn', 'phase_practice', 'phase_review'] : k === 2 ? ['phase_practice', 'phase_review'] : ['phase_review']
    const phase = phases[Math.floor((i * phases.length) / k)]
    return { date, phase, minutes: minutesPerDay }
  })
}

const TIPS: { title: Key; text: Key; icon: React.ReactNode }[] = [
  { title: 'tip_recall_t', text: 'tip_recall', icon: <Brain size={18} /> },
  { title: 'tip_spaced_t', text: 'tip_spaced', icon: <Repeat size={18} /> },
  { title: 'tip_pomo_t', text: 'tip_pomo', icon: <Timer size={18} /> },
  { title: 'tip_feynman_t', text: 'tip_feynman', icon: <Lightbulb size={18} /> },
  { title: 'tip_sleep_t', text: 'tip_sleep', icon: <Moon size={18} /> },
]

export function PianoPage() {
  const { exams, subjects, goals, addGoal, setPage } = useDiaryStore()
  const { t, fd } = useT()
  const today = localDate()
  const upcoming = exams.filter(e => e.date > today).sort((a, b) => a.date.localeCompare(b.date))

  const [examId, setExamId] = useState<string>(() => takePlanExamId() ?? upcoming[0]?.id ?? 'custom')
  const [customSubject, setCustomSubject] = useState(subjects[0]?.id ?? '')
  const [customDate, setCustomDate] = useState(localDate(addDays(new Date(), 7)))
  const [minutes, setMinutes] = useState('45')
  const [added, setAdded] = useState<number | null>(null)

  useEffect(() => setAdded(null), [examId, customSubject, customDate, minutes])

  const exam = upcoming.find(e => e.id === examId)
  const subjectId = exam?.subjectId ?? customSubject
  const subjectName = subjects.find(s => s.id === subjectId)?.name ?? ''
  const date = exam?.date ?? customDate
  const plan = useMemo(() => buildPlan(date, Math.max(10, parseInt(minutes) || 45)), [date, minutes])

  const addToGoals = () => {
    let count = 0
    for (const day of plan) {
      const title = `${subjectName ? subjectName + ': ' : ''}${t(day.phase)}`
      if (goals.some(g => g.date === day.date && g.title === title)) continue
      addGoal({ title, targetMinutes: day.minutes, completedMinutes: 0, date: day.date, completed: false })
      count++
    }
    hapticSuccess()
    setAdded(count)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="card">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-primary-600 flex items-center justify-center text-white flex-shrink-0">
            <Route size={20} />
          </div>
          <p className="text-sm text-gray-500">{t('plan_intro')}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">{t('plan_exam')}</label>
            <select className="input" value={examId} onChange={e => setExamId(e.target.value)}>
              {upcoming.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} · {subjects.find(s => s.id === e.subjectId)?.name ?? ''} · {fd(parseISO(e.date), 'short')}
                </option>
              ))}
              <option value="custom">{t('plan_custom')}</option>
            </select>
          </div>
          {!exam && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('subject')}</label>
                <select className="input" value={customSubject} onChange={e => setCustomSubject(e.target.value)}>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('date')}</label>
                <input type="date" className="input" value={customDate} min={today} onChange={e => setCustomDate(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <label className="label">{t('plan_minutes')}</label>
            <input type="number" inputMode="numeric" min="10" step="5" className="input" value={minutes} onChange={e => setMinutes(e.target.value)} />
          </div>
        </div>
      </div>

      {plan.length === 0 ? (
        <p className="text-sm text-amber-600 text-center">{t('plan_too_late')}</p>
      ) : (
        <div className="card">
          <p className="text-sm text-gray-500 mb-3">{t('plan_days', { n: plan.length })}</p>
          <ol className="space-y-2">
            {plan.map(day => (
              <li key={day.date} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                <span className="text-xs font-medium text-gray-500 w-20 flex-shrink-0">{fd(parseISO(day.date), 'weekdayShort')}</span>
                <span className="text-sm flex-1">{t(day.phase)}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{t('min_n', { n: day.minutes })}</span>
              </li>
            ))}
          </ol>
          <button onClick={addToGoals} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
            <CheckCircle2 size={18} /> {t('plan_add_goals')}
          </button>
          {added !== null && <p className="text-sm text-green-600 text-center mt-2">{t('plan_added', { n: added })}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setPage('flashcards')} className="btn-secondary flex items-center justify-center gap-2 text-sm">
          <Layers size={16} /> {t('open_flashcards')}
        </button>
        <button onClick={() => setPage('pomodoro')} className="btn-secondary flex items-center justify-center gap-2 text-sm">
          <Timer size={16} /> {t('open_pomodoro')}
        </button>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">{t('tips_title')}</h3>
        <div className="space-y-3">
          {TIPS.map(tip => (
            <div key={tip.title} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center flex-shrink-0">{tip.icon}</div>
              <div>
                <p className="text-sm font-medium">{t(tip.title)}</p>
                <p className="text-sm text-gray-500">{t(tip.text)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
