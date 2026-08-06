/**
 * Painel do Administrador — cadastros pendentes e atividades adiadas
 */

const ADMIN_EQUIPE_ATIVIDADES = (typeof SOLARVITA_DEMO !== 'undefined' && SOLARVITA_CONFIG.useDemoData)
  ? SOLARVITA_DEMO.adminEquipe
  : [];

let adminSessionRef = null;
let adminActiveTab = 'usuarios';
let adminInitialTabSet = false;
let adminUsuariosFilter = { search: '', tipo: '', status: '', perfil: '' };

function getAtividadesAdiadasAtivas(colaborador) {
  return colaborador.atividades.filter((a) => !a.concluida && a.diasAdiada > 0);
}

function calcularMetricasColaborador(colaborador) {
  const adiadas = getAtividadesAdiadasAtivas(colaborador);
  const totalDias = adiadas.reduce((sum, a) => sum + a.diasAdiada, 0);
  const totalVezes = adiadas.reduce((sum, a) => sum + (a.vezesAdiada ?? a.diasAdiada), 0);
  const mediaDias = adiadas.length ? totalDias / adiadas.length : 0;

  return {
    qtdAdiadas: adiadas.length,
    totalDiasAdiados: totalDias,
    totalVezesAdiadas: totalVezes,
    mediaDiasAdiados: mediaDias
  };
}

function formatTempoAdiado(dias) {
  if (dias === 0) return '0 dias';
  if (dias === 1) return '1 dia';
  return `${dias} dias`;
}

function formatVezesAdiado(vezes) {
  if (vezes === 0) return '0 vezes';
  if (vezes === 1) return '1 vez';
  return `${vezes} vezes`;
}

function formatMediaDias(dias) {
  if (!dias) return '—';
  return dias % 1 === 0 ? `${dias} dia${dias === 1 ? '' : 's'}` : `${dias.toFixed(1)} dias`;
}

function formatDataCadastro(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTipoLabel(tipo) {
  return ROLES[tipo]?.label || tipo || '—';
}

function getStatusLabel(status) {
  if (status === 'pendente') return 'Pendente';
  if (status === 'rejeitado') return 'Rejeitado';
  return 'Aprovado';
}

function getStatusClass(status) {
  if (status === 'pendente') return 'admin-user-status-pendente';
  if (status === 'rejeitado') return 'admin-user-status-rejeitado';
  return 'admin-user-status-aprovado';
}

function getUsuariosResumo(usuarios) {
  const resumo = {
    total: usuarios.length,
    admin: 0,
    cliente: 0,
    parceiro: 0,
    pendentes: 0
  };

  usuarios.forEach((user) => {
    if (user.tipo === 'admin') resumo.admin += 1;
    if (user.tipo === 'cliente') resumo.cliente += 1;
    if (user.tipo === 'parceiro') resumo.parceiro += 1;
    if (user.status === 'pendente') resumo.pendentes += 1;
  });

  return resumo;
}

function filterUsuarios(usuarios) {
  const term = adminUsuariosFilter.search.trim().toLowerCase();
  const digits = term.replace(/\D/g, '');

  return usuarios.filter((user) => {
    if (adminUsuariosFilter.tipo && user.tipo !== adminUsuariosFilter.tipo) return false;
    if (adminUsuariosFilter.status && (user.status || 'aprovado') !== adminUsuariosFilter.status) return false;
    if (adminUsuariosFilter.perfil && (user.perfil || '') !== adminUsuariosFilter.perfil) return false;

    if (!term) return true;

    const haystack = [
      user.nome,
      user.cpf,
      user.email,
      user.whatsapp,
      getTipoLabel(user.tipo),
      getPerfilLabel(user.perfil),
      getStatusLabel(user.status)
    ].filter(Boolean).join(' ').toLowerCase();

    if (haystack.includes(term)) return true;
    if (digits && user.cpf.includes(digits)) return true;
    return false;
  });
}

function renderPerfilFilterOptions(selected = '') {
  return Object.entries(ADMIN_PROFILES)
    .map(([value, profile]) => (
      `<option value="${value}" ${selected === value ? 'selected' : ''}>${profile.label}</option>`
    ))
    .join('');
}

function renderUsuariosRows(usuarios) {
  if (!usuarios.length) {
    return '<tr><td colspan="8" class="admin-table-empty">Nenhum usuário encontrado com os filtros atuais.</td></tr>';
  }

  return usuarios
    .map((user) => {
      const status = user.status || 'aprovado';
      const perfilCell = user.tipo === 'admin'
        ? `<span class="admin-perfil-badge">${getPerfilLabel(user.perfil)}</span>`
        : '—';

      return `
        <tr>
          <td><strong>${user.nome}</strong></td>
          <td>${formatCPF(user.cpf)}</td>
          <td>${getTipoLabel(user.tipo)}</td>
          <td>${perfilCell}</td>
          <td>${user.email || '—'}</td>
          <td>${user.whatsapp ? formatWhatsApp(user.whatsapp) : '—'}</td>
          <td><span class="admin-user-status ${getStatusClass(status)}">${getStatusLabel(status)}</span></td>
          <td>${formatDataCadastro(user.criadoEm)}</td>
        </tr>
      `;
    }).join('');
}

function getPerfilLabel(perfil) {
  return ADMIN_PROFILES[perfil]?.label || perfil || '—';
}

function getResumoEquipe() {
  const colaboradores = ADMIN_EQUIPE_ATIVIDADES.map((col) => ({
    ...col,
    metricas: calcularMetricasColaborador(col),
    adiadas: getAtividadesAdiadasAtivas(col)
  }));

  const totalAdiadas = colaboradores.reduce((sum, c) => sum + c.metricas.qtdAdiadas, 0);
  const totalDias = colaboradores.reduce((sum, c) => sum + c.metricas.totalDiasAdiados, 0);
  const totalVezes = colaboradores.reduce((sum, c) => sum + c.metricas.totalVezesAdiadas, 0);

  return { colaboradores, totalAdiadas, totalDias, totalVezes };
}

function renderAdminAtividadesRows(colaboradores) {
  if (!colaboradores.length) {
    return '<tr><td colspan="6" class="admin-table-empty">Nenhum colaborador com atividades adiadas.</td></tr>';
  }

  return colaboradores
    .sort((a, b) => b.metricas.totalDiasAdiados - a.metricas.totalDiasAdiados)
    .map((col) => {
      const detalhes = col.adiadas.length
        ? col.adiadas.map((a) => {
            const vezes = a.vezesAdiada ?? a.diasAdiada;
            return `
            <li>
              <strong>${a.titulo}</strong>
              <span>${a.cliente} · ${formatTempoAdiado(a.diasAdiada)} · ${formatVezesAdiado(vezes)}</span>
            </li>
          `;
          }).join('')
        : '<li class="admin-sem-adiadas">Nenhuma atividade adiada no momento.</li>';

      return `
        <tr class="admin-colab-row">
          <td>
            <strong>${col.nome}</strong>
            <span class="admin-colab-id">${col.id}</span>
          </td>
          <td><span class="admin-perfil-badge">${col.perfil}</span></td>
          <td class="admin-num ${col.metricas.qtdAdiadas ? 'admin-num-alert' : ''}">${col.metricas.qtdAdiadas}</td>
          <td class="admin-num ${col.metricas.totalVezesAdiadas ? 'admin-num-alert' : ''}">${formatVezesAdiado(col.metricas.totalVezesAdiadas)}</td>
          <td class="admin-num ${col.metricas.totalDiasAdiados ? 'admin-num-alert' : ''}">${formatTempoAdiado(col.metricas.totalDiasAdiados)}</td>
          <td>${formatMediaDias(col.metricas.mediaDiasAdiados)}</td>
        </tr>
        <tr class="admin-colab-detalhe-row">
          <td colspan="6">
            <ul class="admin-atividades-lista">${detalhes}</ul>
          </td>
        </tr>
      `;
    }).join('');
}

function renderCadastrosPendentesRows(pendentes) {
  if (!pendentes.length) {
    return '<tr><td colspan="7" class="admin-table-empty">Nenhum cadastro aguardando aprovação no momento.</td></tr>';
  }

  return pendentes
    .sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0))
    .map((user) => `
      <tr>
        <td><strong>${user.nome}</strong></td>
        <td>${formatCPF(user.cpf)}</td>
        <td>${user.email || '—'}</td>
        <td>${user.whatsapp ? formatWhatsApp(user.whatsapp) : '—'}</td>
        <td><span class="admin-perfil-badge">${getPerfilLabel(user.perfil)}</span></td>
        <td>${formatDataCadastro(user.criadoEm)}</td>
        <td class="admin-cadastro-actions">
          <button type="button" class="btn btn-sm btn-primary" data-approve-cadastro="${user.cpf}" data-perfil="${user.perfil}">Aprovar</button>
          <button type="button" class="btn btn-sm btn-outline-light admin-btn-reject" data-reject-cadastro="${user.cpf}" data-perfil="${user.perfil}">Rejeitar</button>
        </td>
      </tr>
    `).join('');
}

function switchAdminTab(tabId) {
  adminActiveTab = tabId;
  const adminPanel = document.getElementById('panel-admin');
  if (!adminPanel) return;

  adminPanel.querySelectorAll('[data-admin-tab]').forEach((btn) => {
    const isActive = btn.dataset.adminTab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  adminPanel.querySelectorAll('[data-admin-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.adminPanel !== tabId;
  });
}

function handleAdminPanelInput(event) {
  const searchInput = event.target.closest('[data-usuarios-search]');
  if (searchInput) {
    adminUsuariosFilter.search = searchInput.value;
    refreshUsuariosTable();
    return;
  }

  const tipoSelect = event.target.closest('[data-usuarios-tipo]');
  if (tipoSelect) {
    adminUsuariosFilter.tipo = tipoSelect.value;
    refreshUsuariosTable();
    return;
  }

  const statusSelect = event.target.closest('[data-usuarios-status]');
  if (statusSelect) {
    adminUsuariosFilter.status = statusSelect.value;
    refreshUsuariosTable();
    return;
  }

  const perfilSelect = event.target.closest('[data-usuarios-perfil]');
  if (perfilSelect) {
    adminUsuariosFilter.perfil = perfilSelect.value;
    refreshUsuariosTable();
  }
}

function refreshUsuariosTable() {
  const adminPanel = document.getElementById('panel-admin');
  if (!adminPanel || !adminPanel.dataset.usuariosJson) return;

  const usuarios = JSON.parse(adminPanel.dataset.usuariosJson);
  const filtrados = filterUsuarios(usuarios);
  const tbody = adminPanel.querySelector('[data-usuarios-tbody]');
  const countEl = adminPanel.querySelector('[data-usuarios-count]');

  if (tbody) tbody.innerHTML = renderUsuariosRows(filtrados);
  if (countEl) {
    countEl.textContent = filtrados.length === usuarios.length
      ? `${usuarios.length} usuário${usuarios.length === 1 ? '' : 's'}`
      : `${filtrados.length} de ${usuarios.length} usuários`;
  }
}

function handleAdminPanelClick(event) {
  const tabBtn = event.target.closest('[data-admin-tab]');
  if (tabBtn) {
    switchAdminTab(tabBtn.dataset.adminTab);
    return;
  }

  const approveBtn = event.target.closest('[data-approve-cadastro]');
  if (approveBtn) {
    const cpf = approveBtn.dataset.approveCadastro;
    const perfil = approveBtn.dataset.perfil;
    setCadastroStatus(cpf, perfil, 'aprovado')
      .then(() => renderAdministradorDashboard(adminSessionRef))
      .catch((error) => alert(error.message || 'Não foi possível aprovar.'));
    return;
  }

  const rejectBtn = event.target.closest('[data-reject-cadastro]');
  if (rejectBtn) {
    const cpf = rejectBtn.dataset.rejectCadastro;
    const perfil = rejectBtn.dataset.perfil;
    const nome = rejectBtn.closest('tr')?.querySelector('strong')?.textContent || 'este usuário';
    if (confirm(`Rejeitar o cadastro de ${nome}?`)) {
      setCadastroStatus(cpf, perfil, 'rejeitado')
        .then(() => renderAdministradorDashboard(adminSessionRef))
        .catch((error) => alert(error.message || 'Não foi possível rejeitar.'));
    }
  }
}

async function renderAdministradorDashboard(session) {
  const defaultPanel = document.getElementById('panel-default');
  const adminPanel = document.getElementById('panel-admin');
  if (!adminPanel) return;

  if (!adminPanel.dataset.eventsBound) {
    adminPanel.dataset.eventsBound = '1';
    adminPanel.addEventListener('click', handleAdminPanelClick);
    adminPanel.addEventListener('input', handleAdminPanelInput);
    adminPanel.addEventListener('change', handleAdminPanelInput);
  }

  adminSessionRef = session;

  if (defaultPanel) defaultPanel.hidden = true;
  adminPanel.hidden = false;
  document.title = 'Painel do Administrador — Sol Amplo';

  const pendentes = await getPendingCadastros().catch((error) => {
    console.error(error);
    return { error: error.message || 'Não foi possível carregar os cadastros pendentes.' };
  });
  const pendentesList = Array.isArray(pendentes) ? pendentes : [];
  const pendentesError = Array.isArray(pendentes) ? null : pendentes.error;

  const usuariosResult = await getAllUsuarios().catch((error) => {
    console.error(error);
    return { error: error.message || 'Não foi possível carregar os usuários.' };
  });
  const usuariosList = Array.isArray(usuariosResult) ? usuariosResult : [];
  const usuariosError = Array.isArray(usuariosResult) ? null : usuariosResult.error;
  const usuariosFiltrados = filterUsuarios(usuariosList);
  const usuariosResumo = getUsuariosResumo(usuariosList);

  const { colaboradores, totalAdiadas, totalDias, totalVezes } = getResumoEquipe();
  const colaboradoresComAdiadas = colaboradores.filter((c) => c.metricas.qtdAdiadas > 0).length;

  if (!adminInitialTabSet) {
    adminActiveTab = pendentesList.length ? 'cadastros' : 'usuarios';
    adminInitialTabSet = true;
  }

  adminPanel.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Painel do Administrador</h1>
        <p>Olá, <strong>${getPrimeiroNome(session.nome)}</strong> — visualize todos os usuários, aprove cadastros e acompanhe a equipe</p>
      </div>
      <a href="/" class="btn btn-outline-light">Voltar ao site</a>
    </div>

    <div class="admin-segmented" role="tablist" aria-label="Seções do administrador">
      <button
        type="button"
        class="admin-segment ${adminActiveTab === 'usuarios' ? 'active' : ''}"
        data-admin-tab="usuarios"
        role="tab"
        aria-selected="${adminActiveTab === 'usuarios' ? 'true' : 'false'}"
      >
        Usuários
      </button>
      <button
        type="button"
        class="admin-segment ${adminActiveTab === 'cadastros' ? 'active' : ''}"
        data-admin-tab="cadastros"
        role="tab"
        aria-selected="${adminActiveTab === 'cadastros' ? 'true' : 'false'}"
      >
        Cadastros pendentes
        ${pendentesList.length ? `<span class="admin-segment-badge">${pendentesList.length}</span>` : ''}
      </button>
      <button
        type="button"
        class="admin-segment ${adminActiveTab === 'atividades' ? 'active' : ''}"
        data-admin-tab="atividades"
        role="tab"
        aria-selected="${adminActiveTab === 'atividades' ? 'true' : 'false'}"
      >
        Tarefas
      </button>
    </div>

    <div class="admin-tab-panel" data-admin-panel="usuarios" ${adminActiveTab !== 'usuarios' ? 'hidden' : ''}>
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <span class="admin-stat-label">Total de usuários</span>
          <span class="admin-stat-value">${usuariosResumo.total}</span>
          <span class="admin-stat-extra">Todos os cadastros no sistema</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-label">Administrativos</span>
          <span class="admin-stat-value">${usuariosResumo.admin}</span>
          <span class="admin-stat-extra">Perfis internos</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-label">Clientes</span>
          <span class="admin-stat-value">${usuariosResumo.cliente}</span>
          <span class="admin-stat-extra">Área do cliente</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-label">Parceiros</span>
          <span class="admin-stat-value">${usuariosResumo.parceiro}</span>
          <span class="admin-stat-extra">Rede de parceiros</span>
        </div>
        <div class="admin-stat-card admin-stat-card-alert">
          <span class="admin-stat-label">Pendentes</span>
          <span class="admin-stat-value">${usuariosResumo.pendentes}</span>
          <span class="admin-stat-extra">Aguardando aprovação</span>
        </div>
      </div>

      <section class="vendedor-section admin-section">
        <h2>Todos os usuários</h2>
        <p class="section-desc">Lista completa de usuários cadastrados, com tipo, perfil, contato e status de acesso.</p>
        ${usuariosError ? `<div class="auth-alert show error">${usuariosError}</div>` : ''}

        <div class="clientes-toolbar admin-usuarios-toolbar">
          <div class="clientes-toolbar-search">
            <label for="admin-usuarios-search" class="visually-hidden">Buscar usuários</label>
            <input
              type="search"
              id="admin-usuarios-search"
              data-usuarios-search
              placeholder="Buscar por nome, CPF, e-mail ou perfil..."
              value="${adminUsuariosFilter.search.replace(/"/g, '&quot;')}"
            >
          </div>
          <div class="clientes-toolbar-filters">
            <select data-usuarios-tipo aria-label="Filtrar por tipo">
              <option value="" ${adminUsuariosFilter.tipo === '' ? 'selected' : ''}>Todos os tipos</option>
              <option value="admin" ${adminUsuariosFilter.tipo === 'admin' ? 'selected' : ''}>Administrativo</option>
              <option value="cliente" ${adminUsuariosFilter.tipo === 'cliente' ? 'selected' : ''}>Cliente</option>
              <option value="parceiro" ${adminUsuariosFilter.tipo === 'parceiro' ? 'selected' : ''}>Parceiro</option>
            </select>
            <select data-usuarios-perfil aria-label="Filtrar por perfil">
              <option value="" ${adminUsuariosFilter.perfil === '' ? 'selected' : ''}>Todos os perfis</option>
              ${renderPerfilFilterOptions(adminUsuariosFilter.perfil)}
            </select>
            <select data-usuarios-status aria-label="Filtrar por status">
              <option value="" ${adminUsuariosFilter.status === '' ? 'selected' : ''}>Todos os status</option>
              <option value="aprovado" ${adminUsuariosFilter.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
              <option value="pendente" ${adminUsuariosFilter.status === 'pendente' ? 'selected' : ''}>Pendente</option>
              <option value="rejeitado" ${adminUsuariosFilter.status === 'rejeitado' ? 'selected' : ''}>Rejeitado</option>
            </select>
            <span class="clientes-count" data-usuarios-count>
              ${usuariosFiltrados.length === usuariosList.length
                ? `${usuariosList.length} usuário${usuariosList.length === 1 ? '' : 's'}`
                : `${usuariosFiltrados.length} de ${usuariosList.length} usuários`}
            </span>
          </div>
        </div>

        <div class="admin-table-wrap">
          <table class="admin-table admin-table-usuarios">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Tipo</th>
                <th>Perfil</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Status</th>
                <th>Cadastrado em</th>
              </tr>
            </thead>
            <tbody data-usuarios-tbody>
              ${renderUsuariosRows(usuariosFiltrados)}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div class="admin-tab-panel" data-admin-panel="cadastros" ${adminActiveTab !== 'cadastros' ? 'hidden' : ''}>
      <div class="admin-stats-grid admin-stats-grid-compact">
        <div class="admin-stat-card admin-stat-card-alert">
          <span class="admin-stat-label">Aguardando aprovação</span>
          <span class="admin-stat-value">${pendentesList.length}</span>
          <span class="admin-stat-extra">Solicitações de acesso</span>
        </div>
      </div>

      <section class="vendedor-section admin-section">
        <h2>Solicitações de cadastro</h2>
        <p class="section-desc">Revise os dados e aprove ou rejeite novos acessos administrativos.</p>
        ${pendentesError ? `<div class="auth-alert show error">${pendentesError}</div>` : ''}
        <div class="admin-table-wrap">
          <table class="admin-table admin-table-cadastros">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>E-mail</th>
                <th>WhatsApp</th>
                <th>Perfil</th>
                <th>Solicitado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${renderCadastrosPendentesRows(pendentesList)}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div class="admin-tab-panel" data-admin-panel="atividades" ${adminActiveTab !== 'atividades' ? 'hidden' : ''}>
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <span class="admin-stat-label">Atividades adiadas</span>
          <span class="admin-stat-value">${totalAdiadas}</span>
          <span class="admin-stat-extra">Em aberto na equipe</span>
        </div>
        <div class="admin-stat-card admin-stat-card-alert">
          <span class="admin-stat-label">Vezes adiadas</span>
          <span class="admin-stat-value">${formatVezesAdiado(totalVezes)}</span>
          <span class="admin-stat-extra">Total de adiamentos</span>
        </div>
        <div class="admin-stat-card admin-stat-card-alert">
          <span class="admin-stat-label">Tempo total adiado</span>
          <span class="admin-stat-value">${formatTempoAdiado(totalDias)}</span>
          <span class="admin-stat-extra">Soma de todos os atrasos</span>
        </div>
        <div class="admin-stat-card">
          <span class="admin-stat-label">Colaboradores com atraso</span>
          <span class="admin-stat-value">${colaboradoresComAdiadas}</span>
          <span class="admin-stat-extra">De ${colaboradores.length} colaboradores</span>
        </div>
      </div>

      <section class="vendedor-section admin-section">
        <h2>Tarefas da equipe</h2>
        <p class="section-desc">Atividades adiadas por colaborador — quantidade, vezes adiadas e tempo total de atraso.</p>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Perfil</th>
                <th>Atividades adiadas</th>
                <th>Vezes adiadas</th>
                <th>Tempo adiado</th>
                <th>Média por tarefa</th>
              </tr>
            </thead>
            <tbody>
              ${renderAdminAtividadesRows(colaboradores)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  adminPanel.dataset.usuariosJson = JSON.stringify(usuariosList);
}
