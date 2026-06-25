/**
 * Painel do Administrador — acompanhamento de atividades adiadas
 */

const ADMIN_EQUIPE_ATIVIDADES = (typeof SOLARVITA_DEMO !== 'undefined' && SOLARVITA_CONFIG.useDemoData)
  ? SOLARVITA_DEMO.adminEquipe
  : [];

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

function renderAdministradorDashboard(session) {
  const defaultPanel = document.getElementById('panel-default');
  const adminPanel = document.getElementById('panel-admin');
  if (!adminPanel) return;

  if (defaultPanel) defaultPanel.hidden = true;
  adminPanel.hidden = false;
  document.title = 'Painel do Administrador — SolarVita';

  const { colaboradores, totalAdiadas, totalDias, totalVezes } = getResumoEquipe();
  const colaboradoresComAdiadas = colaboradores.filter((c) => c.metricas.qtdAdiadas > 0).length;

  adminPanel.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Painel do Administrador</h1>
        <p>Olá, <strong>${session.nome}</strong> — acompanhe atividades adiadas da equipe</p>
      </div>
      <a href="index.html" class="btn btn-outline-light">Voltar ao site</a>
    </div>

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
  `;
}
