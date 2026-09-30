import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { Onboarding } from './components/Onboarding'
import { useDiaryStore } from './store/useDiaryStore'
import { initNativeApp, requestNotificationPermission } from './lib/native'
import { syncAllNotifications } from './lib/notifications'
import { applyDocumentLang } from './i18n/core'
import { useT } from './i18n/useT'
import { bootstrapAds } from './monetization/ads'
import { DashboardPage } from './pages/DashboardPage'
import { OrarioPage } from './pages/OrarioPage'
import { CompitiPage } from './pages/CompitiPage'
import { EsamiPage } from './pages/EsamiPage'
import { VotiPage } from './pages/VotiPage'
import { CalendarioPage } from './pages/CalendarioPage'
import { MateriePage } from './pages/MateriePage'
import { InsegnantiPage } from './pages/InsegnantiPage'
import { AssenzePage } from './pages/AssenzePage'
import { NotePage } from './pages/NotePage'
import { LezioniPage } from './pages/LezioniPage'
import { PomodoroPage } from './pages/PomodoroPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { ObiettiviPage } from './pages/ObiettiviPage'
import { StatistichePage } from './pages/StatistichePage'
import { PianoPage } from './pages/PianoPage'
import { ImpostazioniPage } from './pages/ImpostazioniPage'

const PAGES = {
  dashboard: DashboardPage,
  orario: OrarioPage,
  compiti: CompitiPage,
  esami: EsamiPage,
  voti: VotiPage,
  calendario: CalendarioPage,
  materie: MateriePage,
  insegnanti: InsegnantiPage,
  assenze: AssenzePage,
  note: NotePage,
  lezioni: LezioniPage,
  pomodoro: PomodoroPage,
  flashcards: FlashcardsPage,
  obiettivi: ObiettiviPage,
  statistiche: StatistichePage,
  piano: PianoPage,
  impostazioni: ImpostazioniPage,
} as const

function App() {
  const { currentPage, settings, homework, exams } = useDiaryStore()
  const { lang, t } = useT()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode)
  }, [settings.darkMode])

  useEffect(() => {
    applyDocumentLang(lang)
    document.title = t('app_name')
  }, [lang, t])

  useEffect(() => {
    initNativeApp()
    if (settings.notifications) {
      requestNotificationPermission().then(() => syncAllNotifications())
    }
  }, [])

  // Launch video + banner: only once the user is inside the app, never over
  // the onboarding.
  useEffect(() => {
    if (settings.onboardingComplete) void bootstrapAds()
  }, [settings.onboardingComplete])

  useEffect(() => {
    if (settings.notifications && settings.onboardingComplete) {
      syncAllNotifications()
    }
  }, [homework, exams, settings.notifications, settings.onboardingComplete, lang])

  if (!settings.onboardingComplete) {
    return <Onboarding />
  }

  const PageComponent = PAGES[currentPage] ?? DashboardPage

  return (
    <Layout>
      <PageComponent />
    </Layout>
  )
}

export default App
