import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { calcSubjectAverage, calcOverallAverage } from '../types'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions, ProgressBar } from '../components/ui/Common'
import { Plus, GraduationCap, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import type { GradeType } from '../types'

export function VotiPage() {
  const { grades, subjects, addGrade, deleteGrade } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [form, setForm] = useState({
    subjectId: '', value: '', maxValue: '10', type: 'scritto' as GradeType,
    date: new Date().toISOString().split('T')[0], description: '', weight: '1',
  })

  const overallAvg = calcOverallAverage(grades, subjects)
  const filteredGrades = selectedSubject ? grades.filter(g => g.subjectId === selectedSubject) : grades

  const handleAdd = () => {
    if (!form.subjectId || !form.value) return
    addGrade({
      subjectId: form.subjectId,
      value: parseFloat(form.value),
      maxValue: parseFloat(form.maxValue),
      type: form.type,
      date: form.date,
      description: form.description || undefined,
      weight: parseFloat(form.weight) || 1,
    })
    setModalOpen(false)
    setForm({ subjectId: '', value: '', maxValue: '10', type: 'scritto', date: new Date().toISOString().split('T')[0], description: '', weight: '1' })
  }

  const getGradeColor = (value: number, max: number) => {
    const pct = (value / max) * 100
    if (pct >= 80) return 'text-green-600'
    if (pct >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Media generale */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white">
          <TrendingUp size={28} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Media generale</p>
          <p className="text-4xl font-bold text-primary-700 dark:text-primary-300">{overallAvg ?? '—'}{overallAvg ? '/10' : ''}</p>
        </div>
      </div>

      {/* Medie per materia */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {subjects.map(sub => {
          const avg = calcSubjectAverage(grades, sub.id)
          const subGrades = grades.filter(g => g.subjectId === sub.id)
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(selectedSubject === sub.id ? null : sub.id)}
              className={`card text-left transition-all ${selectedSubject === sub.id ? 'ring-2 ring-primary-500' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                <span className="text-sm font-medium truncate">{sub.name}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: sub.color }}>{avg ?? '—'}</p>
              <p className="text-xs text-gray-400">{subGrades.length} voti</p>
              {avg && <ProgressBar value={avg} max={10} color={sub.color} />}
            </button>
          )
        })}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-semibold">
          {selectedSubject ? subjects.find(s => s.id === selectedSubject)?.name + ' — ' : ''}Tutti i voti
        </h3>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Aggiungi voto
        </button>
      </div>

      {filteredGrades.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={32} />}
          title="Nessun voto"
          description="Inserisci i tuoi voti per calcolare automaticamente le medie"
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">Aggiungi voto</button>}
        />
      ) : (
        <div className="space-y-2">
          {[...filteredGrades].sort((a, b) => b.date.localeCompare(a.date)).map(grade => (
            <div key={grade.id} className="card flex items-center gap-3">
              <div className={`text-2xl font-bold w-16 text-center ${getGradeColor(grade.value, grade.maxValue)}`}>
                {grade.value}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <SubjectBadge subjectId={grade.subjectId} />
                  <span className="text-xs text-gray-400 capitalize">{grade.type}</span>
                  {grade.weight !== 1 && <span className="text-xs text-gray-400">×{grade.weight}</span>}
                </div>
                {grade.description && <p className="text-xs text-gray-400 mt-0.5">{grade.description}</p>}
                <p className="text-xs text-gray-400">{format(parseISO(grade.date), 'd MMM yyyy', { locale: it })}</p>
              </div>
              <ItemActions onDelete={() => deleteGrade(grade.id)} />
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Aggiungi voto">
        <div className="space-y-4">
          <div>
            <label className="label">Materia</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">Seleziona</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Voto</label>
              <input type="number" step="0.25" className="input" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
            </div>
            <div>
              <label className="label">Max</label>
              <input type="number" className="input" value={form.maxValue} onChange={e => setForm(f => ({ ...f, maxValue: e.target.value }))} />
            </div>
            <div>
              <label className="label">Peso</label>
              <input type="number" step="0.5" className="input" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <label className="label">Data</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Descrizione</label>
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="es. Verifica, Interrogazione..." />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Salva voto</button>
        </div>
      </Modal>
    </div>
  )
}
