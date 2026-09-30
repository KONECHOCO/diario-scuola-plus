import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { useDiaryStore } from './store/useDiaryStore'
import { applyDocumentLang, resolveLang } from './i18n/core'

// Before the first paint, so right-to-left layouts don't animate into place.
applyDocumentLang(resolveLang(useDiaryStore.getState().settings.language))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
