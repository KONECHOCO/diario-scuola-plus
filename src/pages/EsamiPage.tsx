import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { Plus, BookOpen } from 'lucide-react'
import { format, parseISO, isPast } from 'date-fns'
import { it } from 'date-fns/locale'
import type { GradeType } from '../types'

export function EsamiPage() {
  const { exams, subjects, addExam, updateExam, deleteExam } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    subjectId: '', title: '', date: '', time: '', type: 'scritto' as GradeType, notes: '',
  })

  const upcoming = exams.filter(e => !isPast(parseISO(e.date))).sort((a, b) => a.date.localeCompare(b.date))
  const past = exams.filter(e => isPast(parseISO(e.date))).sort((a, b) => b.date.localeCompare(a.date))

  const handleAdd = () => {
    if (!form.subjectId || !form.title || !form.date) return
    addExam({ ...form, studied: false, time: form.time || undefined, notes: form.notes || undefined })
    setModalOpen(false)
    setForm({ subjectId: '', title: '', date: '', time: '', type: 'scritto', notes: '' })
  }

  const ExamCard = ({ exam }: { exam: typeof exams[0] }) => (
    <div className="card flex items-start gap-3">
      <div className="flex-1">
        <p className="font-medium">{exam.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <SubjectBadge subjectId={exam.subjectId} />
          <span className="text-xs text-gray-400 capitalize">{exam.type}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {format(parseISO(exam.date), "EEEE d MMMM yyyy", { locale: it })}
          {exam.time && ` · ${exam.time}`}
        </p>
        {exam.notes && <p className="text-xs text-gray-400 mt-1">{exam.notes}</p>}
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => updateExam(exam.id, { studied: !exam.studied })}
          className={`text-xs px-2 py-1 rounded-lg ${exam.studied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}
        >
          {exam.studied ? '✓ Preparato' : 'Da preparare'}
        </button>
        <ItemActions onDelete={() => deleteExam(exam.id)} />
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuovo esame
        </button>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title="Nessun esame"
          description="Programma i tuoi esami e verifiche"
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">Aggiungi esame</button>}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-3">In arrivo ({upcoming.length})</h3>
              <div className="space-y-2">{upcoming.map(e => <ExamCard key={e.id} exam={e} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-3">Passati</h3>
              <div className="space-y-2 opacity-70">{past.map(e => <ExamCard key={e.id} exam={e} />)}</div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo esame">
        <div className="space-y-4">
          <div>
            <label className="label">Titolo</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="es. Verifica capitolo 3" />
          </div>
          <div>
            <label className="label">Materia</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">Seleziona</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Ora</label>
              <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as GradeType }))}>
              <option value="scritto">Scritto</option>
              <option value="orale">Orale</option>
              <option value="pratico">Pratico</option>
              <option value="altro">Altro</option>
            </select>
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Salva</button>
        </div>
      </Modal>
    </div>
  )
}
