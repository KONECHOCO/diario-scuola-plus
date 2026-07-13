# Pubblicazione su App Store e Play Store

## Prerequisiti

| Requisito | iOS | Android |
|-----------|-----|---------|
| Account sviluppatore | Apple Developer ($99/anno) | Google Play Console ($25 una tantum) |
| Mac per build locale | Sì (o usa Codemagic) | No |
| Android Studio | No | Sì |

## Setup iniziale (una volta)

```bash
cd C:\Users\rebic\Desktop\master\DIARIO
npm install
npm run build
npx cap init "Diario Scuola Plus" com.diarioscuolaplus.app --web-dir dist
npx cap add android
npx cap add ios          # Solo su Mac
npm run assets:generate  # Genera icone e splash da resources/icon.png
npx cap sync
```

## Build Android (Windows)

```bash
npm run cap:sync
npx cap open android
```

In Android Studio:
1. **Build → Generate Signed Bundle/APK** → Android App Bundle (.aab)
2. Carica su [Google Play Console](https://play.google.com/console)

### Permessi Android (già configurati da Capacitor)
Dopo `cap add android`, verifica in `android/app/src/main/AndroidManifest.xml`:
- `RECORD_AUDIO` — registrazioni lezioni
- `POST_NOTIFICATIONS` — promemoria (Android 13+)
- `VIBRATE` — feedback aptico

## Build iOS (Mac o Codemagic)

```bash
npm run cap:sync
npx cap open ios
```

In Xcode:
1. Seleziona team e provisioning profile
2. Aggiungi in Info.plist:
   - `NSMicrophoneUsageDescription`: "Per registrare le lezioni audio"
3. **Product → Archive** → Upload su App Store Connect

## CI/CD con Codemagic

Guida dettagliata: **[CODEMAGIC_SETUP.md](CODEMAGIC_SETUP.md)**

Il file `codemagic.yaml` include 3 workflow:
- `android-release` — build AAB per Play Store
- `ios-release` — build IPA per TestFlight
- `web-static` — verifica pagine legali in `dist/`

Configura su [codemagic.io](https://codemagic.io):
1. Collega repository GitHub
2. Keystore Android (`diario_android_keystore`)
3. Service Account Google Play
4. Integrazione App Store Connect (iOS)

## Deploy Privacy Policy (obbligatorio)

Guida: **[DEPLOY_WEB.md](DEPLOY_WEB.md)**

Opzioni gratuite:
- **Vercel** (consigliato) — `npm run deploy:vercel`
- **Netlify** — importa repo, usa `netlify.toml`
- **GitHub Pages** — workflow in `.github/workflows/deploy-pages.yml`

URL da inserire negli store:
`https://TUO-DOMINIO/privacy-policy.html`

## Checklist pre-pubblicazione

- [ ] Testare su dispositivo reale (microfono, notifiche, dark mode)
- [ ] Screenshot per ogni dimensione richiesta
- [ ] Icona 1024x1024 (in `resources/icon.png`)
- [ ] Privacy policy online
- [ ] Compilare Data Safety (Play) e Privacy Labels (Apple)
- [ ] TestFlight beta (iOS) o Internal testing (Android)
- [ ] Verificare che "Assistente AI" sia descritto come assistente locale

## Aggiornamenti

```bash
# Incrementa versione in package.json e capacitor.config.ts
npm run cap:sync
# Poi build e upload su store
```
