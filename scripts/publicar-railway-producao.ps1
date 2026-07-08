# Publica producao no Railway (deploy manual)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root

Write-Host "Publicando ambiente producao no Railway..."
railway environment link producao | Out-Null
railway service link solarvita-producao | Out-Null
railway redeploy --yes 2>&1

Write-Host ""
Write-Host "Deploy solicitado."
Write-Host "URL producao: https://solarvita-producao-producao.up.railway.app"
Write-Host "Acompanhe: https://railway.com/project/895431ef-103e-4b78-a0b1-c7704cf36dcd"
