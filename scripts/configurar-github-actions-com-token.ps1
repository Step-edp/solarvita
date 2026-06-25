# Configura GitHub Actions usando Personal Access Token (alternativa ao device login)
param(
    [string]$Token
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $root

$owner = 'Step-edp'
$repo = 'solarvita'

if (-not $Token) {
    Write-Host ""
    Write-Host "=== Token GitHub para Actions ==="
    Write-Host ""
    Write-Host "1. Abra (logado como Step-edp):"
    Write-Host "   https://github.com/settings/tokens/new?scopes=repo,workflow&description=SolarVita-Actions"
    Write-Host ""
    Write-Host "2. Gere o token e cole abaixo (nao sera exibido):"
    $Token = Read-Host -AsSecureString
    $Token = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)
    )
}

if (-not $Token -or $Token.Length -lt 20) {
    Write-Error "Token invalido."
}

$headers = @{
    Authorization = "Bearer $Token"
    Accept        = 'application/vnd.github+json'
    'User-Agent'  = 'SolarVita-Setup'
}

Write-Host "Validando token..."
try {
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
    Write-Host "Conta: $($user.login)"
} catch {
    Write-Error "Token rejeitado. Verifique se marcou os escopos repo e workflow."
}

Write-Host "Instalando workflows..."
& (Join-Path $root 'scripts\instalar-workflows.ps1')

function Publish-File($path, $branch) {
    $full = Join-Path $root $path
    if (-not (Test-Path $full)) { return }
    $bytes = [Text.Encoding]::UTF8.GetBytes((Get-Content $full -Raw))
    $b64 = [Convert]::ToBase64String($bytes)
    $uri = "https://api.github.com/repos/$owner/$repo/contents/$($path.Replace('\','/'))"
    $existing = $null
    try {
        $existing = Invoke-RestMethod -Uri "$uri`?ref=$branch" -Headers $headers
    } catch { }
    $body = @{
        message = "Ativa GitHub Actions: $path"
        content = $b64
        branch  = $branch
    }
    if ($existing.sha) { $body.sha = $existing.sha }
    Invoke-RestMethod -Method Put -Uri $uri -Headers $headers -Body ($body | ConvertTo-Json) -ContentType 'application/json' | Out-Null
    Write-Host "  OK $path -> $branch"
}

Write-Host "Publicando workflows na branch teste..."
Publish-File '.github\workflows\deploy-teste.yml' 'teste'
Publish-File '.github\workflows\deploy-producao.yml' 'teste'

Write-Host "Publicando workflows na branch producao..."
Publish-File '.github\workflows\deploy-teste.yml' 'producao'
Publish-File '.github\workflows\deploy-producao.yml' 'producao'

Write-Host "Configurando GitHub Pages para Actions..."
$pagesBody = @{ build_type = 'workflow' } | ConvertTo-Json
Invoke-RestMethod -Method Put -Uri "https://api.github.com/repos/$owner/$repo/pages" -Headers $headers -Body $pagesBody -ContentType 'application/json' | Out-Null

Write-Host ""
Write-Host "=== Concluido! ==="
Write-Host "Site: https://step-edp.github.io/solarvita/"
Write-Host "Teste: push automatico em teste"
Write-Host "Producao: https://github.com/$owner/$repo/actions/workflows/deploy-producao.yml"
Write-Host ""
Write-Host "Sincronizando repositorio local..."
git pull origin teste
git pull origin producao 2>$null
