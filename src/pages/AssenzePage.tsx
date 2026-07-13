import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions, StatCard } from '../components/ui/Common'
import { Plus, UserX, CheckCircle, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

export function AssenzePage() {
  const { absences, subjects, addAbsence, updateAbsence, deleteAbsence } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ date: '', subjectId: '', justified: false, reason: '', hours: '1' })

  const justified = absences.filter(a => a.justified).length
  const unjustified = absences.filter(a => !a.justified).length
  const totalHours = absences.reduce((sum, a) => sum + (a.hours ?? 1), 0)

  const handleAdd = () => {
    if (!form.date) return
    addAbsence({
      date: form.date,
      subjectId: form.subjectId || undefined,
      justified: form.justified,
      reason: form.reason || undefined,
      hours: parseFloat(form.hours) || 1,
    })
    setModalOpen(false)
    setForm({ date: '', subjectId: '', justified: false, reason: '', hours: '1' })
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Giustificate" value={justified} icon={<CheckCircle size={20} />} color="#22c55e" />
        <StatCard label="Non giustificate" value={unjustified} icon={<XCircle size={20} />} color="#ef4444" />
        <StatCard label="Ore totali" value={totalHours} icon={<UserX size={20} />} color="#f59e0b" />
      </div>

      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Registra assenza
        </button>
      </div>

      {absences.length === 0 ? (
        <EmptyState icon={<UserX size={32} />} title="Nessuna assenza" description="Tieni traccia delle tue assenze e giustificazioni" action={<button onClick={() => setModalOpen(true)} className="btn-primary">Registra</button>} />
      ) : (
        <div className="space-y-2">
          {[...absences].sort((a, b) => b.date.localeCompare(a.date)).map(abs => (
            <div key={abs.id} className="card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${abs.justified ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                {abs.justified ? <CheckCircle size={20} /> : <XCircle size={20} />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{format(parseISO(abs.date), 'EEEE d MMMM yyyy', { locale: it })}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {abs.subjectId && <SubjectBadge subjectId={abs.subjectId} />}
                  <span className="text-xs text-gray-400">{abs.hours}h · {abs.justified ? 'Giustificata' : 'Non giustificata'}</span>
                </div>
                {abs.reason && <p className="text-xs text-gray-400 mt-0.5">{abs.reason}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => updateAbsence(abs.id, { justified: !abs.justified })} className="text-xs btn-secondary px-2 py-1">
                  {abs.justified ? 'Revoca' : 'Giustifica'}
                </button>
                <ItemActions onDelete={() => deleteAbsence(abs.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registra assenza">
        <div className="space-y-4">
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Materia (opzionale)</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">Tutta la giornata</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ore di assenza</label>
            <input type="number" step="0.5" className="input" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
          </div>
          <div>
            <label className="label">Motivo</label>
            <input className="input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="es. Malattia, visita medica..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.justified} onChange={e => setForm(f => ({ ...f, justified: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm">Giustificata</span>
          </label>
          <button onClick={handleAdd} className="btn-primary w-full">Salva</button>
        </div>
      </Modal>
    </div>
  )
}
