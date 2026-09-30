import { useDiaryStore, localDate } from '../store/useDiaryStore'
import { formatAverage, overallUnitAverage, subjectUnitAverage } from '../lib/grades'
import { slotsFor, weekKindOf } from '../lib/timetable'
import { useT } from '../i18n/useT'
import { StatCard, ProgressBar } from '../components/ui/Common'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { RemoveAdsButton } from '../monetization/RemoveAdsButton'
import {
  GraduationCap, ClipboardList, BookOpen, Flame, Clock, AlertCircle, ChevronRight, CalendarDays,
} from 'lucide-react'
import { isToday, isTomorrow, parseISO } from 'date-fns'
import type { DayOfWeek } from '../types'

export function DashboardPage() {
  const {
    subjects, grades, homework, exams, studyStreak, pomodoroSessions, goals, timetable,
    settings, profiles, activeProfileId, setPage,
  } = useDiaryStore()
  const { t, fd, scale, intl } = useT()
  const today = localDate()

  const profile = profiles.find(p => p.id === activeProfileId)
  const overallAvg = overallUnitAverage(grades, subjects)
  const pendingHw = homework.filter(h => !h.completed)
  const upcomingExams = exams.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  const todayGoals = goals.filter(g => g.date === today)
  const todayMinutes = pomodoroSessions
    .filter(s => s.type === 'focus' && localDate(new Date(s.date)) === today)
    .reduce((a, s) => a + s.duration, 0)

  const week = settings.rotation ? weekKindOf(new Date(), settings.rotationAnchor) : null
  const todaySlots = slotsFor(timetable, new Date().getDay() as DayOfWeek, week)

  const urgentHw = [...pendingHw].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5)

  const formatDue = (date: string) => {
    const d = parseISO(date)
    if (isToday(d)) return t('today')
    if (isTomorrow(d)) return t('tomorrow')
    return fd(d, 'short')
  }

  const hasName = profile?.name && profile.name !== t('default_student')

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">{hasName ? t('hello', { name: profile!.name }) : t('hello_anon')}</h2>
        <p className="text-primary-100 text-sm">
          {t('dash_summary', { hw: pendingHw.length, ex: upcomingExams.length })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t('stat_avg')} value={formatAverage(scale, overallAvg, intl)} icon={<GraduationCap size={20} />} color="#3b82f6" />
        <StatCard label={t('stat_hw')} value={pendingHw.length} sub={t('stat_hw_sub')} icon={<ClipboardList size={20} />} color="#f59e0b" />
        <StatCard label={t('stat_streak')} value={`${studyStreak}🔥`} sub={t('stat_streak_sub')} icon={<Flame size={20} />} color="#ef4444" />
        <StatCard label={t('stat_today')} value={t('min_n', { n: todayMinutes })} sub={t('stat_today_sub')} icon={<Clock size={20} />} color="#22c55e" />
      </div>

      <RemoveAdsButton card />

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarDays size={18} className="text-primary-500" />
              {t('today_lessons')}
              {week && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600">{t('week_n', { w: week })}</span>}
            </h3>
            <button onClick={() => setPage('orario')} className="text-sm text-primary-600 flex items-center gap-1">
              {t('see_all')} <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          </div>
          {todaySlots.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t('no_lessons_today')}</p>
          ) : (
            <div className="space-y-2">
              {todaySlots.map(slot => {
                const sub = subjects.find(s => s.id === slot.subjectId)
                return (
                  <div key={slot.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-24 flex-shrink-0" dir="ltr">{slot.startTime}–{slot.endTime}</span>
                    <span className="w-1 h-6 rounded-full" style={{ backgroundColor: sub?.color }} />
                    <span className="text-sm font-medium flex-1 truncate">{sub?.name}</span>
                    {slot.room && <span className="text-xs text-gray-400">{t('room_n', { room: slot.room })}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              {t('due_hw')}
            </h3>
            <button onClick={() => setPage('compiti')} className="text-sm text-primary-600 flex items-center gap-1">
              {t('see_all')} <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          </div>
          {urgentHw.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t('no_pending_hw')}</p>
          ) : (
            <div className="space-y-2">
              {urgentHw.map(hw => (
                <div key={hw.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{hw.title}</p>
                    <SubjectBadge subjectId={hw.subjectId} />
                  </div>
                  <span className={`text-xs font-medium ms-2 ${hw.dueDate < today ? 'text-red-500' : 'text-gray-400'}`}>
                    {formatDue(hw.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen size={18} className="text-purple-500" />
              {t('next_exams')}
            </h3>
            <button onClick={() => setPage('esami')} className="text-sm text-primary-600 flex items-center gap-1">
              {t('see_all')} <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t('no_exams_planned')}</p>
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

        <div className="card">
          <h3 className="font-semibold mb-4">{t('subject_trend')}</h3>
          <div className="space-y-3">
            {subjects.map(sub => {
              const avg = subjectUnitAverage(grades, sub.id)
              return (
                <div key={sub.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{sub.name}</span>
                    <span className="text-sm font-bold" style={{ color: sub.color }}>{formatAverage(scale, avg, intl)}</span>
                  </div>
                  <ProgressBar value={avg ?? 0} max={1} color={sub.color} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {todayGoals.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">{t('today_goals')}</h3>
          <div className="space-y-2">
            {todayGoals.map(goal => (
              <div key={goal.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{goal.title}</p>
                  <ProgressBar value={goal.completedMinutes} max={goal.targetMinutes} color="#22c55e" />
                </div>
                <span className="text-xs text-gray-400">{t('minutes_progress', { done: goal.completedMinutes, target: goal.targetMinutes })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
