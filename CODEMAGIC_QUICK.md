# Codemagic — Setup rapido (account personale rebichocol@gmail.com)

Repository GitHub: **https://github.com/KONECHOCO/diario-scuola-plus**

Account Apple Developer: **INZA KONE** (profilo personale)

## 1. Aggiungi l'app

1. [codemagic.io/apps](https://codemagic.io/apps)
2. **Add application** → GitHub → **`KONECHOCO/diario-scuola-plus`**
3. Workflow da `codemagic.yaml`: `android-release`, `ios-release`, `web-static`

## 2. Integrazione App Store Connect (account personale)

Su Codemagic **profilo personale** (non Team):

1. Icona profilo in alto a destra → **Personal account settings**
2. **Integrations** → **Developer Portal** → **Manage keys**
3. Aggiungi la API key del tuo account **INZA KONE** (da App Store Connect → Users and Access → Integrations → API)
4. Nome integrazione in Codemagic: **`KONE INZA`** (deve coincidere con `codemagic.yaml`)

API key già presenti su INZA KONE: `KONE INZA`, `Codemagic CasaControl`, ecc.

## 3. iOS — Provisioning profile (account personale)

Il profilo **Diario Scuola Plus App Store** esiste già su Apple Developer per `com.diarioscuolaplus.app`.

Su Codemagic profilo personale:

1. **Personal account settings** → **codemagic.yaml settings** → **Code signing identities**
2. **iOS provisioning profiles** → **Fetch profiles**
3. Seleziona profilo **App Store** per `com.diarioscuolaplus.app`
4. Reference name profilo: **`diario_appstore`**
5. Tab **iOS certificates** → **Fetch certificate** (Distribution) oppure **Generate certificate**
6. Reference name certificato: **`diario_distribution`**
7. Avvia workflow **`ios-release`**

### Errori comuni

| Errore | Causa | Fix |
|--------|-------|-----|
| No matching profiles found | Profilo non caricato su Codemagic | Fetch profiles (passo 3 sopra) |
| Cannot save Signing Certificates without certificate private key | Manca `CERTIFICATE_PRIVATE_KEY` | Usa Fetch profiles manuale, non `fetch-signing-files --create` |
| Integrazione non trovata | Nome sbagliato in yaml | Rinomina integrazione in Codemagic o aggiorna `app_store_connect:` in yaml |

## 4. Android keystore

1. **Personal account settings** → **Code signing identities** → **Android keystores**
2. Carica keystore con reference name: **`diario`**

## 5. Google Play

Variabile `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` — se già configurata sul tuo account Codemagic per altri progetti, riutilizzala a livello app o personale.

## Workflow

| Workflow | Output |
|----------|--------|
| `android-release` | `.aab` Play Store |
| `ios-release` | `.ipa` TestFlight |
| `web-static` | `dist/` privacy policy |
