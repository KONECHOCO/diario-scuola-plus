# Deploy Web — Privacy Policy e App Demo

La privacy policy **deve** essere online con URL HTTPS prima di pubblicare su App Store e Play Store.

## URL che userai negli store

Dopo il deploy, usa questi URL (sostituisci `TUO-DOMINIO`):

| Pagina | URL |
|--------|-----|
| Privacy Policy | `https://TUO-DOMINIO/privacy-policy.html` |
| Termini | `https://TUO-DOMINIO/terms.html` |
| App web (demo) | `https://TUO-DOMINIO/` |

URL corti (configurati):
- `https://TUO-DOMINIO/privacy` → privacy policy
- `https://TUO-DOMINIO/terms` → termini

---

## Opzione A — Vercel (consigliata, gratuita)

### 1. Push su GitHub

```bash
cd C:\Users\rebic\Desktop\master\DIARIO
git init
git add .
git commit -m "Diario Scuola Plus - ready for stores"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/diario-scuola-plus.git
git push -u origin main
```

### 2. Collega Vercel

1. Vai su [vercel.com](https://vercel.com) → **Add New Project**
2. Importa il repository GitHub
3. Vercel rileva automaticamente Vite grazie a `vercel.json`
4. Clicca **Deploy**

### 3. Verifica

Apri nel browser:
- `https://tuo-progetto.vercel.app/privacy-policy.html`
- `https://tuo-progetto.vercel.app/terms.html`

### 4. Dominio personalizzato (opzionale)

In Vercel → **Settings → Domains** → aggiungi es. `diarioscuolaplus.app`

Aggiorna poi gli URL in:
- `store/app-store-metadata.md`
- `store/play-store-metadata.md`

### Deploy da terminale (alternativa)

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## Opzione B — Netlify (gratuita)

1. Vai su [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Seleziona il repository
3. Netlify legge `netlify.toml` automaticamente
4. **Deploy site**

URL: `https://tuo-sito.netlify.app/privacy-policy.html`

---

## Opzione C — GitHub Pages

1. In GitHub → repository → **Settings → Pages**
2. Source: **GitHub Actions**
3. Crea `.github/workflows/deploy-pages.yml` (vedi sotto)

---

## Aggiornare email nella privacy policy

Prima del deploy, modifica le email in:
- `public/privacy-policy.html` → `privacy@tuodominio.com`
- `public/terms.html` → `support@tuodominio.com`

Poi: `npm run build` e rideploy.

---

## Checklist post-deploy

- [ ] `https://.../privacy-policy.html` si apre correttamente
- [ ] `https://.../terms.html` si apre correttamente
- [ ] URL inserito in App Store Connect → App Privacy
- [ ] URL inserito in Google Play Console → Policy
- [ ] L'app mobile punta allo stesso URL nelle impostazioni
