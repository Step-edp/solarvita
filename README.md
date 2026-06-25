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
