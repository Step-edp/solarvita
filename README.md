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

### Workflows GitHub Actions (opcional, recomendado)

Templates em `deploy/workflows/`. Para ativar deploy via Actions:

**Opcao A — Token (mais simples)**

1. Gere um token em: https://github.com/settings/tokens/new?scopes=repo,workflow&description=SolarVita-Actions
2. Execute: `.\scripts\configurar-github-actions-com-token.ps1`
3. Cole o token quando pedido

**Opcao B — GitHub CLI**

1. Execute: `.\scripts\configurar-github-actions.ps1`
2. Autorize no navegador quando aparecer o codigo

- **Deploy Teste** — automatico a cada push em `teste`
- **Deploy Producao** — manual em Actions, digitando `DEPLOY` para confirmar

Enquanto os workflows nao estiverem ativos, use `publicar-producao.ps1` para producao.

## Deploy (Railway)

Repositorio: **https://github.com/Step-edp/solarvita**

| Ambiente | Branch | Deploy |
|----------|--------|--------|
| **Teste** | `teste` | Automatico a cada push |
| **Producao** | `producao` | Manual (somente quando voce solicitar) |

### Configurar no Railway (uma vez)

1. Acesse https://railway.com/new
2. **Deploy from GitHub repo** → `Step-edp/solarvita`
3. Ambiente **teste**: branch `teste`, **Auto Deploy** ligado
4. Crie ambiente **producao**: branch `producao`, **Auto Deploy** desligado
5. Deploy de producao: botao **Deploy** no painel Railway

O site sobe com `npm start` (servidor estatico na porta `PORT`).


