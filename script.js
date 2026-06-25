/**
 * SolarVita — Calculadora de Energia Solar
 * Estimativas baseadas em médias do mercado brasileiro (2026)
 */

const TARIFA_KWH = 0.85;           // R$/kWh médio residencial
const POTENCIA_PAINEL = 0.55;      // kWp por painel (550W)
const CUSTO_POR_KWP = 4200;        // R$/kWp instalado
const IRRADIACAO = {                // kWh/kWp/dia (média anual)
  SP: 4.5, RJ: 4.6, MG: 5.0, PR: 4.3, RS: 4.2,
  SC: 4.1, BA: 5.2, GO: 5.3, PE: 5.4, CE: 5.5, OUTRO: 4.8
};
const FATOR_SISTEMA = 0.80;        // Perdas (sombra, inversor, cabos)
const ECONOMIA_PERCENT = 0.90;     // % da conta compensada
const VIDA_UTIL = 25;              // anos

const form = document.getElementById('solar-form');
const inputConsumo = document.getElementById('consumo');
const inputConta = document.getElementById('conta');
const resultado = document.getElementById('resultado');

// Sincronizar consumo ↔ conta
inputConsumo.addEventListener('input', () => {
  if (inputConsumo.value) {
    inputConta.value = '';
  }
});

inputConta.addEventListener('input', () => {
  if (inputConta.value) {
    const kwh = parseFloat(inputConta.value) / TARIFA_KWH;
    inputConsumo.value = Math.round(kwh);
  }
});

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcular(dados) {
  const { consumoKwh, estado } = dados;

  const irradiacao = IRRADIACAO[estado] || IRRADIACAO.OUTRO;
  const geracaoMensalPorKwp = irradiacao * 30 * FATOR_SISTEMA;

  // Potência necessária para cobrir ~90% do consumo
  const potenciaKwp = (consumoKwh * ECONOMIA_PERCENT) / geracaoMensalPorKwp;
  const potenciaArredondada = Math.ceil(potenciaKwp * 10) / 10;

  const numPaineis = Math.ceil(potenciaArredondada / POTENCIA_PAINEL);
  const potenciaReal = numPaineis * POTENCIA_PAINEL;

  const investimento = potenciaReal * CUSTO_POR_KWP;
  const contaMensal = consumoKwh * TARIFA_KWH;
  const economiaMensal = contaMensal * ECONOMIA_PERCENT;
  const paybackAnos = investimento / (economiaMensal * 12);
  const economiaTotal = economiaMensal * 12 * VIDA_UTIL;

  return {
    potencia: potenciaReal,
    paineis: numPaineis,
    investimento,
    economiaMensal,
    payback: paybackAnos,
    economiaTotal
  };
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  let consumoKwh = parseFloat(inputConsumo.value);

  if (!consumoKwh && inputConta.value) {
    consumoKwh = parseFloat(inputConta.value) / TARIFA_KWH;
  }

  if (!consumoKwh || consumoKwh < 50) {
    alert('Informe um consumo válido (mínimo 50 kWh/mês) ou o valor da conta.');
    return;
  }

  const estado = document.getElementById('estado').value;
  const res = calcular({ consumoKwh, estado });

  document.getElementById('res-economia').textContent = formatCurrency(res.economiaMensal) + '/mês';
  document.getElementById('res-potencia').textContent = res.potencia.toFixed(2) + ' kWp';
  document.getElementById('res-paineis').textContent = res.paineis + ' painéis';
  document.getElementById('res-investimento').textContent = formatCurrency(res.investimento);
  document.getElementById('res-payback').textContent = res.payback.toFixed(1) + ' anos';
  document.getElementById('res-total').textContent = formatCurrency(res.economiaTotal);

  resultado.classList.remove('hidden');
  resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Formulário de contato
document.getElementById('contato-form').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Obrigado! Entraremos em contato em até 24 horas.');
  e.target.reset();
});

// Menu mobile
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});
