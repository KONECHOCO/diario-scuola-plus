# Configurazione Codemagic — Guida passo passo

Codemagic compila e pubblica automaticamente l'app su **Google Play** e **App Store** ad ogni push su `main`.

---

## 1. Prerequisiti

| Cosa | Dove |
|------|------|
| Repository GitHub | Push del progetto DIARIO |
| Account Codemagic | [codemagic.io](https://codemagic.io) — piano free include 500 min/mese |
| Google Play Console | Account developer ($25) |
| Apple Developer | Account ($99/anno) — solo per iOS |

---

## 2. Collega il repository

1. Vai su [codemagic.io/apps](https://codemagic.io/apps)
2. **Add application** → seleziona GitHub → repository `diario-scuola-plus`
3. Codemagic rileva automaticamente `codemagic.yaml`
4. Abilita **3 workflows**:
   - `android-release`
   - `ios-release`
   - `web-static`

---

## 3. Android — Keystore e Google Play

### 3.1 Crea il keystore (una volta, sul tuo PC)

```bash
keytool -genkey -v -keystore diario-release.keystore -alias diario -keyalg RSA -keysize 2048 -validity 10000
```

Salva password, alias e file `.keystore` in un posto sicuro.

### 3.2 Carica su Codemagic

1. **Teams** → il tuo team → **Encrypted environment variables** oppure **Code signing identities**
2. **Android code signing** → Upload keystore:
   - Reference name: `diario_android_keystore`
   - Keystore file: `diario-release.keystore`
   - Keystore password, key alias, key password

### 3.3 Google Play Service Account

1. [Google Play Console](https://play.google.com/console) → **Setup → API access**
2. Crea un Service Account con ruolo **Release manager**
3. Scarica il JSON delle credenziali
4. Su Codemagic → **Environment variables** → gruppo `google_play_credentials`:
   - `GOOGLE_PLAY_SERVICE_ACCOUNT` = contenuto del file JSON (segreto)

### 3.4 Prima build Android

1. Avvia manualmente workflow `android-release`
2. Scarica l'artifact `.aab` se la pubblicazione automatica non è ancora configurata
3. Carica manualmente su Play Console → **Internal testing** per il primo test

---

## 4. iOS — Certificati e App Store Connect

### 4.1 Integrazione App Store Connect

1. Codemagic → **Team settings → Integrations → App Store Connect**
2. Crea una **API Key** su [App Store Connect → Users and Access → Keys](https://appstoreconnect.apple.com/access/integrations/api)
3. Collega l'integrazione con Issuer ID, Key ID e file `.p8`

### 4.2 Code signing iOS (automatico)

1. Codemagic → **Code signing identities → iOS**
2. Abilita **Automatic code signing** con l'integrazione App Store Connect
3. Bundle ID: `com.diarioscuolaplus.app`

### 4.3 Crea l'app su App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps → +**
2. Nome: **Diario Scuola Plus**
3. Bundle ID: `com.diarioscuolaplus.app`
4. Copia l'**Apple ID** numerico dell'app
5. Su Codemagic → variabile `APP_STORE_APP_ID` nel workflow iOS

### 4.4 Prima build iOS

1. Avvia workflow `ios-release`
2. Codemagic crea automaticamente `ios/` su Mac se non esiste nel repo
3. Lo script `scripts/patch-ios-plist.sh` aggiunge il permesso microfono
4. L'IPA va su **TestFlight** automaticamente

---

## 5. Workflow web-static

Verifica che `dist/privacy-policy.html` e `dist/terms.html` siano generati correttamente.

Puoi scaricare l'artifact `dist/` e usarlo per deploy manuale, oppure usare Vercel (vedi `DEPLOY_WEB.md`).

---

## 6. Variabili da configurare su Codemagic

| Variabile | Workflow | Descrizione |
|-----------|----------|-------------|
| `GOOGLE_PLAY_SERVICE_ACCOUNT` | Android | JSON service account (segreto) |
| `GOOGLE_PLAY_TRACK` | Android | `internal` → `alpha` → `beta` → `production` |
| `APP_STORE_APP_ID` | iOS | ID numerico app su App Store Connect |

---

## 7. Flusso di rilascio consigliato

```
1. Sviluppo locale → npm run dev
2. Push su main
3. Codemagic builda Android + iOS + Web
4. Test su Internal Testing (Android) e TestFlight (iOS)
5. Screenshot e metadati store (store/*.md)
6. Promuovi a Production
```

---

## 8. Risoluzione problemi

### Android: `sdk.dir` non trovato
Lo script `Set Android SDK location` in codemagic.yaml lo risolve automaticamente.

### iOS: `ios/` non esiste nel repo
Normale su Windows. Il workflow iOS esegue `npx cap add ios` su Mac.

### Build web fallisce
```bash
npm ci && npm run build
```
in locale per vedere l'errore.

### Privacy policy rifiutata da Apple/Google
Assicurati che l'URL HTTPS sia raggiungibile **prima** di inviare l'app in review.
Deploy con Vercel (vedi `DEPLOY_WEB.md`).

---

## 9. Costi stimati Codemagic

| Workflow | Macchina | Durata tipica |
|----------|----------|---------------|
| android-release | linux_x2 | ~8 min |
| ios-release | mac_mini_m2 | ~15 min |
| web-static | linux_x2 | ~3 min |

Piano free: 500 minuti/mese — sufficiente per ~20 build complete al mese.
