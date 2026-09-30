import { useDiaryStore } from '../store/useDiaryStore'
import { hapticLight } from '../lib/native'
import { useT } from '../i18n/useT'
import { Menu } from 'lucide-react'
import { NAV_ITEMS, TAB_IDS, navKey } from './nav'

interface BottomNavProps {
  onOpenMenu: () => void
}

export function BottomNav({ onOpenMenu }: BottomNavProps) {
  const { currentPage, setPage } = useDiaryStore()
  const { t } = useT()
  const tabs = NAV_ITEMS.filter(i => TAB_IDS.includes(i.id))
  const isMoreActive = !TAB_IDS.includes(currentPage)

  return (
    <nav
      className="lg:hidden fixed left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 safe-bottom"
      style={{ bottom: 'var(--ad-banner-height, 0px)' }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { hapticLight(); setPage(tab.id) }}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[60px] transition-colors ${
              currentPage === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
            }`}
          >
            {tab.icon(22)}
            <span className="text-[10px] font-medium truncate max-w-[72px]">{t(navKey(tab.id))}</span>
          </button>
        ))}
        <button
          onClick={() => { hapticLight(); onOpenMenu() }}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[60px] transition-colors ${
            isMoreActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
          }`}
        >
          <Menu size={22} />
          <span className="text-[10px] font-medium">{t('more')}</span>
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
  const { t } = useT()

  if (!open) return null
  const items = NAV_ITEMS.filter(i => !TAB_IDS.includes(i.id))

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="absolute left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-4 safe-bottom animate-fade-in max-h-[75vh] overflow-y-auto"
        style={{ bottom: 'var(--ad-banner-height, 0px)' }}
      >
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-3">{t('all_sections')}</h3>
        <div className="grid grid-cols-3 gap-2">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => { hapticLight(); setPage(item.id); onClose() }}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors ${
                currentPage === item.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {item.icon(20)}
              <span className="text-xs font-medium text-center leading-tight">{t(navKey(item.id))}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
