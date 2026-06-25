# Configura GitHub Actions para deploy (teste automatico + producao manual)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root

$gh = if (Test-Path "$env:TEMP\gh-cli\bin\gh.exe") { "$env:TEMP\gh-cli\bin\gh.exe" }
      elseif (Get-Command gh -ErrorAction SilentlyContinue) { (Get-Command gh).Source }
      else { $null }

if (-not $gh) {
    Write-Host "Baixando GitHub CLI..."
    $zip = "$env:TEMP\gh.zip"
    $dest = "$env:TEMP\gh-cli"
    Invoke-WebRequest -Uri "https://github.com/cli/cli/releases/download/v2.63.2/gh_2.63.2_windows_amd64.zip" -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath $dest -Force
    $gh = "$dest\bin\gh.exe"
}

Write-Host ""
Write-Host "=== Configurar GitHub Actions - SolarVita ==="
Write-Host ""
Write-Host "Passo 1: Autorizar permissao WORKFLOW no GitHub"
Write-Host ""

& $gh auth status 2>&1 | Write-Host

$status = & $gh auth status 2>&1 | Out-String
if ($status -notmatch 'workflow') {
    Write-Host "Abrindo autorizacao no navegador..."
    Write-Host "Se nao abrir, acesse: https://github.com/login/device"
    Write-Host ""
    Start-Process "https://github.com/login/device"
    & $gh auth refresh -h github.com -s workflow,repo
    Write-Host ""
    Write-Host "Concluiu a autorizacao no navegador? (S/N)"
    $ok = Read-Host
    if ($ok -notmatch '^[sS]') {
        Write-Error "Autorizacao cancelada. Execute o script novamente apos autorizar."
    }
    $status = & $gh auth status 2>&1 | Out-String
    if ($status -notmatch 'workflow') {
        Write-Error "Permissao workflow ainda nao detectada. Tente: gh auth refresh -h github.com -s workflow,repo"
    }
}

Write-Host ""
Write-Host "Passo 2: Instalar workflows..."
& (Join-Path $root 'scripts\instalar-workflows.ps1')

Write-Host ""
Write-Host "Passo 3: Publicar workflows no GitHub..."
& $gh auth setup-git
git add .github/workflows deploy/workflows README.md
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "Ativa GitHub Actions para deploy teste e producao"
    git push origin teste
    git push origin producao 2>$null
    if ($LASTEXITCODE -ne 0) {
        git checkout producao
        git cherry-pick HEAD@{1} 2>$null
        git push origin producao
        git checkout teste
    }
} else {
    Write-Host "Workflows ja commitados."
    git push origin teste
}

Write-Host ""
Write-Host "Passo 4: Configurar GitHub Pages para Actions..."
$token = (& $gh auth token)
$headers = @{
    Authorization = "Bearer $token"
    Accept        = 'application/vnd.github+json'
    'User-Agent'  = 'SolarVita-Setup'
}
$body = @{ build_type = 'workflow' } | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri "https://api.github.com/repos/Step-edp/solarvita/pages" -Headers $headers -Body $body -ContentType 'application/json' | Out-Null

Write-Host ""
Write-Host "=== Concluido! ==="
Write-Host "Site: https://step-edp.github.io/solarvita/"
Write-Host ""
Write-Host "Teste:  push automatico na branch teste"
Write-Host "Producao: Actions -> Deploy Producao -> Run workflow -> digite DEPLOY"
Write-Host "URL: https://github.com/Step-edp/solarvita/actions/workflows/deploy-producao.yml"
