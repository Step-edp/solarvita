const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { migrate } = require('./migrate');
const { seedAdmin } = require('./seed');

const { MAX_FILE_SIZE_LABEL } = require('./uploads');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const vendedorRoutes = require('./routes/vendedor');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.PORT || 8080;

const HTML_PAGES = [
  'login',
  'cadastro',
  'painel',
  'clientes',
  'cadastro-pendente'
];

const ROLES = ['parceiro', 'cliente', 'admin'];

function createApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser(process.env.SESSION_SECRET || 'solarvita-dev-secret'));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, database: Boolean(process.env.DATABASE_URL) });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/vendedor', vendedorRoutes);

  app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT, 'index.html'));
  });

  for (const page of HTML_PAGES) {
    app.get(`/${page}/:tipo`, (req, res) => {
      if (!ROLES.includes(req.params.tipo)) {
        return res.status(404).send('Not found');
      }
      res.sendFile(path.join(ROOT, `${page}.html`));
    });

    app.get(`/${page}`, (req, res) => {
      res.sendFile(path.join(ROOT, `${page}.html`));
    });
  }

  app.use(express.static(ROOT, { index: false }));

  app.use((err, req, res, next) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'arquivo_grande',
        message: `O arquivo excede o limite de ${MAX_FILE_SIZE_LABEL}. Para vídeos 4K do drone, envie um trecho curto ou comprima o arquivo antes de anexar.`
      });
    }

    if (err?.type === 'entity.too.large') {
      return res.status(413).json({
        error: 'arquivo_grande',
        message: `Arquivo muito grande. Limite: ${MAX_FILE_SIZE_LABEL}.`
      });
    }

    if (err?.code === 'anexos_nao_armazenados') {
      return res.status(400).json({
        error: err.code,
        message: err.message
      });
    }

    console.error(err);
    res.status(500).json({
      error: 'Erro interno do servidor.',
      message: err?.message || 'Erro interno do servidor.'
    });
  });

  return app;
}

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não configurada. Adicione PostgreSQL no Railway.');
    process.exit(1);
  }

  await migrate();
  await seedAdmin();

  const app = createApp();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sol Amplo rodando na porta ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});
