import { Trash2, Edit2 } from 'lucide-react'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  )
}

interface ItemActionsProps {
  onEdit?: () => void
  onDelete?: () => void
}

export function ItemActions({ onEdit, onDelete }: ItemActionsProps) {
  return (
    <div className="flex gap-1">
      {onEdit && (
        <button onClick={onEdit} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary-600 transition-colors">
          <Edit2 size={16} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}

export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color ?? '#3b82f6' }}
      />
    </div>
  )
}

export function Toggle({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-start">
      <span className="flex items-center gap-2 text-sm">{icon}{label}</span>
      <div className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-primary-600' : 'bg-gray-300'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${on ? 'translate-x-4 rtl:-translate-x-4' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
      </div>
    </button>
  )
}

export function StatCard({ label, value, sub, icon, color }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="card flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
