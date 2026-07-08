const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { migrate } = require('./migrate');
const { seedAdmin } = require('./seed');

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

  app.use(express.json({ limit: '2mb' }));
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
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
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
    console.log(`SolarVita rodando na porta ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});
