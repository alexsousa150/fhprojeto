const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362\\scratch\\screenshots';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await delay(1000);

  // Ir para calculadora
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('header nav button'));
    const orcBtn = btns.find(b => b.innerText.includes('Orçamento'));
    if (orcBtn) orcBtn.click();
  });
  await delay(800);

  // Screenshot 1: Barra inteligente de 1 linha
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_barra_inteligente_1_linha.png') });
  console.log('✅ Screenshot da Barra Inteligente salvo.');

  // Clica no botão "Mais Dados / Endereço"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const drawerBtn = btns.find(b => b.innerText.includes('Mais Dados') || b.innerText.includes('Endereço'));
    if (drawerBtn) drawerBtn.click();
  });
  await delay(600);

  // Digita um CEP de teste (ex: 60160230 de Fortaleza/CE ou 01310100 de SP)
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const cepInput = inputs.find(i => i.placeholder && i.placeholder.includes('00000-000'));
    if (cepInput) {
      cepInput.value = '60160230';
      cepInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await delay(1200);

  // Screenshot 2: Gaveta lateral aberta com ViaCEP
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_gaveta_lateral_aberta_viacep.png') });
  console.log('✅ Screenshot da Gaveta Lateral aberta com ViaCEP salvo.');

  await browser.close();
}

capture();
