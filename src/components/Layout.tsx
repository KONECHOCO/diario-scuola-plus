import { useState } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import type { PageId } from '../types'
import { BottomNav, MoreMenu } from './BottomNav'
import {
  LayoutDashboard, Calendar, BookOpen, ClipboardList, GraduationCap,
  Clock, Users, UserX, StickyNote, Mic, Timer, Layers, Target,
  BarChart3, Sparkles, Settings, BookMarked, Menu, X, Moon, Sun,
} from 'lucide-react'

const NAV_ITEMS: { id: PageId; label: string; icon: React.ReactNode; section: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, section: 'Principale' },
  { id: 'orario', label: 'Orario', icon: <Clock size={20} />, section: 'Principale' },
  { id: 'compiti', label: 'Compiti', icon: <ClipboardList size={20} />, section: 'Principale' },
  { id: 'esami', label: 'Esami', icon: <BookOpen size={20} />, section: 'Principale' },
  { id: 'voti', label: 'Voti', icon: <GraduationCap size={20} />, section: 'Principale' },
  { id: 'calendario', label: 'Calendario', icon: <Calendar size={20} />, section: 'Principale' },
  { id: 'materie', label: 'Materie', icon: <BookMarked size={20} />, section: 'Gestione' },
  { id: 'insegnanti', label: 'Insegnanti', icon: <Users size={20} />, section: 'Gestione' },
  { id: 'assenze', label: 'Assenze', icon: <UserX size={20} />, section: 'Gestione' },
  { id: 'note', label: 'Note', icon: <StickyNote size={20} />, section: 'Studio' },
  { id: 'lezioni', label: 'Registrazioni', icon: <Mic size={20} />, section: 'Studio' },
  { id: 'pomodoro', label: 'Pomodoro', icon: <Timer size={20} />, section: 'Studio' },
  { id: 'flashcards', label: 'Flashcards', icon: <Layers size={20} />, section: 'Studio' },
  { id: 'obiettivi', label: 'Obiettivi', icon: <Target size={20} />, section: 'Studio' },
  { id: 'statistiche', label: 'Statistiche', icon: <BarChart3 size={20} />, section: 'Studio' },
  { id: 'ai', label: 'Assistente AI', icon: <Sparkles size={20} />, section: 'Studio' },
  { id: 'impostazioni', label: 'Impostazioni', icon: <Settings size={20} />, section: 'Sistema' },
]

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { currentPage, setPage, profiles, activeProfileId, settings, updateSettings } = useDiaryStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const profile = profiles.find(p => p.id === activeProfileId)

  const sections = [...new Set(NAV_ITEMS.map(i => i.section))]

  const toggleDark = () => {
    const dark = !settings.darkMode
    updateSettings({ darkMode: dark })
    document.documentElement.classList.toggle('dark', dark)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transform transition-transform duration-300 safe-top ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold">
                D+
              </div>
              <div>
                <h1 className="font-bold text-sm">Diario Scuola Plus</h1>
                <p className="text-xs text-gray-400">{profile?.avatar} {profile?.name}</p>
              </div>
            </div>
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {sections.map(section => (
            <div key={section}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{section}</p>
              <div className="space-y-0.5">
                {NAV_ITEMS.filter(i => i.section === section).map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setPage(item.id); setSidebarOpen(false) }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      currentPage === item.id
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 safe-bottom">
          <button onClick={toggleDark} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {settings.darkMode ? 'Modalità chiara' : 'Modalità scura'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 safe-top">
          <button className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h2 className="font-semibold text-lg flex-1">
            {NAV_ITEMS.find(i => i.id === currentPage)?.label}
          </h2>
          <div className="text-sm text-gray-500 hidden sm:block">
            {profile?.school} · {profile?.className}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 animate-fade-in">
          {children}
        </main>
      </div>

      <BottomNav onOpenMenu={() => setMoreMenuOpen(true)} />
      <MoreMenu open={moreMenuOpen} onClose={() => setMoreMenuOpen(false)} />
    </div>
  )
}
