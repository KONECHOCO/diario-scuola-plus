// Programma ambasciatori Ikonet: configurazione per Diario Scuola Plus (logica comune in referral-core.js).
// La chiave identifica l'app verso partner.ikonetsolutions.com, non è un segreto.
import { useSyncExternalStore } from 'react'
import { configureReferral, getReferralState, subscribeReferral } from './referral-core'

export const APP_VERSION = '2.2'

configureReferral({
  api: 'https://partner.ikonetsolutions.com',
  key: 'CFSnRlaC3A15sfb7pqBkDxfrcq2XgWT9',
  appId: 'diarioscuolaplus',
  appVersion: APP_VERSION,
})

export * from './referral-core'
export const useReferral = () => useSyncExternalStore(subscribeReferral, getReferralState)
