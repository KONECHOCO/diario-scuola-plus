# App Store release now

Stato al 14 luglio 2026:

- App Store Connect app: `Diario Scuola Plus`
- Apple ID: `6790534929`
- Bundle ID: `com.diarioscuolaplus.app`
- Codemagic app ID: `6a553e90c08f38b08faefb5e`
- Workflow: `ios-release`
- Ultima build vista: `6a567218d601bb6cd9bf666a`, failed
- App Store Connect integration: `Ikonet Solutions`

## Blocco attuale

Codemagic si ferma sulla firma iOS:

```text
No provisioning profile with reference 'diario_appstore' were found from code signing identities.
```

Questo significa che `codemagic.yaml` sta cercando il reference `diario_appstore`, ma quel profilo non e' ancora presente nelle Code signing identities dell'account Codemagic usato dalla build.

## Fix in Codemagic

In Codemagic, account personale `rebichoco@gmail.com`:

1. Apri `Personal Account settings`.
2. Vai in `codemagic.yaml settings` -> `Code signing identities`.
3. Apri `iOS provisioning profiles`.
4. Clicca `Fetch profiles`.
5. Seleziona il profilo `App Store` con bundle ID `com.diarioscuolaplus.app`.
6. Imposta reference name esattamente:

```text
diario_appstore
```

7. Apri `iOS certificates`.
8. Verifica che esista il certificato Distribution con reference name:

```text
IkonetSolutions
```

Questo certificato e' gia presente in Codemagic per `Apple Distribution: INZA KONE (BUZP7DUAM6)`.

## Dopo il fix

Rilancia in Codemagic:

- application: `diario-scuola-plus`
- branch: `main`
- workflow: `Diario Scuola Plus - iOS` / `ios-release`

Nota build `6a567b38ea52e812bbf12cbf`: la firma iOS e l'applicazione dei provisioning profiles sono passate. Il blocco successivo era il path workspace nel comando `Build IPA`, corretto usando `App.xcworkspace` dopo `cd ios/App`.

Nota build `6a567c252e9afe57d0686871`: il workspace viene trovato e Xcode avvia l'archive. In caso di ulteriore exit code 65, il workflow ora usa `--verbose --disable-xcpretty` per mostrare l'errore Xcode completo nel log Codemagic.

Se la build passa, Codemagic carica l'IPA su TestFlight con:

```yaml
publishing:
  app_store_connect:
    auth: integration
    submit_to_testflight: true
```

Poi in App Store Connect:

1. Vai su `Diario Scuola Plus` -> `TestFlight`.
2. Attendi `Processing` completato.
3. In `Distribution`, seleziona la build.
4. Completa metadata, privacy, screenshots e note review.
5. Invia a review solo dopo controllo manuale.

## Verifica locale gia fatta

```powershell
npm run build
```

Risultato: build web riuscita. Il warning sui chunk grandi non blocca App Store.
