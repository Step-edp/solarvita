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

function extractAnexoId(url) {
  const match = String(url || '').match(/\/anexos\/(\d+)(?:\?.*)?$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function collectAnexoRefs(arquivos) {
  const refs = [];
  const arq = normalizeArquivos(arquivos);

  const contas = Array.isArray(arq.contaLuz) ? arq.contaLuz : [];
  contas.forEach((entry, index) => {
    if (entry?.name) refs.push({ path: `contaLuz:${index}`, entry });
  });

  Object.entries(arq.drone || {}).forEach(([slotId, entry]) => {
    if (entry?.name) refs.push({ path: `drone:${slotId}`, entry });
  });

  (arq.extras || []).forEach((entry, index) => {
    if (entry?.name) refs.push({ path: `extras:${index}`, entry });
  });

  if (arq.video?.name) refs.push({ path: 'video:0', entry: arq.video });

  return refs;
}

function validateArquivosHaveUrls(arquivos) {
  const missing = collectAnexoRefs(arquivos).filter((ref) => ref.entry?.name && !ref.entry?.url);
  if (missing.length) {
    const error = new Error('Existem anexos sem arquivo armazenado no servidor.');
    error.code = 'anexos_nao_armazenados';
    throw error;
  }
}

async function linkAnexosToCliente(queryFn, clienteId, arquivos, cpf) {
  const refs = collectAnexoRefs(arquivos);
  for (const ref of refs) {
    const anexoId = extractAnexoId(ref.entry?.url);
    if (!anexoId) continue;
    await queryFn(
      `UPDATE anexo_arquivos
       SET cliente_id = $1, anexo_path = $2
       WHERE id = $3 AND vendedor_cpf = $4`,
      [clienteId, ref.path, anexoId, cpf]
    );
  }
}

function pruneUnstoredAnexos(arquivos) {
  if (!arquivos) return null;

  const arq = normalizeArquivos(arquivos);
  let hasStored = false;

  if (Array.isArray(arq.contaLuz)) {
    arq.contaLuz = arq.contaLuz.filter((entry) => {
      if (entry?.url) {
        hasStored = true;
        return true;
      }
      return false;
    });
    if (!arq.contaLuz.length) delete arq.contaLuz;
  }

  if (arq.drone) {
    const nextDrone = {};
    Object.entries(arq.drone).forEach(([slotId, entry]) => {
      if (entry?.url) {
        hasStored = true;
        nextDrone[slotId] = entry;
      }
    });
    if (Object.keys(nextDrone).length) arq.drone = nextDrone;
    else delete arq.drone;
  }

  if (Array.isArray(arq.extras)) {
    arq.extras = arq.extras.filter((entry) => {
      if (entry?.url) {
        hasStored = true;
        return true;
      }
      return false;
    });
    if (!arq.extras.length) delete arq.extras;
  }

  if (arq.video?.name) {
    if (arq.video.url) hasStored = true;
    else delete arq.video;
  }

  if (!hasStored) return null;

  return arq;
}

function collectStoredAnexoIds(arquivos) {
  return collectAnexoRefs(arquivos)
    .map((ref) => extractAnexoId(ref.entry?.url))
    .filter(Boolean);
}

module.exports = {
  normalizeArquivos,
  getAnexoAtPath,
  setAnexoAtPath,
  extractAnexoId,
  collectAnexoRefs,
  validateArquivosHaveUrls,
  linkAnexosToCliente,
  pruneUnstoredAnexos,
  collectStoredAnexoIds
};
