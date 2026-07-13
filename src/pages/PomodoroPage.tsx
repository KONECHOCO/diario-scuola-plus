import { useState, useEffect, useRef } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react'

type TimerMode = 'focus' | 'break'

export function PomodoroPage() {
  const { settings, subjects, addPomodoroSession } = useDiaryStore()
  const [mode, setMode] = useState<TimerMode>('focus')
  const [seconds, setSeconds] = useState(settings.pomodoroFocus * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = mode === 'focus' ? settings.pomodoroFocus * 60 : settings.pomodoroBreak * 60
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!)
            setRunning(false)
            if (mode === 'focus') {
              setSessions(sess => sess + 1)
              addPomodoroSession({
                subjectId: selectedSubject || undefined,
                duration: settings.pomodoroFocus,
                type: 'focus',
                date: new Date().toISOString(),
              })
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Pomodoro completato! 🎉', { body: 'Tempo di pausa!' })
              }
            }
            const nextMode = mode === 'focus' ? 'break' : 'focus'
            setMode(nextMode)
            return nextMode === 'focus' ? settings.pomodoroFocus * 60 : settings.pomodoroBreak * 60
          }
          return s - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode])

  const reset = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSeconds(mode === 'focus' ? settings.pomodoroFocus * 60 : settings.pomodoroBreak * 60)
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const requestNotification = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="max-w-lg mx-auto">
      <div className="card text-center">
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => { setMode('focus'); reset(); setSeconds(settings.pomodoroFocus * 60) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mode === 'focus' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            <Brain size={16} /> Focus ({settings.pomodoroFocus}m)
          </button>
          <button
            onClick={() => { setMode('break'); reset(); setSeconds(settings.pomodoroBreak * 60) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${mode === 'break' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            <Coffee size={16} /> Pausa ({settings.pomodoroBreak}m)
          </button>
        </div>

        <div className="relative inline-flex items-center justify-center mb-6">
          <svg width="280" height="280" className="-rotate-90">
            <circle cx="140" cy="140" r="120" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800" />
            <circle
              cx="140" cy="140" r="120" fill="none"
              stroke={mode === 'focus' ? '#3b82f6' : '#22c55e'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-mono font-bold">{formatTime(seconds)}</p>
            <p className="text-sm text-gray-400 mt-1">{mode === 'focus' ? 'Tempo di studio' : 'Pausa'}</p>
          </div>
        </div>

        <div className="mb-4">
          <select className="input max-w-xs mx-auto" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            <option value="">Materia (opzionale)</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={() => setRunning(!running)} className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
            {running ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>
          <button onClick={reset} className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
            <RotateCcw size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-400 mt-4">Sessioni completate oggi: <span className="font-bold text-primary-600">{sessions}</span></p>
        <button onClick={requestNotification} className="text-xs text-gray-400 hover:text-primary-600 mt-2">Attiva notifiche</button>
      </div>
    </div>
  )
}
