import { useState, useEffect, useRef } from 'react'
import { useDiaryStore } from '../store/useDiaryStore'
import { useT } from '../i18n/useT'
import { showInterstitialAfterNavigation } from '../monetization/ads'
import { BottomNav, MoreMenu } from './BottomNav'
import { NAV_ITEMS, navKey, type Section } from './nav'
import { Menu, X, Moon, Sun } from 'lucide-react'

const SECTIONS: Section[] = ['sec_main', 'sec_manage', 'sec_study', 'sec_system']

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { currentPage, setPage, profiles, activeProfileId, settings, updateSettings } = useDiaryStore()
  const { t } = useT()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const firstPage = useRef(true)

  // Section change: back to the top, and the paced interstitial (at most one
  // every 5 minutes, see monetization/ads.ts).
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
    if (firstPage.current) {
      firstPage.current = false
      return
    }
    void showInterstitialAfterNavigation()
  }, [currentPage])

  const profile = profiles.find(p => p.id === activeProfileId)
  const schoolLine = [profile?.school, profile?.className].filter(Boolean).join(' · ')

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

      <aside className={`fixed lg:static inset-y-0 start-0 z-50 w-72 bg-white dark:bg-gray-900 border-e border-gray-100 dark:border-gray-800 flex flex-col transform transition-transform duration-300 safe-top ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full lg:translate-x-0 lg:rtl:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold">
                D+
              </div>
              <div>
                <h1 className="font-bold text-sm">{t('app_name')}</h1>
                <p className="text-xs text-gray-400">{profile?.avatar} {profile?.name}</p>
              </div>
            </div>
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {SECTIONS.map(section => (
            <div key={section}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">{t(section)}</p>
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
                    {item.icon(20)}
                    {t(navKey(item.id))}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 safe-bottom">
          <button onClick={toggleDark} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {settings.darkMode ? t('light_mode') : t('dark_mode')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 safe-top">
          <button className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <h2 className="font-semibold text-lg flex-1 truncate">{t(navKey(currentPage))}</h2>
          {schoolLine && <div className="text-sm text-gray-500 hidden sm:block">{schoolLine}</div>}
        </header>
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto p-4 lg:p-6 lg:pb-6 animate-fade-in"
          style={{ paddingBottom: 'calc(6rem + var(--ad-banner-height, 0px))' }}
        >
          {children}
        </main>
      </div>

      <BottomNav onOpenMenu={() => setMoreMenuOpen(true)} />
      <MoreMenu open={moreMenuOpen} onClose={() => setMoreMenuOpen(false)} />
    </div>
  )
}
