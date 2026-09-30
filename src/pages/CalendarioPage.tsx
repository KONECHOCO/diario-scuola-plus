import { useState } from 'react'
import { useDiaryStore, localDate } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import type { Key } from '../i18n/core'
import { buildIcs } from '../lib/ics'
import { shareTextFile } from '../lib/files'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { Plus, CalendarPlus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, addDays, startOfWeek,
} from 'date-fns'
import type { CalendarEvent } from '../types'

const EVENT_COLORS = {
  scuola: '#3b82f6', personale: '#22c55e', sport: '#f59e0b', festa: '#ec4899',
}
const EVENT_TYPES = Object.keys(EVENT_COLORS) as CalendarEvent['type'][]

export function CalendarioPage() {
  const { events, homework, exams, subjects, settings, addEvent, deleteEvent } = useDiaryStore()
  const { t, fmt, fd } = useT()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', type: 'scuola' as CalendarEvent['type'], description: '' })

  const monthStart = startOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentMonth) })
  const startPad = (monthStart.getDay() - settings.weekStartsOn + 7) % 7
  const firstDay = startOfWeek(new Date(), { weekStartsOn: settings.weekStartsOn })
  const weekdayNames = Array.from({ length: 7 }, (_, i) => fmt(addDays(firstDay, i), 'EEEEEE'))

  const getDayItems = (day: Date) => {
    const dateStr = localDate(day)
    return {
      events: events.filter(e => e.date === dateStr),
      homework: homework.filter(h => h.dueDate === dateStr && !h.completed),
      exams: exams.filter(e => e.date === dateStr),
    }
  }

  const selectedItems = selectedDay ? getDayItems(selectedDay) : null

  const handleAdd = () => {
    if (!form.title || !form.date) return
    addEvent({ ...form, description: form.description || undefined })
    setModalOpen(false)
    setForm({ title: '', date: '', type: 'scuola', description: '' })
  }

  const exportIcs = async () => {
    const { ics, count } = buildIcs({ homework, exams, events, subjects }, { hw: t('word_hw'), exam: t('word_exam') }, localDate())
    if (!count) {
      alert(t('ics_empty'))
      return
    }
    await shareTextFile('diario-scuola-plus.ics', ics, 'text/calendar', t('export_ics'))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="btn-secondary px-3"><ChevronLeft size={18} className="rtl:rotate-180" /></button>
          <h3 className="font-semibold first-letter:uppercase min-w-[8rem] text-center">{fd(currentMonth, 'month')}</h3>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="btn-secondary px-3"><ChevronRight size={18} className="rtl:rotate-180" /></button>
        </div>
        <button onClick={() => { setForm(f => ({ ...f, date: selectedDay ? localDate(selectedDay) : '' })); setModalOpen(true) }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('event')}
        </button>
      </div>

      <div className="card">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdayNames.map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-gray-400 py-1 capitalize">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPad }, (_, i) => <div key={`pad-${i}`} className="h-12" />)}
          {days.map(day => {
            const items = getDayItems(day)
            const total = items.events.length + items.homework.length + items.exams.length
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`h-12 rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                  isToday(day) ? 'bg-primary-100 dark:bg-primary-900/30 font-bold text-primary-700 dark:text-primary-300' :
                  isSelected ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                } ${isSelected && isToday(day) ? 'ring-2 ring-primary-400' : ''}`}
              >
                {day.getDate()}
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
          <h3 className="font-semibold mb-3 first-letter:uppercase">{fd(selectedDay, 'weekdayLong')}</h3>
          {selectedItems.exams.map(e => (
            <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 mb-1 flex-wrap">
              <span className="text-xs font-medium text-red-600">{t('exam_tag')}</span>
              <span className="text-sm">{e.title}</span>
              <SubjectBadge subjectId={e.subjectId} />
            </div>
          ))}
          {selectedItems.homework.map(h => (
            <div key={h.id} className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 mb-1 flex-wrap">
              <span className="text-xs font-medium text-amber-600">{t('hw_tag')}</span>
              <span className="text-sm">{h.title}</span>
              <SubjectBadge subjectId={h.subjectId} />
            </div>
          ))}
          {selectedItems.events.map(e => (
            <div key={e.id} className="flex items-center justify-between p-2 rounded-lg mb-1" style={{ backgroundColor: EVENT_COLORS[e.type] + '15' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium truncate" style={{ color: EVENT_COLORS[e.type] }}>{e.title}</span>
                <span className="text-xs text-gray-400">{t(`ev_${e.type}` as Key)}</span>
              </div>
              <button onClick={() => deleteEvent(e.id)} className="p-1 text-gray-400 hover:text-red-500" aria-label={t('delete')}><Trash2 size={15} /></button>
            </div>
          ))}
          {selectedItems.exams.length + selectedItems.homework.length + selectedItems.events.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">{t('no_items_day')}</p>
          )}
        </div>
      )}

      <button onClick={exportIcs} className="mt-4 btn-secondary w-full flex items-center justify-center gap-2 text-sm">
        <CalendarPlus size={16} /> {t('export_ics')}
      </button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('new_event')}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('title')}</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('date')}</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('type')}</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CalendarEvent['type'] }))}>
                {EVENT_TYPES.map(type => <option key={type} value={type}>{t(`ev_${type}` as Key)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('description')}</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <button onClick={handleAdd} disabled={!form.title || !form.date} className="btn-primary w-full">{t('save')}</button>
        </div>
      </Modal>
    </div>
  )
}
