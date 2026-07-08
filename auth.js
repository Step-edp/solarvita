/**
 * SolarVita — Autenticação (CPF + senha)
 * Armazena usuários em localStorage (demo sem backend)
 */

const CADASTRO_CLIENTE_PERFIS = ['vendedor', 'backoffice', 'marketing', 'financeiro', 'projetista'];

const ROLES = {
  parceiro: {
    label: 'Parceiro',
    icon: '🤝',
    loginTitle: 'Seja Parceiro',
    loginSubtitle: 'Acesse sua área exclusiva de parceiro',
    cadastroTitle: 'Cadastro de Parceiro',
    cadastroSubtitle: 'Crie sua conta e comece a indicar clientes',
    panelTitle: 'Área do Parceiro',
    panelDesc: 'Bem-vindo à sua área de parceiro. Gerencie indicações e comissões.'
  },
  cliente: {
    label: 'Cliente',
    icon: '🏠',
    loginTitle: 'Área do Cliente',
    loginSubtitle: 'Acompanhe seu sistema solar e economia',
    cadastroTitle: 'Cadastro de Cliente',
    cadastroSubtitle: 'Crie sua conta para acessar seu painel',
    panelTitle: 'Área do Cliente',
    panelDesc: 'Bem-vindo! Aqui você acompanha a produção e economia do seu sistema.'
  },
  admin: {
    label: 'Área Administrativa',
    icon: '⚙️',
    loginTitle: 'Área Administrativa',
    loginSubtitle: 'Acesse com CPF e senha — seu perfil é identificado automaticamente',
    cadastroTitle: 'Cadastro Administrativo',
    cadastroSubtitle: 'Escolha seu perfil e crie sua conta de acesso',
    panelTitle: 'Painel Administrativo',
    panelDesc: 'Bem-vindo ao painel administrativo SolarVita.'
  }
};

const ADMIN_PROFILES = {
  administrador: {
    label: 'Administrador',
    icon: '👔',
    panelTitle: 'Painel do Administrador',
    panelDesc: 'Acesso total ao sistema. Gerencie usuários, configurações e relatórios.',
    modules: ['Usuários e permissões', 'Configurações do sistema', 'Relatórios gerais', 'Auditoria e logs']
  },
  vendedor: {
    label: 'Vendedor',
    icon: '🛒',
    panelTitle: 'Painel do Vendedor',
    panelDesc: 'Gerencie propostas, leads e acompanhe suas vendas e comissões.',
    modules: ['Propostas comerciais', 'Leads e indicações', 'Comissões', 'Metas de vendas']
  },
  financeiro: {
    label: 'Financeiro',
    icon: '💰',
    panelTitle: 'Painel Financeiro',
    panelDesc: 'Controle faturamento, pagamentos e fluxo de caixa da operação.',
    modules: ['Faturas e notas', 'Pagamentos recebidos', 'Fluxo de caixa', 'Conciliação bancária']
  },
  projetista: {
    label: 'Projetista',
    icon: '📐',
    panelTitle: 'Painel do Projetista',
    panelDesc: 'Elabore e acompanhe projetos técnicos de energia solar.',
    modules: ['Projetos em andamento', 'Dimensionamentos', 'Homologações', 'Biblioteca técnica']
  },
  backoffice: {
    label: 'BackOffice',
    icon: '📋',
    panelTitle: 'Painel BackOffice',
    panelDesc: 'Suporte operacional, documentação e acompanhamento de processos.',
    modules: ['Processos internos', 'Documentação', 'Suporte operacional', 'Agenda e tarefas']
  },
  marketing: {
    label: 'Marketing',
    icon: '📣',
    panelTitle: 'Painel de Marketing',
    panelDesc: 'Gerencie campanhas, conteúdo e comunicação da marca SolarVita.',
    modules: ['Campanhas digitais', 'Redes sociais', 'Materiais de apoio', 'Leads e métricas']
  }
};

const STORAGE_KEY = 'solarvita_users';
const SESSION_KEY = 'solarvita_session';
const DATA_VERSION_KEY = 'solarvita_data_version';
const DATA_VERSION = 2;

const DEMO_CPFS = new Set([
  '11144477735',
  '52998224725',
  '39053344705'
]);

const SEED_ADMIN = {
  nome: 'Administrador',
  cpf: '40280221851',
  email: 'admin@solarvita.com.br',
  senha: 'Step@241',
  tipo: 'admin',
  perfil: 'administrador',
  whatsapp: '12996839184',
  nascimento: '1990-01-15',
  status: 'aprovado'
};

let cachedSession;

function usesDatabase() {
  return Boolean(SOLARVITA_CONFIG.useDatabase);
}

function getAppOrigin() {
  if (!SOLARVITA_CONFIG.appUrl) return window.location.origin;
  try {
    return new URL(SOLARVITA_CONFIG.appUrl).origin;
  } catch {
    return window.location.origin;
  }
}

function isStaticAuthHost() {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return false;
  if (host.endsWith('.railway.app')) return false;
  return host.endsWith('github.io') || !usesDatabase();
}

async function ensureAuthUsesDatabase() {
  if (isStaticAuthHost() && SOLARVITA_CONFIG.appUrl) {
    const target = new URL(SOLARVITA_CONFIG.appUrl);
    target.pathname = window.location.pathname;
    target.search = window.location.search;
    window.location.replace(target.href);
    return false;
  }

  if (!usesDatabase()) return true;

  try {
    const response = await fetch('/api/health', { credentials: 'include' });
    const data = await response.json();
    return Boolean(response.ok && data.ok && data.database);
  } catch {
    return false;
  }
}

async function refreshSession() {
  if (!usesDatabase()) return getLocalSession();
  const data = await SolarVitaAPI.me();
  cachedSession = data.user || null;
  return cachedSession;
}

async function clearSessionAsync() {
  if (usesDatabase()) {
    await SolarVitaAPI.logout();
    cachedSession = null;
    return;
  }
  clearLocalSession();
}

function isAdminApproved(user) {
  return user.tipo !== 'admin' || !user.status || user.status === 'aprovado';
}

function upsertAdminUser(userData) {
  const users = getUsersRaw();
  const idx = users.findIndex(u =>
    u.cpf === userData.cpf && u.tipo === 'admin' && u.perfil === userData.perfil
  );

  if (idx >= 0) {
    users[idx] = { ...users[idx], ...userData, status: 'aprovado' };
  } else {
    users.push({ ...userData, criadoEm: new Date().toISOString() });
  }

  saveUsers(users);
}

function seedPendingAdminUser(userData) {
  if (!SOLARVITA_CONFIG.useDemoData) return;

  const users = getUsersRaw();
  const exists = users.some(u =>
    u.cpf === userData.cpf && u.tipo === 'admin' && u.perfil === userData.perfil
  );

  if (!exists) {
    users.push({ ...userData, criadoEm: userData.criadoEm || new Date().toISOString() });
    saveUsers(users);
  }
}

function cleanupLegacyDemoData() {
  const version = localStorage.getItem(DATA_VERSION_KEY);
  if (version === String(DATA_VERSION)) return;

  const users = getUsersRaw().filter((user) => {
    if (user.cpf === SEED_ADMIN.cpf && user.tipo === 'admin' && user.perfil === 'administrador') {
      return true;
    }
    return !DEMO_CPFS.has(user.cpf);
  });

  saveUsers(users);
  localStorage.removeItem('solarvita_vendedor_clientes');
  localStorage.setItem(DATA_VERSION_KEY, String(DATA_VERSION));
}

function getPendingCadastrosLocal() {
  return getUsersRaw().filter(u => u.tipo === 'admin' && u.status === 'pendente');
}

async function getPendingCadastros() {
  if (usesDatabase()) {
    try {
      const data = await SolarVitaAPI.getPendingCadastros();
      return data.cadastros || [];
    } catch (error) {
      console.error('Erro ao carregar cadastros pendentes:', error);
      throw error;
    }
  }
  return getPendingCadastrosLocal();
}

function mapLocalUserRow(user) {
  return {
    nome: user.nome,
    cpf: user.cpf,
    email: user.email || null,
    tipo: user.tipo,
    perfil: user.perfil || null,
    whatsapp: user.whatsapp || null,
    nascimento: user.nascimento || null,
    status: user.status || 'aprovado',
    criadoEm: user.criadoEm || null,
    aprovadoEm: user.aprovadoEm || null,
    rejeitadoEm: user.rejeitadoEm || null
  };
}

async function getAllUsuarios() {
  if (usesDatabase()) {
    const data = await SolarVitaAPI.getUsuarios();
    return data.usuarios || [];
  }
  return getUsersRaw().map(mapLocalUserRow);
}

function setCadastroStatusLocal(cpf, perfil, status) {
  const users = getUsersRaw();
  const idx = users.findIndex(u =>
    u.cpf === cpf && u.tipo === 'admin' && u.perfil === perfil
  );

  if (idx < 0) return false;

  users[idx].status = status;
  if (status === 'aprovado') users[idx].aprovadoEm = new Date().toISOString();
  if (status === 'rejeitado') users[idx].rejeitadoEm = new Date().toISOString();
  saveUsers(users);
  return true;
}

async function setCadastroStatus(cpf, perfil, status) {
  if (usesDatabase()) {
    await SolarVitaAPI.setCadastroStatus(cpf, perfil, status);
    return true;
  }
  return setCadastroStatusLocal(cpf, perfil, status);
}

function initAuthData() {
  cleanupLegacyDemoData();
  upsertAdminUser(SEED_ADMIN);

  if (SOLARVITA_CONFIG.useDemoData && typeof SOLARVITA_DEMO !== 'undefined' && SOLARVITA_DEMO.seedVendedor) {
    upsertAdminUser(SOLARVITA_DEMO.seedVendedor);
  }
  if (SOLARVITA_CONFIG.useDemoData && typeof SOLARVITA_DEMO !== 'undefined' && SOLARVITA_DEMO.pendingCadastros) {
    SOLARVITA_DEMO.pendingCadastros.forEach(seedPendingAdminUser);
  }
}

function getUsersRaw() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

if (!usesDatabase()) {
  initAuthData();
}

function getLocalSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setLocalSession(user) {
  const session = {
    cpf: user.cpf,
    tipo: user.tipo,
    nome: user.nome,
    perfil: user.perfil || null
  };
  if (user.whatsapp) session.whatsapp = user.whatsapp;
  if (user.nascimento) session.nascimento = user.nascimento;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
}

function pageUrl(page, tipo, extraParams = {}) {
  const extras = Object.entries(extraParams).filter(([, value]) => value != null && value !== '');
  if (tipo && extras.length === 0) {
    return `/${page}/${tipo}`;
  }

  const params = new URLSearchParams();
  if (tipo) params.set('tipo', tipo);
  extras.forEach(([key, value]) => params.set(key, value));
  const query = params.toString();
  return query ? `/${page}?${query}` : `/${page}`;
}

function getTipo() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('tipo');
  if (ROLES[fromQuery]) return fromQuery;

  const segments = window.location.pathname.split('/').filter(Boolean);
  const pageIdx = segments.findIndex((segment) =>
    ['login', 'cadastro', 'painel', 'clientes', 'cadastro-pendente'].includes(segment.replace('.html', ''))
  );
  if (pageIdx >= 0) {
    const fromPath = segments[pageIdx + 1];
    if (fromPath && ROLES[fromPath]) return fromPath;
  }

  return 'cliente';
}

function getUsers() {
  return getUsersRaw();
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getSession() {
  if (usesDatabase()) return cachedSession ?? null;
  return getLocalSession();
}

function setSession(user) {
  if (usesDatabase()) {
    cachedSession = {
      cpf: user.cpf,
      tipo: user.tipo,
      nome: user.nome,
      perfil: user.perfil || null,
      whatsapp: user.whatsapp || null,
      nascimento: user.nascimento || null
    };
    return;
  }
  setLocalSession(user);
}

function clearSession() {
  clearLocalSession();
}

function onlyDigits(str) {
  return str.replace(/\D/g, '');
}

function formatCPF(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function getPrimeiroNome(nome) {
  if (!nome) return '—';
  const primeiro = String(nome).trim().split(/\s+/)[0];
  return primeiro || nome;
}

function validateCPF(cpf) {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(d[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(d[10]);
}

function showAlert(el, message, type = 'error') {
  el.textContent = message;
  el.className = `auth-alert show ${type}`;
}

function hideAlert(el) {
  el.className = 'auth-alert';
  el.textContent = '';
}

function setupCPFInput(input) {
  input.addEventListener('input', () => {
    input.value = formatCPF(input.value);
    input.classList.remove('error');
  });
}

function setupPasswordToggle(wrapper) {
  const input = wrapper.querySelector('input');
  const btn = wrapper.querySelector('button');
  btn.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.textContent = isPassword ? '🙈' : '👁';
  });
}

function formatWhatsApp(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function validateWhatsApp(phone) {
  const d = onlyDigits(phone);
  return d.length === 10 || d.length === 11;
}

function validateBirthDate(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr + 'T00:00:00');
  return !Number.isNaN(date.getTime());
}

function formatBirthDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function setupWhatsAppInput(input) {
  input.addEventListener('input', () => {
    input.value = formatWhatsApp(input.value);
    input.classList.remove('error');
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showPendingApproval(tipo) {
  window.location.href = pageUrl('cadastro-pendente', tipo);
}

function clearBirthDateLimits(input) {
  if (!input) return;
  input.removeAttribute('min');
  input.removeAttribute('max');
  input.min = '';
  input.max = '';
}

function setupAdminExtraFields(tipo) {
  const group = document.getElementById('admin-extra-fields');
  const emailInput = document.getElementById('email');
  const whatsappInput = document.getElementById('whatsapp');
  const nascimentoInput = document.getElementById('nascimento');
  if (!group || !emailInput || !whatsappInput || !nascimentoInput) return;

  if (tipo === 'admin') {
    group.hidden = false;
    emailInput.required = true;
    whatsappInput.required = true;
    nascimentoInput.required = true;
    setupWhatsAppInput(whatsappInput);
    clearBirthDateLimits(nascimentoInput);
    return { emailInput, whatsappInput, nascimentoInput };
  }

  group.hidden = true;
  emailInput.required = false;
  whatsappInput.required = false;
  nascimentoInput.required = false;
  return null;
}

function populatePerfilSelect(select) {
  select.innerHTML = '<option value="">Selecione seu perfil</option>';
  Object.entries(ADMIN_PROFILES).forEach(([key, p]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `${p.icon} ${p.label}`;
    select.appendChild(opt);
  });
}

function setupAdminPerfilField(tipo) {
  const group = document.getElementById('perfil-group');
  const select = document.getElementById('perfil');
  if (!group || !select) return null;

  if (tipo === 'admin') {
    group.hidden = false;
    select.required = true;
    populatePerfilSelect(select);
    return select;
  }

  group.hidden = true;
  select.required = false;
  return null;
}

function getPerfilFromForm(perfilSelect) {
  return perfilSelect ? perfilSelect.value : null;
}

function findUserForLogin(cpf, senha, preferredTipo) {
  const allMatches = getUsers().filter(u => u.cpf === cpf && u.senha === senha);

  if (!allMatches.length) {
    if (getUsers().some(u => u.cpf === cpf)) return { error: 'wrong_password' };
    return { error: 'not_found' };
  }

  if (preferredTipo) {
    const inArea = allMatches.filter(u => u.tipo === preferredTipo);
    if (inArea.length === 1) return { user: inArea[0] };
    if (inArea.length > 1) {
      const approved = inArea.find(u => isAdminApproved(u));
      return { user: approved || inArea[0] };
    }
  }

  if (allMatches.length === 1) return { user: allMatches[0] };

  const approved = allMatches.find(u => isAdminApproved(u));
  return { user: approved || allMatches[0] };
}

function initLoginPage() {
  (async () => {
    const dbReady = await ensureAuthUsesDatabase();
    if (!dbReady) {
      const alert = document.getElementById('auth-alert');
      if (alert && usesDatabase()) {
        showAlert(alert, 'Não foi possível conectar ao servidor. Tente novamente em instantes.');
      }
      return;
    }

    const tipo = getTipo();
    const role = ROLES[tipo];

    document.title = `${role.loginTitle} — SolarVita`;
    document.getElementById('auth-badge').textContent = `${role.icon} ${role.label}`;
    document.getElementById('auth-title').textContent = role.loginTitle;
    document.getElementById('auth-subtitle').textContent = role.loginSubtitle;
    document.getElementById('link-cadastro').href = pageUrl('cadastro', tipo);

    const form = document.getElementById('login-form');
    const alert = document.getElementById('auth-alert');
    const cpfInput = document.getElementById('cpf');

    setupCPFInput(cpfInput);
    setupPasswordToggle(document.querySelector('.password-toggle'));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alert);

      const cpf = onlyDigits(cpfInput.value);
      const senha = document.getElementById('senha').value;

      if (!validateCPF(cpf)) {
        cpfInput.classList.add('error');
        showAlert(alert, 'CPF inválido. Verifique os números digitados.');
        return;
      }

      if (!senha) {
        showAlert(alert, 'Informe sua senha.');
        return;
      }

      if (usesDatabase()) {
        try {
          const data = await SolarVitaAPI.login(cpf, senha, tipo);
          setSession(data.user);
          window.location.href = pageUrl('painel', data.user.tipo);
        } catch (error) {
          if (error.code === 'not_found') {
            showAlert(alert, 'CPF não cadastrado nesta área. Clique em "Cadastre-se" para criar sua conta.');
            return;
          }
          if (error.code === 'wrong_password') {
            showAlert(alert, 'Senha incorreta. Tente novamente.');
            return;
          }
          if (error.code === 'pending') {
            window.location.href = pageUrl('cadastro-pendente', 'admin');
            return;
          }
          showAlert(alert, error.message || 'Não foi possível entrar. Tente novamente.');
        }
        return;
      }

      const result = findUserForLogin(cpf, senha, tipo);

      if (result.error === 'not_found') {
        showAlert(alert, 'CPF não cadastrado nesta área. Clique em "Cadastre-se" para criar sua conta.');
        return;
      }

      if (result.error === 'wrong_password') {
        showAlert(alert, 'Senha incorreta. Tente novamente.');
        return;
      }

      const user = result.user;

      if (user.tipo === 'admin' && !isAdminApproved(user)) {
        window.location.href = pageUrl('cadastro-pendente', 'admin');
        return;
      }

      setSession(user);
      window.location.href = pageUrl('painel', user.tipo);
    });
  })();
}

function initCadastroPage() {
  (async () => {
    const dbReady = await ensureAuthUsesDatabase();
    if (!dbReady) {
      const alert = document.getElementById('auth-alert');
      if (alert && usesDatabase()) {
        showAlert(alert, 'Não foi possível conectar ao servidor. Tente novamente em instantes.');
      }
      return;
    }

    const tipo = getTipo();
  const role = ROLES[tipo];

  document.title = `${role.cadastroTitle} — SolarVita`;
  document.getElementById('auth-badge').textContent = `${role.icon} ${role.label}`;
  document.getElementById('auth-title').textContent = role.cadastroTitle;
  document.getElementById('auth-subtitle').textContent = role.cadastroSubtitle;
  document.getElementById('link-login').href = pageUrl('login', tipo);

  const form = document.getElementById('cadastro-form');
  const alert = document.getElementById('auth-alert');
  const cpfInput = document.getElementById('cpf');

  setupCPFInput(cpfInput);
  document.querySelectorAll('.password-toggle').forEach(setupPasswordToggle);
  clearBirthDateLimits(document.getElementById('nascimento'));
  const perfilSelect = setupAdminPerfilField(tipo);
  const adminFields = setupAdminExtraFields(tipo);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alert);

    const nome = document.getElementById('nome').value.trim();
    const cpf = onlyDigits(cpfInput.value);
    const senha = document.getElementById('senha').value;
    const confirmar = document.getElementById('confirmar').value;
    const perfil = getPerfilFromForm(perfilSelect);

    if (nome.length < 3) {
      showAlert(alert, 'Informe seu nome completo.');
      return;
    }

    if (tipo === 'admin' && !perfil) {
      showAlert(alert, 'Selecione seu perfil de acesso.');
      return;
    }

    if (tipo === 'admin' && adminFields) {
      const email = adminFields.emailInput.value.trim();
      const whatsapp = adminFields.whatsappInput.value;
      const nascimento = adminFields.nascimentoInput.value;

      if (!validateEmail(email)) {
        adminFields.emailInput.classList.add('error');
        showAlert(alert, 'Informe um e-mail válido.');
        return;
      }

      if (!validateWhatsApp(whatsapp)) {
        adminFields.whatsappInput.classList.add('error');
        showAlert(alert, 'Informe um WhatsApp válido com DDD. Ex: (11) 98765-4321');
        return;
      }

      if (!validateBirthDate(nascimento)) {
        adminFields.nascimentoInput.classList.add('error');
        showAlert(alert, 'Informe uma data de nascimento válida.');
        return;
      }
    }

    if (!validateCPF(cpf)) {
      cpfInput.classList.add('error');
      showAlert(alert, 'CPF inválido. Verifique os números digitados.');
      return;
    }

    if (senha.length < 6) {
      showAlert(alert, 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmar) {
      showAlert(alert, 'As senhas não coincidem.');
      return;
    }

    if (usesDatabase()) {
      try {
        const payload = { nome, cpf, senha, tipo };
        if (tipo === 'admin' && adminFields) {
          payload.perfil = perfil;
          payload.email = adminFields.emailInput.value.trim();
          payload.whatsapp = onlyDigits(adminFields.whatsappInput.value);
          payload.nascimento = adminFields.nascimentoInput.value;
        }

        const data = await SolarVitaAPI.register(payload);

        if (data.pending) {
          showPendingApproval(tipo);
          return;
        }

        setSession(data.user);
        showAlert(alert, 'Cadastro realizado com sucesso! Redirecionando...', 'success');
        setTimeout(() => {
          window.location.href = pageUrl('painel', tipo);
        }, 1200);
      } catch (error) {
        showAlert(alert, error.message || 'Não foi possível concluir o cadastro.');
      }
      return;
    }

    const users = getUsers();
    const exists = users.some(u =>
      u.cpf === cpf &&
      u.tipo === tipo &&
      (tipo !== 'admin' || u.perfil === perfil)
    );

    if (exists) {
      showAlert(alert, 'Este CPF já está cadastrado neste perfil. Faça login ou escolha outro perfil.');
      return;
    }

    const newUser = { nome, cpf, senha, tipo };
    if (tipo === 'admin') {
      newUser.perfil = perfil;
      newUser.email = adminFields.emailInput.value.trim();
      newUser.whatsapp = onlyDigits(adminFields.whatsappInput.value);
      newUser.nascimento = adminFields.nascimentoInput.value;
      newUser.status = 'pendente';
      newUser.criadoEm = new Date().toISOString();
    }
    users.push(newUser);
    saveUsers(users);

    if (tipo === 'admin') {
      showPendingApproval(tipo);
      return;
    }

    setSession(newUser);

    showAlert(alert, 'Cadastro realizado com sucesso! Redirecionando...', 'success');
    setTimeout(() => {
      window.location.href = pageUrl('painel', tipo);
    }, 1200);
  });
  })();
}

function renderAdminModules(perfil) {
  const container = document.getElementById('panel-modules');
  if (!container || !ADMIN_PROFILES[perfil]) return;

  const profile = ADMIN_PROFILES[perfil];
  container.hidden = false;
  container.innerHTML = `
    <h2>Módulos disponíveis</h2>
    <div class="modules-grid">
      ${profile.modules.map(m => `<div class="module-card">${m}</div>`).join('')}
    </div>
  `;
}

function initPainelPage() {
  (async () => {
    const tipo = getTipo();
    const role = ROLES[tipo];

    if (usesDatabase()) {
      await refreshSession();
    }

    const session = getSession();

    if (!session || session.tipo !== tipo) {
      window.location.href = pageUrl('login', tipo);
      return;
    }

    if (tipo === 'admin' && !session.perfil) {
      window.location.href = pageUrl('login', 'admin');
      return;
    }

    let panelTitle = role.panelTitle;
    let panelDesc = role.panelDesc;
    let roleLabel = role.label;

    if (tipo === 'admin' && session.perfil && ADMIN_PROFILES[session.perfil]) {
      const profile = ADMIN_PROFILES[session.perfil];
      panelTitle = profile.panelTitle;
      panelDesc = profile.panelDesc;
      roleLabel = profile.label;

      if (session.perfil === 'vendedor') {
        await renderVendedorDashboard(session);
        document.getElementById('user-name').textContent = getPrimeiroNome(session.nome);
        document.getElementById('btn-logout').addEventListener('click', async () => {
          await clearSessionAsync();
          window.location.href = pageUrl('login', tipo);
        });
        return;
      }

      if (['backoffice', 'marketing', 'financeiro', 'projetista'].includes(session.perfil)) {
        await renderPainelOperacional(session);
        document.getElementById('user-name').textContent = getPrimeiroNome(session.nome);
        document.getElementById('btn-logout').addEventListener('click', async () => {
          await clearSessionAsync();
          window.location.href = pageUrl('login', tipo);
        });
        return;
      }

      if (session.perfil === 'administrador') {
        await renderAdministradorDashboard(session);
        document.getElementById('user-name').textContent = getPrimeiroNome(session.nome);
        document.getElementById('btn-logout').addEventListener('click', async () => {
          await clearSessionAsync();
          window.location.href = pageUrl('login', tipo);
        });
        return;
      }

      renderAdminModules(session.perfil);
    }

    document.title = `${panelTitle} — SolarVita`;
    document.getElementById('panel-title').textContent = panelTitle;
    document.getElementById('panel-desc').textContent = panelDesc;
    document.getElementById('user-name').textContent = getPrimeiroNome(session.nome);
    document.getElementById('user-cpf').textContent = formatCPF(session.cpf);
    document.getElementById('user-role').textContent = roleLabel;

    if (tipo === 'admin' && session.whatsapp) {
      document.getElementById('user-whatsapp-row').hidden = false;
      document.getElementById('user-whatsapp').textContent = formatWhatsApp(session.whatsapp);
    }

    if (tipo === 'admin' && session.nascimento) {
      document.getElementById('user-nascimento-row').hidden = false;
      document.getElementById('user-nascimento').textContent = formatBirthDate(session.nascimento);
    }

    document.getElementById('btn-logout').addEventListener('click', async () => {
      await clearSessionAsync();
      window.location.href = pageUrl('login', tipo);
    });
  })().catch((error) => {
    console.error(error);
    window.location.href = pageUrl('login', getTipo());
  });
}

function initClientesPage() {
  (async () => {
    if (usesDatabase()) {
      await refreshSession();
    }

    const session = getSession();
    let tipo = getTipo();

    if (!session) {
      window.location.href = pageUrl('login', 'admin');
      return;
    }

    if (session.tipo === 'admin' && tipo !== 'admin') {
      window.location.replace(pageUrl('clientes', 'admin'));
      return;
    }

    if (session.tipo !== 'admin' || !CADASTRO_CLIENTE_PERFIS.includes(session.perfil)) {
      window.location.href = pageUrl('painel', session.tipo || tipo);
      return;
    }

    tipo = 'admin';

    document.getElementById('user-name').textContent = getPrimeiroNome(session.nome);
    await renderVendedorClientesPage(session);

    document.getElementById('btn-logout').addEventListener('click', async () => {
      await clearSessionAsync();
      window.location.href = pageUrl('login', tipo);
    });
  })().catch((error) => {
    console.error(error);
    window.location.href = pageUrl('login', 'admin');
  });
}
