import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { DAY_NAMES, DAY_NAMES_SHORT } from '../types'
import type { DayOfWeek } from '../types'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/Common'
import { Plus, Clock } from 'lucide-react'

const SCHOOL_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5]

export function OrarioPage() {
  const { timetable, subjects, addTimetableSlot, deleteTimetableSlot } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ subjectId: '', day: 1 as DayOfWeek, startTime: '08:00', endTime: '09:00', room: '' })

  const handleAdd = () => {
    if (!form.subjectId) return
    addTimetableSlot({ ...form, room: form.room || undefined })
    setModalOpen(false)
    setForm({ subjectId: '', day: 1, startTime: '08:00', endTime: '09:00', room: '' })
  }

  const getSlotsForDay = (day: DayOfWeek) =>
    timetable.filter(t => t.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">Orario settimanale personalizzabile</p>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Aggiungi lezione
        </button>
      </div>

      {timetable.length === 0 ? (
        <EmptyState
          icon={<Clock size={32} />}
          title="Nessuna lezione"
          description="Aggiungi le tue lezioni per visualizzare l'orario settimanale"
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">Crea orario</button>}
        />
      ) : (
        <div className="grid gap-3">
          {SCHOOL_DAYS.map(day => {
            const slots = getSlotsForDay(day)
            return (
              <div key={day} className="card">
                <h3 className="font-semibold text-sm text-gray-500 mb-3">{DAY_NAMES[day]}</h3>
                {slots.length === 0 ? (
                  <p className="text-xs text-gray-400">Nessuna lezione</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map(slot => {
                      const sub = subjects.find(s => s.id === slot.subjectId)
                      return (
                        <div key={slot.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: (sub?.color ?? '#9ca3af') + '15' }}>
                          <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: sub?.color }} />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{sub?.name}</p>
                            <p className="text-xs text-gray-500">{slot.startTime} – {slot.endTime}{slot.room ? ` · Aula ${slot.room}` : ''}</p>
                          </div>
                          <button onClick={() => deleteTimetableSlot(slot.id)} className="text-xs text-red-400 hover:text-red-600">Elimina</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Vista griglia desktop */}
      {timetable.length > 0 && (
        <div className="hidden lg:block mt-6 card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 text-gray-400 font-medium">Ora</th>
                {SCHOOL_DAYS.map(d => (
                  <th key={d} className="p-2 text-center font-medium">{DAY_NAMES_SHORT[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(timetable.map(t => t.startTime))).sort().map(time => (
                <tr key={time} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-2 text-gray-400 text-xs">{time}</td>
                  {SCHOOL_DAYS.map(day => {
                    const slot = timetable.find(t => t.day === day && t.startTime === time)
                    const sub = slot ? subjects.find(s => s.id === slot.subjectId) : null
                    return (
                      <td key={day} className="p-1">
                        {sub && (
                          <div className="rounded-lg p-2 text-xs text-white text-center font-medium" style={{ backgroundColor: sub.color }}>
                            {sub.name}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Aggiungi lezione">
        <div className="space-y-4">
          <div>
            <label className="label">Materia</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">Seleziona materia</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Giorno</label>
            <select className="input" value={form.day} onChange={e => setForm(f => ({ ...f, day: Number(e.target.value) as DayOfWeek }))}>
              {SCHOOL_DAYS.map(d => <option key={d} value={d}>{DAY_NAMES[d]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Inizio</label>
              <input type="time" className="input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fine</label>
              <input type="time" className="input" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Aula (opzionale)</label>
            <input className="input" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="es. 12" />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Aggiungi</button>
        </div>
      </Modal>
    </div>
  )
}
