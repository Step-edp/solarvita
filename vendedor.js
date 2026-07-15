/**
 * Painel do Vendedor — mapa e gestão de clientes
 */

const DEMO = (typeof SOLARVITA_DEMO !== 'undefined' && SOLARVITA_CONFIG.useDemoData)
  ? SOLARVITA_DEMO
  : null;

const VENDEDOR_STATS = DEMO?.vendedorStats ?? {
  apresentadas: 0,
  convertidas: 0,
  perdidas: 0,
  prospectados: 0
};

const VENDEDOR_COMISSAO_MES = DEMO?.comissaoMes ?? 0;

const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getMesAtualLabel() {
  const hoje = new Date();
  return `${MESES_NOME[hoje.getMonth()]} ${hoje.getFullYear()}`;
}

function formatDataHoje() {
  const hoje = new Date();
  return `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
}

function formatCarimbo(date = new Date()) {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatCoords(lat, lng) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

const DIAS_SEMANA_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toISODate(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDataBR(iso) {
  const date = parseISODate(iso);
  if (!date) return '';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function initModernDatePicker(container) {
  if (!container) return { reset() {} };

  const hidden = container.querySelector('input[type="hidden"]');
  const trigger = container.querySelector('.date-picker-trigger');
  const valueEl = container.querySelector('.date-picker-value');
  const popover = container.querySelector('.date-picker-popover');
  const monthLabel = container.querySelector('.date-picker-month');
  const daysGrid = container.querySelector('.date-picker-days');
  const btnPrev = container.querySelector('.date-picker-prev');
  const btnNext = container.querySelector('.date-picker-next');
  const btnToday = container.querySelector('.date-picker-today');
  const btnClear = container.querySelector('.date-picker-clear');

  let viewDate = new Date();
  viewDate.setDate(1);
  let selectedISO = '';
  let scrollParent = null;

  function positionPopover() {
    const rect = trigger.getBoundingClientRect();
    const popoverHeight = popover.offsetHeight || 340;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const openUp = spaceBelow < popoverHeight && rect.top > popoverHeight + gap;

    popover.style.width = `${Math.max(rect.width, 300)}px`;
    popover.style.left = `${Math.min(rect.left, window.innerWidth - parseFloat(popover.style.width) - 12)}px`;

    if (openUp) {
      popover.style.top = `${rect.top - popoverHeight - gap}px`;
      popover.classList.add('date-picker-popover--up');
    } else {
      popover.style.top = `${rect.bottom + gap}px`;
      popover.classList.remove('date-picker-popover--up');
    }
  }

  function updateTrigger() {
    if (selectedISO) {
      valueEl.textContent = formatDataBR(selectedISO);
      valueEl.classList.remove('placeholder');
    } else {
      valueEl.textContent = 'Selecione a data';
      valueEl.classList.add('placeholder');
    }
    hidden.value = selectedISO;
    trigger.setAttribute('aria-expanded', container.classList.contains('is-open') ? 'true' : 'false');
  }

  function renderCalendar() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    monthLabel.textContent = `${MESES_NOME[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = parseISODate(selectedISO);

    const cells = [];

    for (let i = startOffset - 1; i >= 0; i -= 1) {
      const day = daysInPrevMonth - i;
      const cellDate = new Date(year, month - 1, day);
      cells.push({ day, date: cellDate, muted: true });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, date: new Date(year, month, day), muted: false });
    }

    let nextMonthDay = 1;
    while (cells.length % 7 !== 0) {
      cells.push({
        day: nextMonthDay,
        date: new Date(year, month + 1, nextMonthDay),
        muted: true
      });
      nextMonthDay += 1;
    }

    daysGrid.innerHTML = cells.map(({ day, date, muted }) => {
      const iso = toISODate(date.getFullYear(), date.getMonth(), date.getDate());
      const classes = ['date-picker-day'];
      if (muted) classes.push('is-muted');
      if (isSameDay(date, today)) classes.push('is-today');
      if (selectedDate && isSameDay(date, selectedDate)) classes.push('is-selected');
      return `<button type="button" class="${classes.join(' ')}" data-date="${iso}" aria-label="${formatDataBR(iso)}">${day}</button>`;
    }).join('');
  }

  function openPopover() {
    if (container.classList.contains('is-open')) return;

    if (selectedISO) {
      const selected = parseISODate(selectedISO);
      viewDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
    } else {
      viewDate = new Date();
      viewDate.setDate(1);
    }

    popover.hidden = false;
    container.classList.add('is-open');
    renderCalendar();
    positionPopover();
    updateTrigger();

    scrollParent = container.closest('.modal-form-scroll');
    if (scrollParent) scrollParent.addEventListener('scroll', closePopover, { passive: true });
    window.addEventListener('resize', positionPopover);
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeyDown);
  }

  function closePopover() {
    if (!container.classList.contains('is-open')) return;

    container.classList.remove('is-open');
    popover.hidden = true;
    updateTrigger();

    if (scrollParent) scrollParent.removeEventListener('scroll', closePopover);
    window.removeEventListener('resize', positionPopover);
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeyDown);
    scrollParent = null;
  }

  function setSelected(iso) {
    selectedISO = iso || '';
    container.classList.remove('is-invalid');
    updateTrigger();
    renderCalendar();
  }

  function onDocumentClick(e) {
    if (!container.contains(e.target)) {
      closePopover();
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') closePopover();
  }

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    container.classList.remove('is-invalid');
    if (container.classList.contains('is-open')) {
      closePopover();
    } else {
      openPopover();
    }
  });

  btnPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderCalendar();
    positionPopover();
  });

  btnNext.addEventListener('click', (e) => {
    e.stopPropagation();
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderCalendar();
    positionPopover();
  });

  btnToday.addEventListener('click', (e) => {
    e.stopPropagation();
    const today = new Date();
    setSelected(toISODate(today.getFullYear(), today.getMonth(), today.getDate()));
    closePopover();
  });

  btnClear.addEventListener('click', (e) => {
    e.stopPropagation();
    setSelected('');
    closePopover();
  });

  daysGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-date]');
    if (!btn) return;
    e.stopPropagation();
    setSelected(btn.dataset.date);
    closePopover();
  });

  popover.addEventListener('click', (e) => e.stopPropagation());

  updateTrigger();

  return {
    reset() {
      closePopover();
      selectedISO = '';
      viewDate = new Date();
      viewDate.setDate(1);
      container.classList.remove('is-invalid');
      updateTrigger();
      renderCalendar();
    },
    setValue(iso) {
      closePopover();
      setSelected(iso || '');
      if (iso) {
        const selected = parseISODate(iso);
        viewDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
      } else {
        viewDate = new Date();
        viewDate.setDate(1);
      }
      renderCalendar();
    }
  };
}

function detectMobilePlatform() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function getGeoDeniedInstructionsHtml() {
  const platform = detectMobilePlatform();
  if (platform === 'ios') {
    return `
      <ol class="geo-steps">
        <li>Abra <strong>Ajustes</strong> do iPhone</li>
        <li>Toque em <strong>Privacidade e Segurança → Localização</strong></li>
        <li>Ative <strong>Localização</strong> e permita para o <strong>Safari</strong> (ou Chrome)</li>
        <li>Volte ao site e toque em <strong>Tentar novamente</strong></li>
      </ol>
    `;
  }
  if (platform === 'android') {
    return `
      <ol class="geo-steps">
        <li>Toque no ícone de <strong>cadeado</strong> ou <strong>⋮</strong> na barra do Chrome</li>
        <li>Abra <strong>Permissões</strong> → <strong>Localização</strong></li>
        <li>Selecione <strong>Permitir</strong></li>
        <li>Volte ao site e toque em <strong>Tentar novamente</strong></li>
      </ol>
    `;
  }
  return `
    <ol class="geo-steps">
      <li>Clique no ícone de <strong>cadeado</strong> ao lado do endereço do site</li>
      <li>Em <strong>Localização</strong>, escolha <strong>Permitir</strong></li>
      <li>Recarregue a página e tente novamente</li>
    </ol>
  `;
}

function getLocalizacaoVendedor() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const error = new Error('Geolocalização não suportada neste navegador.');
      error.code = 'UNSUPPORTED';
      reject(error);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy)
      }),
      (err) => {
        const codeMap = { 1: 'PERMISSION_DENIED', 2: 'UNAVAILABLE', 3: 'TIMEOUT' };
        const msgs = {
          1: 'Permissão de localização negada.',
          2: 'Localização indisponível no momento.',
          3: 'Tempo esgotado ao obter localização. Tente novamente.'
        };
        const error = new Error(msgs[err.code] || 'Não foi possível obter a localização.');
        error.code = codeMap[err.code] || 'UNKNOWN';
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });
}

async function reverseGeocodeEndereco(lat, lng) {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('accept-language', 'pt-BR');

  const response = await fetch(url.toString(), {
    headers: { 'Accept-Language': 'pt-BR' }
  });

  if (!response.ok) {
    throw new Error('Não foi possível obter o endereço pela localização.');
  }

  const data = await response.json();
  const address = data.address || {};
  const partes = [
    address.road || address.pedestrian || address.footway,
    address.suburb || address.neighbourhood || address.quarter,
    address.city || address.town || address.village,
    address.state
  ].filter(Boolean);

  return partes.join(', ') || data.display_name || '';
}

let vendedorMap = null;
let previewUrls = [];

const DRONE_SLOTS = [
  { id: 'cima', label: 'Cima' },
  { id: 'lado1', label: 'Lado esquerdo' },
  { id: 'lado2', label: 'Lado direito' },
  { id: 'frente', label: 'Frente' },
  { id: 'tras', label: 'Trás' },
  { id: 'norte', label: 'Norte' },
  { id: 'panoramica', label: 'Panorâmica' }
];

const TIPOS_RETORNO = [
  { value: 'proposta', label: 'Apresentar proposta' },
  { value: 'drone', label: 'Fazer imagens de drone' },
  { value: 'visita', label: 'Fazer visita técnica' },
  { value: 'proprietario', label: 'Encontrar proprietário' },
  { value: 'outros', label: 'Outros' }
];

function renderTipoRetornoOptions() {
  const options = TIPOS_RETORNO.map(
    (tipo) => `<option value="${tipo.value}">${tipo.label}</option>`
  ).join('');
  return `<option value="" disabled selected hidden>Selecione o tipo</option>${options}`;
}

function getTipoRetornoLabel(value, outrosText = '') {
  if (value === 'outros') return outrosText.trim() || 'Outros';
  return TIPOS_RETORNO.find((tipo) => tipo.value === value)?.label || value;
}

function initTipoRetorno(form) {
  const select = form.querySelector('#cliente-tipo-retorno');
  const outrosWrap = form.querySelector('#cliente-tipo-retorno-outros-wrap');
  const outrosInput = form.querySelector('#cliente-tipo-retorno-outros');
  if (!select || !outrosWrap || !outrosInput) return;

  select.addEventListener('change', () => {
    const isOutros = select.value === 'outros';
    outrosWrap.hidden = !isOutros;
    if (isOutros) {
      outrosInput.focus();
    } else {
      outrosInput.value = '';
    }
  });
}

function resetTipoRetorno(form) {
  const outrosWrap = form.querySelector('#cliente-tipo-retorno-outros-wrap');
  const select = form.querySelector('#cliente-tipo-retorno');
  if (outrosWrap) outrosWrap.hidden = true;
  if (select) select.selectedIndex = 0;
}

function setAccordionPanelOpen(panel, open) {
  if (!panel) return;
  panel.classList.toggle('is-open', open);
  const trigger = panel.querySelector('.accordion-trigger');
  const body = panel.querySelector('.accordion-body');
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (body) body.hidden = !open;
}

function expandAccordionPanel(form, panelId) {
  setAccordionPanelOpen(form.querySelector(`[data-accordion="${panelId}"]`), true);
}

function initFormAccordion(form) {
  form.querySelectorAll('[data-accordion]').forEach((panel) => {
    const trigger = panel.querySelector('.accordion-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      setAccordionPanelOpen(panel, !panel.classList.contains('is-open'));
    });
  });
}

function resetFormAccordion(form) {
  form.querySelectorAll('[data-accordion]').forEach((panel) => {
    setAccordionPanelOpen(panel, false);
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function revokePreviewUrls() {
  previewUrls.forEach(url => URL.revokeObjectURL(url));
  previewUrls = [];
}

function renderPreviewCard(file, inputId, index = null) {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  const isVideo = file.type.startsWith('video/');
  let media = '<span class="preview-file-icon">📎</span>';
  if (isImage) {
    const url = URL.createObjectURL(file);
    previewUrls.push(url);
    media = `<img src="${url}" alt="" class="preview-img">`;
  } else if (isPdf) {
    media = '<span class="preview-file-icon pdf">PDF</span>';
  } else if (isVideo) {
    media = '<span class="preview-file-icon video">▶</span>';
  }
  const idxAttr = index != null ? ` data-index="${index}"` : '';
  return `
    <div class="preview-card">
      ${media}
      <div class="preview-meta">
        <span class="preview-name">${file.name}</span>
        <span class="preview-size">${formatFileSize(file.size)}</span>
      </div>
      <button type="button" class="preview-remove" data-input="${inputId}"${idxAttr} aria-label="Remover">×</button>
    </div>
  `;
}

function refreshUploadZone(input) {
  const zone = input.closest('.upload-zone');
  if (!zone) return;
  const preview = zone.querySelector('.upload-preview');

  revokePreviewUrls();

  if (input.multiple) {
    const files = zone._files || [];
    zone.classList.toggle('has-file', files.length > 0);
    preview.innerHTML = files.map((f, i) => renderPreviewCard(f, input.id, i)).join('');
    return;
  }

  const file = input.files[0];
  zone.classList.toggle('has-file', !!file);
  preview.innerHTML = file ? renderPreviewCard(file, input.id) : '';
}

function syncInputFiles(input, files) {
  const dt = new DataTransfer();
  files.forEach(f => dt.items.add(f));
  input.files = dt.files;
}

function setupUploadZone(zone) {
  const input = zone.querySelector('.upload-input');
  const drop = zone.querySelector('.upload-drop');
  if (!input || !drop) return;

  if (input.multiple) zone._files = [];

  input.addEventListener('change', () => {
    if (input.multiple) {
      zone._files = [...(zone._files || []), ...Array.from(input.files)];
      syncInputFiles(input, zone._files);
    }
    refreshUploadZone(input);
  });

  ['dragenter', 'dragover'].forEach(evt => {
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
    });
  });

  drop.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    if (input.multiple) {
      zone._files = [...(zone._files || []), ...files];
      syncInputFiles(input, zone._files);
    } else {
      syncInputFiles(input, [files[0]]);
    }
    refreshUploadZone(input);
  });
}

function setupFileUploads(form) {
  form.querySelectorAll('.upload-zone').forEach(setupUploadZone);

  form.addEventListener('click', (e) => {
    const btn = e.target.closest('.preview-remove');
    if (!btn) return;
    const input = form.querySelector(`#${btn.dataset.input}`);
    if (!input) return;
    const zone = input.closest('.upload-zone');

    if (input.multiple && btn.dataset.index != null) {
      zone._files.splice(parseInt(btn.dataset.index, 10), 1);
      syncInputFiles(input, zone._files);
    } else {
      input.value = '';
      if (zone) zone._files = [];
    }
    revokePreviewUrls();
    refreshUploadZone(input);
  });
}

function resetFilePreviews(form) {
  revokePreviewUrls();
  form.querySelectorAll('.upload-zone').forEach((zone) => {
    zone.classList.remove('has-file', 'dragover');
    zone._files = [];
    const preview = zone.querySelector('.upload-preview');
    if (preview) preview.innerHTML = '';
  });
}

function renderUploadZone({ id, label, accept, multiple = false, icon, hint, large = false }) {
  const iconSvg = icon || `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>`;
  return `
    <div class="upload-zone${large ? ' upload-zone-lg' : ''}${multiple ? ' upload-zone-multi' : ''}" data-zone>
      <input type="file" id="${id}" class="upload-input" accept="${accept}" ${multiple ? 'multiple' : ''} hidden>
      <label for="${id}" class="upload-drop">
        <span class="upload-drop-icon">${iconSvg}</span>
        <span class="upload-drop-title">${label}</span>
        <span class="upload-drop-hint">${hint}</span>
      </label>
      <div class="upload-preview"></div>
    </div>
  `;
}

function renderDroneUploadFields() {
  return DRONE_SLOTS.map(s => renderUploadZone({
    id: `drone-${s.id}`,
    label: s.label,
    accept: 'image/*',
    hint: s.id === 'panoramica' ? 'Foto panorâmica' : 'Foto aérea'
  })).join('');
}

const CONTA_LUZ_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

let contaLuzIdCounter = 0;

function renderContaLuzItem(id) {
  return `
    <div class="conta-luz-item" data-conta-id="${id}">
      <div class="conta-luz-top">
        <div class="modal-field conta-luz-nome-field">
          <label for="conta-nome-${id}">Nome da conta de luz <span class="req">*</span></label>
          <input type="text" id="conta-nome-${id}" class="conta-luz-nome" placeholder="Ex: Jan/2026 — Residência principal" required>
        </div>
        <button type="button" class="btn-remove-conta" title="Remover conta" aria-label="Remover conta">&times;</button>
      </div>
      ${renderUploadZone({
        id: `file-conta-luz-${id}`,
        label: 'Anexar conta de luz',
        accept: '.pdf,image/*',
        hint: 'PDF ou foto · clique ou arraste',
        icon: CONTA_LUZ_ICON,
        large: true
      })}
    </div>
  `;
}

function updateContaLuzRemoveButtons(list) {
  const items = list.querySelectorAll('.conta-luz-item');
  items.forEach((item) => {
    const btn = item.querySelector('.btn-remove-conta');
    if (btn) btn.hidden = items.length <= 1;
  });
}

function resetContasLuz(form) {
  const list = form.querySelector('#contas-luz-list');
  if (!list) return;
  contaLuzIdCounter = 0;
  list.innerHTML = renderContaLuzItem(0);
  const zone = list.querySelector('.upload-zone');
  if (zone) setupUploadZone(zone);
  updateContaLuzRemoveButtons(list);
}

function initContasLuz(form) {
  const list = form.querySelector('#contas-luz-list');
  const btnAdd = form.querySelector('#btn-add-conta-luz');
  if (!list || !btnAdd || btnAdd.dataset.bound) return;

  btnAdd.dataset.bound = 'true';
  resetContasLuz(form);

  btnAdd.addEventListener('click', () => {
    contaLuzIdCounter += 1;
    list.insertAdjacentHTML('beforeend', renderContaLuzItem(contaLuzIdCounter));
    const zone = list.querySelector(`[data-conta-id="${contaLuzIdCounter}"] .upload-zone`);
    if (zone) setupUploadZone(zone);
    updateContaLuzRemoveButtons(list);
  });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-conta');
    if (!btn || list.querySelectorAll('.conta-luz-item').length <= 1) return;
    btn.closest('.conta-luz-item')?.remove();
    updateContaLuzRemoveButtons(list);
  });
}

function validateContasLuz(form) {
  for (const item of form.querySelectorAll('.conta-luz-item')) {
    const nomeConta = item.querySelector('.conta-luz-nome')?.value.trim();
    const hasFile = !!item.querySelector('.upload-input')?.files?.[0];
    const hasExisting = item.dataset.existingAnexo === 'true';
    if (hasFile && !nomeConta) {
      return 'Informe o nome de cada conta de luz anexada.';
    }
    if (nomeConta && !hasFile && !hasExisting) {
      return `Anexe o arquivo da conta "${nomeConta}".`;
    }
  }
  return null;
}

const TIPOS_TELHADO = [
  { value: 'colonial', label: 'Colonial' },
  { value: 'laje', label: 'Laje' },
  { value: 'metalico', label: 'Metálico' },
  { value: 'cimento', label: 'Cimento' },
  { value: 'brasilit', label: 'Brasilit' },
  { value: 'calhetão', label: 'Calhetão' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao-identificado', label: 'Não identificado' }
];

const PARENTESCO_OPCOES = [
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'companheiro', label: 'Companheiro(a)' },
  { value: 'filho', label: 'Filho(a)' },
  { value: 'pai', label: 'Pai' },
  { value: 'mae', label: 'Mãe' },
  { value: 'irmao', label: 'Irmão(ã)' },
  { value: 'avo', label: 'Avô / Avó' },
  { value: 'neto', label: 'Neto(a)' },
  { value: 'sogro', label: 'Sogro(a)' },
  { value: 'genro-nora', label: 'Genro / Nora' },
  { value: 'tio', label: 'Tio(a)' },
  { value: 'sobrinho', label: 'Sobrinho(a)' },
  { value: 'primo', label: 'Primo(a)' },
  { value: 'amigo', label: 'Amigo(a)' },
  { value: 'inquilino', label: 'Inquilino' },
  { value: 'empregado', label: 'Empregado(a)' },
  { value: 'outro', label: 'Outro' }
];

function renderParentescoOptions() {
  const options = PARENTESCO_OPCOES.map(
    (item) => `<option value="${item.value}">${item.label}</option>`
  ).join('');
  return `<option value="" disabled selected hidden>Selecione</option>${options}`;
}

function getParentescoLabel(value) {
  return PARENTESCO_OPCOES.find((item) => item.value === value)?.label || value;
}

function renderRadioGroup(name, options) {
  return `<div class="radio-group">${options.map((opt) => `
    <label class="radio-option">
      <input type="radio" name="${name}" value="${opt.value}">
      <span>${opt.label}</span>
    </label>
  `).join('')}</div>`;
}

function renderTelhadoOptions() {
  const options = TIPOS_TELHADO.map(
    (tipo) => `<option value="${tipo.value}">${tipo.label}</option>`
  ).join('');
  return `<option value="" disabled selected hidden>Selecione o tipo</option>${options}`;
}

let equipamentoIdCounter = 0;
let ocupanteIdCounter = 0;
let consumoIdCounter = 0;

function renderConsumoItem(id) {
  return `
    <div class="dynamic-item consumo-item" data-consumo-id="${id}">
      <div class="dynamic-item-grid consumo-item-grid">
        <div class="modal-field">
          <label for="consumo-titulo-${id}">Título do consumo</label>
          <input type="text" id="consumo-titulo-${id}" class="consumo-titulo" placeholder="Ex: Conta residencial, Loja comercial">
        </div>
        <div class="modal-field">
          <label for="consumo-valor-${id}">Valor médio (R$)</label>
          <div class="input-with-prefix">
            <span class="input-prefix">R$</span>
            <input type="number" id="consumo-valor-${id}" class="consumo-valor" min="0" step="0.01" placeholder="0,00">
          </div>
        </div>
        <button type="button" class="btn-remove-dynamic btn-remove-inline" title="Remover consumo" aria-label="Remover consumo">&times;</button>
      </div>
    </div>
  `;
}

function renderEquipamentoItem(id) {
  return `
    <div class="dynamic-item equipamento-item" data-equip-id="${id}">
      <div class="dynamic-item-grid">
        <div class="modal-field">
          <label>Equipamento</label>
          <input type="text" class="equipamento-nome" placeholder="Ex: Ar-condicionado">
        </div>
        <div class="modal-field">
          <label>Quantidade</label>
          <input type="number" class="equipamento-qtd" min="1" step="1" placeholder="1">
        </div>
      </div>
      <button type="button" class="btn-remove-dynamic" title="Remover equipamento" aria-label="Remover equipamento">&times;</button>
    </div>
  `;
}

function renderOcupanteItem(id) {
  return `
    <div class="dynamic-item ocupante-item" data-ocupante-id="${id}">
      <div class="dynamic-item-grid dynamic-item-grid-3">
        <div class="modal-field">
          <label>Sexo</label>
          <select class="ocupante-sexo">
            <option value="">Selecione</option>
            <option value="homem">Homem</option>
            <option value="mulher">Mulher</option>
          </select>
        </div>
        <div class="modal-field ocupante-parentesco-field">
          <label for="ocupante-parentesco-${id}">Parentesco com cliente</label>
          <select id="ocupante-parentesco-${id}" class="ocupante-parentesco">
            ${renderParentescoOptions()}
          </select>
        </div>
        <div class="modal-field">
          <label for="ocupante-idade-${id}">Idade</label>
          <input type="number" id="ocupante-idade-${id}" class="ocupante-idade" min="0" max="120" placeholder="Anos">
        </div>
      </div>
      <div class="ocupante-parentesco-outros-wrap conditional-panel conditional-panel-inline" hidden>
        <div class="modal-field">
          <label for="ocupante-parentesco-outros-${id}">Descreva o parentesco</label>
          <input type="text" id="ocupante-parentesco-outros-${id}" class="ocupante-parentesco-outros" placeholder="Informe o parentesco">
        </div>
      </div>
      <button type="button" class="btn-remove-dynamic" title="Remover pessoa" aria-label="Remover pessoa">&times;</button>
    </div>
  `;
}

function renderDadosConsumoFields() {
  return `
    <div class="form-section form-section-nested consumo-section">
      <div class="modal-field">
        <div class="section-row">
          <span class="field-label">Qual é o valor médio da sua conta de energia?</span>
          <button type="button" id="btn-add-consumo" class="btn btn-add-conta">+ Adicionar consumo</button>
        </div>
        <div id="consumos-list"></div>
      </div>

      <div class="modal-field">
        <span class="field-label">Pretende aumentar o consumo?</span>
        ${renderRadioGroup('aumentar-consumo', [
          { value: 'sim', label: 'Sim' },
          { value: 'nao', label: 'Não' }
        ])}
      </div>

      <div id="aumento-consumo-panel" class="conditional-panel" hidden>
        <div class="modal-field">
          <span class="field-label">Como deseja informar o aumento?</span>
          ${renderRadioGroup('modo-aumento-consumo', [
            { value: 'kw', label: 'Informar em kW' },
            { value: 'equipamentos', label: 'Adicionar equipamentos' }
          ])}
        </div>
        <div id="aumento-kw-panel" class="conditional-panel" hidden>
          <div class="modal-field">
            <label for="consumo-aumento-kw">Aumento previsto (kW)</label>
            <input type="number" id="consumo-aumento-kw" min="0" step="0.01" placeholder="Ex: 3,5">
          </div>
        </div>
        <div id="aumento-equipamentos-panel" class="conditional-panel" hidden>
          <div class="section-row">
            <span class="field-label">Equipamentos e quantidades</span>
            <button type="button" id="btn-add-equipamento" class="btn btn-add-conta">+ Adicionar equipamento</button>
          </div>
          <div id="equipamentos-list"></div>
        </div>
      </div>

      <div class="modal-field-row">
        <div class="modal-field">
          <span class="field-label">Quem é o cliente?</span>
          ${renderRadioGroup('cliente-genero', [
            { value: 'homem', label: 'Homem' },
            { value: 'mulher', label: 'Mulher' }
          ])}
        </div>
        <div class="modal-field modal-field-compact">
          <label for="consumo-cliente-idade">Idade</label>
          <input type="number" id="consumo-cliente-idade" min="0" max="120" placeholder="Anos">
        </div>
      </div>

      <div class="modal-field">
        <label for="consumo-qtd-pessoas">Quantas pessoas utilizam o imóvel?</label>
        <div class="input-with-checkbox">
          <input type="number" id="consumo-qtd-pessoas" min="0" step="1" placeholder="Número de pessoas">
          <label class="checkbox-option" for="consumo-qtd-nao-identificado">
            <input type="checkbox" id="consumo-qtd-nao-identificado">
            <span>Não identificado</span>
          </label>
        </div>
      </div>

      <div class="modal-field">
        <div class="section-row">
          <span class="field-label">Pessoas no imóvel</span>
          <button type="button" id="btn-add-ocupante" class="btn btn-add-conta">+ Adicionar pessoa</button>
        </div>
        <p class="field-hint">Informe sexo, parentesco com o cliente e idade de cada pessoa.</p>
        <div id="ocupantes-list"></div>
      </div>

      <div class="modal-field">
        <span class="field-label">Tipo do imóvel</span>
        ${renderRadioGroup('tipo-imovel', [
          { value: 'residencial', label: 'Residencial' },
          { value: 'comercial', label: 'Comercial' },
          { value: 'misto', label: 'Residencial/Comercial' }
        ])}
      </div>

      <div class="modal-field-row">
        <div class="modal-field">
          <span class="field-label">Imóvel rural ou urbano?</span>
          ${renderRadioGroup('local-imovel', [
            { value: 'urbano', label: 'Urbano' },
            { value: 'rural', label: 'Rural' }
          ])}
        </div>
        <div class="modal-field">
          <span class="field-label">Imóvel próprio ou alugado?</span>
          ${renderRadioGroup('posse-imovel', [
            { value: 'proprio', label: 'Próprio' },
            { value: 'alugado', label: 'Alugado' }
          ])}
        </div>
      </div>

      <div class="modal-field">
        <label for="consumo-tipo-telhado">Qual o tipo de telhado?</label>
        <select id="consumo-tipo-telhado" name="tipoTelhado">
          ${renderTelhadoOptions()}
        </select>
        <div id="telhado-outro-wrap" class="tipo-retorno-outros" hidden>
          <label for="consumo-tipo-telhado-outro">Descreva o tipo de telhado</label>
          <input type="text" id="consumo-tipo-telhado-outro" placeholder="Informe o tipo de telhado">
        </div>
      </div>

      <div class="modal-field">
        <span class="field-label">Existe algum sombreamento?</span>
        ${renderRadioGroup('sombreamento', [
          { value: 'sim', label: 'Sim' },
          { value: 'nao', label: 'Não' }
        ])}
      </div>

      <div id="sombreamento-panel" class="conditional-panel" hidden>
        <div class="modal-field">
          <label for="consumo-sombreamento-desc">Descreva o sombreamento</label>
          <textarea id="consumo-sombreamento-desc" rows="2" placeholder="Ex: Árvore grande no telhado norte, sombra da casa vizinha pela manhã"></textarea>
        </div>
      </div>
    </div>
  `;
}

function updateParentescoOutroWrap(selectEl) {
  const item = selectEl.closest('.ocupante-item');
  if (!item) return;
  const wrap = item.querySelector('.ocupante-parentesco-outros-wrap');
  const input = item.querySelector('.ocupante-parentesco-outros');
  const isOutro = selectEl.value === 'outro';
  if (wrap) wrap.hidden = !isOutro;
  if (!isOutro && input) input.value = '';
  if (isOutro && input) input.focus();
}

function updateTelhadoOutroPanel(form) {
  const telhado = form.querySelector('#consumo-tipo-telhado');
  const wrap = form.querySelector('#telhado-outro-wrap');
  const input = form.querySelector('#consumo-tipo-telhado-outro');
  if (!telhado || !wrap) return;
  const isOutro = telhado.value === 'outro';
  wrap.hidden = !isOutro;
  if (!isOutro && input) input.value = '';
}

function updateQtdPessoasNaoIdentificado(form) {
  const checkbox = form.querySelector('#consumo-qtd-nao-identificado');
  const input = form.querySelector('#consumo-qtd-pessoas');
  if (!checkbox || !input) return;
  input.disabled = checkbox.checked;
  if (checkbox.checked) input.value = '';
}

function toggleConsumoPanel(panel, show) {
  if (!panel) return;
  panel.hidden = !show;
}

function updateAumentoConsumoPanels(form) {
  const aumentar = form.querySelector('input[name="aumentar-consumo"]:checked')?.value;
  const modo = form.querySelector('input[name="modo-aumento-consumo"]:checked')?.value;
  toggleConsumoPanel(form.querySelector('#aumento-consumo-panel'), aumentar === 'sim');
  toggleConsumoPanel(form.querySelector('#aumento-kw-panel'), aumentar === 'sim' && modo === 'kw');
  toggleConsumoPanel(form.querySelector('#aumento-equipamentos-panel'), aumentar === 'sim' && modo === 'equipamentos');
}

function updateSombreamentoPanel(form) {
  const sombreamento = form.querySelector('input[name="sombreamento"]:checked')?.value;
  toggleConsumoPanel(form.querySelector('#sombreamento-panel'), sombreamento === 'sim');
}

function resetConsumosList(form) {
  const list = form.querySelector('#consumos-list');
  if (!list) return;
  consumoIdCounter = 0;
  list.innerHTML = renderConsumoItem(0);
}

function resetEquipamentosList(form) {
  const list = form.querySelector('#equipamentos-list');
  if (!list) return;
  equipamentoIdCounter = 0;
  list.innerHTML = renderEquipamentoItem(0);
}

function resetOcupantesList(form) {
  const list = form.querySelector('#ocupantes-list');
  if (!list) return;
  ocupanteIdCounter = 0;
  list.innerHTML = renderOcupanteItem(0);
}

function resetDadosConsumo(form) {
  resetConsumosList(form);
  resetEquipamentosList(form);
  resetOcupantesList(form);
  const telhado = form.querySelector('#consumo-tipo-telhado');
  if (telhado) telhado.selectedIndex = 0;
  const telhadoOutro = form.querySelector('#consumo-tipo-telhado-outro');
  if (telhadoOutro) telhadoOutro.value = '';
  toggleConsumoPanel(form.querySelector('#telhado-outro-wrap'), false);
  const qtdCheckbox = form.querySelector('#consumo-qtd-nao-identificado');
  const qtdInput = form.querySelector('#consumo-qtd-pessoas');
  if (qtdCheckbox) qtdCheckbox.checked = false;
  if (qtdInput) {
    qtdInput.disabled = false;
    qtdInput.value = '';
  }
  toggleConsumoPanel(form.querySelector('#aumento-consumo-panel'), false);
  toggleConsumoPanel(form.querySelector('#aumento-kw-panel'), false);
  toggleConsumoPanel(form.querySelector('#aumento-equipamentos-panel'), false);
  toggleConsumoPanel(form.querySelector('#sombreamento-panel'), false);
}

function initDadosConsumo(form) {
  if (form.dataset.consumoBound) return;
  form.dataset.consumoBound = 'true';

  resetDadosConsumo(form);

  form.addEventListener('change', (e) => {
    if (e.target.name === 'aumentar-consumo' || e.target.name === 'modo-aumento-consumo') {
      updateAumentoConsumoPanels(form);
    }
    if (e.target.name === 'sombreamento') {
      updateSombreamentoPanel(form);
    }
    if (e.target.id === 'consumo-tipo-telhado') {
      updateTelhadoOutroPanel(form);
    }
    if (e.target.id === 'consumo-qtd-nao-identificado') {
      updateQtdPessoasNaoIdentificado(form);
    }
  });

  form.querySelector('#ocupantes-list')?.addEventListener('change', (e) => {
    if (e.target.classList.contains('ocupante-parentesco')) {
      updateParentescoOutroWrap(e.target);
    }
  });

  form.querySelector('#btn-add-consumo')?.addEventListener('click', () => {
    const list = form.querySelector('#consumos-list');
    if (!list) return;
    consumoIdCounter += 1;
    list.insertAdjacentHTML('beforeend', renderConsumoItem(consumoIdCounter));
  });

  form.querySelector('#btn-add-equipamento')?.addEventListener('click', () => {
    const list = form.querySelector('#equipamentos-list');
    if (!list) return;
    equipamentoIdCounter += 1;
    list.insertAdjacentHTML('beforeend', renderEquipamentoItem(equipamentoIdCounter));
  });

  form.querySelector('#btn-add-ocupante')?.addEventListener('click', () => {
    const list = form.querySelector('#ocupantes-list');
    if (!list) return;
    ocupanteIdCounter += 1;
    list.insertAdjacentHTML('beforeend', renderOcupanteItem(ocupanteIdCounter));
  });

  form.querySelector('#consumos-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-dynamic');
    const list = form.querySelector('#consumos-list');
    if (!btn || !list || list.querySelectorAll('.consumo-item').length <= 1) return;
    btn.closest('.consumo-item')?.remove();
  });

  form.querySelector('#equipamentos-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-dynamic');
    const list = form.querySelector('#equipamentos-list');
    if (!btn || !list || list.querySelectorAll('.equipamento-item').length <= 1) return;
    btn.closest('.equipamento-item')?.remove();
  });

  form.querySelector('#ocupantes-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-dynamic');
    const list = form.querySelector('#ocupantes-list');
    if (!btn || !list || list.querySelectorAll('.ocupante-item').length <= 1) return;
    btn.closest('.ocupante-item')?.remove();
  });
}

function collectDadosConsumo(form) {
  const aumentarConsumo = form.querySelector('input[name="aumentar-consumo"]:checked')?.value || '';
  const modoAumento = form.querySelector('input[name="modo-aumento-consumo"]:checked')?.value || '';
  const sombreamento = form.querySelector('input[name="sombreamento"]:checked')?.value || '';

  const consumos = [];
  form.querySelectorAll('.consumo-item').forEach((item) => {
    const titulo = item.querySelector('.consumo-titulo')?.value.trim();
    const valor = item.querySelector('.consumo-valor')?.value;
    if (titulo || valor) {
      consumos.push({
        titulo: titulo || '',
        valor: valor || ''
      });
    }
  });

  const equipamentos = [];
  form.querySelectorAll('.equipamento-item').forEach((item) => {
    const nome = item.querySelector('.equipamento-nome')?.value.trim();
    const quantidade = item.querySelector('.equipamento-qtd')?.value;
    if (nome || quantidade) {
      equipamentos.push({
        nome: nome || '',
        quantidade: quantidade ? Number(quantidade) : null
      });
    }
  });

  const ocupantes = [];
  form.querySelectorAll('.ocupante-item').forEach((item) => {
    const sexo = item.querySelector('.ocupante-sexo')?.value || '';
    const parentesco = item.querySelector('.ocupante-parentesco')?.value || '';
    const parentescoOutros = item.querySelector('.ocupante-parentesco-outros')?.value.trim() || '';
    const idade = item.querySelector('.ocupante-idade')?.value || '';
    if (sexo || parentesco || parentescoOutros || idade) {
      ocupantes.push({
        sexo,
        parentesco,
        parentescoOutros: parentesco === 'outro' ? parentescoOutros : '',
        parentescoLabel: parentesco === 'outro'
          ? (parentescoOutros || 'Outro')
          : getParentescoLabel(parentesco),
        idade: idade ? Number(idade) : null
      });
    }
  });

  const telhadoValue = form.querySelector('#consumo-tipo-telhado')?.value || '';
  const telhadoOutro = form.querySelector('#consumo-tipo-telhado-outro')?.value.trim() || '';
  const telhadoLabel = telhadoValue === 'outro'
    ? (telhadoOutro || 'Outro')
    : (TIPOS_TELHADO.find((t) => t.value === telhadoValue)?.label || '');

  const qtdNaoIdentificado = form.querySelector('#consumo-qtd-nao-identificado')?.checked || false;

  return {
    consumos,
    pretendeAumentarConsumo: aumentarConsumo === 'sim',
    aumentoConsumo: aumentarConsumo === 'sim' ? {
      modo: modoAumento,
      kw: form.querySelector('#consumo-aumento-kw')?.value || '',
      equipamentos
    } : null,
    clienteGenero: form.querySelector('input[name="cliente-genero"]:checked')?.value || '',
    clienteIdade: form.querySelector('#consumo-cliente-idade')?.value || '',
    qtdPessoasNaoIdentificado: qtdNaoIdentificado,
    qtdPessoasImovel: qtdNaoIdentificado
      ? ''
      : (form.querySelector('#consumo-qtd-pessoas')?.value || ''),
    ocupantes,
    tipoImovel: form.querySelector('input[name="tipo-imovel"]:checked')?.value || '',
    localImovel: form.querySelector('input[name="local-imovel"]:checked')?.value || '',
    posseImovel: form.querySelector('input[name="posse-imovel"]:checked')?.value || '',
    tipoTelhado: telhadoValue,
    tipoTelhadoOutro: telhadoValue === 'outro' ? telhadoOutro : '',
    tipoTelhadoLabel: telhadoLabel,
    sombreamento: sombreamento === 'sim',
    sombreamentoDescricao: sombreamento === 'sim'
      ? form.querySelector('#consumo-sombreamento-desc')?.value.trim() || ''
      : ''
  };
}

const CONTATO_CLIENTE_ORIGENS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'site', label: 'Site' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'google', label: 'Google' },
  { value: 'panfleto', label: 'Panfleto' },
  { value: 'feiras-eventos', label: 'Feiras/eventos' },
  { value: 'placa-divulgacao', label: 'Placa de divulgação' },
  { value: 'outro', label: 'Outro' }
];

const CONTATO_VENDEDOR_CANAIS = [
  { value: 'pap-street', label: 'PAP Street' },
  { value: 'pap-digital', label: 'PAP digital' },
  { value: 'feiras-eventos', label: 'Feiras/Eventos' },
  { value: 'outro', label: 'Outro' }
];

const COMPORTAMENTO_VENDEDOR_OPCOES = [
  { value: 'receptivo', label: 'Receptivo' },
  { value: 'resistente', label: 'Resistente' },
  { value: 'resistente-inicio', label: 'Resistente apenas no início' },
  { value: 'outro', label: 'Outro' }
];

const DECISAO_OUTROS_OPCOES = [
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'filho', label: 'Filho(a)' },
  { value: 'socio', label: 'Sócio' },
  { value: 'pais', label: 'Pais' },
  { value: 'outro', label: 'Outro' }
];

const FORMA_PAGAMENTO_OPCOES = [
  { value: 'a-vista', label: 'À vista' },
  { value: 'parcelado-cartao', label: 'Parcelado cartão' },
  { value: 'entrada-boleto', label: 'Entrada + boleto' },
  { value: 'financiamento', label: 'Financiamento' },
  { value: 'nao-identificado', label: 'Não identificado' }
];

const CARACTERISTICAS_CLIENTE = [
  { value: 'falante', label: 'Falante' },
  { value: 'serio', label: 'Sério' },
  { value: 'objetivo', label: 'Objetivo' },
  { value: 'brincalhao', label: 'Brincalhão' },
  { value: 'sorridente', label: 'Sorridente' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'comunicativo', label: 'Comunicativo' },
  { value: 'timido', label: 'Tímido' },
  { value: 'educado', label: 'Educado' },
  { value: 'impaciente', label: 'Impaciente' },
  { value: 'paciente', label: 'Paciente' },
  { value: 'desconfiado', label: 'Desconfiado' },
  { value: 'entusiasmado', label: 'Entusiasmado' }
];

const PERFIL_TECNICO_OPCOES = [
  { value: 'muito-tecnico', label: 'Muito técnico' },
  { value: 'detalhes-tecnicos', label: 'Gosta de detalhes técnicos' },
  { value: 'basico', label: 'Entende o básico' },
  { value: 'sem-interesse-tecnico', label: 'Não tem interesse em assuntos técnicos' },
  { value: 'resultado-economia', label: 'Quer apenas o resultado/economia' },
  { value: 'muitas-perguntas', label: 'Faz muitas perguntas técnicas' },
  { value: 'confia-especialista', label: 'Confia na recomendação do especialista' }
];

const PRIORIDADE_PRINCIPAL_OPCOES = [
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'qualidade-equipamentos', label: 'Qualidade dos equipamentos' },
  { value: 'economia-conta', label: 'Economia na conta' },
  { value: 'retorno-investimento', label: 'Retorno do investimento' },
  { value: 'garantia', label: 'Garantia' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'marca-equipamentos', label: 'Marca dos equipamentos' },
  { value: 'financiamento', label: 'Financiamento' }
];

const PERFIL_FINANCEIRO_OPCOES = [
  { value: 'menor-investimento', label: 'Busca o menor investimento' },
  { value: 'custo-beneficio', label: 'Busca o melhor custo-benefício' },
  { value: 'qualidade-preco', label: 'Prioriza qualidade acima do preço' },
  { value: 'facilidade-investir', label: 'Tem facilidade para investir' },
  { value: 'depende-financiamento', label: 'Quer facilidade de parcelamento' }
];

const COMPORTAMENTO_NEGOCIACAO_OPCOES = [
  { value: 'negociador', label: 'Negociador' },
  { value: 'aceita-primeira', label: 'Aceita a primeira proposta' },
  { value: 'compara-concorrentes', label: 'Compara concorrentes' },
  { value: 'valoriza-confianca', label: 'Valoriza confiança' },
  { value: 'valoriza-relacionamento', label: 'Valoriza relacionamento' },
  { value: 'focado-numeros', label: 'Focado em números' },
  { value: 'focado-indicacoes', label: 'Focado em indicações' }
];

const DISPONIBILIDADE_TEMPO_OPCOES = [
  { value: 'tem-pressa', label: 'Tem pressa' },
  { value: 'sem-urgencia', label: 'Sem urgência' },
  { value: 'agenda-corrida', label: 'Agenda corrida' },
  { value: 'facil-contato', label: 'Fácil contato' },
  { value: 'dificil-contato', label: 'Difícil contato' },
  { value: 'responde-rapido', label: 'Responde rapidamente' },
  { value: 'demora-responder', label: 'Demora para responder' }
];

const CONFIANCA_SOLAR_OPCOES = [
  { value: 'pesquisou-bastante', label: 'Já pesquisou bastante' },
  { value: 'conhece-pouco', label: 'Conhece pouco' },
  { value: 'desconfiado', label: 'Cliente desconfiado' },
  { value: 'convencido-compra', label: 'Cliente convencido da compra' }
];

const PERFIL_DOMINANTE_OPCOES = [
  { value: 'analitico', label: 'Analítico (dados, números e detalhes)' },
  { value: 'executor', label: 'Executor (rápido e objetivo)' },
  { value: 'afavel', label: 'Afável (valoriza relacionamento e confiança)' },
  { value: 'expressivo', label: 'Expressivo (gosta de conversar e compartilhar ideias)' }
];

function renderSelectFromOptions(items, placeholder = 'Selecione') {
  const options = items.map(
    (item) => `<option value="${item.value}">${item.label}</option>`
  ).join('');
  return `<option value="" disabled selected hidden>${placeholder}</option>${options}`;
}

function renderCheckboxGroup(name, options) {
  return `<div class="checkbox-group">${options.map((opt) => `
    <label class="checkbox-chip">
      <input type="checkbox" name="${name}" value="${opt.value}">
      <span>${opt.label}</span>
    </label>
  `).join('')}</div>`;
}

function getSelectedRadio(form, name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value || '';
}

function getCheckedValues(form, name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

function getLabelsForValues(items, values) {
  return values.map((value) => items.find((item) => item.value === value)?.label || value);
}

function getSelectLabel(items, value, outroText = '') {
  if (value === 'outro') return outroText.trim() || 'Outro';
  return items.find((item) => item.value === value)?.label || '';
}

function updateSelectOutroPanel(form, selectId, wrapId, inputId) {
  const select = form.querySelector(`#${selectId}`);
  const wrap = form.querySelector(`#${wrapId}`);
  const input = form.querySelector(`#${inputId}`);
  const isOutro = select?.value === 'outro';
  if (wrap) wrap.hidden = !isOutro;
  if (!isOutro && input) input.value = '';
}

function updatePerfilContatoPanels(form) {
  const quem = getSelectedRadio(form, 'quem-contato');
  toggleConsumoPanel(form.querySelector('#contato-cliente-panel'), quem === 'cliente');
  toggleConsumoPanel(form.querySelector('#contato-vendedor-panel'), quem === 'vendedor');
  if (quem !== 'cliente') {
    updateSelectOutroPanel(form, 'perfil-origem-cliente', 'origem-cliente-outro-wrap', 'perfil-origem-cliente-outro');
  }
  if (quem !== 'vendedor') {
    updateSelectOutroPanel(form, 'perfil-canal-vendedor', 'canal-vendedor-outro-wrap', 'perfil-canal-vendedor-outro');
    updateSelectOutroPanel(form, 'perfil-comportamento-vendedor', 'comportamento-vendedor-outro-wrap', 'perfil-comportamento-outro');
  }
}

function updateOrigemClienteOutro(form) {
  updateSelectOutroPanel(form, 'perfil-origem-cliente', 'origem-cliente-outro-wrap', 'perfil-origem-cliente-outro');
}

function updateCanalVendedorOutro(form) {
  updateSelectOutroPanel(form, 'perfil-canal-vendedor', 'canal-vendedor-outro-wrap', 'perfil-canal-vendedor-outro');
}

function updateComportamentoVendedorOutro(form) {
  updateSelectOutroPanel(form, 'perfil-comportamento-vendedor', 'comportamento-vendedor-outro-wrap', 'perfil-comportamento-outro');
}

function updateDecisaoOutrosPanel(form) {
  const temOutros = getSelectedRadio(form, 'decisao-envolvidos') === 'outros';
  toggleConsumoPanel(form.querySelector('#decisao-outros-panel'), temOutros);
  if (!temOutros) {
    form.querySelectorAll('input[name="decisao-outros"]').forEach((el) => { el.checked = false; });
    const outro = form.querySelector('#perfil-decisao-outro');
    if (outro) outro.value = '';
    toggleConsumoPanel(form.querySelector('#decisao-outro-text-wrap'), false);
  }
}

function updateDecisaoOutroText(form) {
  const checked = getCheckedValues(form, 'decisao-outros');
  const wrap = form.querySelector('#decisao-outro-text-wrap');
  const show = checked.includes('outro');
  toggleConsumoPanel(wrap, show);
  if (!show) {
    const input = form.querySelector('#perfil-decisao-outro');
    if (input) input.value = '';
  }
}

function updatePropostasPanel(form) {
  const recebeu = getSelectedRadio(form, 'perfil-outras-propostas') === 'sim';
  toggleConsumoPanel(form.querySelector('#propostas-detalhe-panel'), recebeu);
  if (!recebeu) {
    form.querySelectorAll('input[name="perfil-propostas-disponibilizou"]').forEach((el) => { el.checked = false; });
  }
}

function renderDefinicaoPerfilFields() {
  return `
    <div class="form-section form-section-nested perfil-section">
      <div class="modal-field">
        <span class="field-label">Quem entrou em contato?</span>
        ${renderRadioGroup('quem-contato', [
          { value: 'cliente', label: 'Cliente' },
          { value: 'vendedor', label: 'Vendedor' }
        ])}
      </div>

      <div id="contato-cliente-panel" class="conditional-panel" hidden>
        <div class="modal-field">
          <label for="perfil-origem-cliente">Como o cliente entrou em contato?</label>
          <select id="perfil-origem-cliente">
            ${renderSelectFromOptions(CONTATO_CLIENTE_ORIGENS, 'Selecione a origem')}
          </select>
          <div id="origem-cliente-outro-wrap" class="tipo-retorno-outros" hidden>
            <label for="perfil-origem-cliente-outro">Descreva como o cliente entrou em contato</label>
            <input type="text" id="perfil-origem-cliente-outro" placeholder="Informe a origem do contato">
          </div>
        </div>
      </div>

      <div id="contato-vendedor-panel" class="conditional-panel" hidden>
        <div class="modal-field">
          <label for="perfil-canal-vendedor">Canal do vendedor</label>
          <select id="perfil-canal-vendedor">
            ${renderSelectFromOptions(CONTATO_VENDEDOR_CANAIS, 'Selecione o canal')}
          </select>
          <div id="canal-vendedor-outro-wrap" class="tipo-retorno-outros" hidden>
            <label for="perfil-canal-vendedor-outro">Descreva o canal do vendedor</label>
            <input type="text" id="perfil-canal-vendedor-outro" placeholder="Informe o canal">
          </div>
        </div>
        <div class="modal-field">
          <label for="perfil-comportamento-vendedor">Comportamento do cliente no contato</label>
          <select id="perfil-comportamento-vendedor">
            ${renderSelectFromOptions(COMPORTAMENTO_VENDEDOR_OPCOES, 'Selecione')}
          </select>
          <div id="comportamento-vendedor-outro-wrap" class="tipo-retorno-outros" hidden>
            <label for="perfil-comportamento-outro">Descreva o comportamento</label>
            <input type="text" id="perfil-comportamento-outro" placeholder="Informe o comportamento">
          </div>
        </div>
      </div>

      <div class="modal-field">
        <label for="perfil-interesse">O que mais despertou interesse do cliente?</label>
        <textarea id="perfil-interesse" rows="2" placeholder="Descreva o principal interesse"></textarea>
      </div>

      <div class="modal-field">
        <span class="field-label">Tem pressa, sem pressa ou precisa ser convencido?</span>
        ${renderRadioGroup('perfil-urgencia', [
          { value: 'pressa', label: 'Tem pressa' },
          { value: 'sem-pressa', label: 'Sem pressa' },
          { value: 'convencer', label: 'Precisa ser convencido' }
        ])}
      </div>

      <div class="modal-field">
        <span class="field-label">Responsável pela decisão</span>
        ${renderRadioGroup('decisao-envolvidos', [
          { value: 'cliente', label: 'Apenas o cliente' },
          { value: 'outros', label: 'Tem mais alguém envolvido' }
        ])}
      </div>

      <div id="decisao-outros-panel" class="conditional-panel" hidden>
        <div class="modal-field">
          <span class="field-label">Quem mais está envolvido na decisão?</span>
          ${renderCheckboxGroup('decisao-outros', DECISAO_OUTROS_OPCOES)}
          <div id="decisao-outro-text-wrap" class="tipo-retorno-outros" hidden>
            <label for="perfil-decisao-outro">Descreva quem mais está envolvido</label>
            <input type="text" id="perfil-decisao-outro" placeholder="Informe quem mais decide">
          </div>
        </div>
      </div>

      <div class="modal-field">
        <span class="field-label">Já recebeu outras propostas?</span>
        ${renderRadioGroup('perfil-outras-propostas', [
          { value: 'sim', label: 'Sim' },
          { value: 'nao', label: 'Não' }
        ])}
      </div>

      <div id="propostas-detalhe-panel" class="conditional-panel" hidden>
        <div class="modal-field">
          <span class="field-label">Disponibilizou as propostas anteriores?</span>
          ${renderRadioGroup('perfil-propostas-disponibilizou', [
            { value: 'sim', label: 'Sim' },
            { value: 'nao', label: 'Não' }
          ])}
        </div>
      </div>

      <div class="perfil-subsection">
        <h4 class="perfil-subtitle">Informações complementares</h4>
        <div class="modal-field-row perfil-sim-nao-row">
          <div class="modal-field">
            <span class="field-label">Valoriza família?</span>
            ${renderRadioGroup('perfil-valoriza-familia', [
              { value: 'sim', label: 'Sim' },
              { value: 'nao', label: 'Não' }
            ])}
          </div>
          <div class="modal-field">
            <span class="field-label">Tem pets?</span>
            ${renderRadioGroup('perfil-tem-pets', [
              { value: 'sim', label: 'Sim' },
              { value: 'nao', label: 'Não' }
            ])}
          </div>
        </div>
        <div class="modal-field">
          <label for="perfil-outros-interesses">Outros interesses do cliente</label>
          <textarea id="perfil-outros-interesses" rows="2" placeholder="Descreva outros interesses do cliente"></textarea>
        </div>
        <div class="modal-field">
          <label for="perfil-servicos-adicionais">Cliente precisa de algo além de energia solar?</label>
          <textarea id="perfil-servicos-adicionais" rows="2" placeholder="Ex: pedreiro, eletricista, calheiro"></textarea>
        </div>
      </div>

      <div class="perfil-subsection">
        <h4 class="perfil-subtitle">Preferências do cliente</h4>
        <div class="modal-field">
          <label for="perfil-forma-pagamento">Qual forma de pagamento tem interesse?</label>
          <select id="perfil-forma-pagamento">
            ${renderSelectFromOptions(FORMA_PAGAMENTO_OPCOES, 'Selecione')}
          </select>
        </div>
      </div>

      <div class="perfil-subsection">
        <h4 class="perfil-subtitle">Características do cliente</h4>
        <div class="modal-field">
          <span class="field-label">Quais características você diria que o cliente tem?</span>
          <p class="field-hint">Pode escolher mais de uma opção.</p>
          ${renderCheckboxGroup('perfil-caracteristicas', CARACTERISTICAS_CLIENTE)}
        </div>
      </div>

      <div class="perfil-subsection">
        <h4 class="perfil-subtitle">Perfil técnico</h4>
        <div class="modal-field">
          ${renderCheckboxGroup('perfil-tecnico', PERFIL_TECNICO_OPCOES)}
        </div>
      </div>

      <div class="perfil-subsection">
        <h4 class="perfil-subtitle">Prioridades e perfil</h4>
        <div class="modal-field">
          <label for="perfil-prioridade">Prioridade principal</label>
          <select id="perfil-prioridade">
            ${renderSelectFromOptions(PRIORIDADE_PRINCIPAL_OPCOES, 'Selecione a prioridade')}
          </select>
        </div>
        <div class="modal-field">
          <span class="field-label">Perfil financeiro</span>
          ${renderCheckboxGroup('perfil-financeiro', PERFIL_FINANCEIRO_OPCOES)}
        </div>
        <div class="modal-field">
          <span class="field-label">Comportamento na negociação</span>
          ${renderCheckboxGroup('perfil-negociacao', COMPORTAMENTO_NEGOCIACAO_OPCOES)}
        </div>
        <div class="modal-field">
          <span class="field-label">Disponibilidade de tempo</span>
          ${renderCheckboxGroup('perfil-disponibilidade', DISPONIBILIDADE_TEMPO_OPCOES)}
        </div>
        <div class="modal-field">
          <span class="field-label">Confiança na energia solar</span>
          ${renderCheckboxGroup('perfil-confianca-solar', CONFIANCA_SOLAR_OPCOES)}
        </div>
        <div class="modal-field">
          <label for="perfil-dominante">Perfil dominante (resumo rápido)</label>
          <select id="perfil-dominante">
            ${renderSelectFromOptions(PERFIL_DOMINANTE_OPCOES, 'Selecione o perfil dominante')}
          </select>
        </div>
      </div>
    </div>
  `;
}

function resetDefinicaoPerfil(form) {
  [
    '#contato-cliente-panel',
    '#contato-vendedor-panel',
    '#origem-cliente-outro-wrap',
    '#canal-vendedor-outro-wrap',
    '#comportamento-vendedor-outro-wrap',
    '#decisao-outros-panel',
    '#decisao-outro-text-wrap',
    '#propostas-detalhe-panel'
  ].forEach((sel) => toggleConsumoPanel(form.querySelector(sel), false));

  ['#perfil-origem-cliente', '#perfil-canal-vendedor', '#perfil-comportamento-vendedor',
    '#perfil-forma-pagamento', '#perfil-prioridade', '#perfil-dominante'
  ].forEach((sel) => {
    const el = form.querySelector(sel);
    if (el) el.selectedIndex = 0;
  });

  ['#perfil-comportamento-outro', '#perfil-origem-cliente-outro', '#perfil-canal-vendedor-outro',
    '#perfil-decisao-outro', '#perfil-interesse', '#perfil-outros-interesses', '#perfil-servicos-adicionais'].forEach((sel) => {
    const el = form.querySelector(sel);
    if (el) el.value = '';
  });
}

function initDefinicaoPerfil(form) {
  if (form.dataset.perfilBound) return;
  form.dataset.perfilBound = 'true';

  resetDefinicaoPerfil(form);

  form.addEventListener('change', (e) => {
    if (e.target.name === 'quem-contato') updatePerfilContatoPanels(form);
    if (e.target.id === 'perfil-origem-cliente') updateOrigemClienteOutro(form);
    if (e.target.id === 'perfil-canal-vendedor') updateCanalVendedorOutro(form);
    if (e.target.id === 'perfil-comportamento-vendedor') updateComportamentoVendedorOutro(form);
    if (e.target.name === 'decisao-envolvidos') updateDecisaoOutrosPanel(form);
    if (e.target.name === 'decisao-outros') updateDecisaoOutroText(form);
    if (e.target.name === 'perfil-outras-propostas') updatePropostasPanel(form);
  });
}

function collectDefinicaoPerfil(form) {
  const quemContato = getSelectedRadio(form, 'quem-contato');
  const origemCliente = form.querySelector('#perfil-origem-cliente')?.value || '';
  const origemClienteOutro = form.querySelector('#perfil-origem-cliente-outro')?.value.trim() || '';
  const canalVendedor = form.querySelector('#perfil-canal-vendedor')?.value || '';
  const canalVendedorOutro = form.querySelector('#perfil-canal-vendedor-outro')?.value.trim() || '';
  const comportamentoVendedor = form.querySelector('#perfil-comportamento-vendedor')?.value || '';
  const comportamentoOutro = form.querySelector('#perfil-comportamento-outro')?.value.trim() || '';
  const decisaoOutros = getCheckedValues(form, 'decisao-outros');
  const decisaoOutroText = form.querySelector('#perfil-decisao-outro')?.value.trim() || '';
  const prioridade = form.querySelector('#perfil-prioridade')?.value || '';
  const formaPagamento = form.querySelector('#perfil-forma-pagamento')?.value || '';
  const perfilDominante = form.querySelector('#perfil-dominante')?.value || '';
  const caracteristicas = getCheckedValues(form, 'perfil-caracteristicas');
  const perfilTecnico = getCheckedValues(form, 'perfil-tecnico');
  const perfilFinanceiro = getCheckedValues(form, 'perfil-financeiro');
  const negociacao = getCheckedValues(form, 'perfil-negociacao');
  const disponibilidade = getCheckedValues(form, 'perfil-disponibilidade');
  const confiancaSolar = getCheckedValues(form, 'perfil-confianca-solar');

  return {
    quemContato,
    origemCliente,
    origemClienteOutro: origemCliente === 'outro' ? origemClienteOutro : '',
    origemClienteLabel: getSelectLabel(CONTATO_CLIENTE_ORIGENS, origemCliente, origemClienteOutro),
    canalVendedor,
    canalVendedorOutro: canalVendedor === 'outro' ? canalVendedorOutro : '',
    canalVendedorLabel: getSelectLabel(CONTATO_VENDEDOR_CANAIS, canalVendedor, canalVendedorOutro),
    comportamentoVendedor,
    comportamentoVendedorLabel: getSelectLabel(COMPORTAMENTO_VENDEDOR_OPCOES, comportamentoVendedor, comportamentoOutro),
    comportamentoOutro: comportamentoVendedor === 'outro' ? comportamentoOutro : '',
    interesseCliente: form.querySelector('#perfil-interesse')?.value.trim() || '',
    urgencia: getSelectedRadio(form, 'perfil-urgencia'),
    decisaoEnvolvidos: getSelectedRadio(form, 'decisao-envolvidos'),
    decisaoOutros,
    decisaoOutrosLabels: getLabelsForValues(DECISAO_OUTROS_OPCOES, decisaoOutros),
    decisaoOutroText: decisaoOutros.includes('outro') ? decisaoOutroText : '',
    outrasPropostas: getSelectedRadio(form, 'perfil-outras-propostas'),
    propostasDisponibilizou: getSelectedRadio(form, 'perfil-propostas-disponibilizou'),
    valorizaFamilia: getSelectedRadio(form, 'perfil-valoriza-familia'),
    temPets: getSelectedRadio(form, 'perfil-tem-pets'),
    outrosInteresses: form.querySelector('#perfil-outros-interesses')?.value.trim() || '',
    servicosAdicionais: form.querySelector('#perfil-servicos-adicionais')?.value.trim() || '',
    formaPagamento,
    formaPagamentoLabel: FORMA_PAGAMENTO_OPCOES.find((i) => i.value === formaPagamento)?.label || '',
    caracteristicas,
    caracteristicasLabels: getLabelsForValues(CARACTERISTICAS_CLIENTE, caracteristicas),
    perfilTecnico,
    perfilTecnicoLabels: getLabelsForValues(PERFIL_TECNICO_OPCOES, perfilTecnico),
    prioridadePrincipal: prioridade,
    prioridadePrincipalLabel: PRIORIDADE_PRINCIPAL_OPCOES.find((i) => i.value === prioridade)?.label || '',
    perfilFinanceiro,
    perfilFinanceiroLabels: getLabelsForValues(PERFIL_FINANCEIRO_OPCOES, perfilFinanceiro),
    comportamentoNegociacao: negociacao,
    comportamentoNegociacaoLabels: getLabelsForValues(COMPORTAMENTO_NEGOCIACAO_OPCOES, negociacao),
    disponibilidadeTempo: disponibilidade,
    disponibilidadeTempoLabels: getLabelsForValues(DISPONIBILIDADE_TEMPO_OPCOES, disponibilidade),
    confiancaSolar,
    confiancaSolarLabels: getLabelsForValues(CONFIANCA_SOLAR_OPCOES, confiancaSolar),
    perfilDominante,
    perfilDominanteLabel: PERFIL_DOMINANTE_OPCOES.find((i) => i.value === perfilDominante)?.label || ''
  };
}

function getFileInfo(input) {
  if (!input?.files?.[0]) return null;
  const f = input.files[0];
  return { name: f.name, type: f.type, size: f.size };
}

function createImagePreview(file, maxWidth = 320, quality = 0.72) {
  return new Promise((resolve) => {
    if (!file?.type?.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function buildFileInfo(file) {
  if (!file) return null;

  const info = {
    name: file.name,
    type: file.type || guessMimeFromName(file.name),
    size: file.size
  };

  if (SOLARVITA_CONFIG.useDatabase) {
    const uploaded = await SolarVitaAPI.uploadAnexo(file);
    if (!uploaded?.url) {
      throw new Error(`Não foi possível armazenar "${file.name}". Tente novamente.`);
    }
    return {
      ...info,
      name: uploaded.name || info.name,
      type: uploaded.type || info.type,
      size: uploaded.size ?? info.size,
      url: uploaded.url,
      stored: true
    };
  }

  if (isImageFile(info)) {
    info.preview = await createImagePreview(file);
  }

  return info;
}

function guessMimeFromName(name = '') {
  const lower = name.toLowerCase();
  if (/\.jpe?g$/.test(lower)) return 'image/jpeg';
  if (/\.png$/.test(lower)) return 'image/png';
  if (/\.webp$/.test(lower)) return 'image/webp';
  if (/\.gif$/.test(lower)) return 'image/gif';
  if (/\.pdf$/.test(lower)) return 'application/pdf';
  if (/\.mp4$/.test(lower)) return 'video/mp4';
  return '';
}

function isImageFile(file) {
  const type = file?.type || '';
  if (type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file?.name || '');
}

function getAnexoImageSrc(file) {
  return file?.url || file?.preview || null;
}

function anexoHasStoredFile(file) {
  return Boolean(file?.url || file?.preview);
}

function getAnexoAcceptType(file) {
  if (isImageFile(file)) return 'image/*';
  if (file?.type === 'application/pdf') return '.pdf,application/pdf';
  if ((file?.type || '').startsWith('video/')) return 'video/*';
  return '*/*';
}

function normalizeArquivos(arquivos) {
  if (!arquivos) return {};
  const copy = JSON.parse(JSON.stringify(arquivos));
  if (copy.contaLuz && !Array.isArray(copy.contaLuz)) {
    copy.contaLuz = [copy.contaLuz];
  }
  return copy;
}

function getAnexoAtPath(arquivos, path) {
  if (!arquivos || !path) return null;
  const arq = normalizeArquivos(arquivos);
  const [section, key] = path.split(':');
  if (section === 'video') return arq.video || null;
  if (section === 'drone') return arq.drone?.[key] || null;
  if (section === 'contaLuz' || section === 'extras') {
    const idx = Number.parseInt(key, 10);
    return Array.isArray(arq[section]) ? arq[section][idx] || null : null;
  }
  return null;
}

function setAnexoAtPath(arquivos, path, value) {
  const arq = normalizeArquivos(arquivos || {});
  const [section, key] = path.split(':');

  if (section === 'video') {
    arq.video = value;
    return arq;
  }

  if (section === 'drone') {
    arq.drone = arq.drone || {};
    arq.drone[key] = value;
    return arq;
  }

  if (section === 'contaLuz' || section === 'extras') {
    const idx = Number.parseInt(key, 10);
    arq[section] = arq[section] || [];
    arq[section][idx] = value;
    return arq;
  }

  return arq;
}

function countMissingAnexoFiles(arquivos) {
  if (!arquivos) return 0;
  let count = 0;

  const contas = Array.isArray(arquivos.contaLuz)
    ? arquivos.contaLuz
    : (arquivos.contaLuz ? [arquivos.contaLuz] : []);
  contas.forEach((conta) => {
    if (conta?.name && !anexoHasStoredFile(conta)) count += 1;
  });

  Object.values(arquivos.drone || {}).forEach((drone) => {
    if (drone?.name && !anexoHasStoredFile(drone)) count += 1;
  });

  (arquivos.extras || []).forEach((extra) => {
    if (extra?.name && !anexoHasStoredFile(extra)) count += 1;
  });

  if (arquivos.video?.name && !anexoHasStoredFile(arquivos.video)) count += 1;

  return count;
}

function assertArquivosArmazenados(arquivos) {
  const refs = [];

  const contas = Array.isArray(arquivos?.contaLuz)
    ? arquivos.contaLuz
    : (arquivos?.contaLuz ? [arquivos.contaLuz] : []);
  contas.forEach((entry) => {
    if (entry?.name && !entry?.url) refs.push(entry.name);
  });

  Object.values(arquivos?.drone || {}).forEach((entry) => {
    if (entry?.name && !entry?.url) refs.push(entry.name);
  });

  (arquivos?.extras || []).forEach((entry) => {
    if (entry?.name && !entry?.url) refs.push(entry.name);
  });

  if (arquivos?.video?.name && !arquivos.video?.url) refs.push(arquivos.video.name);

  if (refs.length) {
    throw new Error(`Estes anexos não foram armazenados: ${refs.join(', ')}`);
  }
}

async function handleClienteAnexoUpload(input) {
  const clienteId = input.dataset.clienteId;
  const anexoPath = input.dataset.anexoPath;
  const file = input.files?.[0];
  if (!file || !clienteId || !anexoPath) return;

  const cliente = VENDEDOR_CLIENTES.find((item) => String(item.id) === String(clienteId));
  if (!cliente) return;

  const uploadBtn = input.closest('.cliente-anexo-upload');
  if (uploadBtn) uploadBtn.classList.add('is-loading');

  try {
    if (SOLARVITA_CONFIG.useDatabase) {
      const data = await SolarVitaAPI.uploadClienteAnexo(clienteId, anexoPath, file);
      const saved = getAnexoAtPath(data.cliente?.arquivos, anexoPath);
      if (!saved?.url) {
        throw new Error('Arquivo enviado, mas não foi salvo no cadastro do cliente.');
      }

      const idx = VENDEDOR_CLIENTES.findIndex((item) => String(item.id) === String(clienteId));
      if (idx >= 0) VENDEDOR_CLIENTES[idx] = data.cliente;
    } else {
      const uploaded = await buildFileInfo(file);
      const current = getAnexoAtPath(cliente.arquivos, anexoPath) || {};
      cliente.arquivos = setAnexoAtPath(cliente.arquivos, anexoPath, {
        ...current,
        ...uploaded,
        name: uploaded.name || current.name,
        label: current.label,
        nomeConta: current.nomeConta
      });
      saveVendedorClientes();
    }

    refreshClientesBaseUI();
  } catch (err) {
    window.alert(err.message || 'Não foi possível enviar o arquivo.');
  } finally {
    if (uploadBtn) uploadBtn.classList.remove('is-loading');
    input.value = '';
  }
}

async function collectContasLuzAsync(form) {
  const contas = [];
  for (const item of form.querySelectorAll('.conta-luz-item')) {
    const nomeConta = item.querySelector('.conta-luz-nome')?.value.trim();
    const file = item.querySelector('.upload-input')?.files?.[0];
    let existing = null;
    try {
      existing = item.dataset.existingAnexoData
        ? JSON.parse(item.dataset.existingAnexoData)
        : null;
    } catch {
      existing = null;
    }

    if (nomeConta || file || existing) {
      const fileInfo = file ? await buildFileInfo(file) : {};
      contas.push({
        ...(existing || {}),
        ...fileInfo,
        nomeConta: nomeConta || existing?.nomeConta || ''
      });
    }
  }
  return contas;
}

async function collectArquivosAsync(form, existingArquivos = null) {
  const existing = existingArquivos || {};
  const drone = { ...(existing.drone || {}) };

  for (const s of DRONE_SLOTS) {
    const file = form.querySelector(`#drone-${s.id}`)?.files?.[0];
    if (file) {
      const info = await buildFileInfo(file);
      drone[s.id] = { ...info, label: s.label };
    }
  }

  const extrasInput = form.querySelector('#file-extras');
  const extrasZone = extrasInput?.closest('.upload-zone');
  const extrasFiles = extrasZone?._files?.length
    ? extrasZone._files
    : Array.from(extrasInput?.files || []);
  const extras = [...(existing.extras || [])];
  for (const file of extrasFiles) {
    const info = await buildFileInfo(file);
    if (info) extras.push(info);
  }

  const videoFile = form.querySelector('#file-video')?.files?.[0];
  let video = existing.video || null;
  if (videoFile) {
    const info = await buildFileInfo(videoFile);
    if (info) video = info;
  }

  const result = {
    contaLuz: await collectContasLuzAsync(form),
    drone,
    extras,
    video
  };

  if (!result.contaLuz.length) delete result.contaLuz;
  if (!Object.keys(result.drone).length) delete result.drone;
  if (!result.extras.length) delete result.extras;
  if (!result.video) delete result.video;

  return Object.keys(result).length ? result : null;
}

function countArquivos(arquivos) {
  if (!arquivos) return 0;
  let n = 0;
  if (Array.isArray(arquivos.contaLuz)) {
    n += arquivos.contaLuz.filter(c => c.name).length;
  } else if (arquivos.contaLuz) {
    n += 1;
  }
  if (arquivos.video) n += 1;
  n += arquivos.extras?.length || 0;
  n += Object.keys(arquivos.drone || {}).length;
  return n;
}

function isPapCliente(cliente) {
  return cliente?.tipoRegistro === 'pap';
}

function rebuildVendedorMapMarkers() {
  if (!vendedorMap || typeof L === 'undefined') return;

  vendedorMap.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      vendedorMap.removeLayer(layer);
    }
  });

  const bounds = [];

  VENDEDOR_VISITAS.forEach((visita) => {
    if (visita.lat == null || visita.lng == null) return;
    const marker = L.marker([visita.lat, visita.lng]).addTo(vendedorMap);
    marker.bindPopup(
      `<strong>${visita.cliente}</strong><br>${visita.endereco}<br>` +
      `<small>${visita.carimbo || visita.data}</small>` +
      (visita.observacao ? `<br><em>${visita.observacao}</em>` : '')
    );
    bounds.push([visita.lat, visita.lng]);
  });

  if (bounds.length) {
    vendedorMap.fitBounds(bounds, { padding: [40, 40] });
  }
}

async function excluirPapCliente(id, triggerBtn) {
  const cliente = VENDEDOR_CLIENTES.find((item) => String(item.id) === String(id));
  if (!cliente || !isPapCliente(cliente)) return;

  if (triggerBtn) triggerBtn.disabled = true;

  try {
    if (SOLARVITA_CONFIG.useDatabase) {
      await SolarVitaAPI.deleteVendedorCliente(id);
    }

    VENDEDOR_CLIENTES = VENDEDOR_CLIENTES.filter((item) => String(item.id) !== String(id));
    saveVendedorClientes();
    syncVisitasFromClientes();

    refreshClientesUI();
    refreshClientesBaseUI();
    rebuildVendedorMapMarkers();
  } catch (error) {
    alert(error.message || 'Não foi possível excluir o PAP.');
    if (triggerBtn) triggerBtn.disabled = false;
  }
}

function initPapDeleteHandlers(root = document) {
  if (root.dataset.papDeleteBound === 'true') return;
  root.dataset.papDeleteBound = 'true';

  root.addEventListener('click', (event) => {
    const btn = event.target.closest('.btn-excluir-pap');
    if (!btn || !root.contains(btn)) return;

    const id = btn.dataset.id;
    if (!id) return;

    if (!confirm('Excluir este registro PAP? Esta ação não pode ser desfeita.')) return;
    excluirPapCliente(id, btn);
  });
}

function renderClientesTableRows() {
  return renderClientesBaseTableRows(getClientesCadastrados());
}

function formatDataRetorno(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatWhatsAppCliente(value) {
  if (!value) return '—';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}

function getClientesCadastrados() {
  return VENDEDOR_CLIENTES.filter((cliente) => !isPapCliente(cliente));
}

function recalcularVendedorStats() {
  const clientes = getClientesCadastrados();
  VENDEDOR_STATS.apresentadas = 0;
  VENDEDOR_STATS.convertidas = 0;
  VENDEDOR_STATS.perdidas = 0;
  VENDEDOR_STATS.prospectados = 0;

  clientes.forEach((cliente) => {
    if (cliente.status === 'apresentado') VENDEDOR_STATS.apresentadas += 1;
    else if (cliente.status === 'convertido') VENDEDOR_STATS.convertidas += 1;
    else if (cliente.status === 'perdido') VENDEDOR_STATS.perdidas += 1;
    else if (cliente.status === 'prospectado') VENDEDOR_STATS.prospectados += 1;
  });
}

function syncVisitasFromClientes() {
  VENDEDOR_VISITAS = VENDEDOR_CLIENTES
    .filter((cliente) => cliente.lat != null && cliente.lng != null)
    .map((cliente) => ({
      cliente: cliente.nome,
      clienteId: cliente.id,
      tipoRegistro: cliente.tipoRegistro,
      endereco: cliente.endereco,
      lat: Number(cliente.lat),
      lng: Number(cliente.lng),
      data: cliente.data || formatDataHoje(),
      carimbo: cliente.carimbo,
      observacao: cliente.observacao || ''
    }));
}

function refreshVendedorStatsUI() {
  recalcularVendedorStats();

  const taxaConversao = VENDEDOR_STATS.apresentadas
    ? Math.round((VENDEDOR_STATS.convertidas / VENDEDOR_STATS.apresentadas) * 100)
    : 0;

  const statApresentadas = document.querySelector('.stat-apresentadas .stat-value');
  const statConvertidas = document.querySelector('.stat-convertidas .stat-value');
  const statConvertidasExtra = document.querySelector('.stat-convertidas .stat-extra');
  const statPerdidas = document.querySelector('.stat-perdidas .stat-value');
  const statProspectados = document.getElementById('stat-prospectados');
  const comissaoDetalhe = document.querySelector('.comissao-detalhe');

  if (statApresentadas) statApresentadas.textContent = VENDEDOR_STATS.apresentadas;
  if (statConvertidas) statConvertidas.textContent = VENDEDOR_STATS.convertidas;
  if (statConvertidasExtra) statConvertidasExtra.textContent = `${taxaConversao}% de conversão`;
  if (statPerdidas) statPerdidas.textContent = VENDEDOR_STATS.perdidas;
  if (statProspectados) statProspectados.textContent = VENDEDOR_STATS.prospectados;
  if (comissaoDetalhe) comissaoDetalhe.textContent = `${VENDEDOR_STATS.convertidas} vendas convertidas`;
}

function filterClientesBase(list, { busca = '', status = '', etapa = '' } = {}) {
  const termo = busca.trim().toLowerCase();

  return list.filter((c) => {
    if (status && c.status !== status) return false;
    if (etapa && getClienteEtapaTrilha(c) !== etapa) return false;
    if (!termo) return true;
    const haystack = [
      c.nome,
      c.endereco,
      c.whatsapp,
      c.observacao,
      c.tipoRetornoLabel,
      STATUS_LABELS[c.status]?.label
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(termo);
  });
}

function getClientesBaseResumo(list) {
  const resumo = {
    total: list.length,
    convertido: 0,
    apresentado: 0,
    prospectado: 0,
    perdido: 0
  };
  list.forEach((c) => {
    if (resumo[c.status] != null) resumo[c.status] += 1;
  });
  return resumo;
}

const CLIENTE_TRILHA_ETAPAS = [
  { id: 'prospecao', label: 'Prospecção' },
  { id: 'drone', label: 'Drone' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'apresentacao', label: 'Apresentação' },
  { id: 'follow-up', label: 'Follow Up' },
  { id: 'contrato', label: 'Contrato' },
  { id: 'pagamento', label: 'Pagamento' },
  { id: 'procuracao', label: 'Procuração' },
  { id: 'projeto', label: 'Projeto' },
  { id: 'homologacao', label: 'Homologação' },
  { id: 'instalacao', label: 'Instalação' },
  { id: 'acompanhamento', label: 'Acompanhamento' }
];

let clientesFiltroEtapa = '';
let expandedClienteRowId = '';

function getClienteEtapaTrilha(cliente) {
  if (cliente?.etapaTrilha) return cliente.etapaTrilha;
  if (cliente?.status === 'apresentado') return 'apresentacao';
  if (cliente?.status === 'convertido') return 'acompanhamento';
  return 'prospecao';
}

function getClienteRowId(cliente, index) {
  return cliente.id != null ? String(cliente.id) : `row-${index}`;
}

function getTrilhaResumo(list) {
  const resumo = Object.fromEntries(CLIENTE_TRILHA_ETAPAS.map((etapa) => [etapa.id, 0]));
  list.forEach((cliente) => {
    const etapa = getClienteEtapaTrilha(cliente);
    if (resumo[etapa] != null) resumo[etapa] += 1;
  });
  return resumo;
}

function renderClientesTrilhaHtml(list, activeEtapa = '') {
  const resumo = getTrilhaResumo(list);

  return CLIENTE_TRILHA_ETAPAS.map((etapa, index) => {
    const count = resumo[etapa.id] || 0;
    const isActive = activeEtapa === etapa.id;

    return `
      <button
        type="button"
        class="trilha-step${count ? ' has-clients' : ''}${isActive ? ' is-active' : ''}"
        data-etapa-trilha="${etapa.id}"
        title="${etapa.label}: ${count} cliente${count === 1 ? '' : 's'}"
        aria-pressed="${isActive ? 'true' : 'false'}"
      >
        <span class="trilha-step-marker">${index + 1}</span>
        <span class="trilha-step-label">${etapa.label}</span>
        <span class="trilha-step-count">${count}</span>
      </button>
    `;
  }).join('');
}

function getEtapaTrilhaLabel(etapaId) {
  return CLIENTE_TRILHA_ETAPAS.find((etapa) => etapa.id === etapaId)?.label || '—';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDetalheValue(value) {
  if (value == null || value === '') return '';
  if (Array.isArray(value)) {
    const items = value.map((item) => {
      if (item == null || item === '') return '';
      if (typeof item === 'object') {
        return Object.values(item).filter(Boolean).join(' · ');
      }
      return String(item);
    }).filter(Boolean);
    return items.length ? items.join(', ') : '';
  }
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

function renderDetalheField(label, value, options = {}) {
  const formatted = formatDetalheValue(value);
  if (!formatted) return '';
  const classes = [
    'cliente-detalhe-item',
    options.wide ? 'cliente-detalhe-item-wide' : '',
    options.full ? 'cliente-detalhe-item-full' : ''
  ].filter(Boolean).join(' ');

  return `
    <div class="${classes}">
      <span class="cliente-detalhe-label">${escapeHtml(label)}</span>
      <span class="cliente-detalhe-value">${escapeHtml(formatted)}</span>
    </div>
  `;
}

function renderDetalheSection(title, fieldsHtml) {
  if (!fieldsHtml) return '';
  return `
    <section class="cliente-detalhe-section">
      <h4 class="cliente-detalhe-section-title">${escapeHtml(title)}</h4>
      <div class="cliente-detalhe-grid">${fieldsHtml}</div>
    </section>
  `;
}

function getFileIcon(type = '') {
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📄';
  if (type.startsWith('video/')) return '🎬';
  return '📎';
}

function renderAnexoItem(file, label = '', ctx = {}) {
  if (!file?.name) return '';
  const { clienteId, anexoPath } = ctx;
  const isImage = isImageFile(file);
  const imageSrc = isImage ? getAnexoImageSrc(file) : null;
  const missingFile = !anexoHasStoredFile(file);
  const canUpload = Boolean(clienteId && anexoPath && missingFile);
  const accept = getAnexoAcceptType(file);
  let previewHtml;

  if (imageSrc) {
    previewHtml = `<a class="cliente-anexo-thumb" href="${imageSrc}" target="_blank" rel="noopener noreferrer" title="Abrir ${escapeHtml(file.name)}">
        <img src="${imageSrc}" alt="${escapeHtml(file.name)}" loading="lazy">
      </a>`;
  } else if (isImage) {
    previewHtml = `<div class="cliente-anexo-thumb cliente-anexo-thumb-missing">
        <span class="cliente-anexo-missing-label">Foto indisponível</span>
        ${canUpload ? renderAnexoUploadButton(clienteId, anexoPath, accept) : ''}
      </div>`;
  } else {
    previewHtml = `<div class="cliente-anexo-file-fallback">
        <span class="cliente-anexo-icon" aria-hidden="true">${getFileIcon(file.type || '')}</span>
        ${canUpload ? renderAnexoUploadButton(clienteId, anexoPath, accept) : ''}
      </div>`;
  }

  return `
    <li class="cliente-anexo-item${imageSrc || isImage ? ' has-preview' : ''}${canUpload ? ' can-upload' : ''}">
      ${previewHtml}
      <div class="cliente-anexo-info">
        ${label ? `<span class="cliente-anexo-label">${escapeHtml(label)}</span>` : ''}
        <span class="cliente-anexo-name">${escapeHtml(file.name)}</span>
        <span class="cliente-anexo-meta">${formatFileSize(file.size || 0)}${file.type ? ` · ${escapeHtml(file.type)}` : ''}</span>
      </div>
    </li>
  `;
}

function renderAnexoUploadButton(clienteId, anexoPath, accept) {
  return `
    <label class="cliente-anexo-upload">
      <input type="file" class="cliente-anexo-input" accept="${accept}" hidden
        data-cliente-id="${escapeHtml(String(clienteId))}" data-anexo-path="${escapeHtml(anexoPath)}">
      <span class="cliente-anexo-upload-text">Enviar arquivo</span>
    </label>
  `;
}

function renderClienteAnexosHtml(arquivos, clienteId = '') {
  if (!arquivos) {
    return '<p class="cliente-detalhe-empty">Nenhum anexo.</p>';
  }

  const items = [];
  const contas = Array.isArray(arquivos.contaLuz)
    ? arquivos.contaLuz
    : (arquivos.contaLuz ? [arquivos.contaLuz] : []);

  contas.forEach((conta, index) => {
    if (!conta?.name) return;
    const label = conta.nomeConta ? `Conta de luz — ${conta.nomeConta}` : 'Conta de luz';
    items.push(renderAnexoItem(conta, label, {
      clienteId,
      anexoPath: `contaLuz:${index}`
    }));
  });

  Object.entries(arquivos.drone || {}).forEach(([slotId, drone]) => {
    if (!drone?.name) return;
    items.push(renderAnexoItem(drone, `Drone — ${drone.label || 'Foto'}`, {
      clienteId,
      anexoPath: `drone:${slotId}`
    }));
  });

  (arquivos.extras || []).forEach((extra, index) => {
    if (!extra?.name) return;
    items.push(renderAnexoItem(extra, 'Demais fotos', {
      clienteId,
      anexoPath: `extras:${index}`
    }));
  });

  if (arquivos.video?.name) {
    items.push(renderAnexoItem(arquivos.video, 'Vídeo', {
      clienteId,
      anexoPath: 'video:0'
    }));
  }

  if (!items.length) {
    return '<p class="cliente-detalhe-empty">Nenhum anexo.</p>';
  }

  const missingCount = countMissingAnexoFiles(arquivos);
  const notice = missingCount && clienteId
    ? `<p class="cliente-anexos-notice">${missingCount} anexo(s) sem arquivo salvo. Use <strong>Enviar arquivo</strong> em cada item para atualizar.</p>`
    : '';

  return `${notice}<ul class="cliente-anexos-list">${items.join('')}</ul>`;
}

function renderClienteDadosConsumoHtml(dados) {
  if (!dados) return '';

  const fields = [
    renderDetalheField('Consumos registrados', dados.consumos?.map((item) => {
      if (!item.titulo && !item.valor) return '';
      return `${item.titulo || 'Consumo'}: ${item.valor || '—'}`;
    })),
    renderDetalheField('Pretende aumentar consumo', dados.pretendeAumentarConsumo),
    renderDetalheField('Modo de aumento', dados.aumentoConsumo?.modo),
    renderDetalheField('Aumento em kW', dados.aumentoConsumo?.kw),
    renderDetalheField('Equipamentos previstos', dados.aumentoConsumo?.equipamentos?.map((item) => {
      if (!item.nome && !item.quantidade) return '';
      return `${item.nome || 'Equipamento'} (${item.quantidade ?? '—'})`;
    })),
    renderDetalheField('Gênero do cliente', dados.clienteGenero),
    renderDetalheField('Idade do cliente', dados.clienteIdade),
    renderDetalheField('Pessoas no imóvel', dados.qtdPessoasNaoIdentificado ? 'Não identificado' : dados.qtdPessoasImovel),
    renderDetalheField('Moradores', dados.ocupantes?.map((item) => {
      const partes = [item.parentescoLabel || item.parentesco, item.sexo, item.idade != null ? `${item.idade} anos` : ''].filter(Boolean);
      return partes.join(' · ');
    })),
    renderDetalheField('Tipo de imóvel', dados.tipoImovel),
    renderDetalheField('Local do imóvel', dados.localImovel),
    renderDetalheField('Posse do imóvel', dados.posseImovel),
    renderDetalheField('Tipo de telhado', dados.tipoTelhadoLabel || dados.tipoTelhadoOutro || dados.tipoTelhado),
    renderDetalheField('Sombreamento', dados.sombreamento),
    renderDetalheField('Descrição do sombreamento', dados.sombreamentoDescricao, { full: true })
  ].join('');

  return renderDetalheSection('Dados de consumo', fields);
}

function renderClienteDefinicaoPerfilHtml(perfil) {
  if (!perfil) return '';

  const quemContato = perfil.quemContato === 'cliente'
    ? 'Cliente'
    : perfil.quemContato === 'vendedor'
      ? 'Vendedor'
      : perfil.quemContato;

  const fields = [
    renderDetalheField('Quem entrou em contato', quemContato),
    renderDetalheField('Origem do contato', perfil.origemClienteLabel),
    renderDetalheField('Canal do vendedor', perfil.canalVendedorLabel),
    renderDetalheField('Comportamento do cliente', perfil.comportamentoVendedorLabel),
    renderDetalheField('Interesse do cliente', perfil.interesseCliente, { full: true }),
    renderDetalheField('Urgência', perfil.urgencia),
    renderDetalheField('Responsável pela decisão', perfil.decisaoEnvolvidos),
    renderDetalheField('Outros decisores', perfil.decisaoOutrosLabels),
    renderDetalheField('Descrição do decisor', perfil.decisaoOutroText),
    renderDetalheField('Já recebeu outras propostas', perfil.outrasPropostas),
    renderDetalheField('Disponibilizou propostas', perfil.propostasDisponibilizou),
    renderDetalheField('Valoriza família', perfil.valorizaFamilia),
    renderDetalheField('Tem pets', perfil.temPets),
    renderDetalheField('Outros interesses', perfil.outrosInteresses, { full: true }),
    renderDetalheField('Serviços adicionais', perfil.servicosAdicionais, { full: true }),
    renderDetalheField('Forma de pagamento', perfil.formaPagamentoLabel),
    renderDetalheField('Características', perfil.caracteristicasLabels),
    renderDetalheField('Perfil técnico', perfil.perfilTecnicoLabels),
    renderDetalheField('Prioridade principal', perfil.prioridadePrincipalLabel),
    renderDetalheField('Perfil financeiro', perfil.perfilFinanceiroLabels),
    renderDetalheField('Comportamento na negociação', perfil.comportamentoNegociacaoLabels),
    renderDetalheField('Disponibilidade de tempo', perfil.disponibilidadeTempoLabels),
    renderDetalheField('Confiança em energia solar', perfil.confiancaSolarLabels),
    renderDetalheField('Perfil dominante', perfil.perfilDominanteLabel)
  ].join('');

  return renderDetalheSection('Definição de perfil', fields);
}

function renderClienteDetalheHtml(cliente) {
  const registro = cliente.carimbo || cliente.data || '—';
  const loc = cliente.lat != null && cliente.lng != null
    ? `${formatCoords(cliente.lat, cliente.lng)} (precisão ~${cliente.accuracy || '?'}m)`
    : '';
  const statusLabel = STATUS_LABELS[cliente.status]?.label || cliente.status || '—';

  const geral = [
    renderDetalheField('WhatsApp', formatWhatsAppCliente(cliente.whatsapp)),
    renderDetalheField('Endereço', cliente.endereco, { wide: true }),
    renderDetalheField('Status', statusLabel),
    renderDetalheField('Data de retorno', formatDataRetorno(cliente.dataRetorno)),
    renderDetalheField('Tipo de retorno', cliente.tipoRetornoLabel),
    renderDetalheField('Etapa na trilha', getEtapaTrilhaLabel(getClienteEtapaTrilha(cliente))),
    renderDetalheField('Registro', registro),
    renderDetalheField('Localização', loc),
    renderDetalheField('Observação', cliente.observacao, { full: true }),
    renderDetalheField('Cadastrado em', cliente.criadoEm ? formatCarimbo(new Date(cliente.criadoEm)) : '')
  ].join('');

  const anexosHtml = renderClienteAnexosHtml(cliente.arquivos, cliente.id);

  return `
    <div class="cliente-detalhe-wrap">
      <div class="cliente-detalhe-actions">
        <button type="button" class="btn-editar-cliente" data-edit-cliente="${escapeHtml(String(cliente.id))}" aria-label="Editar informações do cliente" title="Editar informações">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
          </svg>
        </button>
      </div>
      ${renderDetalheSection('Dados gerais', geral)}
      ${renderClienteDefinicaoPerfilHtml(cliente.definicaoPerfil)}
      ${renderClienteDadosConsumoHtml(cliente.dadosConsumo)}
      <section class="cliente-detalhe-section">
        <h4 class="cliente-detalhe-section-title">Anexos</h4>
        ${anexosHtml}
      </section>
    </div>
  `;
}

function renderProspectadoAcoesHtml(cliente) {
  if (cliente.status !== 'prospectado' || cliente.id == null) return '';

  const possuiFotoActive = cliente.possuiFoto ? ' is-active' : '';

  return `
    <div class="cliente-prospectado-acoes">
      <button type="button" class="btn-prospectado-acao btn-possui-foto${possuiFotoActive}" data-acao-prospectado="possui-foto" data-cliente-id="${escapeHtml(String(cliente.id))}" title="Marcar que possui foto">
        Possui foto
      </button>
      <button type="button" class="btn-prospectado-acao btn-inviavel" data-acao-prospectado="inviavel" data-cliente-id="${escapeHtml(String(cliente.id))}" title="Marcar como inviável">
        Inviável
      </button>
    </div>
  `;
}

async function handleProspectadoAcao(clienteId, acao) {
  const cliente = findClienteById(clienteId);
  if (!cliente || cliente.status !== 'prospectado') return;

  let payload;
  if (acao === 'possui-foto') {
    if (cliente.possuiFoto) return;
    payload = { possuiFoto: true };
  } else if (acao === 'inviavel') {
    payload = { inviavel: true, status: 'perdido' };
  } else {
    return;
  }

  try {
    if (SOLARVITA_CONFIG.useDatabase) {
      const data = await SolarVitaAPI.updateVendedorCliente(clienteId, payload);
      const idx = VENDEDOR_CLIENTES.findIndex((item) => String(item.id) === String(clienteId));
      if (idx >= 0) VENDEDOR_CLIENTES[idx] = data.cliente;
    } else {
      Object.assign(cliente, payload);
      saveVendedorClientes();
    }

    syncVisitasFromClientes();
    refreshClientesUI();
    refreshClientesBaseUI();
    rebuildVendedorMapMarkers();
  } catch (err) {
    window.alert(err.message || 'Não foi possível atualizar o cliente.');
  }
}

function renderClientesBaseTableRows(clientes, { extended = false, expandedId = '' } = {}) {
  if (!clientes.length) {
    const cols = extended ? 3 : 5;
    return `<tr><td colspan="${cols}" class="clientes-empty">Nenhum cliente encontrado.</td></tr>`;
  }

  return clientes.map((c, index) => {
    const st = STATUS_LABELS[c.status];
    const registro = c.carimbo || c.data;
    const obs = c.observacao
      ? `<span class="cliente-obs" title="${c.observacao.replace(/"/g, '&quot;')}">${c.observacao}</span>`
      : '—';
    const loc = c.lat != null && c.lng != null
      ? `<span class="cliente-loc" title="Precisão ~${c.accuracy || '?'}m">${formatCoords(c.lat, c.lng)}</span>`
      : '';
    const arqCount = countArquivos(c.arquivos);
    const arqBadge = arqCount
      ? `<span class="arq-badge" title="${arqCount} arquivo(s) anexado(s)">📎 ${arqCount}</span>`
      : '';
    const fotoBadge = c.possuiFoto
      ? '<span class="cliente-foto-badge" title="Possui foto">📷</span>'
      : '';
    const prospectadoAcoes = renderProspectadoAcoesHtml(c);
    const rowId = getClienteRowId(c, index);
    const isOpen = expandedId === rowId;

    if (extended) {
      return `
        <tr class="cliente-row${isOpen ? ' is-open' : ''}" data-cliente-row="${rowId}" tabindex="0" role="button" aria-expanded="${isOpen ? 'true' : 'false'}">
          <td class="cliente-nome-cell">
            <span class="cliente-row-chevron" aria-hidden="true">${isOpen ? '▾' : '▸'}</span>
            <strong>${c.nome}</strong>${fotoBadge}${arqBadge}
          </td>
          <td class="cliente-status-cell">
            <span class="status-badge ${st.class}">${st.label}</span>
            ${prospectadoAcoes}
          </td>
          <td>${formatDataRetorno(c.dataRetorno)}</td>
        </tr>
        <tr class="cliente-detalhe-row" data-cliente-detalhe="${rowId}" ${isOpen ? '' : 'hidden'}>
          <td colspan="3">${renderClienteDetalheHtml(c)}</td>
        </tr>
      `;
    }

    return `
      <tr>
        <td><strong>${c.nome}</strong>${arqBadge}</td>
        <td>${c.endereco}</td>
        <td><span class="status-badge ${st.class}">${st.label}</span></td>
        <td class="col-registro">${registro}${loc !== '—' ? `<br>${loc}` : ''}</td>
        <td>${obs}</td>
      </tr>
    `;
  }).join('');
}

function refreshClientesBaseUI() {
  const busca = document.getElementById('clientes-busca')?.value || '';
  const status = document.getElementById('clientes-filtro-status')?.value || '';
  const clientesBase = getClientesCadastrados();
  const filtrados = filterClientesBase(clientesBase, { busca, status, etapa: clientesFiltroEtapa });
  const tbody = document.getElementById('clientes-base-tbody');
  const countEl = document.getElementById('clientes-count');
  const resumoEl = document.getElementById('clientes-resumo-stats');
  const trilhaEl = document.getElementById('clientes-trilha');

  if (tbody) {
    const stillVisible = filtrados.some((cliente, index) => getClienteRowId(cliente, index) === expandedClienteRowId);
    if (!stillVisible) expandedClienteRowId = '';
    tbody.innerHTML = renderClientesBaseTableRows(filtrados, {
      extended: true,
      expandedId: expandedClienteRowId
    });
  }
  if (countEl) {
    countEl.textContent = filtrados.length === clientesBase.length
      ? `${clientesBase.length} clientes`
      : `${filtrados.length} de ${clientesBase.length} clientes`;
  }
  if (resumoEl) {
    const resumo = getClientesBaseResumo(clientesBase);
    resumoEl.innerHTML = `
      <div class="clientes-resumo-item"><span class="clientes-resumo-num">${resumo.total}</span><span>Total</span></div>
      <div class="clientes-resumo-item clientes-resumo-convertido"><span class="clientes-resumo-num">${resumo.convertido}</span><span>Convertidos</span></div>
      <div class="clientes-resumo-item clientes-resumo-apresentado"><span class="clientes-resumo-num">${resumo.apresentado}</span><span>Apresentados</span></div>
      <div class="clientes-resumo-item clientes-resumo-prospectado"><span class="clientes-resumo-num">${resumo.prospectado}</span><span>Prospectados</span></div>
      <div class="clientes-resumo-item clientes-resumo-perdido"><span class="clientes-resumo-num">${resumo.perdido}</span><span>Perdidos</span></div>
    `;
  }
  if (trilhaEl) {
    trilhaEl.innerHTML = `<span class="trilha-line" aria-hidden="true"></span>${renderClientesTrilhaHtml(clientesBase, clientesFiltroEtapa)}`;
  }
}

function initClientesTrilhaHandlers(root = document) {
  if (root.dataset.trilhaBound === 'true') return;
  root.dataset.trilhaBound = 'true';

  root.addEventListener('click', (event) => {
    if (event.target.closest('.cliente-anexo-upload, .cliente-anexo-input, .btn-editar-cliente, .cliente-prospectado-acoes, .btn-prospectado-acao')) {
      event.stopPropagation();
    }

    const acaoBtn = event.target.closest('[data-acao-prospectado]');
    if (acaoBtn && root.contains(acaoBtn)) {
      handleProspectadoAcao(acaoBtn.dataset.clienteId, acaoBtn.dataset.acaoProspectado);
      return;
    }

    const editBtn = event.target.closest('[data-edit-cliente]');
    if (editBtn && root.contains(editBtn) && registrarClienteModalCtx) {
      const cliente = findClienteById(editBtn.dataset.editCliente);
      if (cliente) abrirModalEditarCliente(cliente, registrarClienteModalCtx);
      return;
    }

    if (event.target.closest('.cliente-anexo-upload, .cliente-anexo-input, .cliente-prospectado-acoes, .btn-prospectado-acao')) {
      return;
    }

    const row = event.target.closest('[data-cliente-row]');
    if (row && root.contains(row)) {
      const rowId = row.dataset.clienteRow;
      expandedClienteRowId = expandedClienteRowId === rowId ? '' : rowId;
      refreshClientesBaseUI();
      return;
    }

    const btn = event.target.closest('[data-etapa-trilha]');
    if (!btn || !root.contains(btn)) return;

    const etapa = btn.dataset.etapaTrilha;
    clientesFiltroEtapa = clientesFiltroEtapa === etapa ? '' : etapa;
    refreshClientesBaseUI();
  });

  root.addEventListener('change', (event) => {
    const input = event.target.closest('.cliente-anexo-input');
    if (!input || !root.contains(input)) return;
    event.stopPropagation();
    handleClienteAnexoUpload(input);
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target.closest('[data-cliente-row]');
    if (!row || !root.contains(row)) return;
    event.preventDefault();
    const rowId = row.dataset.clienteRow;
    expandedClienteRowId = expandedClienteRowId === rowId ? '' : rowId;
    refreshClientesBaseUI();
  });
}

function renderVisitasListItems() {
  return VENDEDOR_VISITAS.map((visita) => {
    const deleteBtn = visita.tipoRegistro === 'pap' && visita.clienteId
      ? `<button type="button" class="btn-excluir-pap btn-excluir-pap-inline" data-id="${visita.clienteId}" title="Excluir PAP">Excluir</button>`
      : '';

    return `
    <li class="visita-item">
      <div class="visita-item-main">
        <strong>${visita.cliente}</strong>
        <span>${visita.endereco} · ${visita.carimbo || visita.data}${visita.observacao ? ` · ${visita.observacao}` : ''}</span>
      </div>
      ${deleteBtn}
    </li>
  `;
  }).join('');
}

function refreshVisitasUI() {
  const list = document.getElementById('visitas-list');
  if (list) list.innerHTML = renderVisitasListItems();
}

function addMarkerToMap(visita) {
  if (!vendedorMap || visita.lat == null) return;
  const marker = L.marker([visita.lat, visita.lng]).addTo(vendedorMap);
  marker.bindPopup(
    `<strong>${visita.cliente}</strong><br>${visita.endereco}<br>` +
    `<small>${visita.carimbo || visita.data}</small>` +
    (visita.observacao ? `<br><em>${visita.observacao}</em>` : '')
  );
  vendedorMap.setView([visita.lat, visita.lng], 14);
}

function refreshClientesUI() {
  const tbody = document.getElementById('clientes-tbody');
  if (tbody) tbody.innerHTML = renderClientesTableRows();
  refreshVendedorStatsUI();
  refreshVisitasUI();
}

function showModalAlert(form, message, type = 'error', options = {}) {
  let el = form.querySelector('.modal-alert');
  if (!el) {
    el = document.createElement('div');
    el.className = 'modal-alert';
    form.prepend(el);
  }
  if (options.html) {
    el.innerHTML = message;
  } else {
    el.textContent = message;
  }
  el.className = `modal-alert show ${type}`;
}

function clearModalAlert(form) {
  const el = form.querySelector('.modal-alert');
  if (el) {
    el.className = 'modal-alert';
    el.textContent = '';
    el.innerHTML = '';
  }
}

let registrarClienteModalCtx = null;

function findClienteById(id) {
  return VENDEDOR_CLIENTES.find((cliente) => String(cliente.id) === String(id));
}

function clearClienteEditState(form, modalTitle) {
  delete form.dataset.editClienteId;
  delete form._editClienteOriginal;
  if (modalTitle) modalTitle.textContent = 'Registrar cliente';
}

function setFormInput(form, selector, value) {
  const el = form.querySelector(selector);
  if (el != null && value != null && value !== '') el.value = value;
}

function setFormRadio(form, name, value) {
  if (!value) return;
  form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = input.value === value;
  });
}

function setFormCheckboxes(form, name, values = []) {
  form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = values.includes(input.value);
  });
}

function setFormSelect(form, selector, value) {
  const el = form.querySelector(selector);
  if (el && value) el.value = value;
}

function populateContasLuzFromCliente(form, contas = []) {
  const list = form.querySelector('#contas-luz-list');
  if (!list) return;

  const items = contas.length ? contas : [{}];
  contaLuzIdCounter = 0;
  list.innerHTML = items.map((_, index) => {
    contaLuzIdCounter = index;
    return renderContaLuzItem(index);
  }).join('');

  list.querySelectorAll('.conta-luz-item').forEach((item, index) => {
    const conta = items[index] || {};
    const nomeInput = item.querySelector('.conta-luz-nome');
    if (nomeInput) nomeInput.value = conta.nomeConta || '';
    if (conta.url || conta.preview) {
      item.dataset.existingAnexo = 'true';
      item.dataset.existingAnexoData = JSON.stringify(conta);
    }
    const zone = item.querySelector('.upload-zone');
    if (zone) setupUploadZone(zone);
  });

  updateContaLuzRemoveButtons(list);
}

function populateDadosConsumoFromCliente(form, dados = {}) {
  resetDadosConsumo(form);

  const consumos = dados.consumos?.length ? dados.consumos : [{}];
  const consumosList = form.querySelector('#consumos-list');
  if (consumosList) {
    consumoIdCounter = 0;
    consumosList.innerHTML = consumos.map((_, index) => {
      consumoIdCounter = index;
      return renderConsumoItem(index);
    }).join('');
    consumosList.querySelectorAll('.consumo-item').forEach((item, index) => {
      const consumo = consumos[index] || {};
      const titulo = item.querySelector('.consumo-titulo');
      const valor = item.querySelector('.consumo-valor');
      if (titulo) titulo.value = consumo.titulo || '';
      if (valor) valor.value = consumo.valor || '';
    });
  }

  setFormRadio(form, 'aumentar-consumo', dados.pretendeAumentarConsumo ? 'sim' : 'nao');
  if (dados.pretendeAumentarConsumo && dados.aumentoConsumo) {
    setFormRadio(form, 'modo-aumento-consumo', dados.aumentoConsumo.modo || '');
    setFormInput(form, '#consumo-aumento-kw', dados.aumentoConsumo.kw || '');

    const equipamentos = dados.aumentoConsumo.equipamentos?.length
      ? dados.aumentoConsumo.equipamentos
      : [];
    const equipList = form.querySelector('#equipamentos-list');
    if (equipList && equipamentos.length) {
      equipamentoIdCounter = 0;
      equipList.innerHTML = equipamentos.map((_, index) => {
        equipamentoIdCounter = index;
        return renderEquipamentoItem(index);
      }).join('');
      equipList.querySelectorAll('.equipamento-item').forEach((item, index) => {
        const equip = equipamentos[index] || {};
        const nome = item.querySelector('.equipamento-nome');
        const qtd = item.querySelector('.equipamento-qtd');
        if (nome) nome.value = equip.nome || '';
        if (qtd) qtd.value = equip.quantidade ?? '';
      });
    }
  }

  setFormRadio(form, 'cliente-genero', dados.clienteGenero || '');
  setFormInput(form, '#consumo-cliente-idade', dados.clienteIdade || '');

  const qtdCheckbox = form.querySelector('#consumo-qtd-nao-identificado');
  const qtdInput = form.querySelector('#consumo-qtd-pessoas');
  if (qtdCheckbox) qtdCheckbox.checked = Boolean(dados.qtdPessoasNaoIdentificado);
  if (qtdInput) {
    qtdInput.disabled = Boolean(dados.qtdPessoasNaoIdentificado);
    qtdInput.value = dados.qtdPessoasImovel || '';
  }

  const ocupantes = dados.ocupantes?.length ? dados.ocupantes : [{}];
  const ocupantesList = form.querySelector('#ocupantes-list');
  if (ocupantesList) {
    ocupanteIdCounter = 0;
    ocupantesList.innerHTML = ocupantes.map((_, index) => {
      ocupanteIdCounter = index;
      return renderOcupanteItem(index);
    }).join('');
    ocupantesList.querySelectorAll('.ocupante-item').forEach((item, index) => {
      const ocupante = ocupantes[index] || {};
      const sexo = item.querySelector('.ocupante-sexo');
      const parentesco = item.querySelector('.ocupante-parentesco');
      const parentescoOutros = item.querySelector('.ocupante-parentesco-outros');
      const idade = item.querySelector('.ocupante-idade');
      if (sexo) sexo.value = ocupante.sexo || '';
      if (parentesco) parentesco.value = ocupante.parentesco || '';
      if (parentescoOutros) parentescoOutros.value = ocupante.parentescoOutros || '';
      if (idade) idade.value = ocupante.idade ?? '';
      if (parentesco) updateParentescoOutroWrap(parentesco);
    });
  }

  setFormRadio(form, 'tipo-imovel', dados.tipoImovel || '');
  setFormRadio(form, 'local-imovel', dados.localImovel || '');
  setFormRadio(form, 'posse-imovel', dados.posseImovel || '');
  setFormSelect(form, '#consumo-tipo-telhado', dados.tipoTelhado || '');
  setFormInput(form, '#consumo-tipo-telhado-outro', dados.tipoTelhadoOutro || '');
  setFormRadio(form, 'sombreamento', dados.sombreamento ? 'sim' : 'nao');
  setFormInput(form, '#consumo-sombreamento-desc', dados.sombreamentoDescricao || '');

  updateTelhadoOutroPanel(form);
  updateQtdPessoasNaoIdentificado(form);
  updateAumentoConsumoPanels(form);
  updateSombreamentoPanel(form);
}

function populateDefinicaoPerfilFromCliente(form, perfil = {}) {
  resetDefinicaoPerfil(form);

  setFormRadio(form, 'quem-contato', perfil.quemContato || '');
  setFormSelect(form, '#perfil-origem-cliente', perfil.origemCliente || '');
  setFormInput(form, '#perfil-origem-cliente-outro', perfil.origemClienteOutro || '');
  setFormSelect(form, '#perfil-canal-vendedor', perfil.canalVendedor || '');
  setFormInput(form, '#perfil-canal-vendedor-outro', perfil.canalVendedorOutro || '');
  setFormSelect(form, '#perfil-comportamento-vendedor', perfil.comportamentoVendedor || '');
  setFormInput(form, '#perfil-comportamento-outro', perfil.comportamentoOutro || '');
  setFormInput(form, '#perfil-interesse', perfil.interesseCliente || '');
  setFormRadio(form, 'perfil-urgencia', perfil.urgencia || '');
  setFormRadio(form, 'decisao-envolvidos', perfil.decisaoEnvolvidos || '');
  setFormCheckboxes(form, 'decisao-outros', perfil.decisaoOutros || []);
  setFormInput(form, '#perfil-decisao-outro', perfil.decisaoOutroText || '');
  setFormRadio(form, 'perfil-outras-propostas', perfil.outrasPropostas || '');
  setFormRadio(form, 'perfil-propostas-disponibilizou', perfil.propostasDisponibilizou || '');
  setFormRadio(form, 'perfil-valoriza-familia', perfil.valorizaFamilia || '');
  setFormRadio(form, 'perfil-tem-pets', perfil.temPets || '');
  setFormInput(form, '#perfil-outros-interesses', perfil.outrosInteresses || '');
  setFormInput(form, '#perfil-servicos-adicionais', perfil.servicosAdicionais || '');
  setFormSelect(form, '#perfil-forma-pagamento', perfil.formaPagamento || '');
  setFormCheckboxes(form, 'perfil-caracteristicas', perfil.caracteristicas || []);
  setFormCheckboxes(form, 'perfil-tecnico', perfil.perfilTecnico || []);
  setFormSelect(form, '#perfil-prioridade', perfil.prioridadePrincipal || '');
  setFormCheckboxes(form, 'perfil-financeiro', perfil.perfilFinanceiro || []);
  setFormCheckboxes(form, 'perfil-negociacao', perfil.comportamentoNegociacao || []);
  setFormCheckboxes(form, 'perfil-disponibilidade', perfil.disponibilidadeTempo || []);
  setFormCheckboxes(form, 'perfil-confianca-solar', perfil.confiancaSolar || []);
  setFormSelect(form, '#perfil-dominante', perfil.perfilDominante || '');

  updatePerfilContatoPanels(form);
  updateOrigemClienteOutro(form);
  updateCanalVendedorOutro(form);
  updateComportamentoVendedorOutro(form);
  updateDecisaoOutrosPanel(form);
  updateDecisaoOutroText(form);
  updatePropostasPanel(form);
}

function populateFormFromCliente(form, cliente, dataRetornoPicker) {
  setFormInput(form, '#cliente-nome', cliente.nome || '');
  setFormInput(form, '#cliente-endereco', cliente.endereco || '');
  setFormInput(form, '#cliente-whatsapp', cliente.whatsapp || '');
  setFormInput(form, '#cliente-observacao', cliente.observacao || '');

  if (cliente.dataRetorno && dataRetornoPicker) {
    dataRetornoPicker.setValue(cliente.dataRetorno);
  } else {
    dataRetornoPicker?.reset();
  }

  const tipoSelect = form.querySelector('#cliente-tipo-retorno');
  const outrosWrap = form.querySelector('#cliente-tipo-retorno-outros-wrap');
  const outrosInput = form.querySelector('#cliente-tipo-retorno-outros');
  if (tipoSelect && cliente.tipoRetorno) {
    tipoSelect.value = cliente.tipoRetorno;
    if (cliente.tipoRetorno === 'outros') {
      if (outrosWrap) outrosWrap.hidden = false;
      if (outrosInput) outrosInput.value = cliente.tipoRetornoLabel || '';
    } else if (outrosWrap) {
      outrosWrap.hidden = true;
      if (outrosInput) outrosInput.value = '';
    }
  }

  const contas = Array.isArray(cliente.arquivos?.contaLuz)
    ? cliente.arquivos.contaLuz
    : (cliente.arquivos?.contaLuz ? [cliente.arquivos.contaLuz] : []);
  populateContasLuzFromCliente(form, contas);
  populateDadosConsumoFromCliente(form, cliente.dadosConsumo || {});
  populateDefinicaoPerfilFromCliente(form, cliente.definicaoPerfil || {});
}

function abrirModalEditarCliente(cliente, ctx) {
  const { form, modal, submitBtn, dataRetornoPicker, modalTitle } = ctx;
  if (!form || !modal || !cliente?.id) return;

  modal.hidden = false;
  document.body.classList.add('modal-open');
  clearModalAlert(form);
  resetFilePreviews(form);
  resetFormAccordion(form);
  form._editClienteOriginal = JSON.parse(JSON.stringify(cliente));
  form.dataset.editClienteId = String(cliente.id);

  if (modalTitle) modalTitle.textContent = 'Editar cliente';
  submitBtn.disabled = false;
  submitBtn.textContent = 'Salvar alterações';

  populateFormFromCliente(form, cliente, dataRetornoPicker);
  expandAccordionPanel(form, 'dados-cliente');
  form.querySelector('#cliente-nome')?.focus();
}

function abrirModalRegistrarCliente(form, modal, submitBtn, dataRetornoPicker, options = {}) {
  const modalTitle = modal?.querySelector('.modal-header h2');
  clearClienteEditState(form, modalTitle);
  modal.hidden = false;
  document.body.classList.add('modal-open');
  clearModalAlert(form);
  resetFilePreviews(form);
  resetContasLuz(form);
  resetDadosConsumo(form);
  resetDefinicaoPerfil(form);
  resetTipoRetorno(form);
  resetFormAccordion(form);
  dataRetornoPicker?.reset();
  submitBtn.disabled = false;
  submitBtn.textContent = 'Salvar cliente';

  if (options.presetCanalVendedor) {
    const canalSelect = form.querySelector('#perfil-canal-vendedor');
    if (canalSelect) {
      canalSelect.value = options.presetCanalVendedor;
      updateCanalVendedorOutro(form);
    }
    expandAccordionPanel(form, 'definicao-perfil');
  }

  form.querySelector('#cliente-nome')?.focus();
}

function initRegistrarCliente() {
  const btn = document.getElementById('btn-registrar-cliente');
  const modal = document.getElementById('modal-registrar-cliente');
  const form = document.getElementById('form-registrar-cliente');
  const btnFechar = document.getElementById('modal-fechar');
  const submitBtn = form?.querySelector('button[type=submit]');

  if (!btn || !modal || !form || !submitBtn) return;

  setupFileUploads(form);
  initContasLuz(form);
  initDadosConsumo(form);
  initDefinicaoPerfil(form);
  initTipoRetorno(form);
  initFormAccordion(form);
  const dataRetornoPicker = initModernDatePicker(form.querySelector('[data-date-picker]'));
  const modalTitle = modal.querySelector('.modal-header h2');

  registrarClienteModalCtx = { form, modal, submitBtn, dataRetornoPicker, modalTitle };

  btn.addEventListener('click', () => {
    abrirModalRegistrarCliente(form, modal, submitBtn, dataRetornoPicker);
  });

  initRegistrarPap();

  function fecharModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    form.reset();
    resetFilePreviews(form);
    resetContasLuz(form);
    resetDadosConsumo(form);
    resetDefinicaoPerfil(form);
    resetTipoRetorno(form);
    resetFormAccordion(form);
    dataRetornoPicker.reset();
    clearModalAlert(form);
    clearClienteEditState(form, modalTitle);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar cliente';
  }

  btnFechar.addEventListener('click', fecharModal);
  modal.querySelector('.modal-overlay').addEventListener('click', fecharModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalAlert(form);

    const nome = form.querySelector('#cliente-nome').value.trim();
    const endereco = form.querySelector('#cliente-endereco').value.trim();
    const whatsapp = form.querySelector('#cliente-whatsapp').value.trim();
    const dataRetorno = form.querySelector('#cliente-data-retorno').value;
    const tipoRetorno = form.querySelector('#cliente-tipo-retorno').value;
    const tipoRetornoOutros = form.querySelector('#cliente-tipo-retorno-outros').value.trim();
    const observacao = form.querySelector('#cliente-observacao').value.trim();

    if (nome.length < 3) {
      expandAccordionPanel(form, 'dados-cliente');
      showModalAlert(form, 'Informe o nome completo do cliente.');
      return;
    }

    if (endereco.length < 5) {
      expandAccordionPanel(form, 'dados-cliente');
      showModalAlert(form, 'Informe o endereço completo.');
      return;
    }

    if (!dataRetorno) {
      expandAccordionPanel(form, 'dados-cliente');
      showModalAlert(form, 'Informe a data de retorno.');
      form.querySelector('[data-date-picker]')?.classList.add('is-invalid');
      return;
    }

    if (!tipoRetorno) {
      expandAccordionPanel(form, 'dados-cliente');
      showModalAlert(form, 'Selecione o tipo de retorno.');
      return;
    }

    if (tipoRetorno === 'outros' && tipoRetornoOutros.length < 3) {
      expandAccordionPanel(form, 'dados-cliente');
      showModalAlert(form, 'Descreva o tipo de retorno em "Outros".');
      form.querySelector('#cliente-tipo-retorno-outros-wrap').hidden = false;
      form.querySelector('#cliente-tipo-retorno-outros').focus();
      return;
    }

    if (!observacao) {
      expandAccordionPanel(form, 'dados-cliente');
      showModalAlert(form, 'O campo Observação é obrigatório.');
      return;
    }

    const contaErr = validateContasLuz(form);
    if (contaErr) {
      expandAccordionPanel(form, 'dados-consumo');
      showModalAlert(form, contaErr);
      return;
    }

    const editClienteId = form.dataset.editClienteId;
    const isEdit = Boolean(editClienteId);
    const submitLabel = isEdit ? 'Salvar alterações' : 'Salvar cliente';

    submitBtn.disabled = true;
    submitBtn.textContent = isEdit ? 'Atualizando anexos...' : 'Enviando anexos...';

    const existingArquivos = isEdit ? form._editClienteOriginal?.arquivos : null;
    let arquivos;
    try {
      arquivos = await collectArquivosAsync(form, existingArquivos);
      if (SOLARVITA_CONFIG.useDatabase && arquivos) {
        assertArquivosArmazenados(arquivos);
      }
    } catch (err) {
      showModalAlert(form, err.message || 'Não foi possível enviar os anexos. Tente novamente.');
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
      return;
    }

    if (isEdit) {
      const payload = {
        nome,
        endereco,
        whatsapp: whatsapp || '',
        dataRetorno,
        tipoRetorno,
        tipoRetornoLabel: getTipoRetornoLabel(tipoRetorno, tipoRetornoOutros),
        observacao,
        dadosConsumo: collectDadosConsumo(form),
        definicaoPerfil: collectDefinicaoPerfil(form)
      };
      if (arquivos) payload.arquivos = arquivos;

      try {
        if (SOLARVITA_CONFIG.useDatabase) {
          const data = await SolarVitaAPI.updateVendedorCliente(editClienteId, payload);
          const idx = VENDEDOR_CLIENTES.findIndex((item) => String(item.id) === String(editClienteId));
          if (idx >= 0) VENDEDOR_CLIENTES[idx] = data.cliente;
        } else {
          const idx = VENDEDOR_CLIENTES.findIndex((item) => String(item.id) === String(editClienteId));
          if (idx >= 0) {
            VENDEDOR_CLIENTES[idx] = {
              ...VENDEDOR_CLIENTES[idx],
              ...payload
            };
            saveVendedorClientes();
          }
        }
      } catch (error) {
        showModalAlert(form, error.message || 'Não foi possível salvar as alterações.');
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
        return;
      }

      syncVisitasFromClientes();
      refreshClientesUI();
      refreshClientesBaseUI();
      rebuildVendedorMapMarkers();
      fecharModal();
      return;
    }

    submitBtn.textContent = 'Capturando localização...';

    let loc;
    try {
      loc = await getLocalizacaoVendedor();
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED') {
        showModalAlert(form, `
          <strong>Localização bloqueada</strong>
          ${getGeoDeniedInstructionsHtml()}
        `, 'error', { html: true });
      } else {
        showModalAlert(form, err.message);
      }
      submitBtn.disabled = false;
      submitBtn.textContent = 'Salvar cliente';
      return;
    }

    const agora = new Date();
    const carimbo = formatCarimbo(agora);

    const cliente = {
      nome,
      endereco,
      whatsapp: whatsapp || '',
      dataRetorno,
      tipoRetorno,
      tipoRetornoLabel: getTipoRetornoLabel(tipoRetorno, tipoRetornoOutros),
      observacao,
      dadosConsumo: collectDadosConsumo(form),
      definicaoPerfil: collectDefinicaoPerfil(form),
      arquivos,
      status: 'prospectado',
      etapaTrilha: 'prospecao',
      data: formatDataHoje(),
      carimbo,
      lat: loc.lat,
      lng: loc.lng,
      accuracy: loc.accuracy
    };

    if (SOLARVITA_CONFIG.useDatabase) {
      try {
        const data = await SolarVitaAPI.createVendedorCliente(cliente);
        VENDEDOR_CLIENTES.unshift(data.cliente);
      } catch (error) {
        showModalAlert(form, error.message || 'Não foi possível salvar o cliente.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar cliente';
        return;
      }
    } else {
      VENDEDOR_CLIENTES.unshift(cliente);
      saveVendedorClientes();
    }

    syncVisitasFromClientes();
    refreshClientesUI();
    rebuildVendedorMapMarkers();
    fecharModal();
  });
}

const VENDEDOR_CLIENTES_KEY = 'solarvita_vendedor_clientes';

const VENDEDOR_CLIENTES_SEED = DEMO?.clientesSeed ?? [];

function loadVendedorClientes() {
  try {
    const stored = localStorage.getItem(VENDEDOR_CLIENTES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return null;
}

function saveVendedorClientes() {
  localStorage.setItem(VENDEDOR_CLIENTES_KEY, JSON.stringify(VENDEDOR_CLIENTES));
}

let VENDEDOR_CLIENTES = loadVendedorClientes() || [...VENDEDOR_CLIENTES_SEED];

async function syncVendedorClientesFromApi() {
  if (!SOLARVITA_CONFIG.useDatabase) {
    recalcularVendedorStats();
    syncVisitasFromClientes();
    return;
  }
  try {
    const data = await SolarVitaAPI.getVendedorClientes();
    VENDEDOR_CLIENTES = data.clientes || [];
  } catch (error) {
    console.error(error);
    VENDEDOR_CLIENTES = [];
  }
  recalcularVendedorStats();
  syncVisitasFromClientes();
}

let VENDEDOR_VISITAS = DEMO?.visitas ? [...DEMO.visitas] : [];

const VENDEDOR_AGENDA_TEMPLATE = DEMO?.agendaTemplate ?? [];

let VENDEDOR_AGENDA_ITEMS = null;

function addDaysISO(iso, days) {
  const date = parseISODate(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
}

function ensureAgendaItems() {
  if (VENDEDOR_AGENDA_ITEMS) return;

  const semana = getSemanaAtual(new Date());
  VENDEDOR_AGENDA_ITEMS = VENDEDOR_AGENDA_TEMPLATE.map((item, index) => {
    const date = new Date(semana[0]);
    date.setDate(semana[0].getDate() + item.dayOffset);
    const { dayOffset, ...rest } = item;
    return {
      ...rest,
      id: `ag-${index + 1}`,
      dataOriginal: formatDateISO(date),
      diasAdiada: 0,
      vezesAdiada: 0,
      concluida: false,
      concluidaEm: null
    };
  });

  if (DEMO?.getAgendaExtras) {
    const semanaISO = semana.map((d) => formatDateISO(d));
    VENDEDOR_AGENDA_ITEMS.push(...DEMO.getAgendaExtras(semanaISO));
  }
}

function syncAgendaRollforward() {
  ensureAgendaItems();
  const hoje = formatDateISO(new Date());

  VENDEDOR_AGENDA_ITEMS.forEach((item) => {
    if (item.concluida) return;
    let dataExibicao = addDaysISO(item.dataOriginal, item.diasAdiada || 0);
    while (dataExibicao < hoje) {
      item.diasAdiada = (item.diasAdiada || 0) + 1;
      item.vezesAdiada = (item.vezesAdiada || 0) + 1;
      dataExibicao = addDaysISO(item.dataOriginal, item.diasAdiada);
    }
  });
}

function getResolvedAgendaItems() {
  ensureAgendaItems();
  syncAgendaRollforward();

  return VENDEDOR_AGENDA_ITEMS.map((item) => ({
    ...item,
    dataExibicao: getAgendaDataExibicao(item)
  }));
}

function calcDiasEntreDatas(isoInicio, isoFim) {
  const inicio = parseISODate(isoInicio);
  const fim = parseISODate(isoFim);
  if (!inicio || !fim) return 0;
  const ms = fim.getTime() - inicio.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function getAgendaDataExibicao(item) {
  if (item.concluida && item.concluidaEm) return item.concluidaEm;
  return addDaysISO(item.dataOriginal, item.diasAdiada || 0);
}

function registrarAdiamentoAgenda(item, { tipo, novaData, motivo }) {
  if (!item.adiamentos) item.adiamentos = [];

  item.adiamentos.push({
    tipo,
    dataNova: novaData,
    motivo,
    em: new Date().toISOString()
  });
  item.ultimoMotivo = motivo;
  item.vezesAdiada = (item.vezesAdiada || 0) + 1;

  if (tipo === 'reagendar') {
    item.dataOriginal = novaData;
    item.diasAdiada = 0;
  } else {
    item.diasAdiada = calcDiasEntreDatas(item.dataOriginal, novaData);
  }
}

let agendaAcaoPicker = null;
let agendaAcaoContext = null;
let agendaAcaoRefresh = null;

function renderAgendaDatePickerField(idPrefix) {
  return `
    <div class="date-picker" data-date-picker>
      <input type="hidden" id="${idPrefix}-data" required>
      <button type="button" class="date-picker-trigger" aria-expanded="false" aria-haspopup="dialog" aria-controls="${idPrefix}-cal">
        <svg class="date-picker-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.75"/>
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
        </svg>
        <span class="date-picker-value placeholder">Selecione a data</span>
        <svg class="date-picker-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div id="${idPrefix}-cal" class="date-picker-popover" hidden role="dialog" aria-label="Selecionar nova data">
        <div class="date-picker-header">
          <button type="button" class="date-picker-nav date-picker-prev" aria-label="Mês anterior">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <span class="date-picker-month"></span>
          <button type="button" class="date-picker-nav date-picker-next" aria-label="Próximo mês">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div class="date-picker-weekdays">
          ${DIAS_SEMANA_CURTOS.map(d => `<span>${d}</span>`).join('')}
        </div>
        <div class="date-picker-days"></div>
        <div class="date-picker-footer">
          <button type="button" class="date-picker-today">Hoje</button>
          <button type="button" class="date-picker-clear">Limpar</button>
        </div>
      </div>
    </div>
  `;
}

function initAgendaAcaoModal() {
  const modal = document.getElementById('modal-agenda-acao');
  const form = document.getElementById('form-agenda-acao');
  const btnFechar = document.getElementById('modal-agenda-acao-fechar');
  if (!modal || !form || form.dataset.bound) return;

  form.dataset.bound = 'true';
  agendaAcaoPicker = initModernDatePicker(form.querySelector('[data-date-picker]'));

  function fecharModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    form.reset();
    agendaAcaoPicker.reset();
    agendaAcaoContext = null;
    clearModalAlert(form);
  }

  btnFechar.addEventListener('click', fecharModal);
  modal.querySelector('.modal-overlay').addEventListener('click', fecharModal);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearModalAlert(form);

    if (!agendaAcaoContext) return;

    const novaData = form.querySelector('#agenda-acao-data').value;
    const motivo = form.querySelector('#agenda-acao-motivo').value.trim();
    const hoje = formatDateISO(new Date());
    const item = agendaAcaoContext.item;
    const dataAtual = getAgendaDataExibicao(item);

    if (!novaData) {
      showModalAlert(form, 'Selecione a nova data.');
      form.querySelector('[data-date-picker]')?.classList.add('is-invalid');
      return;
    }

    if (novaData < hoje) {
      showModalAlert(form, 'A nova data não pode ser anterior a hoje.');
      return;
    }

    if (agendaAcaoContext.tipo === 'adiar' && novaData <= dataAtual) {
      showModalAlert(form, 'Para adiar, escolha uma data posterior à data atual da atividade.');
      return;
    }

    if (motivo.length < 3) {
      showModalAlert(form, 'Informe o motivo (mínimo 3 caracteres).');
      form.querySelector('#agenda-acao-motivo').focus();
      return;
    }

    registrarAdiamentoAgenda(item, {
      tipo: agendaAcaoContext.tipo,
      novaData,
      motivo
    });

    fecharModal();
    if (agendaAcaoRefresh) {
      agendaAcaoRefresh(parseISODate(novaData));
    }
  });
}

function abrirAgendaAcaoModal(tipo, agendaId) {
  ensureAgendaItems();
  const modal = document.getElementById('modal-agenda-acao');
  const form = document.getElementById('form-agenda-acao');
  const titulo = document.getElementById('modal-agenda-acao-titulo');
  const resumo = document.getElementById('modal-agenda-acao-resumo');
  const item = VENDEDOR_AGENDA_ITEMS.find(i => i.id === agendaId);

  if (!modal || !form || !item || item.concluida) return;

  const dataAtual = getAgendaDataExibicao(item);
  const defaultData = tipo === 'adiar'
    ? addDaysISO(dataAtual, 1)
    : dataAtual;

  agendaAcaoContext = { tipo, item };

  titulo.textContent = tipo === 'adiar' ? 'Adiar atividade' : 'Reagendar atividade';
  resumo.innerHTML = `
    <strong>${item.titulo}</strong>
    <span>${item.cliente} · Data atual: ${formatDataBR(dataAtual)} · ${item.hora}</span>
  `;

  clearModalAlert(form);
  form.reset();
  agendaAcaoPicker?.setValue(defaultData);
  form.querySelector('#agenda-acao-motivo').value = '';

  modal.hidden = false;
  document.body.classList.add('modal-open');
  form.querySelector('#agenda-acao-motivo').focus();
}

function formatDiasAdiadaLabel(dias) {
  if (dias === 1) return 'Adiada 1 dia';
  return `Adiada ${dias} dias`;
}

function formatVezesAdiadaLabel(vezes) {
  if (vezes === 1) return 'Adiou 1 vez';
  return `Adiou ${vezes} vezes`;
}

const AGENDA_TIPOS = {
  visita: { label: 'Visita', class: 'agenda-visita' },
  retorno: { label: 'Retorno', class: 'agenda-retorno' },
  contrato: { label: 'Contrato', class: 'agenda-contrato' },
  prospeccao: { label: 'Prospecção', class: 'agenda-prospeccao' },
  reuniao: { label: 'Reunião', class: 'agenda-reuniao' }
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getSemanaAtual(baseDate = new Date()) {
  const d = new Date(baseDate);
  const dia = d.getDay();
  const inicio = new Date(d);
  inicio.setDate(d.getDate() - dia);
  inicio.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(inicio);
    date.setDate(inicio.getDate() + i);
    return date;
  });
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderAgendaSemana(selectedDate) {
  const semana = getSemanaAtual(selectedDate);
  const selectedISO = formatDateISO(selectedDate);
  const agenda = getResolvedAgendaItems();

  const diasHTML = semana.map(date => {
    const iso = formatDateISO(date);
    const eventos = agenda.filter(e => e.dataExibicao === iso);
    const isToday = iso === formatDateISO(new Date());
    const isSelected = iso === selectedISO;
    return `
      <button type="button" class="agenda-dia ${isToday ? 'hoje' : ''} ${isSelected ? 'ativo' : ''}" data-date="${iso}">
        <span class="agenda-dia-nome">${DIAS_SEMANA[date.getDay()]}</span>
        <span class="agenda-dia-num">${date.getDate()}</span>
        ${eventos.length ? `<span class="agenda-dia-badge">${eventos.length}</span>` : ''}
      </button>
    `;
  }).join('');

  const eventosDia = agenda
    .filter(e => e.dataExibicao === selectedISO)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const eventosHTML = eventosDia.length
    ? eventosDia.map(e => {
        const tipo = AGENDA_TIPOS[e.tipo];
        const vezes = e.vezesAdiada || e.diasAdiada || 0;
        const adiadaTag = !e.concluida && e.diasAdiada > 0
          ? `<span class="agenda-adiada">${formatDiasAdiadaLabel(e.diasAdiada)}</span>`
          : '';
        const vezesTag = !e.concluida && vezes > 0
          ? `<span class="agenda-vezes-adiada">${formatVezesAdiadaLabel(vezes)}</span>`
          : '';
        const motivoHtml = !e.concluida && e.ultimoMotivo
          ? `<p class="agenda-motivo" title="Motivo do último adiamento">Motivo: ${e.ultimoMotivo}</p>`
          : '';
        const acoesHtml = !e.concluida
          ? `<div class="agenda-evento-acoes">
              <button type="button" class="btn-agenda-acao btn-agenda-adiar" data-agenda-adiar="${e.id}">Adiar</button>
              <button type="button" class="btn-agenda-acao btn-agenda-reagendar" data-agenda-reagendar="${e.id}">Reagendar</button>
            </div>`
          : '';
        return `
          <article class="agenda-evento${e.concluida ? ' agenda-evento-concluida' : ''}">
            <label class="agenda-check" title="Marcar atividade como feita">
              <input type="checkbox" class="agenda-check-input" data-agenda-id="${e.id}"${e.concluida ? ' checked' : ''}>
              <span class="agenda-check-ui" aria-hidden="true"></span>
            </label>
            <div class="agenda-evento-hora">${e.hora}</div>
            <div class="agenda-evento-body">
              <div class="agenda-evento-top">
                <strong>${e.titulo}</strong>
                <div class="agenda-evento-tags">
                  <span class="agenda-tipo ${tipo.class}">${tipo.label}</span>
                  ${adiadaTag}
                  ${vezesTag}
                </div>
              </div>
              <p class="agenda-cliente">${e.cliente}</p>
              <p class="agenda-endereco">${e.endereco}</p>
              ${motivoHtml}
              ${acoesHtml}
            </div>
          </article>
        `;
      }).join('')
    : '<p class="agenda-vazio">Nenhum compromisso neste dia.</p>';

  const ref = semana[0];
  const mesAno = `${MESES_NOME[ref.getMonth()]} ${ref.getFullYear()}`;

  return { diasHTML, eventosHTML, mesAno, selectedISO };
}

function initAgenda(selectedDate = new Date()) {
  const container = document.getElementById('agenda-content');
  if (!container) return;

  let currentDate = selectedDate;

  if (!container.dataset.agendaBound) {
    container.dataset.agendaBound = 'true';
    container.addEventListener('change', (e) => {
      const input = e.target.closest('.agenda-check-input');
      if (!input) return;

      ensureAgendaItems();
      const item = VENDEDOR_AGENDA_ITEMS.find(i => i.id === input.dataset.agendaId);
      if (!item) return;

      item.concluida = input.checked;
      item.concluidaEm = item.concluida ? formatDateISO(currentDate) : null;
      update(currentDate);
    });

    container.addEventListener('click', (e) => {
      const btnAdiar = e.target.closest('[data-agenda-adiar]');
      const btnReagendar = e.target.closest('[data-agenda-reagendar]');
      if (btnAdiar) {
        abrirAgendaAcaoModal('adiar', btnAdiar.dataset.agendaAdiar);
      }
      if (btnReagendar) {
        abrirAgendaAcaoModal('reagendar', btnReagendar.dataset.agendaReagendar);
      }
    });
  }

  function update(date) {
    currentDate = date;
    const { diasHTML, eventosHTML, mesAno } = renderAgendaSemana(date);
    container.innerHTML = `
      <div class="agenda-toolbar">
        <h2>Agenda</h2>
        <span class="agenda-mes">${mesAno}</span>
      </div>
      <div class="agenda-semana">${diasHTML}</div>
      <div class="agenda-eventos" id="agenda-eventos">${eventosHTML}</div>
    `;

    container.querySelectorAll('.agenda-dia').forEach(btn => {
      btn.addEventListener('click', () => {
        const [y, m, d] = btn.dataset.date.split('-').map(Number);
        update(new Date(y, m - 1, d));
      });
    });
  }

  update(selectedDate);
  agendaAcaoRefresh = (date) => update(date || currentDate);
  initAgendaAcaoModal();
}

const STATUS_LABELS = {
  convertido: { label: 'Convertido', class: 'status-convertido' },
  apresentado: { label: 'Apresentado', class: 'status-apresentado' },
  perdido: { label: 'Perdido', class: 'status-perdido' },
  prospectado: { label: 'Prospectado', class: 'status-prospectado' }
};

function buildRegistrarPapModalHtml() {
  return `
    <div id="modal-registrar-pap" class="modal-registrar" hidden>
      <div class="modal-overlay"></div>
      <div class="modal-box">
        <div class="modal-header">
          <h2>Registrar PAP</h2>
          <button type="button" id="modal-pap-fechar" class="modal-close" aria-label="Fechar">&times;</button>
        </div>
        <form id="form-registrar-pap" class="modal-form">
          <div id="pap-modal-alert" class="modal-alert"></div>

          <div id="pap-geo-prompt" class="geo-permission-box">
            <div class="geo-permission-icon" aria-hidden="true">📍</div>
            <p class="geo-permission-title">Precisamos da sua localização</p>
            <p class="geo-permission-desc">O endereço será preenchido automaticamente com base na sua posição atual.</p>
            <p class="geo-permission-desc">Toque no botão abaixo — o celular vai pedir permissão de localização.</p>
            <button type="button" id="pap-btn-permitir-loc" class="btn btn-primary btn-full">Permitir localização</button>
            <div id="pap-geo-denied" class="geo-denied-help" hidden>
              <p><strong>Localização bloqueada</strong></p>
              ${getGeoDeniedInstructionsHtml()}
              <button type="button" id="pap-btn-tentar-loc" class="btn btn-outline btn-full">Tentar novamente</button>
            </div>
          </div>

          <div id="pap-form-fields" hidden>
            <div class="modal-field">
              <label for="pap-observacao">Observação <span class="req">*</span></label>
              <textarea id="pap-observacao" rows="3" placeholder="Descreva a visita ou contato PAP" required></textarea>
            </div>

            <div class="modal-field">
              <label for="pap-endereco">Endereço</label>
              <input type="text" id="pap-endereco" readonly placeholder="Endereço obtido pela localização">
              <p class="field-hint">Preenchido automaticamente pela sua localização atual.</p>
              <input type="hidden" id="pap-lat">
              <input type="hidden" id="pap-lng">
              <input type="hidden" id="pap-accuracy">
            </div>

            <div class="modal-field">
              <label for="pap-numero">Número <span class="req">*</span></label>
              <input type="text" id="pap-numero" placeholder="Ex: 123" required inputmode="numeric">
            </div>

            <button type="submit" class="btn btn-primary btn-full">Salvar PAP</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function resetPapGeoState(form) {
  const geoPrompt = form.querySelector('#pap-geo-prompt');
  const formFields = form.querySelector('#pap-form-fields');
  const btnPermitir = form.querySelector('#pap-btn-permitir-loc');
  const geoDenied = form.querySelector('#pap-geo-denied');

  if (geoPrompt) geoPrompt.hidden = false;
  if (formFields) formFields.hidden = true;
  if (btnPermitir) {
    btnPermitir.hidden = false;
    btnPermitir.disabled = false;
    btnPermitir.textContent = 'Permitir localização';
  }
  if (geoDenied) geoDenied.hidden = true;
}

function showPapFormFields(form) {
  const geoPrompt = form.querySelector('#pap-geo-prompt');
  const formFields = form.querySelector('#pap-form-fields');
  if (geoPrompt) geoPrompt.hidden = true;
  if (formFields) formFields.hidden = false;
}

function showPapGeoDenied(form) {
  const btnPermitir = form.querySelector('#pap-btn-permitir-loc');
  const geoDenied = form.querySelector('#pap-geo-denied');
  if (btnPermitir) btnPermitir.hidden = true;
  if (geoDenied) geoDenied.hidden = false;
}

function initRegistrarPap() {
  const btn = document.getElementById('btn-registrar-pap');
  const modal = document.getElementById('modal-registrar-pap');
  const form = document.getElementById('form-registrar-pap');
  const btnFechar = document.getElementById('modal-pap-fechar');
  const btnPermitir = form?.querySelector('#pap-btn-permitir-loc');
  const btnTentar = form?.querySelector('#pap-btn-tentar-loc');
  const submitBtn = form?.querySelector('button[type=submit]');

  if (!btn || !modal || !form || !submitBtn || !btnPermitir) return;

  async function aplicarLocalizacaoPap(loc) {
    const enderecoInput = form.querySelector('#pap-endereco');
    const latInput = form.querySelector('#pap-lat');
    const lngInput = form.querySelector('#pap-lng');
    const accuracyInput = form.querySelector('#pap-accuracy');

    enderecoInput.value = '';
    enderecoInput.placeholder = 'Obtendo localização...';

    const endereco = await reverseGeocodeEndereco(loc.lat, loc.lng);
    if (!endereco) {
      throw new Error('Não foi possível identificar o endereço pela localização.');
    }

    latInput.value = String(loc.lat);
    lngInput.value = String(loc.lng);
    accuracyInput.value = String(loc.accuracy);
    enderecoInput.value = endereco;
    enderecoInput.placeholder = '';
  }

  function solicitarLocalizacaoPap(triggerBtn) {
    clearModalAlert(form);
    triggerBtn.disabled = true;
    const labelOriginal = triggerBtn.textContent;
    triggerBtn.textContent = 'Obtendo localização...';

    // Dispara no clique do usuário — necessário no celular para o navegador pedir permissão
    getLocalizacaoVendedor()
      .then((loc) => aplicarLocalizacaoPap(loc))
      .then(() => {
        showPapFormFields(form);
        form.querySelector('#pap-observacao').focus();
      })
      .catch((error) => {
        if (error.code === 'PERMISSION_DENIED') {
          showPapGeoDenied(form);
        } else {
          showModalAlert(form, error.message || 'Não foi possível obter a localização.');
        }
      })
      .finally(() => {
        triggerBtn.disabled = false;
        triggerBtn.textContent = labelOriginal;
      });
  }

  btn.addEventListener('click', () => {
    modal.hidden = false;
    document.body.classList.add('modal-open');
    clearModalAlert(form);
    form.reset();
    resetPapGeoState(form);
  });

  btnPermitir.addEventListener('click', () => {
    solicitarLocalizacaoPap(btnPermitir);
  });

  btnTentar?.addEventListener('click', () => {
    const btnPermitirRetry = form.querySelector('#pap-btn-permitir-loc');
    if (btnPermitirRetry) {
      btnPermitirRetry.hidden = false;
      form.querySelector('#pap-geo-denied').hidden = true;
      solicitarLocalizacaoPap(btnPermitirRetry);
    }
  });

  function fecharModalPap() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    form.reset();
    clearModalAlert(form);
    resetPapGeoState(form);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar PAP';
  }

  btnFechar.addEventListener('click', fecharModalPap);
  modal.querySelector('.modal-overlay').addEventListener('click', fecharModalPap);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearModalAlert(form);

    const observacao = form.querySelector('#pap-observacao').value.trim();
    const enderecoBase = form.querySelector('#pap-endereco').value.trim();
    const numero = form.querySelector('#pap-numero').value.trim();
    const lat = form.querySelector('#pap-lat').value;
    const lng = form.querySelector('#pap-lng').value;
    const accuracy = form.querySelector('#pap-accuracy').value;

    if (!observacao) {
      showModalAlert(form, 'Informe a observação.');
      return;
    }

    if (!enderecoBase || !lat || !lng) {
      showModalAlert(form, 'Aguarde a localização ser capturada ou abra o formulário novamente.');
      return;
    }

    if (!numero) {
      showModalAlert(form, 'Informe o número do endereço.');
      return;
    }

    const endereco = `${enderecoBase}, ${numero}`;
    const agora = new Date();
    const carimbo = formatCarimbo(agora);

    const registro = {
      nome: `PAP - ${numero}`,
      endereco,
      enderecoBase,
      numero,
      observacao,
      tipoRegistro: 'pap',
      canalVendedor: 'pap-street',
      canalVendedorLabel: 'PAP Street',
      status: 'prospectado',
      data: formatDataHoje(),
      carimbo,
      lat: Number(lat),
      lng: Number(lng),
      accuracy: Number(accuracy)
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';

    if (SOLARVITA_CONFIG.useDatabase) {
      try {
        const data = await SolarVitaAPI.createVendedorCliente(registro);
        VENDEDOR_CLIENTES.unshift(data.cliente);
        registro.id = data.cliente.id;
      } catch (error) {
        showModalAlert(form, error.message || 'Não foi possível salvar o PAP.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar PAP';
        return;
      }
    } else {
      if (!registro.id) registro.id = `local-${Date.now()}`;
      VENDEDOR_CLIENTES.unshift(registro);
      saveVendedorClientes();
    }

    syncVisitasFromClientes();
    refreshClientesUI();
    rebuildVendedorMapMarkers();
    fecharModalPap();
  });
}

function buildRegistrarClienteModalHtml() {
  return `
    <div id="modal-registrar-cliente" class="modal-registrar" hidden>
      <div class="modal-overlay"></div>
      <div class="modal-box modal-box-lg">
        <div class="modal-header">
          <h2>Registrar cliente</h2>
          <button type="button" id="modal-fechar" class="modal-close" aria-label="Fechar">&times;</button>
        </div>
        <form id="form-registrar-cliente" class="modal-form modal-form-scroll">

          <div class="form-accordion">
            <div class="accordion-panel" data-accordion="dados-cliente">
              <button type="button" class="accordion-trigger" aria-expanded="false" aria-controls="accordion-dados-cliente">
                <span class="accordion-title">Dados dos clientes</span>
                <svg class="accordion-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div id="accordion-dados-cliente" class="accordion-body" hidden>
                <div class="accordion-inner">
                  <div class="modal-field">
                    <label for="cliente-nome">Nome completo <span class="req">*</span></label>
                    <input type="text" id="cliente-nome" placeholder="Nome do cliente" required>
                  </div>
                  <div class="modal-field">
                    <label for="cliente-endereco">Endereço <span class="req">*</span></label>
                    <input type="text" id="cliente-endereco" placeholder="Rua, número, bairro, cidade" required>
                  </div>
                  <div class="modal-field">
                    <label for="cliente-whatsapp">WhatsApp</label>
                    <input type="tel" id="cliente-whatsapp" placeholder="(00) 00000-0000">
                  </div>
                  <div class="modal-field">
                    <label for="cliente-data-retorno">Data de Retorno <span class="req">*</span></label>
                    <div class="date-picker" data-date-picker>
                      <input type="hidden" id="cliente-data-retorno" name="dataRetorno" required>
                      <button type="button" class="date-picker-trigger" aria-expanded="false" aria-haspopup="dialog" aria-controls="cliente-data-retorno-cal">
                        <svg class="date-picker-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.75"/>
                          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
                        </svg>
                        <span class="date-picker-value placeholder">Selecione a data</span>
                        <svg class="date-picker-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <div id="cliente-data-retorno-cal" class="date-picker-popover" hidden role="dialog" aria-label="Selecionar data de retorno">
                        <div class="date-picker-header">
                          <button type="button" class="date-picker-nav date-picker-prev" aria-label="Mês anterior">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                          </button>
                          <span class="date-picker-month"></span>
                          <button type="button" class="date-picker-nav date-picker-next" aria-label="Próximo mês">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                          </button>
                        </div>
                        <div class="date-picker-weekdays">
                          ${DIAS_SEMANA_CURTOS.map(d => `<span>${d}</span>`).join('')}
                        </div>
                        <div class="date-picker-days"></div>
                        <div class="date-picker-footer">
                          <button type="button" class="date-picker-today">Hoje</button>
                          <button type="button" class="date-picker-clear">Limpar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="modal-field">
                    <label for="cliente-tipo-retorno">Tipo de Retorno <span class="req">*</span></label>
                    <select id="cliente-tipo-retorno" name="tipoRetorno" required>
                      ${renderTipoRetornoOptions()}
                    </select>
                    <div class="tipo-retorno-outros" id="cliente-tipo-retorno-outros-wrap" hidden>
                      <label for="cliente-tipo-retorno-outros">Descreva o tipo de retorno</label>
                      <input type="text" id="cliente-tipo-retorno-outros" placeholder="Informe o motivo do retorno">
                    </div>
                  </div>
                  <div class="modal-field">
                    <label for="cliente-observacao">Observação <span class="req">*</span></label>
                    <textarea id="cliente-observacao" rows="3" placeholder="Anotações sobre o cliente ou a visita" required></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div class="accordion-panel" data-accordion="dados-consumo">
              <button type="button" class="accordion-trigger" aria-expanded="false" aria-controls="accordion-dados-consumo">
                <span class="accordion-title">Dados de consumo</span>
                <svg class="accordion-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div id="accordion-dados-consumo" class="accordion-body" hidden>
                <div class="accordion-inner">
                  ${renderDadosConsumoFields()}

                  <div class="form-section form-section-nested">
                    <div class="section-row">
                      <h3>Contas de luz</h3>
                      <button type="button" id="btn-add-conta-luz" class="btn btn-add-conta">+ Adicionar conta de luz</button>
                    </div>
                    <div id="contas-luz-list"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="accordion-panel" data-accordion="definicao-perfil">
              <button type="button" class="accordion-trigger" aria-expanded="false" aria-controls="accordion-definicao-perfil">
                <span class="accordion-title">Definição de perfil</span>
                <svg class="accordion-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div id="accordion-definicao-perfil" class="accordion-body" hidden>
                <div class="accordion-inner">
                  ${renderDefinicaoPerfilFields()}
                </div>
              </div>
            </div>

            <div class="accordion-panel" data-accordion="registros-fotograficos">
              <button type="button" class="accordion-trigger" aria-expanded="false" aria-controls="accordion-registros-fotograficos">
                <span class="accordion-title">Registros fotográficos</span>
                <svg class="accordion-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div id="accordion-registros-fotograficos" class="accordion-body" hidden>
                <div class="accordion-inner">
                  <div class="form-section form-section-nested">
                    <h3>Fotos de drone</h3>
                    <div class="upload-grid">${renderDroneUploadFields()}</div>
                  </div>

                  <div class="form-section form-section-nested">
                    <h3>Demais fotos</h3>
                    ${renderUploadZone({
                      id: 'file-extras',
                      label: 'Adicionar fotos',
                      accept: 'image/*',
                      hint: 'Quantas fotos quiser · clique ou arraste',
                      multiple: true,
                      large: true
                    })}
                  </div>

                  <div class="form-section form-section-nested">
                    <h3>Vídeo</h3>
                    ${renderUploadZone({
                      id: 'file-video',
                      label: 'Vídeo da visita',
                      accept: 'video/*',
                      hint: 'MP4, MOV ou similar',
                      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
                      large: true
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-full">Salvar cliente</button>
        </form>
      </div>
    </div>
  `;
}

async function renderPainelOperacional(session) {
  await syncVendedorClientesFromApi();

  const defaultPanel = document.getElementById('panel-default');
  const vendedorPanel = document.getElementById('panel-vendedor');
  const adminPanel = document.getElementById('panel-admin');
  const profile = ADMIN_PROFILES[session.perfil];

  if (defaultPanel) defaultPanel.hidden = true;
  if (adminPanel) adminPanel.hidden = true;
  if (!vendedorPanel || !profile) return;

  vendedorPanel.hidden = false;
  document.title = `${profile.panelTitle} — SolarVita`;

  vendedorPanel.innerHTML = `
    <div class="panel-operacional-wrap">
      <div class="panel-card panel-card-action">
        <h1>${profile.panelTitle}</h1>
        <p>${profile.panelDesc}</p>
        <div class="panel-operacional-actions">
          <button type="button" id="btn-registrar-cliente" class="btn btn-primary btn-registrar">
            <span>+</span> Cadastrar cliente
          </button>
          <button type="button" id="btn-registrar-pap" class="btn btn-primary btn-registrar">
            <span>+</span> Registrar PAP
          </button>
          <a href="/clientes/admin" class="btn btn-outline-light">Minha base de clientes</a>
        </div>
      </div>
    </div>
    ${buildRegistrarClienteModalHtml()}
    ${buildRegistrarPapModalHtml()}
  `;

  initRegistrarCliente();
}

async function renderVendedorDashboard(session) {
  await syncVendedorClientesFromApi();

  const defaultPanel = document.getElementById('panel-default');
  const vendedorPanel = document.getElementById('panel-vendedor');

  if (defaultPanel) defaultPanel.hidden = true;
  if (!vendedorPanel) return;

  vendedorPanel.hidden = false;
  document.title = 'Painel do Vendedor — SolarVita';

  recalcularVendedorStats();

  const taxaConversao = VENDEDOR_STATS.apresentadas
    ? Math.round((VENDEDOR_STATS.convertidas / VENDEDOR_STATS.apresentadas) * 100)
    : 0;

  vendedorPanel.innerHTML = `
    <div class="comissao-banner">
      <div class="comissao-banner-inner">
        <div class="comissao-texto">
          <span class="comissao-label">Comissão a receber este mês</span>
          <span class="comissao-mes">${getMesAtualLabel()}</span>
        </div>
        <div class="comissao-valor-wrap">
          <span class="comissao-valor" id="comissao-valor">${formatCurrency(VENDEDOR_COMISSAO_MES)}</span>
          <span class="comissao-detalhe">${VENDEDOR_STATS.convertidas} vendas convertidas</span>
        </div>
      </div>
    </div>

    <div class="vendedor-top-bar">
      <button type="button" id="btn-registrar-cliente" class="btn btn-primary btn-registrar">
        <span>+</span> Registrar cliente
      </button>
      <button type="button" id="btn-registrar-pap" class="btn btn-primary btn-registrar">
        <span>+</span> Registrar PAP
      </button>
      <a href="/clientes/admin" class="btn btn-outline-light btn-base-clientes">
        Minha base de clientes
      </a>
    </div>

    <div class="vendedor-header">
      <div>
        <h1>Painel do Vendedor</h1>
        <p>Olá, <strong>${getPrimeiroNome(session.nome)}</strong> — acompanhe suas propostas e visitas</p>
      </div>
      <a href="index.html" class="btn btn-outline-light">Voltar ao site</a>
    </div>

    ${buildRegistrarClienteModalHtml()}
    ${buildRegistrarPapModalHtml()}

    <div id="modal-agenda-acao" class="modal-registrar" hidden>
      <div class="modal-overlay"></div>
      <div class="modal-box">
        <div class="modal-header">
          <h2 id="modal-agenda-acao-titulo">Adiar atividade</h2>
          <button type="button" id="modal-agenda-acao-fechar" class="modal-close" aria-label="Fechar">&times;</button>
        </div>
        <form id="form-agenda-acao" class="modal-form">
          <p id="modal-agenda-acao-resumo" class="agenda-modal-resumo"></p>
          <div class="modal-field">
            <label for="agenda-acao-data">Nova data <span class="req">*</span></label>
            ${renderAgendaDatePickerField('agenda-acao')}
          </div>
          <div class="modal-field">
            <label for="agenda-acao-motivo">Motivo <span class="req">*</span></label>
            <textarea id="agenda-acao-motivo" rows="3" placeholder="Informe o motivo do adiamento ou reagendamento" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full">Confirmar</button>
        </form>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card stat-apresentadas">
        <span class="stat-label">Propostas apresentadas</span>
        <span class="stat-value">${VENDEDOR_STATS.apresentadas}</span>
      </div>
      <div class="stat-card stat-convertidas">
        <span class="stat-label">Propostas convertidas</span>
        <span class="stat-value">${VENDEDOR_STATS.convertidas}</span>
        <span class="stat-extra">${taxaConversao}% de conversão</span>
      </div>
      <div class="stat-card stat-perdidas">
        <span class="stat-label">Propostas perdidas</span>
        <span class="stat-value">${VENDEDOR_STATS.perdidas}</span>
      </div>
      <div class="stat-card stat-prospectados">
        <span class="stat-label">Clientes prospectados</span>
        <span class="stat-value" id="stat-prospectados">${VENDEDOR_STATS.prospectados}</span>
      </div>
    </div>

    <section class="vendedor-section agenda-section" id="agenda-content"></section>

    <section class="vendedor-section vendedor-map-section vendedor-map-full">
      <div class="section-row">
        <div>
          <h2>Mapa de visitas</h2>
          <p class="section-desc">Endereços que você já visitou na região</p>
        </div>
        <a href="/clientes/admin" class="btn btn-outline-light btn-sm">Ver base de clientes</a>
      </div>
      <div id="vendedor-map" class="vendedor-map"></div>
      <ul class="visitas-list" id="visitas-list">
        ${renderVisitasListItems()}
      </ul>
    </section>
  `;

  initRegistrarCliente();
  initAgenda(new Date());
  initVendedorMap();
  initPapDeleteHandlers(vendedorPanel);
}

function initVendedorMap() {
  const mapEl = document.getElementById('vendedor-map');
  if (!mapEl || typeof L === 'undefined') return;

  vendedorMap = L.map('vendedor-map').setView([-23.1791, -45.8872], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(vendedorMap);

  const bounds = [];

  VENDEDOR_VISITAS.forEach((v) => {
    if (v.lat == null || v.lng == null) return;
    const marker = L.marker([v.lat, v.lng]).addTo(vendedorMap);
    marker.bindPopup(
      `<strong>${v.cliente}</strong><br>${v.endereco}<br>` +
      `<small>${v.carimbo || v.data}</small>` +
      (v.observacao ? `<br><em>${v.observacao}</em>` : '')
    );
    bounds.push([v.lat, v.lng]);
  });

  if (bounds.length) {
    vendedorMap.fitBounds(bounds, { padding: [40, 40] });
  }

  setTimeout(() => vendedorMap.invalidateSize(), 200);
}

async function renderVendedorClientesPage(session) {
  await syncVendedorClientesFromApi();
  clientesFiltroEtapa = '';
  expandedClienteRowId = '';

  const panel = document.getElementById('panel-clientes');
  if (!panel) return;

  document.title = 'Base de Clientes — SolarVita';

  panel.innerHTML = `
    <div class="vendedor-header">
      <div>
        <a href="/painel/admin" class="clientes-back-link">← Voltar ao painel</a>
        <h1>Minha base de clientes</h1>
        <p>Olá, <strong>${getPrimeiroNome(session.nome)}</strong> — consulte e filtre todos os seus clientes cadastrados</p>
      </div>
      <a href="/painel/admin" class="btn btn-primary" id="btn-registrar-cliente">+ Registrar cliente</a>
    </div>

    ${buildRegistrarClienteModalHtml()}

    <div id="clientes-resumo-stats" class="clientes-resumo-grid"></div>

    <div class="clientes-trilha-wrap">
      <div id="clientes-trilha" class="clientes-trilha" role="list" aria-label="Trilha do cliente">
        <span class="trilha-line" aria-hidden="true"></span>
      </div>
    </div>

    <section class="vendedor-section clientes-base-section">
      <div class="clientes-toolbar">
        <div class="clientes-toolbar-search">
          <label for="clientes-busca" class="visually-hidden">Buscar cliente</label>
          <input type="search" id="clientes-busca" placeholder="Buscar por nome, endereço, WhatsApp ou observação…">
        </div>
        <div class="clientes-toolbar-filters">
          <label for="clientes-filtro-status" class="visually-hidden">Filtrar por status</label>
          <select id="clientes-filtro-status">
            <option value="">Todos os status</option>
            <option value="convertido">Convertido</option>
            <option value="apresentado">Apresentado</option>
            <option value="prospectado">Prospectado</option>
            <option value="perdido">Perdido</option>
          </select>
          <span id="clientes-count" class="clientes-count"></span>
        </div>
      </div>

      <div class="clientes-table-wrap clientes-table-wrap-lg">
        <table class="clientes-table clientes-table-base">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Status</th>
              <th>Retorno</th>
            </tr>
          </thead>
          <tbody id="clientes-base-tbody"></tbody>
        </table>
      </div>
    </section>
  `;

  refreshClientesBaseUI();
  initRegistrarCliente();
  initClientesTrilhaHandlers(panel);

  document.getElementById('clientes-busca')?.addEventListener('input', refreshClientesBaseUI);
  document.getElementById('clientes-filtro-status')?.addEventListener('change', refreshClientesBaseUI);
}
