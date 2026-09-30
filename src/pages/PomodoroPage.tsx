import { useState, useEffect, useRef } from 'react'
import { useDiaryStore, localDate } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import { hapticSuccess, scheduleNotification, cancelNotification } from '../lib/native'
import { pauseInterstitials } from '../monetization/ads'
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react'

type TimerMode = 'focus' | 'break'
const POMODORO_NOTIFICATION_ID = 424242

export function PomodoroPage() {
  const { settings, subjects, pomodoroSessions, addPomodoroSession } = useDiaryStore()
  const { t } = useT()
  const [mode, setMode] = useState<TimerMode>('focus')
  const [seconds, setSeconds] = useState(settings.pomodoroFocus * 60)
  const [running, setRunning] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  // Wall-clock end time: the timer stays right after the app was in background.
  const endAt = useRef<number | null>(null)

  const today = localDate()
  const sessionsToday = pomodoroSessions.filter(s => s.type === 'focus' && localDate(new Date(s.date)) === today).length
  const totalSeconds = (mode === 'focus' ? settings.pomodoroFocus : settings.pomodoroBreak) * 60
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100

  useEffect(() => {
    pauseInterstitials('pomodoro', running)
    return () => pauseInterstitials('pomodoro', false)
  }, [running])

  useEffect(() => {
    if (!running) return
    endAt.current ??= Date.now() + seconds * 1000
    const title = mode === 'focus' ? t('pomo_done') : t('study_time')
    void scheduleNotification(POMODORO_NOTIFICATION_ID, title, mode === 'focus' ? t('pomo_done_body') : '', new Date(endAt.current))
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current! - Date.now()) / 1000))
      setSeconds(left)
      if (left > 0) return
      clearInterval(id)
      endAt.current = null
      setRunning(false)
      hapticSuccess()
      if (mode === 'focus') {
        addPomodoroSession({
          subjectId: selectedSubject || undefined,
          duration: settings.pomodoroFocus,
          type: 'focus',
          date: new Date().toISOString(),
        })
      }
      const next = mode === 'focus' ? 'break' : 'focus'
      setMode(next)
      setSeconds((next === 'focus' ? settings.pomodoroFocus : settings.pomodoroBreak) * 60)
    }, 500)
    return () => clearInterval(id)
  }, [running, mode])

  const stop = () => {
    setRunning(false)
    endAt.current = null
    void cancelNotification(POMODORO_NOTIFICATION_ID)
  }

  const switchMode = (next: TimerMode) => {
    stop()
    setMode(next)
    setSeconds((next === 'focus' ? settings.pomodoroFocus : settings.pomodoroBreak) * 60)
  }

  const toggle = () => {
    if (running) {
      // Pause: keep the remaining seconds, drop the end time.
      stop()
    } else {
      setRunning(true)
    }
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="max-w-lg mx-auto">
      <div className="card text-center">
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => switchMode('focus')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mode === 'focus' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            <Brain size={16} /> {t('focus_n', { n: settings.pomodoroFocus })}
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mode === 'break' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            <Coffee size={16} /> {t('break_n', { n: settings.pomodoroBreak })}
          </button>
        </div>

        <div className="relative inline-flex items-center justify-center mb-6">
          <svg width="260" height="260" viewBox="0 0 280 280" className="-rotate-90">
            <circle cx="140" cy="140" r="120" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
            <circle
              cx="140" cy="140" r="120" fill="none"
              stroke={mode === 'focus' ? '#3b82f6' : '#22c55e'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" dir="ltr">
            <p className="text-5xl font-mono font-bold">{formatTime(seconds)}</p>
            <p className="text-sm text-gray-400 mt-1">{mode === 'focus' ? t('study_time') : t('pause')}</p>
          </div>
        </div>

        <div className="mb-4">
          <select className="input max-w-xs mx-auto" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            <option value="">{t('subject_optional')}</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={toggle} className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
            {running ? <Pause size={24} /> : <Play size={24} className="ms-1" />}
          </button>
          <button onClick={() => switchMode(mode)} className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
            <RotateCcw size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mt-4">{t('sessions_today', { n: sessionsToday })}</p>
      </div>
    </div>
  )
}
