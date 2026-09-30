import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions, StatCard } from '../components/ui/Common'
import { Plus, UserX, CheckCircle, XCircle } from 'lucide-react'
import { parseISO } from 'date-fns'

export function AssenzePage() {
  const { absences, subjects, addAbsence, updateAbsence, deleteAbsence } = useDiaryStore()
  const { t, fd } = useT()
  const [modalOpen, setModalOpen] = useState(false)
  const emptyForm = { date: '', subjectId: '', justified: false, reason: '', hours: '1' }
  const [form, setForm] = useState(emptyForm)

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
    setForm(emptyForm)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={t('justified')} value={justified} icon={<CheckCircle size={20} />} color="#22c55e" />
        <StatCard label={t('unjustified')} value={unjustified} icon={<XCircle size={20} />} color="#ef4444" />
        <StatCard label={t('total_hours')} value={totalHours} icon={<UserX size={20} />} color="#f59e0b" />
      </div>

      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('add_absence')}
        </button>
      </div>

      {absences.length === 0 ? (
        <EmptyState icon={<UserX size={32} />} title={t('no_absences')} description={t('no_absences_desc')} action={<button onClick={() => setModalOpen(true)} className="btn-primary">{t('register')}</button>} />
      ) : (
        <div className="space-y-2">
          {[...absences].sort((a, b) => b.date.localeCompare(a.date)).map(abs => (
            <div key={abs.id} className="card flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${abs.justified ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                {abs.justified ? <CheckCircle size={20} /> : <XCircle size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm first-letter:uppercase">{fd(parseISO(abs.date), 'full')}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {abs.subjectId && <SubjectBadge subjectId={abs.subjectId} />}
                  <span className="text-xs text-gray-400">{t('hours_n', { n: abs.hours ?? 1 })} · {abs.justified ? t('abs_justified') : t('abs_unjustified')}</span>
                </div>
                {abs.reason && <p className="text-xs text-gray-400 mt-0.5">{abs.reason}</p>}
              </div>
              <div className="flex gap-1 items-center">
                <button onClick={() => updateAbsence(abs.id, { justified: !abs.justified })} className="text-xs btn-secondary px-2 py-1">
                  {abs.justified ? t('revoke') : t('justify')}
                </button>
                <ItemActions onDelete={() => deleteAbsence(abs.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('add_absence')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('date')}</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('abs_hours')}</label>
              <input type="number" inputMode="decimal" step="0.5" className="input" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">{t('subject')} {t('optional')}</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">{t('whole_day')}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('reason')}</label>
            <input className="input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder={t('reason_ph')} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.justified} onChange={e => setForm(f => ({ ...f, justified: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm">{t('abs_justified')}</span>
          </label>
          <button onClick={handleAdd} disabled={!form.date} className="btn-primary w-full">{t('save')}</button>
        </div>
      </Modal>
    </div>
  )
}
