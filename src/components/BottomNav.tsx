import { useDiaryStore } from '../store/useDiaryStore'
import { hapticLight } from '../lib/native'
import {
  LayoutDashboard, ClipboardList, Clock, GraduationCap, Menu,
  Calendar, BookOpen, Timer, Sparkles, Settings,
} from 'lucide-react'
import type { PageId } from '../types'

const TABS: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={22} /> },
  { id: 'compiti', label: 'Compiti', icon: <ClipboardList size={22} /> },
  { id: 'orario', label: 'Orario', icon: <Clock size={22} /> },
  { id: 'voti', label: 'Voti', icon: <GraduationCap size={22} /> },
]

const MORE_ITEMS: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'calendario', label: 'Calendario', icon: <Calendar size={20} /> },
  { id: 'esami', label: 'Esami', icon: <BookOpen size={20} /> },
  { id: 'pomodoro', label: 'Pomodoro', icon: <Timer size={20} /> },
  { id: 'flashcards', label: 'Flashcards', icon: <Sparkles size={20} /> },
  { id: 'statistiche', label: 'Statistiche', icon: <GraduationCap size={20} /> },
  { id: 'ai', label: 'Assistente', icon: <Sparkles size={20} /> },
  { id: 'impostazioni', label: 'Impostazioni', icon: <Settings size={20} /> },
]

interface BottomNavProps {
  onOpenMenu: () => void
}

export function BottomNav({ onOpenMenu }: BottomNavProps) {
  const { currentPage, setPage } = useDiaryStore()

  const navigate = (page: PageId) => {
    hapticLight()
    setPage(page)
  }

  const isMoreActive = MORE_ITEMS.some(i => i.id === currentPage)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px] transition-colors ${
              currentPage === tab.id
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => { hapticLight(); onOpenMenu() }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px] transition-colors ${
            isMoreActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
          }`}
        >
          <Menu size={22} />
          <span className="text-[10px] font-medium">Altro</span>
        </button>
      </div>
    </nav>
  )
}

interface MoreMenuProps {
  open: boolean
  onClose: () => void
}

export function MoreMenu({ open, onClose }: MoreMenuProps) {
  const { currentPage, setPage } = useDiaryStore()

  if (!open) return null

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-4 safe-bottom animate-fade-in max-h-[70vh] overflow-y-auto">
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-3">Tutte le sezioni</h3>
        <div className="grid grid-cols-3 gap-2">
          {MORE_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { hapticLight(); setPage(item.id); onClose() }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors ${
                currentPage === item.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {item.icon}
              <span className="text-xs font-medium text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
