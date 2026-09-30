import { useMemo, useState } from 'react'
import { useDiaryStore, localDate } from '../store/useDiaryStore'
import {
  formatAverage, formatGrade, fromUnit, gradeUnit, neededUnit, overallUnitAverage, periodOf,
  roundUpToStep, scaleRangeLabel, subjectUnitAverage, toUnit,
} from '../lib/grades'
import { useT } from '../i18n/useT'
import type { Key } from '../i18n/core'
import { Modal } from '../components/ui/Modal'
import { SubjectBadge } from '../components/ui/SubjectBadge'
import { EmptyState, ItemActions, ProgressBar } from '../components/ui/Common'
import { GradeInput, parseGrade } from '../components/ui/GradeInput'
import { Plus, GraduationCap, TrendingUp, Calculator } from 'lucide-react'
import { parseISO } from 'date-fns'
import type { Grade, GradeType } from '../types'

const GRADE_TYPES: GradeType[] = ['scritto', 'orale', 'pratico', 'altro']

export function VotiPage() {
  const { grades, subjects, settings, addGrade, deleteGrade } = useDiaryStore()
  const { t, fd, scale, intl } = useT()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [periodId, setPeriodId] = useState<string>('')
  const emptyForm = { subjectId: '', value: '', type: 'scritto' as GradeType, date: localDate(), description: '', weight: '1' }
  const [form, setForm] = useState(emptyForm)

  const periods = [...settings.periods].sort((a, b) => a.start.localeCompare(b.start))
  const inPeriod = useMemo(() => (periodId
    ? grades.filter(g => periodOf(periods, g.date)?.id === periodId)
    : grades), [grades, periodId, periods])

  const overallAvg = overallUnitAverage(inPeriod, subjects)
  const filteredGrades = selectedSubject ? inPeriod.filter(g => g.subjectId === selectedSubject) : inPeriod
  const passUnit = toUnit(scale, settings.passMark)

  const handleAdd = () => {
    const value = parseGrade(scale, form.value)
    if (!form.subjectId || value === null) return
    addGrade({
      subjectId: form.subjectId,
      value,
      maxValue: scale.max,
      scale: scale.id,
      type: form.type,
      date: form.date,
      description: form.description || undefined,
      weight: parseFloat(form.weight) || 1,
    })
    setModalOpen(false)
    setForm(emptyForm)
  }

  const unitColor = (u: number) => u >= passUnit + (1 - passUnit) * 0.4 ? 'text-green-600' : u >= passUnit ? 'text-amber-600' : 'text-red-600'
  // Grades entered in another scale (or before scales existed) are converted.
  const gradeLabel = (g: Grade) => formatGrade(scale, g.scale === scale.id ? g.value : fromUnit(scale, gradeUnit(g)), intl)

  return (
    <div className="max-w-4xl space-y-6">
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white">
          <TrendingUp size={28} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">{t('avg_overall')}</p>
          <p className={`text-4xl font-bold ${overallAvg === null ? 'text-primary-700 dark:text-primary-300' : unitColor(overallAvg)}`}>
            {formatAverage(scale, overallAvg, intl)}
          </p>
          <p className="text-xs text-gray-400">{t('scale_n', { range: scaleRangeLabel(scale) })}</p>
        </div>
      </div>

      {periods.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: '', name: t('whole_year') }, ...periods].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriodId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap ${periodId === p.id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {subjects.map(sub => {
          const avg = subjectUnitAverage(inPeriod, sub.id)
          const count = inPeriod.filter(g => g.subjectId === sub.id).length
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(selectedSubject === sub.id ? null : sub.id)}
              className={`card text-start transition-all ${selectedSubject === sub.id ? 'ring-2 ring-primary-500' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                <span className="text-sm font-medium truncate">{sub.name}</span>
              </div>
              <p className={`text-2xl font-bold ${avg === null ? '' : unitColor(avg)}`}>{formatAverage(scale, avg, intl)}</p>
              <p className="text-xs text-gray-400">{t('grades_count', { n: count })}</p>
              {avg !== null && <ProgressBar value={avg} max={1} color={sub.color} />}
            </button>
          )
        })}
      </div>

      <NeededGrade />

      <div className="flex justify-between items-center gap-2">
        <h3 className="font-semibold truncate">
          {selectedSubject ? subjects.find(s => s.id === selectedSubject)?.name + ' — ' : ''}{t('all_grades')}
        </h3>
        <button onClick={() => { setForm({ ...emptyForm, subjectId: selectedSubject ?? '' }); setModalOpen(true) }} className="btn-primary flex items-center gap-2 text-sm flex-shrink-0">
          <Plus size={16} /> {t('add_grade')}
        </button>
      </div>

      {filteredGrades.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={32} />}
          title={t('no_grades')}
          description={t('no_grades_desc')}
          action={<button onClick={() => setModalOpen(true)} className="btn-primary">{t('add_grade')}</button>}
        />
      ) : (
        <div className="space-y-2">
          {[...filteredGrades].sort((a, b) => b.date.localeCompare(a.date)).map(grade => (
            <div key={grade.id} className="card flex items-center gap-3">
              <div className={`text-2xl font-bold w-16 text-center ${unitColor(gradeUnit(grade))}`}>
                {gradeLabel(grade)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SubjectBadge subjectId={grade.subjectId} />
                  <span className="text-xs text-gray-400">{t(`gtype_${grade.type}` as Key)}</span>
                  {grade.weight !== 1 && <span className="text-xs text-gray-400">×{grade.weight}</span>}
                </div>
                {grade.description && <p className="text-xs text-gray-400 mt-0.5">{grade.description}</p>}
                <p className="text-xs text-gray-400">{fd(parseISO(grade.date), 'shortYear')}</p>
              </div>
              <ItemActions onDelete={() => deleteGrade(grade.id)} />
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('add_grade')}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('subject')}</label>
            <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}>
              <option value="">{t('select')}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('grade')}</label>
              <GradeInput scale={scale} value={form.value} onChange={value => setForm(f => ({ ...f, value }))} />
            </div>
            <div>
              <label className="label">{t('weight')}</label>
              <input type="number" inputMode="decimal" step="0.5" min="0.5" className="input" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('type')}</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as GradeType }))}>
                {GRADE_TYPES.map(g => <option key={g} value={g}>{t(`gtype_${g}` as Key)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('date')}</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">{t('description')}</label>
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t('grade_desc_ph')} />
          </div>
          <button onClick={handleAdd} disabled={!form.subjectId || parseGrade(scale, form.value) === null} className="btn-primary w-full">{t('save_grade')}</button>
        </div>
      </Modal>
    </div>
  )
}

/** "What grade do I need on the next test to reach my target average?" */
function NeededGrade() {
  const { grades, subjects, settings } = useDiaryStore()
  const { t, scale, intl } = useT()
  const [subjectId, setSubjectId] = useState('')
  const [target, setTarget] = useState('')
  const [weight, setWeight] = useState('1')

  const subject = subjects.find(s => s.id === subjectId)
  const targetValue = parseGrade(scale, target) ?? subject?.targetGrade ?? settings.passMark
  let result: string
  if (!subjectId) {
    result = t('need_pick')
  } else {
    const needed = neededUnit(grades, subjectId, toUnit(scale, targetValue), parseFloat(weight) || 1)
    if (needed === null) result = t('need_pick')
    else if (needed <= 0) result = t('need_reached')
    else if (needed > 1) result = t('need_impossible')
    else result = t('need_result', { grade: formatGrade(scale, roundUpToStep(scale, fromUnit(scale, needed)), intl) })
  }

  return (
    <div className="card">
      <h3 className="font-semibold flex items-center gap-2 mb-3"><Calculator size={18} className="text-primary-500" /> {t('need_title')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">{t('subject')}</label>
          <select className="input" value={subjectId} onChange={e => { setSubjectId(e.target.value); setTarget('') }}>
            <option value="">{t('select')}</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">{t('need_target')}</label>
          <GradeInput scale={scale} value={target || String(targetValue)} onChange={setTarget} />
        </div>
        <div>
          <label className="label">{t('need_weight')}</label>
          <input type="number" inputMode="decimal" step="0.5" min="0.5" className="input" value={weight} onChange={e => setWeight(e.target.value)} />
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-primary-700 dark:text-primary-300">{result}</p>
    </div>
  )
}
