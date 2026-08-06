const TARIFA_KWH = 0.85;
const POTENCIA_PAINEL_W = 635;
const POTENCIA_PAINEL_KWP = POTENCIA_PAINEL_W / 1000;
const CUSTO_POR_KWP = 3700;
const PERDA_PERCENT = 25;
const FATOR_SISTEMA = 1 - PERDA_PERCENT / 100;
const IRRADIACAO_DEFAULT = 5.11;
const ECONOMIA_PERCENT = 0.9;
const VIDA_UTIL = 25;
const TAXA_FINANCIAMENTO_MES = 0.0199;

function parseNumber(value) {
  const n = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function extractCidade(endereco = '') {
  const parts = String(endereco).split(',').map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return 'Local';
  const last = parts[parts.length - 1].replace(/^[\—\-–]\s*/, '').trim();
  return last || parts[parts.length - 1] || 'Local';
}

function getPrimeiroNome(nome = '') {
  return String(nome).trim().split(/\s+/)[0] || 'Cliente';
}

function calcConsumoMensalReais(cliente) {
  const consumos = cliente?.dadosConsumo?.consumos || [];
  const total = consumos.reduce((sum, item) => sum + parseNumber(item.valor), 0);
  if (total > 0) return total;

  const proposta = cliente?.proposta || {};
  if (proposta.contaMensal) return parseNumber(proposta.contaMensal);
  return 500;
}

function calcPropostaFromCliente(cliente, overrides = {}) {
  const propostaSalva = cliente?.proposta || {};
  const merged = { ...propostaSalva, ...overrides };

  const contaMensal = parseNumber(merged.contaMensal) || calcConsumoMensalReais(cliente);
  const consumoKwh = parseNumber(merged.consumoKwh) || round2(contaMensal / TARIFA_KWH);
  const irradiacao = parseNumber(merged.irradiacao) || IRRADIACAO_DEFAULT;
  const perdaPercent = parseNumber(merged.perdaPercent) || PERDA_PERCENT;
  const fator = 1 - perdaPercent / 100;
  const geracaoMensalPorKwp = irradiacao * 30 * fator;

  let potenciaKwp = parseNumber(merged.potenciaKwp);
  if (!potenciaKwp) {
    potenciaKwp = round2((consumoKwh * ECONOMIA_PERCENT) / geracaoMensalPorKwp);
  }

  let numPaineis = parseInt(merged.numPaineis, 10);
  if (!numPaineis) {
    numPaineis = Math.max(1, Math.ceil(potenciaKwp / POTENCIA_PAINEL_KWP));
  }

  const potenciaReal = round2(numPaineis * POTENCIA_PAINEL_KWP);
  let microinversores = parseInt(merged.microinversores, 10);
  if (!microinversores) {
    microinversores = Math.max(1, Math.ceil(numPaineis / 4));
  }

  const geracaoMensal = round2(potenciaReal * geracaoMensalPorKwp);
  let investimento = parseNumber(merged.investimento);
  if (!investimento) {
    investimento = Math.round(potenciaReal * CUSTO_POR_KWP / 100) * 100;
  }

  const economiaMensal = parseNumber(merged.economiaMensal) || round2(contaMensal * ECONOMIA_PERCENT);
  const economiaAnual = round2(economiaMensal * 12);

  const roiRows = [];
  let acumulada = 0;
  for (let ano = 0; ano <= VIDA_UTIL; ano += 1) {
    if (ano === 0) {
      roiRows.push({ ano: 0, economiaAnual: 0, economiaAcumulada: 0, roi: -investimento });
      continue;
    }
    acumulada = round2(acumulada + economiaAnual);
    roiRows.push({
      ano,
      economiaAnual,
      economiaAcumulada: acumulada,
      roi: round2(acumulada - investimento)
    });
  }

  const parcelas = [];
  for (let n = 21; n >= 10; n -= 1) {
    const fator = Math.pow(1 + TAXA_FINANCIAMENTO_MES, n);
    const valor = round2((investimento * TAXA_FINANCIAMENTO_MES * fator) / (fator - 1));
    parcelas.push({ parcelas: n, valor });
  }

  const entrada = parseNumber(merged.entrada) || Math.round(investimento * 0.48 / 100) * 100;
  const parcelasBoleto = parseInt(merged.parcelasBoleto, 10) || 30;
  const valorParcelaBoleto = parseNumber(merged.valorParcelaBoleto)
    || Math.max(100, Math.round((investimento - entrada) / parcelasBoleto));

  return {
    clienteNome: cliente?.nome || 'Cliente',
    clientePrimeiroNome: getPrimeiroNome(cliente?.nome),
    endereco: cliente?.endereco || '',
    cidade: extractCidade(cliente?.endereco),
    vendedorNome: merged.vendedorNome || 'Stephanie Amorim',
    vendedorCrea: merged.vendedorCrea || '5071559559',
    perdaPercent,
    potenciaKwp: potenciaReal,
    irradiacao,
    numPaineis,
    potenciaPainelW: POTENCIA_PAINEL_W,
    microinversores,
    geracaoMensal,
    investimento,
    economiaMensal,
    economiaAnual,
    roiRows,
    parcelas,
    entrada,
    parcelasBoleto,
    valorParcelaBoleto,
    validadeDias: 7,
    dataProposta: new Date()
  };
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCurrencyPlain(value) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatNumber(value, digits = 2) {
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

module.exports = {
  calcPropostaFromCliente,
  formatCurrency,
  formatCurrencyPlain,
  formatNumber
};
