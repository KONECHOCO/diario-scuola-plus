import { useState } from 'react'
import { useDiaryStore, localDate } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import { Modal } from '../components/ui/Modal'
import { EmptyState, ItemActions, ProgressBar } from '../components/ui/Common'
import { Plus, Target, Check } from 'lucide-react'
import { parseISO } from 'date-fns'
import type { StudyGoal } from '../types'

export function ObiettiviPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useDiaryStore()
  const { t, fd } = useT()
  const today = localDate()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', targetMinutes: '60', date: today })

  const todayGoals = goals.filter(g => g.date === today)
  const upcoming = goals.filter(g => g.date > today).sort((a, b) => a.date.localeCompare(b.date))
  const past = goals.filter(g => g.date < today).sort((a, b) => b.date.localeCompare(a.date))

  const handleAdd = () => {
    if (!form.title) return
    addGoal({
      title: form.title,
      targetMinutes: parseInt(form.targetMinutes) || 60,
      completedMinutes: 0,
      date: form.date,
      completed: false,
    })
    setModalOpen(false)
    setForm({ title: '', targetMinutes: '60', date: today })
  }

  const addMinutes = (goal: StudyGoal, minutes: number) => {
    const done = Math.min(goal.targetMinutes, goal.completedMinutes + minutes)
    updateGoal(goal.id, { completedMinutes: done, completed: done >= goal.targetMinutes })
  }

  const GoalCard = ({ goal }: { goal: StudyGoal }) => (
    <div className={`card ${goal.completed ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {goal.completed ? (
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0"><Check size={14} /></div>
          ) : (
            <Target size={20} className="text-primary-500 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className={`font-medium text-sm ${goal.completed ? 'line-through' : ''}`}>{goal.title}</p>
            <p className="text-xs text-gray-400">{fd(parseISO(goal.date), 'weekdayShort')}</p>
          </div>
        </div>
        <ItemActions onDelete={() => deleteGoal(goal.id)} />
      </div>
      <ProgressBar value={goal.completedMinutes} max={goal.targetMinutes} color={goal.completed ? '#22c55e' : '#3b82f6'} />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">{t('minutes_progress', { done: goal.completedMinutes, target: goal.targetMinutes })}</span>
        {!goal.completed && (
          <div className="flex gap-1">
            {[15, 30, 60].map(m => (
              <button key={m} onClick={() => addMinutes(goal, m)} className="text-xs btn-secondary px-2 py-1">+{m}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> {t('new_goal')}
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={<Target size={32} />} title={t('no_goals')} description={t('no_goals_desc')} action={<button onClick={() => setModalOpen(true)} className="btn-primary">{t('create_goal')}</button>} />
      ) : (
        <>
          {todayGoals.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-3">{t('today')}</h3>
              <div className="space-y-2">{todayGoals.map(g => <GoalCard key={g.id} goal={g} />)}</div>
            </div>
          )}
          {upcoming.length + past.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-3">{t('other_days')}</h3>
              <div className="space-y-2">{[...upcoming, ...past].map(g => <GoalCard key={g.id} goal={g} />)}</div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('new_goal')}>
        <div className="space-y-4">
          <div>
            <label className="label">{t('title')}</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t('goal_ph')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('target_minutes')}</label>
              <input type="number" inputMode="numeric" className="input" value={form.targetMinutes} onChange={e => setForm(f => ({ ...f, targetMinutes: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('date')}</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleAdd} disabled={!form.title} className="btn-primary w-full">{t('save')}</button>
        </div>
      </Modal>
    </div>
  )
}
