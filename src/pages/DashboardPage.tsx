import { useDiaryStore } from '../store/useDiaryStore'
import { calcOverallAverage, calcSubjectAverage } from '../types'
import { StatCard, ProgressBar } from '../components/ui/Common'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import {
  GraduationCap, ClipboardList, BookOpen, Flame, Clock, AlertCircle, ChevronRight,
} from 'lucide-react'
import { format, isToday, isTomorrow, parseISO, isPast } from 'date-fns'
import { it } from 'date-fns/locale'

export function DashboardPage() {
  const { subjects, grades, homework, exams, studyStreak, pomodoroSessions, goals, setPage } = useDiaryStore()

  const overallAvg = calcOverallAverage(grades, subjects)
  const pendingHw = homework.filter(h => !h.completed)
  const upcomingExams = exams.filter(e => !isPast(parseISO(e.date))).slice(0, 3)
  const todayGoals = goals.filter(g => g.date === format(new Date(), 'yyyy-MM-dd'))
  const todayMinutes = pomodoroSessions
    .filter(s => s.date.startsWith(format(new Date(), 'yyyy-MM-dd')) && s.type === 'focus')
    .reduce((a, s) => a + s.duration, 0)

  const urgentHw = pendingHw
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)

  const formatDue = (date: string) => {
    const d = parseISO(date)
    if (isToday(d)) return 'Oggi'
    if (isTomorrow(d)) return 'Domani'
    return format(d, 'd MMM', { locale: it })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">Bentornato! 👋</h2>
        <p className="text-primary-100 text-sm">
          {pendingHw.length} compiti da fare · {upcomingExams.length} esami in arrivo
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Media generale" value={overallAvg ?? '—'} sub="su 10" icon={<GraduationCap size={20} />} color="#3b82f6" />
        <StatCard label="Compiti" value={pendingHw.length} sub="da completare" icon={<ClipboardList size={20} />} color="#f59e0b" />
        <StatCard label="Streak studio" value={`${studyStreak}🔥`} sub="giorni consecutivi" icon={<Flame size={20} />} color="#ef4444" />
        <StatCard label="Studio oggi" value={`${todayMinutes}m`} sub="tempo di focus" icon={<Clock size={20} />} color="#22c55e" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Compiti urgenti */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              Compiti in scadenza
            </h3>
            <button onClick={() => setPage('compiti')} className="text-sm text-primary-600 flex items-center gap-1">
              Vedi tutti <ChevronRight size={16} />
            </button>
          </div>
          {urgentHw.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nessun compito in sospeso 🎉</p>
          ) : (
            <div className="space-y-2">
              {urgentHw.map(hw => (
                <div key={hw.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{hw.title}</p>
                    <SubjectBadge subjectId={hw.subjectId} />
                  </div>
                  <span className={`text-xs font-medium ml-2 ${isPast(parseISO(hw.dueDate)) ? 'text-red-500' : 'text-gray-400'}`}>
                    {formatDue(hw.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Esami */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen size={18} className="text-purple-500" />
              Prossimi esami
            </h3>
            <button onClick={() => setPage('esami')} className="text-sm text-primary-600 flex items-center gap-1">
              Vedi tutti <ChevronRight size={16} />
            </button>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nessun esame programmato</p>
          ) : (
            <div className="space-y-2">
              {upcomingExams.map(exam => (
                <div key={exam.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div>
                    <p className="text-sm font-medium">{exam.title}</p>
                    <SubjectBadge subjectId={exam.subjectId} />
                  </div>
                  <span className="text-xs text-gray-400">{formatDue(exam.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Medie per materia */}
      <div className="card">
        <h3 className="font-semibold mb-4">Andamento materie</h3>
        <div className="space-y-3">
          {subjects.map(sub => {
            const avg = calcSubjectAverage(grades, sub.id)
            return (
              <div key={sub.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{sub.name}</span>
                  <span className="text-sm font-bold" style={{ color: sub.color }}>
                    {avg ?? '—'}{avg ? '/10' : ''}
                  </span>
                </div>
                <ProgressBar value={avg ?? 0} max={10} color={sub.color} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Obiettivi giornalieri */}
      {todayGoals.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Obiettivi di oggi</h3>
          <div className="space-y-2">
            {todayGoals.map(goal => (
              <div key={goal.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{goal.title}</p>
                  <ProgressBar value={goal.completedMinutes} max={goal.targetMinutes} color="#22c55e" />
                </div>
                <span className="text-xs text-gray-400">{goal.completedMinutes}/{goal.targetMinutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
