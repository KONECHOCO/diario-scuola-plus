# Diario Scuola Plus

App scolastica completa per **App Store** e **Play Store**, basata su React + Capacitor.

## Funzionalità

- Orario, compiti, esami, voti, calendario, assenze
- Pomodoro, flashcards, obiettivi, statistiche
- Registrazioni audio lezioni, note, contatti insegnanti
- Assistente di studio locale (privacy-first)
- Notifiche native per compiti ed esami
- Onboarding, bottom navigation mobile, dark mode
- Backup/export JSON

## Sviluppo web

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

## Mobile (Capacitor)

```bash
npm run mobile:setup   # Prima volta: aggiunge android/ios + icone
npm run cap:sync       # Dopo ogni modifica
npm run cap:android    # Apre Android Studio
npm run cap:ios        # Apre Xcode (solo Mac)
```

Guida completa pubblicazione: **[STORE_PUBLISHING.md](STORE_PUBLISHING.md)**

## Deploy web (privacy policy)

| Guida | Contenuto |
|-------|-----------|
| **[DEPLOY_WEB.md](DEPLOY_WEB.md)** | Vercel, Netlify, GitHub Pages |
| **[CODEMAGIC_SETUP.md](CODEMAGIC_SETUP.md)** | Build automatiche iOS + Android |

```bash
npm run deploy:vercel   # Deploy su Vercel (richiede vercel login)
```

## Stack

React 18 · TypeScript · Vite · Tailwind · Zustand · Capacitor 7 · Recharts

## Privacy

Tutti i dati restano sul dispositivo. Nessun server esterno.
Privacy policy: `public/privacy-policy.html`
