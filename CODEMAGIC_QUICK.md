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

Significa che Codemagic non ha certificato/provisioning profile per `com.diarioscuolaplus.app`.

**Soluzione automatica (consigliata):** il workflow `ios-release` ora esegue:
`app-store-connect fetch-signing-files --create` usando l'integrazione App Store Connect.

**Requisiti:**
1. **Integrations** → App Store Connect → nome esatto: **`Ikonet Solutions`**
2. La API key deve appartenere al team Apple Developer dove esiste il Bundle ID `com.diarioscuolaplus.app` (account **INZA KONE**)
3. Ruolo API key: **Admin** o **App Manager** con accesso a Certificates, Identifiers & Profiles

**Soluzione manuale (alternativa):**
1. Codemagic → **Team settings** → **Code signing identities** → **iOS provisioning profiles**
2. Clicca **Fetch profiles** (con API key collegata)
3. Seleziona profilo **App Store** per `com.diarioscuolaplus.app`
4. Assegna reference name es. `diario_appstore`

Poi avvia di nuovo workflow **`ios-release`**.

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
