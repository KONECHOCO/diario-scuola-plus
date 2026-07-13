import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { Plus } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  isSameDay, addMonths, subMonths, isToday,
} from 'date-fns'
import { it } from 'date-fns/locale'

const EVENT_COLORS = {
  scuola: '#3b82f6', personale: '#22c55e', sport: '#f59e0b', festa: '#ec4899',
}

export function CalendarioPage() {
  const { events, homework, exams, addEvent, deleteEvent } = useDiaryStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', type: 'scuola' as const, description: '' })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const startPad = (monthStart.getDay() + 6) % 7
  const padDays = Array.from({ length: startPad }, (_, i) => {
    const d = new Date(monthStart)
    d.setDate(d.getDate() - (startPad - i))
    return d
  })

  const getDayItems = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayEvents = events.filter(e => e.date === dateStr)
    const dayHw = homework.filter(h => h.dueDate === dateStr && !h.completed)
    const dayExams = exams.filter(e => e.date === dateStr)
    return { events: dayEvents, homework: dayHw, exams: dayExams }
  }

  const selectedItems = selectedDay ? getDayItems(selectedDay) : null

  const handleAdd = () => {
    if (!form.title || !form.date) return
    addEvent({ ...form, description: form.description || undefined })
    setModalOpen(false)
    setForm({ title: '', date: '', type: 'scuola', description: '' })
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="btn-secondary text-sm px-3">←</button>
          <h3 className="font-semibold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: it })}</h3>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="btn-secondary text-sm px-3">→</button>
        </div>
        <button onClick={() => { setForm(f => ({ ...f, date: selectedDay ? format(selectedDay, 'yyyy-MM-dd') : '' })); setModalOpen(true) }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Evento
        </button>
      </div>

      <div className="card">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {padDays.map(day => (
            <div key={day.toISOString()} className="h-12 rounded-lg opacity-30" />
          ))}
          {days.map(day => {
            const items = getDayItems(day)
            const total = items.events.length + items.homework.length + items.exams.length
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`h-12 rounded-lg flex flex-col items-center justify-center text-sm transition-all relative ${
                  isToday(day) ? 'bg-primary-100 dark:bg-primary-900/30 font-bold text-primary-700 dark:text-primary-300' :
                  isSelected ? 'bg-gray-100 dark:bg-gray-800' :
                  isSameMonth(day, currentMonth) ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : 'opacity-30'
                }`}
              >
                {format(day, 'd')}
                {total > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {items.exams.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    {items.homework.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    {items.events.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay && selectedItems && (
        <div className="mt-4 card">
          <h3 className="font-semibold mb-3 capitalize">
            {format(selectedDay, "EEEE d MMMM", { locale: it })}
          </h3>
          {selectedItems.exams.map(e => (
            <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 mb-1">
              <span className="text-xs font-medium text-red-600">ESAME</span>
              <span className="text-sm">{e.title}</span>
              <SubjectBadge subjectId={e.subjectId} />
            </div>
          ))}
          {selectedItems.homework.map(h => (
            <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 mb-1">
              <span className="text-xs font-medium text-amber-600">COMPITO</span>
              <span className="text-sm">{h.title}</span>
              <SubjectBadge subjectId={h.subjectId} />
            </div>
          ))}
          {selectedItems.events.map(e => (
            <div key={e.id} className="flex items-center justify-between p-2 rounded-lg mb-1" style={{ backgroundColor: EVENT_COLORS[e.type] + '15' }}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: EVENT_COLORS[e.type] }}>{e.title}</span>
                <span className="text-xs text-gray-400 capitalize">{e.type}</span>
              </div>
              <button onClick={() => deleteEvent(e.id)} className="text-xs text-red-400">Elimina</button>
            </div>
          ))}
          {selectedItems.exams.length + selectedItems.homework.length + selectedItems.events.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Nessun impegno per questo giorno</p>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo evento">
        <div className="space-y-4">
          <div>
            <label className="label">Titolo</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as typeof form.type }))}>
              <option value="scuola">Scuola</option>
              <option value="personale">Personale</option>
              <option value="sport">Sport</option>
              <option value="festa">Festa/Vacanza</option>
            </select>
          </div>
          <div>
            <label className="label">Descrizione</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Salva</button>
        </div>
      </Modal>
    </div>
  )
}
