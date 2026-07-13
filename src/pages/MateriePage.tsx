import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { SUBJECT_COLORS } from '../types'
import { Modal } from '../components/ui/Modal'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { Plus, BookMarked } from 'lucide-react'
import { calcSubjectAverage } from '../types'

export function MateriePage() {
  const { subjects, grades, addSubject, updateSubject, deleteSubject } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', color: SUBJECT_COLORS[0], coefficient: '1', targetGrade: '' })

  const openAdd = () => {
    setEditId(null)
    setForm({ name: '', color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length], coefficient: '1', targetGrade: '' })
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const sub = subjects.find(s => s.id === id)!
    setEditId(id)
    setForm({ name: sub.name, color: sub.color, coefficient: String(sub.coefficient ?? 1), targetGrade: String(sub.targetGrade ?? '') })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name) return
    const data = {
      name: form.name,
      color: form.color,
      coefficient: parseFloat(form.coefficient) || 1,
      targetGrade: form.targetGrade ? parseFloat(form.targetGrade) : undefined,
    }
    if (editId) updateSubject(editId, data)
    else addSubject(data)
    setModalOpen(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{subjects.length} materie · Personalizza colori e coefficienti</p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuova materia
        </button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState icon={<BookMarked size={32} />} title="Nessuna materia" description="Aggiungi le tue materie scolastiche" action={<button onClick={openAdd} className="btn-primary">Aggiungi</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {subjects.map(sub => {
            const avg = calcSubjectAverage(grades, sub.id)
            const gradeCount = grades.filter(g => g.subjectId === sub.id).length
            return (
              <div key={sub.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: sub.color }}>
                      {sub.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{sub.name}</p>
                      <p className="text-xs text-gray-400">Coeff. {sub.coefficient} · {gradeCount} voti</p>
                    </div>
                  </div>
                  <ItemActions onEdit={() => openEdit(sub.id)} onDelete={() => deleteSubject(sub.id)} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Media</p>
                    <p className="text-xl font-bold" style={{ color: sub.color }}>{avg ?? '—'}{avg ? '/10' : ''}</p>
                  </div>
                  {sub.targetGrade && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Obiettivo</p>
                      <p className="text-sm font-medium">{sub.targetGrade}/10</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Modifica materia' : 'Nuova materia'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="es. Matematica" />
          </div>
          <div>
            <label className="label">Colore</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Coefficiente</label>
              <input type="number" step="0.5" className="input" value={form.coefficient} onChange={e => setForm(f => ({ ...f, coefficient: e.target.value }))} />
            </div>
            <div>
              <label className="label">Voto obiettivo</label>
              <input type="number" step="0.5" className="input" value={form.targetGrade} onChange={e => setForm(f => ({ ...f, targetGrade: e.target.value }))} placeholder="es. 8" />
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary w-full">Salva</button>
        </div>
      </Modal>
    </div>
  )
}
