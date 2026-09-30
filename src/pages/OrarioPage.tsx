import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { schoolDays, slotsFor, weekKindOf } from '../lib/timetable'
import { useT } from '../i18n/useT'
import type { DayOfWeek, WeekKind } from '../types'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/Common'
import { Plus, Clock, Trash2 } from 'lucide-react'
import { nextDay } from 'date-fns'

export function OrarioPage() {
  const { timetable, subjects, settings, addTimetableSlot, deleteTimetableSlot } = useDiaryStore()
  const { t, fmt } = useT()
  const days = schoolDays(settings)
  const currentWeek = weekKindOf(new Date(), settings.rotationAnchor)
  const [week, setWeek] = useState<WeekKind>(currentWeek)
  const shownWeek = settings.rotation ? week : null
  const [modalOpen, setModalOpen] = useState(false)
  const emptyForm = { subjectId: '', day: 1 as DayOfWeek, startTime: '08:00', endTime: '09:00', room: '', week: '' as '' | WeekKind }
  const [form, setForm] = useState(emptyForm)

  // A reference date for each weekday, for localized day names.
  const dayName = (d: DayOfWeek, pattern = 'EEEE') => fmt(nextDay(new Date(2024, 0, 1), d), pattern)
  const todayDay = new Date().getDay()

  const handleAdd = () => {
    if (!form.subjectId) return
    addTimetableSlot({
      subjectId: form.subjectId,
      day: form.day,
      startTime: form.startTime,
      endTime: form.endTime,
      room: form.room || undefined,
      week: form.week || undefined,
    })
    setModalOpen(false)
    // Keep day/times: lessons are usually added one after the other.
    setForm(f => ({ ...emptyForm, day: f.day, startTime: f.endTime, endTime: addHour(f.endTime), week: f.week }))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center gap-2 mb-4 flex-wrap">
        {settings.rotation ? (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['A', 'B'] as WeekKind[]).map(w => (
              <button
                key={w}
                onClick={() => setWeek(w)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${week === w ? 'bg-white dark:bg-gray-700 shadow text-primary-600' : 'text-gray-500'}`}
              >
                {t('week_n', { w })}{w === currentWeek ? ' •' : ''}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t('tt_intro')}</p>
        )}
        <button onClick={() => { setForm(f => ({ ...f, week: settings.rotation ? week : '' })); setModalOpen(true) }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('add_lesson')}
        </button>
      </div>

      {timetable.length === 0 ? (
        <EmptyState
          icon={<Clock size={32} />}
          title={t('no_lessons')}
          description={t('no_lessons_desc')}
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">{t('create_tt')}</button>}
        />
      ) : (
        <div className="grid gap-3 lg:hidden">
          {days.map(day => {
            const slots = slotsFor(timetable, day, shownWeek)
            return (
              <div key={day} className={`card ${day === todayDay ? 'ring-2 ring-primary-300 dark:ring-primary-700' : ''}`}>
                <h3 className="font-semibold text-sm text-gray-500 mb-3 capitalize">{dayName(day)}</h3>
                {slots.length === 0 ? (
                  <p className="text-xs text-gray-400">{t('no_lessons')}</p>
                ) : (
                  <div className="space-y-2">
                    {slots.map(slot => {
                      const sub = subjects.find(s => s.id === slot.subjectId)
                      return (
                        <div key={slot.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: (sub?.color ?? '#9ca3af') + '15' }}>
                          <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: sub?.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{sub?.name}</p>
                            <p className="text-xs text-gray-500">
                              <bdi dir="ltr">{slot.startTime}–{slot.endTime}</bdi>{slot.room ? ` · ${t('room_n', { room: slot.room })}` : ''}
                              {settings.rotation && slot.week ? ` · ${t('week_only', { w: slot.week })}` : ''}
                            </p>
                          </div>
                          <button onClick={() => deleteTimetableSlot(slot.id)} className="p-1.5 text-gray-400 hover:text-red-500" aria-label={t('delete')}>
                            <Trash2 size={16} />
                          </button>
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

      {timetable.length > 0 && (
        <div className="hidden lg:block card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-start p-2 text-gray-400 font-medium">{t('time')}</th>
                {days.map(d => (
                  <th key={d} className="p-2 text-center font-medium capitalize">{dayName(d, 'EEE')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(timetable.filter(s => !shownWeek || !s.week || s.week === shownWeek).map(s => s.startTime))).sort().map(time => (
                <tr key={time} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-2 text-gray-400 text-xs">{time}</td>
                  {days.map(day => {
                    const slot = slotsFor(timetable, day, shownWeek).find(s => s.startTime === time)
                    const sub = slot ? subjects.find(s => s.id === slot.subjectId) : null
                    return (
                      <td key={day} className="p-1">
                        {slot && sub && (
                          <div className="group relative rounded-lg p-2 text-xs text-white text-center font-medium" style={{ backgroundColor: sub.color }}>
                            {sub.name}
                            {slot.room && <div className="opacity-80 font-normal">{t('room_n', { room: slot.room })}</div>}
                            <button onClick={() => deleteTimetableSlot(slot.id)} className="absolute top-0.5 end-0.5 hidden group-hover:block p-0.5" aria-label={t('delete')}>
                              <Trash2 size={12} />
                            </button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('add_lesson')}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('subject')}</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">{t('select')}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('day')}</label>
            <select className="input capitalize" value={form.day} onChange={e => setForm(f => ({ ...f, day: Number(e.target.value) as DayOfWeek }))}>
              {days.map(d => <option key={d} value={d}>{dayName(d)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('start')}</label>
              <input type="time" className="input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('end')}</label>
              <input type="time" className="input" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <div className={settings.rotation ? 'grid grid-cols-2 gap-3' : ''}>
            <div>
              <label className="label">{t('room')} {t('optional')}</label>
              <input className="input" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder={t('room_ph')} />
            </div>
            {settings.rotation && (
              <div>
                <label className="label">{t('week_n', { w: 'A/B' })}</label>
                <select className="input" value={form.week} onChange={e => setForm(f => ({ ...f, week: e.target.value as '' | WeekKind }))}>
                  <option value="">{t('week_every')}</option>
                  <option value="A">{t('week_only', { w: 'A' })}</option>
                  <option value="B">{t('week_only', { w: 'B' })}</option>
                </select>
              </div>
            )}
          </div>
          <button onClick={handleAdd} disabled={!form.subjectId} className="btn-primary w-full">{t('add')}</button>
        </div>
      </Modal>
    </div>
  )
}

function addHour(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${String(Math.min(23, h + 1)).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
