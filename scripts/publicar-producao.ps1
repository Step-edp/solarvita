# Publica a branch producao no GitHub Pages (somente quando solicitado)
param(
    [switch]$VoltarTeste
)

$ErrorActionPreference = 'Stop'
$owner = 'Step-edp'
$repo = 'solarvita'
$pagesUrl = "https://$owner.github.io/$repo/"

$cred = "protocol=https`nhost=github.com" | git credential fill
$token = ($cred | Select-String '^password=(.+)$').Matches.Groups[1].Value
if (-not $token) {
    Write-Error 'Credencial GitHub nao encontrada. Faca login no Git primeiro.'
}

$headers = @{
    Authorization = "Bearer $token"
    'User-Agent'  = 'SolarVita-Deploy'
    Accept        = 'application/vnd.github+json'
}

$branch = if ($VoltarTeste) { 'teste' } else { 'producao' }
$label = if ($VoltarTeste) { 'teste (automatico)' } else { 'producao' }

$body = @{
    build_type = 'legacy'
    source     = @{
        branch = $branch
        path   = '/'
    }
} | ConvertTo-Json -Depth 3

Write-Host "Publicando ambiente de $label na branch '$branch'..."
Invoke-RestMethod -Method Put -Uri "https://api.github.com/repos/$owner/$repo/pages" -Headers $headers -Body $body -ContentType 'application/json' | Out-Null

Write-Host ""
Write-Host "Deploy solicitado com sucesso."
Write-Host "URL: $pagesUrl"
Write-Host "Aguarde 1-2 minutos para o site atualizar."
if (-not $VoltarTeste) {
    Write-Host ""
    Write-Host "Para voltar ao ambiente de teste automatico, execute:"
    Write-Host "  .\scripts\publicar-producao.ps1 -VoltarTeste"
}
