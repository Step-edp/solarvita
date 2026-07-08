/**
 * Painel do Administrador — cadastros pendentes e atividades adiadas
 */

const ADMIN_EQUIPE_ATIVIDADES = (typeof SOLARVITA_DEMO !== 'undefined' && SOLARVITA_CONFIG.useDemoData)
  ? SOLARVITA_DEMO.adminEquipe
  : [];

let adminSessionRef = null;
let adminActiveTab = 'cadastros';
let adminInitialTabSet = false;

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
    btn.classList.toggle('active', btn.dataset.adminTab === tabId);
  });
  adminPanel.querySelectorAll('[data-admin-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.adminPanel !== tabId;
  });
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
  }

  adminSessionRef = session;

  if (defaultPanel) defaultPanel.hidden = true;
  adminPanel.hidden = false;
  document.title = 'Painel do Administrador — SolarVita';

  const pendentes = await getPendingCadastros().catch((error) => {
    console.error(error);
    return { error: error.message || 'Não foi possível carregar os cadastros pendentes.' };
  });
  const pendentesList = Array.isArray(pendentes) ? pendentes : [];
  const pendentesError = Array.isArray(pendentes) ? null : pendentes.error;
  const { colaboradores, totalAdiadas, totalDias, totalVezes } = getResumoEquipe();
  const colaboradoresComAdiadas = colaboradores.filter((c) => c.metricas.qtdAdiadas > 0).length;

  if (!adminInitialTabSet) {
    adminActiveTab = pendentesList.length ? 'cadastros' : 'atividades';
    adminInitialTabSet = true;
  }
  if (adminActiveTab === 'cadastros' && !pendentesList.length) {
    adminActiveTab = 'atividades';
  }

  adminPanel.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Painel do Administrador</h1>
        <p>Olá, <strong>${session.nome}</strong> — gerencie cadastros e acompanhe a equipe</p>
      </div>
      <a href="/" class="btn btn-outline-light">Voltar ao site</a>
    </div>

    <div class="admin-tabs">
      <button type="button" class="admin-tab ${adminActiveTab === 'cadastros' ? 'active' : ''}" data-admin-tab="cadastros">
        Cadastros pendentes
        ${pendentesList.length ? `<span class="admin-tab-badge">${pendentesList.length}</span>` : ''}
      </button>
      <button type="button" class="admin-tab ${adminActiveTab === 'atividades' ? 'active' : ''}" data-admin-tab="atividades">
        Atividades adiadas
      </button>
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
        <h2>Atividades adiadas por colaborador</h2>
        <p class="section-desc">Quantidade de tarefas em atraso, vezes adiadas e tempo total de adiamento por membro da equipe.</p>
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
}
