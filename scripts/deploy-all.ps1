# Deploy automatico - esegui dopo aver autorizzato GitHub e Vercel
# Uso: .\scripts\deploy-all.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== Diario Scuola Plus - Deploy ===" -ForegroundColor Cyan

# 1. Verifica GitHub
Write-Host "`n[1/4] Verifica GitHub..." -ForegroundColor Yellow
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "GitHub non autenticato. Esegui: gh auth login --web" -ForegroundColor Red
    exit 1
}

# 2. Crea repo e push (se non esiste remote)
Write-Host "`n[2/4] GitHub repository..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    gh repo create diario-scuola-plus --public --source=. --remote=origin --description "Diario scolastico completo per studenti - App Store e Play Store" --push
} else {
    git push -u origin main
}

# 3. Build
Write-Host "`n[3/4] Build produzione..." -ForegroundColor Yellow
npm run build

# 4. Deploy Vercel
Write-Host "`n[4/4] Deploy Vercel..." -ForegroundColor Yellow
npx vercel --prod --yes

Write-Host "`n=== FATTO ===" -ForegroundColor Green
Write-Host "Privacy policy: https://TUO-PROGETTO.vercel.app/privacy-policy.html"
Write-Host "Prossimo: collega repo su codemagic.io"
