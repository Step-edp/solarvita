/**
 * SolarVita — Autenticação (CPF + senha)
 * Armazena usuários em localStorage (demo sem backend)
 */

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
    loginSubtitle: 'Selecione seu perfil e acesse com CPF e senha',
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
  }
};

const STORAGE_KEY = 'solarvita_users';
const SESSION_KEY = 'solarvita_session';

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

function initAuthData() {
  upsertAdminUser(SEED_ADMIN);
  if (SOLARVITA_CONFIG.useDemoData && typeof SOLARVITA_DEMO !== 'undefined' && SOLARVITA_DEMO.seedVendedor) {
    upsertAdminUser(SOLARVITA_DEMO.seedVendedor);
  }
}

function getUsersRaw() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

initAuthData();

function getTipo() {
  const params = new URLSearchParams(window.location.search);
  const tipo = params.get('tipo');
  return ROLES[tipo] ? tipo : 'cliente';
}

function getUsers() {
  return getUsersRaw();
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setSession(user) {
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

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
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
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date >= today) return false;

  const minAge = new Date();
  minAge.setFullYear(minAge.getFullYear() - 18);
  if (date > minAge) return false;

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  return date >= minDate;
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
  window.location.href = `cadastro-pendente.html?tipo=${tipo}`;
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

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    nascimentoInput.max = maxDate.toISOString().split('T')[0];
    nascimentoInput.min = '1920-01-01';
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

function initLoginPage() {
  const tipo = getTipo();
  const role = ROLES[tipo];

  document.title = `${role.loginTitle} — SolarVita`;
  document.getElementById('auth-badge').textContent = `${role.icon} ${role.label}`;
  document.getElementById('auth-title').textContent = role.loginTitle;
  document.getElementById('auth-subtitle').textContent = role.loginSubtitle;
  document.getElementById('link-cadastro').href = `cadastro.html?tipo=${tipo}`;

  const form = document.getElementById('login-form');
  const alert = document.getElementById('auth-alert');
  const cpfInput = document.getElementById('cpf');

  setupCPFInput(cpfInput);
  setupPasswordToggle(document.querySelector('.password-toggle'));
  const perfilSelect = setupAdminPerfilField(tipo);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideAlert(alert);

    const cpf = onlyDigits(cpfInput.value);
    const senha = document.getElementById('senha').value;
    const perfil = getPerfilFromForm(perfilSelect);

    if (!validateCPF(cpf)) {
      cpfInput.classList.add('error');
      showAlert(alert, 'CPF inválido. Verifique os números digitados.');
      return;
    }

    if (tipo === 'admin' && !perfil) {
      showAlert(alert, 'Selecione seu perfil de acesso.');
      return;
    }

    if (!senha) {
      showAlert(alert, 'Informe sua senha.');
      return;
    }

    const user = getUsers().find(u =>
      u.cpf === cpf &&
      u.tipo === tipo &&
      (tipo !== 'admin' || u.perfil === perfil)
    );

    if (!user) {
      showAlert(alert, 'CPF não cadastrado nesta área. Clique em "Cadastre-se" para criar sua conta.');
      return;
    }

    if (user.senha !== senha) {
      showAlert(alert, 'Senha incorreta. Tente novamente.');
      return;
    }

    if (tipo === 'admin' && !isAdminApproved(user)) {
      window.location.href = 'cadastro-pendente.html?tipo=admin';
      return;
    }

    setSession(user);
    window.location.href = `painel.html?tipo=${tipo}`;
  });
}

function initCadastroPage() {
  const tipo = getTipo();
  const role = ROLES[tipo];

  document.title = `${role.cadastroTitle} — SolarVita`;
  document.getElementById('auth-badge').textContent = `${role.icon} ${role.label}`;
  document.getElementById('auth-title').textContent = role.cadastroTitle;
  document.getElementById('auth-subtitle').textContent = role.cadastroSubtitle;
  document.getElementById('link-login').href = `login.html?tipo=${tipo}`;

  const form = document.getElementById('cadastro-form');
  const alert = document.getElementById('auth-alert');
  const cpfInput = document.getElementById('cpf');

  setupCPFInput(cpfInput);
  document.querySelectorAll('.password-toggle').forEach(setupPasswordToggle);
  const perfilSelect = setupAdminPerfilField(tipo);
  const adminFields = setupAdminExtraFields(tipo);

  form.addEventListener('submit', (e) => {
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
        showAlert(alert, 'Informe uma data de nascimento válida (mínimo 18 anos).');
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
      window.location.href = `painel.html?tipo=${tipo}`;
    }, 1200);
  });
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
  const tipo = getTipo();
  const role = ROLES[tipo];
  const session = getSession();

  if (!session || session.tipo !== tipo) {
    window.location.href = `login.html?tipo=${tipo}`;
    return;
  }

  if (tipo === 'admin' && !session.perfil) {
    window.location.href = 'login.html?tipo=admin';
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
      renderVendedorDashboard(session);
      document.getElementById('user-name').textContent = session.nome;
      document.getElementById('btn-logout').addEventListener('click', () => {
        clearSession();
        window.location.href = `login.html?tipo=${tipo}`;
      });
      return;
    }

    if (session.perfil === 'administrador') {
      renderAdministradorDashboard(session);
      document.getElementById('user-name').textContent = session.nome;
      document.getElementById('btn-logout').addEventListener('click', () => {
        clearSession();
        window.location.href = `login.html?tipo=${tipo}`;
      });
      return;
    }

    renderAdminModules(session.perfil);
  }

  document.title = `${panelTitle} — SolarVita`;
  document.getElementById('panel-title').textContent = panelTitle;
  document.getElementById('panel-desc').textContent = panelDesc;
  document.getElementById('user-name').textContent = session.nome;
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

  document.getElementById('btn-logout').addEventListener('click', () => {
    clearSession();
    window.location.href = `login.html?tipo=${tipo}`;
  });
}

function initClientesPage() {
  const session = getSession();
  let tipo = getTipo();

  if (!session) {
    window.location.href = `login.html?tipo=admin`;
    return;
  }

  if (session.tipo === 'admin' && tipo !== 'admin') {
    window.location.replace('clientes.html?tipo=admin');
    return;
  }

  if (session.tipo !== 'admin' || session.perfil !== 'vendedor') {
    window.location.href = `painel.html?tipo=${session.tipo || tipo}`;
    return;
  }

  tipo = 'admin';

  document.getElementById('user-name').textContent = session.nome;
  renderVendedorClientesPage(session);

  document.getElementById('btn-logout').addEventListener('click', () => {
    clearSession();
    window.location.href = `login.html?tipo=${tipo}`;
  });
}
