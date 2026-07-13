import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { Modal } from '../components/ui/Modal'
import { EmptyState, ItemActions, ProgressBar } from '../components/ui/Common'
import { Plus, Target, Check } from 'lucide-react'
import { format } from 'date-fns'

export function ObiettiviPage() {
  const { goals, addGoal, updateGoal, deleteGoal } = useDiaryStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', targetMinutes: '60', date: format(new Date(), 'yyyy-MM-dd') })

  const today = format(new Date(), 'yyyy-MM-dd')
  const todayGoals = goals.filter(g => g.date === today)
  const otherGoals = goals.filter(g => g.date !== today)

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

  const addMinutes = (id: string, minutes: number) => {
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    const newCompleted = Math.min(goal.targetMinutes, goal.completedMinutes + minutes)
    updateGoal(id, {
      completedMinutes: newCompleted,
      completed: newCompleted >= goal.targetMinutes,
    })
  }

  const GoalCard = ({ goal }: { goal: typeof goals[0] }) => (
    <div className={`card ${goal.completed ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {goal.completed ? (
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white"><Check size={14} /></div>
          ) : (
            <Target size={20} className="text-primary-500" />
          )}
          <div>
            <p className={`font-medium text-sm ${goal.completed ? 'line-through' : ''}`}>{goal.title}</p>
            <p className="text-xs text-gray-400">{goal.date}</p>
          </div>
        </div>
        <ItemActions onDelete={() => deleteGoal(goal.id)} />
      </div>
      <ProgressBar value={goal.completedMinutes} max={goal.targetMinutes} color={goal.completed ? '#22c55e' : '#3b82f6'} />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400">{goal.completedMinutes}/{goal.targetMinutes} minuti</span>
        {!goal.completed && (
          <div className="flex gap-1">
            {[15, 30, 60].map(m => (
              <button key={m} onClick={() => addMinutes(goal.id, m)} className="text-xs btn-secondary px-2 py-1">+{m}m</button>
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
          <Plus size={16} /> Nuovo obiettivo
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={<Target size={32} />} title="Nessun obiettivo" description="Imposta obiettivi di studio giornalieri per rimanere motivato" action={<button onClick={() => setModalOpen(true)} className="btn-primary">Crea obiettivo</button>} />
      ) : (
        <>
          {todayGoals.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-3">Oggi</h3>
              <div className="space-y-2">{todayGoals.map(g => <GoalCard key={g.id} goal={g} />)}</div>
            </div>
          )}
          {otherGoals.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm text-gray-500 mb-3">Altri giorni</h3>
              <div className="space-y-2">{otherGoals.map(g => <GoalCard key={g.id} goal={g} />)}</div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo obiettivo">
        <div className="space-y-4">
          <div>
            <label className="label">Titolo</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="es. Studiare matematica" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Minuti obiettivo</label>
              <input type="number" className="input" value={form.targetMinutes} onChange={e => setForm(f => ({ ...f, targetMinutes: e.target.value }))} />
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">Salva</button>
        </div>
      </Modal>
    </div>
  )
}
