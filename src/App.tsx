import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { Onboarding } from './components/Onboarding'
import { useDiaryStore } from './store/useDiaryStore'
import { initNativeApp, requestNotificationPermission } from './lib/native'
import { syncAllNotifications } from './lib/notifications'
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
import { AIPage } from './pages/AIPage'
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
  ai: AIPage,
  impostazioni: ImpostazioniPage,
} as const

function App() {
  const { currentPage, settings, homework, exams } = useDiaryStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode)
  }, [settings.darkMode])

  useEffect(() => {
    initNativeApp()
    if (settings.notifications) {
      requestNotificationPermission().then(() => syncAllNotifications())
    }
  }, [])

  useEffect(() => {
    if (settings.notifications && settings.onboardingComplete) {
      syncAllNotifications()
    }
  }, [homework, exams, settings.notifications, settings.onboardingComplete])

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
