import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { SUBJECT_COLORS } from '../types'
import { formatAverage, formatGrade, subjectUnitAverage } from '../lib/grades'
import { useT } from '../i18n/useT'
import { Modal } from '../components/ui/Modal'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { GradeInput, parseGrade } from '../components/ui/GradeInput'
import { Plus, BookMarked } from 'lucide-react'

export function MateriePage() {
  const { subjects, grades, addSubject, updateSubject, deleteSubject } = useDiaryStore()
  const { t, scale, intl } = useT()
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
    setForm({ name: sub.name, color: sub.color, coefficient: String(sub.coefficient ?? 1), targetGrade: sub.targetGrade != null ? String(sub.targetGrade) : '' })
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name) return
    const data = {
      name: form.name,
      color: form.color,
      coefficient: parseFloat(form.coefficient) || 1,
      targetGrade: parseGrade(scale, form.targetGrade) ?? undefined,
    }
    if (editId) updateSubject(editId, data)
    else addSubject(data)
    setModalOpen(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center gap-2 mb-4">
        <p className="text-sm text-gray-500">{t('subjects_intro', { n: subjects.length })}</p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm flex-shrink-0">
          <Plus size={16} /> {t('new_subject')}
        </button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState icon={<BookMarked size={32} />} title={t('no_subjects')} description={t('no_subjects_desc')} action={<button onClick={openAdd} className="btn-primary">{t('add')}</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {subjects.map(sub => {
            const avg = subjectUnitAverage(grades, sub.id)
            const gradeCount = grades.filter(g => g.subjectId === sub.id).length
            return (
              <div key={sub.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: sub.color }}>
                      {sub.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{sub.name}</p>
                      <p className="text-xs text-gray-400">{t('coeff_n', { n: sub.coefficient ?? 1 })} · {t('grades_count', { n: gradeCount })}</p>
                    </div>
                  </div>
                  <ItemActions onEdit={() => openEdit(sub.id)} onDelete={() => deleteSubject(sub.id)} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{t('average')}</p>
                    <p className="text-xl font-bold" style={{ color: sub.color }}>{formatAverage(scale, avg, intl)}</p>
                  </div>
                  {sub.targetGrade != null && (
                    <div className="text-end">
                      <p className="text-xs text-gray-400">{t('target')}</p>
                      <p className="text-sm font-medium">{formatGrade(scale, sub.targetGrade, intl)}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? t('edit_subject') : t('new_subject')}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('name')}</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('subject_ph')} />
          </div>
          <div>
            <label className="label">{t('color')}</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('coefficient')}</label>
              <input type="number" inputMode="decimal" step="0.5" className="input" value={form.coefficient} onChange={e => setForm(f => ({ ...f, coefficient: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('target_grade')}</label>
              <GradeInput scale={scale} value={form.targetGrade} onChange={targetGrade => setForm(f => ({ ...f, targetGrade }))} />
            </div>
          </div>
          <button onClick={handleSave} disabled={!form.name} className="btn-primary w-full">{t('save')}</button>
        </div>
      </Modal>
    </div>
  )
}
