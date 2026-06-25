# Copia os workflows para .github/workflows (requer permissao workflow no token)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$src = Join-Path $root 'deploy\workflows'
$dest = Join-Path $root '.github\workflows'

New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item (Join-Path $src 'deploy-teste.yml') $dest -Force
Copy-Item (Join-Path $src 'deploy-producao.yml') $dest -Force

Write-Host "Workflows copiados para .github/workflows/"
Write-Host "Faca commit e push apos autorizar escopo workflow no GitHub."
