const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const {
  calcPropostaFromCliente,
  formatCurrencyPlain,
  formatNumber
} = require('./propostaCalc');

const ROOT = path.join(__dirname, '..', '..');
const PAGES_DIR = path.join(ROOT, 'assets', 'proposta', 'pages');
const FONT_PATH = path.join(ROOT, 'assets', 'fonts', 'Arial.ttf');

const PAGE_WIDTH = 595.32;
const PAGE_HEIGHT = 841.92;

const COLORS = {
  navy: rgb(0.05, 0.17, 0.36),
  green: rgb(0.0, 0.45, 0.25),
  dark: rgb(0.12, 0.12, 0.12),
  white: rgb(1, 1, 1),
  red: rgb(0.75, 0.1, 0.1)
};

function readPageImage(pageNumber) {
  const filePath = path.join(PAGES_DIR, `page-${String(pageNumber).padStart(2, '0')}.png`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Página da proposta não encontrada: ${filePath}`);
  }
  return fs.readFileSync(filePath);
}

async function embedPageImage(pdfDoc, bytes) {
  return pdfDoc.embedPng(bytes);
}

function drawCenteredText(page, font, text, centerX, y, size, color = COLORS.navy, bold = false) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: centerX - width / 2,
    y,
    size,
    font,
    color
  });
}

function drawRightText(page, font, text, rightX, y, size, color = COLORS.navy) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: rightX - width,
    y,
    size,
    font,
    color
  });
}

function coverRect(page, x, y, width, height) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: COLORS.white,
    borderWidth: 0
  });
}

async function drawPageCover(page, fonts, data) {
  coverRect(page, 36, 748, 250, 28);
  page.drawText('Preparado para:', {
    x: 40,
    y: 762,
    size: 11,
    font: fonts.regular,
    color: COLORS.dark
  });
  page.drawText(data.clientePrimeiroNome.toUpperCase(), {
    x: 40,
    y: 744,
    size: 18,
    font: fonts.bold,
    color: COLORS.navy
  });
}

async function drawPageSugestao(page, fonts, data) {
  coverRect(page, 52, 146, 210, 24);
  drawCenteredText(page, fonts.bold, `PERDA DE ${data.perdaPercent}%`, 157, 152, 11, COLORS.navy, true);

  coverRect(page, 318, 146, 120, 28);
  drawCenteredText(page, fonts.bold, `${formatNumber(data.potenciaKwp)} kWp`, 378, 152, 16, COLORS.navy, true);

  coverRect(page, 52, 214, 230, 24);
  drawCenteredText(
    page,
    fonts.bold,
    `${formatNumber(data.irradiacao)} - ${data.cidade.toUpperCase().slice(0, 12)}`,
    170,
    220,
    10,
    COLORS.navy,
    true
  );

  coverRect(page, 318, 206, 220, 34);
  drawCenteredText(
    page,
    fonts.bold,
    `${data.numPaineis} PLACAS ${data.potenciaPainelW}W`,
    430,
    222,
    11,
    COLORS.navy,
    true
  );
  drawCenteredText(
    page,
    fonts.regular,
    `${data.microinversores} microinversores`,
    430,
    208,
    9,
    COLORS.green
  );

  coverRect(page, 120, 286, 360, 24);
  drawCenteredText(
    page,
    fonts.bold,
    `${formatNumber(data.geracaoMensal)} kWh/mês`,
    300,
    292,
    14,
    COLORS.navy,
    true
  );

  coverRect(page, 48, 468, 170, 34);
  drawCenteredText(page, fonts.bold, formatCurrencyPlain(data.investimento), 132, 476, 16, COLORS.green, true);

  coverRect(page, 170, 548, 260, 30);
  drawCenteredText(page, fonts.bold, formatCurrencyPlain(data.economiaAnual), 300, 556, 18, COLORS.green, true);

  coverRect(page, 250, 532, 180, 14);
  drawCenteredText(
    page,
    fonts.regular,
    `(${formatCurrencyPlain(data.economiaMensal)} x 12 meses)`,
    340,
    534,
    8,
    COLORS.navy
  );

  const tableTop = 792;
  const rowHeight = 7.2;
  coverRect(page, 34, 600, 528, 205);

  data.roiRows.forEach((row, index) => {
    const y = tableTop - index * rowHeight;
    const roiColor = row.roi < 0 ? COLORS.red : COLORS.green;
    page.drawText(String(row.ano), { x: 46, y, size: 7, font: fonts.regular, color: COLORS.dark });
    drawRightText(page, fonts.regular, formatCurrencyPlain(row.economiaAnual), 250, y, 7, COLORS.dark);
    drawRightText(page, fonts.regular, formatCurrencyPlain(row.economiaAcumulada), 390, y, 7, COLORS.dark);
    drawRightText(page, fonts.bold, formatCurrencyPlain(row.roi), 548, y, 7, roiColor);
  });
}

async function drawPagePagamento(page, fonts, data) {
  const startY = 734;
  const rowHeight = 28.4;

  data.parcelas.forEach((item, index) => {
    const y = startY - index * rowHeight;
    coverRect(page, 56, y - 5, 60, 20);
    coverRect(page, 350, y - 5, 130, 20);
    page.drawText(`${item.parcelas}x`, { x: 72, y, size: 12, font: fonts.bold, color: COLORS.navy });
    drawRightText(page, fonts.bold, formatCurrencyPlain(item.valor), 470, y, 12, COLORS.navy);
  });

  coverRect(page, 120, 196, 180, 36);
  drawCenteredText(page, fonts.bold, formatCurrencyPlain(data.entrada), 210, 206, 22, COLORS.green, true);

  coverRect(page, 150, 108, 280, 28);
  drawCenteredText(
    page,
    fonts.bold,
    `${data.parcelasBoleto} x ${Math.round(data.valorParcelaBoleto)} REAIS`,
    290,
    116,
    16,
    COLORS.navy,
    true
  );
}

async function buildPropostaPdf(cliente, overrides = {}, vendedor = {}) {
  const data = calcPropostaFromCliente(cliente, {
    ...overrides,
    vendedorNome: overrides.vendedorNome || vendedor.nome,
    vendedorCrea: overrides.vendedorCrea || vendedor.crea
  });

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  let regularFontBytes;
  if (fs.existsSync(FONT_PATH)) {
    regularFontBytes = fs.readFileSync(FONT_PATH);
  } else {
    throw new Error('Fonte Arial.ttf não encontrada em assets/fonts.');
  }

  const regular = await pdfDoc.embedFont(regularFontBytes);
  const bold = regular;
  const fonts = { regular, bold };

  for (let pageNumber = 1; pageNumber <= 10; pageNumber += 1) {
    const imageBytes = readPageImage(pageNumber);
    const image = await embedPageImage(pdfDoc, imageBytes);
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT });

    if (pageNumber === 1) await drawPageCover(page, fonts, data);
    if (pageNumber === 6) await drawPageSugestao(page, fonts, data);
    if (pageNumber === 7) await drawPagePagamento(page, fonts, data);
  }

  pdfDoc.setTitle(`Proposta Comercial - ${data.clienteNome}`);
  pdfDoc.setAuthor(data.vendedorNome);
  pdfDoc.setSubject('Proposta Comercial - Sistema Fotovoltaico');

  const bytes = await pdfDoc.save();
  const safeName = data.clientePrimeiroNome.replace(/[^\w\-]+/g, '_');

  return {
    bytes,
    filename: `Proposta_${safeName}.pdf`,
    dados: data
  };
}

module.exports = {
  buildPropostaPdf
};
