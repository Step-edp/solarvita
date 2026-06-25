# SolarVita

Landing page e painéis de energia solar (HTML/CSS/JS).

## Ambientes (branches)

| Branch | Descrição |
|--------|-----------|
| `teste` | Dados fictícios para demonstração (vendedor seed, clientes, agenda, equipe admin) |
| `producao` | Sem dados fictícios — apenas login seed do administrador |

### Login administrador (ambas as branches)

- **CPF:** `40280221851`
- **Senha:** `Step@241`
- **Perfil:** Administrador

### Login vendedor demo (somente branch `teste`)

- **CPF:** `11144477735`
- **Senha:** `Vendedor@123`

## Executar localmente

```bash
python -m http.server 8080
```

Acesse `http://localhost:8080`

## Trocar de ambiente

```bash
git checkout teste      # ambiente de teste
git checkout producao   # ambiente de produção
```

A diferença entre os ambientes está em `config.js` e na presença de `data/demo-data.js`.

## Deploy (GitHub Pages)

Site: **https://step-edp.github.io/solarvita/**

| Ambiente | Branch | Como publicar |
|----------|--------|---------------|
| **Teste** | `teste` | **Automatico** — a cada `git push` na branch `teste` |
| **Producao** | `producao` | **Manual** — somente quando voce pedir (veja abaixo) |

### Publicar producao (manual)

No PowerShell, na pasta do projeto:

```powershell
.\scripts\publicar-producao.ps1
```

Para voltar ao ambiente de teste (deploy automatico na branch `teste`):

```powershell
.\scripts\publicar-producao.ps1 -VoltarTeste
```

### Workflows GitHub Actions (opcional)

Os arquivos em `.github/workflows/` publicam via GitHub Actions. Se o push dos workflows falhar por falta de permissao `workflow`, autorize uma vez em:

https://github.com/settings/applications

Depois faca push da branch `teste` normalmente.

- **Deploy Teste** — automatico a cada push em `teste`
- **Deploy Producao** — manual em Actions, digitando `DEPLOY` para confirmar


