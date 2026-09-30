import { useDiaryStore, localDate } from '../store/useDiaryStore'
import { formatGrade, fromUnit, gradeUnit, subjectUnitAverage } from '../lib/grades'
import { useT } from '../i18n/useT'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import { subDays, eachDayOfInterval } from 'date-fns'

export function StatistichePage() {
  const { subjects, grades, homework, pomodoroSessions, absences, studyStreak } = useDiaryStore()
  const { t, fmt, scale, intl } = useT()
  const round = (n: number) => Math.round(n * 100) / 100
  // Letter scales are charted on their numeric value (GPA points).
  // Reversed scales (German 1–6) keep the best grade at the top via `reversed`.
  const domain: [number, number] = [scale.min, scale.max]
  const label = (v: number) => formatGrade(scale, v, intl)

  const subjectData = subjects
    .map(sub => {
      const avg = subjectUnitAverage(grades, sub.id)
      return {
        name: sub.name.length > 8 ? sub.name.slice(0, 8) + '…' : sub.name,
        avg: avg === null ? null : round(fromUnit(scale, avg)),
        color: sub.color,
      }
    })
    .filter((s): s is { name: string; avg: number; color: string } => s.avg !== null)

  const gradeTrend = [...grades]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((g, i) => ({ index: i + 1, value: round(fromUnit(scale, gradeUnit(g))) }))

  const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })
  const studyData = last7Days.map(day => {
    const dateStr = localDate(day)
    const minutes = pomodoroSessions
      .filter(s => s.type === 'focus' && localDate(new Date(s.date)) === dateStr)
      .reduce((a, s) => a + s.duration, 0)
    return { day: fmt(day, 'EEEEEE'), minutes }
  })

  const hwStats = [
    { name: t('f_done'), value: homework.filter(h => h.completed).length, color: '#22c55e' },
    { name: t('f_todo'), value: homework.filter(h => !h.completed).length, color: '#f59e0b' },
  ].filter(s => s.value > 0)

  const totalStudyMinutes = pomodoroSessions.filter(s => s.type === 'focus').reduce((a, s) => a + s.duration, 0)

  return (
    <div className="max-w-5xl space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('st_grades'), value: grades.length },
          { label: t('st_hw'), value: homework.length },
          { label: t('st_minutes'), value: totalStudyMinutes },
          { label: t('st_streak'), value: `${studyStreak}🔥` },
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <p className="text-2xl font-bold text-primary-600">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4" dir="ltr">
        {subjectData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-4" dir="auto">{t('avg_by_subject')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subjectData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={domain} reversed={!!scale.reversed} tick={{ fontSize: 11 }} tickFormatter={label} />
                <Tooltip formatter={(v: number) => [label(v), t('average')]} />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                  {subjectData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <h3 className="font-semibold mb-4" dir="auto">{t('study_7d')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={studyData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [t('min_n', { n: v }), t('study')]} />
              <Bar dataKey="minutes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {gradeTrend.length > 1 && (
          <div className="card">
            <h3 className="font-semibold mb-4" dir="auto">{t('grade_trend')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={gradeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                <YAxis domain={domain} reversed={!!scale.reversed} tick={{ fontSize: 11 }} tickFormatter={label} />
                <Tooltip formatter={(v: number) => [label(v), t('grade')]} labelFormatter={(l) => t('grade_n', { n: l })} />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {hwStats.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-4" dir="auto">{t('hw_status')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={hwStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {hwStats.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {absences.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-2">{t('absences')}</h3>
          <p className="text-sm text-gray-500">
            {t('abs_summary', {
              n: absences.length,
              j: absences.filter(a => a.justified).length,
              h: absences.reduce((s, a) => s + (a.hours ?? 1), 0),
            })}
          </p>
        </div>
      )}
    </div>
  )
}
