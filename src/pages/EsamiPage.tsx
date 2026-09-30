import { useState } from 'react'
import { useDiaryStore, localDate } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import type { Key } from '../i18n/core'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions } from '../components/ui/Common'
import { Plus, BookOpen, Route } from 'lucide-react'
import { parseISO } from 'date-fns'
import type { Exam, GradeType } from '../types'

const GRADE_TYPES: GradeType[] = ['scritto', 'orale', 'pratico', 'altro']

/** Exam chosen with "Study plan" on this page, picked up once by the study plan page. */
let planExamId: string | null = null
export function takePlanExamId() {
  const id = planExamId
  planExamId = null
  return id
}

export function EsamiPage() {
  const { exams, subjects, addExam, updateExam, deleteExam, setPage } = useDiaryStore()
  const { t, fd } = useT()
  const [modalOpen, setModalOpen] = useState(false)
  const emptyForm = { subjectId: '', title: '', date: '', time: '', type: 'scritto' as GradeType, notes: '' }
  const [form, setForm] = useState(emptyForm)
  const today = localDate()

  const upcoming = exams.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const past = exams.filter(e => e.date < today).sort((a, b) => b.date.localeCompare(a.date))

  const handleAdd = () => {
    if (!form.subjectId || !form.title || !form.date) return
    addExam({ ...form, studied: false, time: form.time || undefined, notes: form.notes || undefined })
    setModalOpen(false)
    setForm(emptyForm)
  }

  const ExamCard = ({ exam, future }: { exam: Exam; future: boolean }) => (
    <div className="card flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium">{exam.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <SubjectBadge subjectId={exam.subjectId} />
          <span className="text-xs text-gray-400">{t(`gtype_${exam.type}` as Key)}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1 first-letter:uppercase">
          {fd(parseISO(exam.date), 'full')}
          {exam.time && ` · ${exam.time}`}
        </p>
        {exam.notes && <p className="text-xs text-gray-400 mt-1">{exam.notes}</p>}
        {future && (
          <button onClick={() => { planExamId = exam.id; setPage('piano') }} className="mt-2 text-xs text-primary-600 flex items-center gap-1">
            <Route size={14} /> {t('plan_study')}
          </button>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => updateExam(exam.id, { studied: !exam.studied })}
          className={`text-xs px-2 py-1 rounded-lg ${exam.studied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}
        >
          {exam.studied ? t('prepared') : t('to_prepare')}
        </button>
        <ItemActions onDelete={() => deleteExam(exam.id)} />
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('new_exam')}
        </button>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={32} />}
          title={t('no_exams')}
          description={t('no_exams_desc')}
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">{t('add_exam')}</button>}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-3">{t('upcoming_n', { n: upcoming.length })}</h3>
              <div className="space-y-2">{upcoming.map(e => <ExamCard key={e.id} exam={e} future />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-3">{t('past')}</h3>
              <div className="space-y-2 opacity-70">{past.map(e => <ExamCard key={e.id} exam={e} future={false} />)}</div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('new_exam')}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('title')}</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t('exam_title_ph')} />
          </div>
          <div>
            <label className="label">{t('subject')}</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">{t('select')}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('date')}</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('time')}</label>
              <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">{t('type')}</label>
            <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as GradeType }))}>
              {GRADE_TYPES.map(g => <option key={g} value={g}>{t(`gtype_${g}` as Key)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('notes')}</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button onClick={handleAdd} disabled={!form.subjectId || !form.title || !form.date} className="btn-primary w-full">{t('save')}</button>
        </div>
      </Modal>
    </div>
  )
}
