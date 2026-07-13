# Codemagic — Setup rapido (account rebichocol@gmail.com)

Repository GitHub: **https://github.com/KONECHOCO/diario-scuola-plus**

## 1. Aggiungi l'app (2 minuti)

1. Vai su [codemagic.io/apps](https://codemagic.io/apps)
2. Clicca **Add application**
3. Seleziona **GitHub** → repository **`KONECHOCO/diario-scuola-plus`**
4. Codemagic rileva automaticamente `codemagic.yaml`
5. Abilita i 3 workflow:
   - `android-release`
   - `ios-release`
   - `web-static`

## 2. Keystore Android (come i tuoi altri progetti)

1. **Team settings** → **Code signing identities** → **Android keystores**
2. Carica un keystore con reference name: **`diario`**
   (stesso stile di `agendadigitale` e `agendadigitale-pro`)
3. Se non ne hai uno, genera:
   ```bash
   keytool -genkey -v -keystore diario.keystore -alias diario -keyalg RSA -keysize 2048 -validity 10000
   ```

## 3. Google Play (già configurato per altri progetti?)

Il workflow usa `$GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` — la stessa variabile di **AGENDADIGITALE**.

Se già presente in Codemagic → Team settings → Environment variables, **non serve rifare nulla**.

## 4. iOS (App Store / TestFlight)

### Errore: "No matching profiles found for bundle identifier"

Significa che Codemagic non ha ancora un **provisioning profile App Store** per `com.diarioscuolaplus.app`.

**Soluzione (2 minuti, come Converter/Agenda Digitale):**

1. [codemagic.io](https://codemagic.io) → **Team settings** → **codemagic.yaml settings** → **Code signing identities**
2. Sezione **iOS provisioning profiles** → **Fetch profiles** (usa integrazione **Ikonet Solutions**)
3. Seleziona profilo **App Store** per `com.diarioscuolaplus.app`
4. Reference name suggerito: `diario_appstore`
5. Avvia workflow **`ios-release`**

Se il profilo non compare in Fetch profiles, crealo prima su [developer.apple.com](https://developer.apple.com/account/resources/profiles/list) (tipo **App Store**, bundle `com.diarioscuolaplus.app`), poi ripeti Fetch profiles.

### Errore: "Cannot save Signing Certificates without certificate private key"

Se usi `fetch-signing-files --create`, aggiungi al gruppo `app_store_credentials` la variabile **`CERTIFICATE_PRIVATE_KEY`** (chiave privata del certificato Distribution esistente). Senza questa variabile la build fallisce quando il bundle ID è nuovo.

## 5. Prima build

1. Su Codemagic → app **diario-scuola-plus**
2. Clicca **Start new build**
3. Scegli workflow **`android-release`**
4. Scarica il `.aab` dagli artifacts oppure pubblica su Play Store (track: internal)

## Workflow disponibili

| Workflow | Macchina | Output |
|----------|----------|--------|
| `android-release` | linux_x2 | `.aab` per Play Store |
| `ios-release` | mac_mini_m2 | `.ipa` per TestFlight |
| `web-static` | linux_x2 | `dist/` con privacy policy |
