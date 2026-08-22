import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initAdMob } from './lib/admob'
import { initUnityAds, USE_UNITY_ADS } from './lib/unityAds'

if (USE_UNITY_ADS) {
  initUnityAds().catch(console.error)
} else {
  initAdMob().catch(console.error)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
