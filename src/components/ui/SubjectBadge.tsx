import { useDiaryStore } from '../../store/useDiaryStore'

interface SubjectBadgeProps {
  subjectId: string
  size?: 'sm' | 'md'
}

export function SubjectBadge({ subjectId, size = 'sm' }: SubjectBadgeProps) {
  const subject = useDiaryStore(s => s.subjects.find(sub => sub.id === subjectId))
  if (!subject) return <span className="text-gray-400 text-xs">—</span>

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium text-white ${sizeClass}`}
      style={{ backgroundColor: subject.color }}
    >
      {subject.name}
    </span>
  )
}

export function SubjectDot({ subjectId }: { subjectId: string }) {
  const subject = useDiaryStore(s => s.subjects.find(sub => sub.id === subjectId))
  return (
    <span
      className="w-3 h-3 rounded-full inline-block flex-shrink-0"
      style={{ backgroundColor: subject?.color ?? '#9ca3af' }}
    />
  )
}
