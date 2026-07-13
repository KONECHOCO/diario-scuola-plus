# Aggiunge diario-scuola-plus a Codemagic via API
# Token: Codemagic → User settings → Integrations → Codemagic API → Create token
# Uso: $env:CODEMAGIC_API_TOKEN="cm_..." ; .\scripts\codemagic-add-app.ps1

param(
    [string]$Token = $env:CODEMAGIC_API_TOKEN,
    [string]$RepoUrl = "https://github.com/KONECHOCO/diario-scuola-plus.git"
)

if (-not $Token) {
    Write-Host "Token mancante." -ForegroundColor Red
    Write-Host "1. Vai su https://codemagic.io/accounts/user-settings"
    Write-Host "2. Integrations → Codemagic API → Create token"
    Write-Host "3. Esegui: `$env:CODEMAGIC_API_TOKEN='cm_...' ; .\scripts\codemagic-add-app.ps1"
    exit 1
}

$body = @{ repositoryUrl = $RepoUrl } | ConvertTo-Json
$headers = @{
    "Content-Type" = "application/json"
    "x-auth-token" = $Token
}

Write-Host "Aggiungo $RepoUrl a Codemagic..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://api.codemagic.io/apps" -Method POST -Headers $headers -Body $body
    Write-Host "App aggiunta con successo!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $err = $reader.ReadToEnd()
    Write-Host "Errore $status : $err" -ForegroundColor Red
    if ($status -eq 409 -or $err -match "already") {
        Write-Host "L'app potrebbe essere gia presente. Controlla https://codemagic.io/apps" -ForegroundColor Yellow
    }
    exit 1
}
