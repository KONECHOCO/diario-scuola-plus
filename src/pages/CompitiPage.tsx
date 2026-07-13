import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { Plus, ClipboardList, Check } from 'lucide-react'
import { format, parseISO, isPast } from 'date-fns'
import { it } from 'date-fns/locale'
import type { TaskPriority } from '../types'

export function CompitiPage() {
  const { homework, subjects, addHomework, toggleHomework, deleteHomework } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [filter, setFilter] = useState<'tutti' | 'da_fare' | 'completati'>('da_fare')
  const [form, setForm] = useState({
    subjectId: '', title: '', description: '', dueDate: '', priority: 'media' as TaskPriority,
  })

  const filtered = homework
    .filter(h => filter === 'tutti' || (filter === 'da_fare' ? !h.completed : h.completed))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const handleAdd = () => {
    if (!form.subjectId || !form.title || !form.dueDate) return
    addHomework({ ...form, completed: false, description: form.description || undefined })
    setModalOpen(false)
    setForm({ subjectId: '', title: '', description: '', dueDate: '', priority: 'media' })
  }

  const priorityColors = { bassa: 'text-gray-400', media: 'text-amber-500', alta: 'text-red-500' }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <div className="flex gap-2">
          {(['da_fare', 'completati', 'tutti'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {f === 'da_fare' ? 'Da fare' : f === 'completati' ? 'Completati' : 'Tutti'}
            </button>
          ))}
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuovo compito
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={32} />}
          title="Nessun compito"
          description="Aggiungi i tuoi compiti e tieni traccia delle scadenze"
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">Aggiungi compito</button>}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(hw => {
            const overdue = !hw.completed && isPast(parseISO(hw.dueDate))
            return (
              <div key={hw.id} className={`card flex items-start gap-3 ${hw.completed ? 'opacity-60' : ''}`}>
                <button
                  onClick={() => toggleHomework(hw.id)}
                  className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    hw.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-primary-500'
                  }`}
                >
                  {hw.completed && <Check size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${hw.completed ? 'line-through' : ''}`}>{hw.title}</p>
                  {hw.description && <p className="text-xs text-gray-400 mt-0.5">{hw.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <SubjectBadge subjectId={hw.subjectId} />
                    <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                      {format(parseISO(hw.dueDate), 'd MMM yyyy', { locale: it })}
                    </span>
                    <span className={`text-xs ${priorityColors[hw.priority]}`}>● {hw.priority}</span>
                  </div>
                </div>
                <ItemActions onDelete={() => deleteHomework(hw.id)} />
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo compito">
        <div className="space-y-4">
          <div>
            <label className="label">Titolo</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="es. Esercizi pag. 45" />
          </div>
          <div>
            <label className="label">Materia</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">Seleziona</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Scadenza</label>
            <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Priorità</label>
            <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}>
              <option value="bassa">Bassa</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label className="label">Descrizione (opzionale)</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Salva compito</button>
        </div>
      </Modal>
    </div>
  )
}
