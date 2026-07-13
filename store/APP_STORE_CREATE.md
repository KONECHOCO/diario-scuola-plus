# Crea l'app su App Store Connect — copia questi valori

Sei su **App Store Connect → Apps → (+)**

## Prima: registra il Bundle ID (se non esiste)

1. [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. **+** → **App IDs** → **App**
3. Description: `Diario Scuola Plus`
4. Bundle ID: `com.diarioscuolaplus.app` (Explicit)
5. Capabilities: nessuna obbligatoria (opzionale: Push Notifications)
6. **Register**

## Poi: nuova app su App Store Connect

| Campo | Valore da incollare |
|-------|---------------------|
| **Piattaforme** | iOS |
| **Nome** | Diario Scuola Plus |
| **Lingua principale** | Italiano |
| **Bundle ID** | com.diarioscuolaplus.app |
| **SKU** | diario-scuola-plus |
| **Accesso utente** | Accesso completo |

Clicca **Crea**.

## Dopo la creazione

Copia l'**Apple ID numerico** dell'app:
- È nell'URL: `appstoreconnect.apple.com/apps/XXXXXXXXXX/...`
- Oppure in **Informazioni app** → **ID Apple**

**Mandamelo in chat** (solo il numero, es. `6775062090`) e avvio la build iOS su Codemagic.

## Metadati minimi per review (da compilare dopo)

- **Categoria:** Istruzione
- **Privacy Policy URL:** (da pubblicare — GitHub Pages o Vercel)
- **Età:** 4+
- **Descrizione:** vedi `store/app-store-metadata.md`
