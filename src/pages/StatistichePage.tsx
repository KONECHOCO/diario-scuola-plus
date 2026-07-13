import { useDiaryStore } from '../store/useDiaryStore'
import { calcSubjectAverage } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns'
import { it } from 'date-fns/locale'

export function StatistichePage() {
  const { subjects, grades, homework, pomodoroSessions, absences, studyStreak } = useDiaryStore()

  const subjectData = subjects.map(sub => ({
    name: sub.name.length > 8 ? sub.name.slice(0, 8) + '…' : sub.name,
    media: calcSubjectAverage(grades, sub.id) ?? 0,
    color: sub.color,
  })).filter(s => s.media > 0)

  const gradeTrend = [...grades]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((g, i) => ({
      date: format(parseISO(g.date), 'd/M', { locale: it }),
      voto: Math.round((g.value / g.maxValue) * 100) / 10,
      index: i + 1,
    }))

  const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })
  const studyData = last7Days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const minutes = pomodoroSessions
      .filter(s => s.date.startsWith(dateStr) && s.type === 'focus')
      .reduce((a, s) => a + s.duration, 0)
    return { giorno: format(day, 'EEE', { locale: it }), minuti: minutes }
  })

  const hwStats = [
    { name: 'Completati', value: homework.filter(h => h.completed).length, color: '#22c55e' },
    { name: 'Da fare', value: homework.filter(h => !h.completed).length, color: '#f59e0b' },
  ].filter(s => s.value > 0)

  const totalStudyMinutes = pomodoroSessions.filter(s => s.type === 'focus').reduce((a, s) => a + s.duration, 0)

  return (
    <div className="max-w-5xl space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Voti inseriti', value: grades.length },
          { label: 'Compiti totali', value: homework.length },
          { label: 'Minuti di studio', value: totalStudyMinutes },
          { label: 'Streak', value: `${studyStreak} giorni` },
        ].map(stat => (
          <div key={stat.label} className="card text-center">
            <p className="text-2xl font-bold text-primary-600">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {subjectData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-4">Media per materia</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={subjectData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}/10`, 'Media']} />
                <Bar dataKey="media" radius={[6, 6, 0, 0]}>
                  {subjectData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="card">
          <h3 className="font-semibold mb-4">Studio ultimi 7 giorni (minuti)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={studyData}>
              <XAxis dataKey="giorno" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v} min`, 'Studio']} />
              <Bar dataKey="minuti" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {gradeTrend.length > 1 && (
          <div className="card">
            <h3 className="font-semibold mb-4">Andamento voti</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={gradeTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}/10`, 'Voto']} labelFormatter={(l) => `Voto #${l}`} />
                <Line type="monotone" dataKey="voto" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {hwStats.length > 0 && (
          <div className="card">
            <h3 className="font-semibold mb-4">Stato compiti</h3>
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
          <h3 className="font-semibold mb-2">Assenze</h3>
          <p className="text-sm text-gray-500">
            Totale: {absences.length} · Giustificate: {absences.filter(a => a.justified).length} ·
            Ore: {absences.reduce((s, a) => s + (a.hours ?? 1), 0)}
          </p>
        </div>
      )}
    </div>
  )
}
