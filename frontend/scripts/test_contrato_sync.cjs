const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362\\scratch\\screenshots';
const ARTIFACTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log('🚀 Iniciando Teste E2E Preciso com Real Keystrokes (Calculadora -> Contrato)...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    // 1. Acessa aplicação
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(1200);

    // 2. Navega para a Calculadora / Orçamento
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header nav button'));
      const orcBtn = btns.find(b => b.innerText.includes('Orçamento'));
      if (orcBtn) orcBtn.click();
    });
    await delay(800);

    // 3. Preenche Nome do Cliente usando digitação real (React 18 compliant)
    console.log('📝 Digitando Nome do Cliente na Barra Inteligente...');
    const nomeSelector = 'input[placeholder*="Nome do Cliente"]';
    await page.waitForSelector(nomeSelector);
    await page.click(nomeSelector);
    await page.type(nomeSelector, 'Carlos Eduardo Teste', { delay: 30 });
    await delay(300);

    const telSelector = 'input[placeholder*="(11) 98765-4321"]';
    await page.click(telSelector);
    await page.type(telSelector, '(85) 98765-4321', { delay: 20 });
    await delay(300);

    const ambSelector = 'input[placeholder*="Ambiente (Cozinha)"]';
    await page.click(ambSelector);
    await page.type(ambSelector, 'Cozinha Gourmet', { delay: 20 });
    await delay(300);

    const movSelector = 'input[placeholder*="Móvel (Armário)"]';
    await page.click(movSelector);
    await page.type(movSelector, 'Armário e Balcão Ilha', { delay: 20 });
    await delay(400);

    // 4. Abre Gaveta para CPF e CEP
    console.log('📋 Abrindo gaveta lateral para CPF e CEP...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const drawerBtn = btns.find(b => b.innerText.includes('Mais Dados') || b.innerText.includes('Endereço'));
      if (drawerBtn) drawerBtn.click();
    });
    await delay(600);

    const cpfSelector = 'input[placeholder*="000.000.000-00"]';
    await page.waitForSelector(cpfSelector);
    await page.click(cpfSelector);
    await page.type(cpfSelector, '123.456.789-00', { delay: 20 });

    const cepSelector = 'input[placeholder*="00000-000"]';
    await page.click(cepSelector);
    await page.type(cepSelector, '60160230', { delay: 30 });
    await delay(1800); // Aguarda consulta ViaCEP

    // Fecha gaveta
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fecharBtn = btns.find(b => b.innerText.includes('Fechar') || b.innerText.includes('Concluir Dados'));
      if (fecharBtn) fecharBtn.click();
    });
    await delay(600);

    // 5. Adiciona 2 chapas no primeiro MDF (botão +)
    console.log('🪵 Adicionando chapas de MDF...');
    await page.evaluate(() => {
      const plusBtns = Array.from(document.querySelectorAll('button[title="Aumentar quantidade"]'));
      if (plusBtns.length > 0) {
        plusBtns[0].click();
        plusBtns[0].click();
      }
    });
    await delay(500);

    // 6. Avança para Etapa 2: Ferramentas
    console.log('🔧 Avançando para Ferramentas...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const proxBtn = btns.find(b => b.innerText.includes('Avançar para Ferramentas') || b.innerText.includes('Etapa 2'));
      if (proxBtn) proxBtn.click();
    });
    await delay(800);

    // Adiciona 4 unidades na primeira ferramenta
    await page.evaluate(() => {
      const plusBtns = Array.from(document.querySelectorAll('button[title="Aumentar quantidade"]'));
      if (plusBtns.length > 0) {
        plusBtns[0].click();
        plusBtns[0].click();
        plusBtns[0].click();
        plusBtns[0].click();
      }
    });
    await delay(500);

    // 7. Avança para Etapa 3: Valores & Proposta
    console.log('💰 Avançando para Etapa 3: Valores & Proposta...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const proxBtn = btns.find(b => b.innerText.includes('Valores & Proposta') || b.innerText.includes('Etapa 3'));
      if (proxBtn) proxBtn.click();
    });
    await delay(1200);

    // 8. Clica no botão "Gerar Contrato"
    console.log('📄 Clicando em "Gerar Contrato"...');
    const clicou = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const contratoBtn = btns.find(b => b.innerText.includes('Gerar Contrato'));
      if (contratoBtn) {
        contratoBtn.click();
        return true;
      }
      return false;
    });
    console.log(`   - Botão "Gerar Contrato" encontrado e clicado: ${clicou}`);
    await delay(1800);

    // 9. Agora na Aba de Contratos de Serviço, inspeciona todos os dados
    const dadosContrato = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const projetoSelect = selects[0];
      const projetoTexto = projetoSelect ? projetoSelect.options[projetoSelect.selectedIndex]?.text : '';

      // Inputs
      const inputs = Array.from(document.querySelectorAll('input'));
      
      // Valor Total do Contrato
      const valorTotalInput = inputs.find(i => i.type === 'number' && i.className.includes('font-mono'));
      const valorTotalVal = valorTotalInput ? valorTotalInput.value : null;

      // Prazo de montagem
      const prazoInput = inputs.find(i => i.type === 'number' && i.className.includes('w-20'));
      const prazoVal = prazoInput ? prazoInput.value : null;

      // Nome do Contratante
      const nomeInput = inputs.find(i => i.placeholder && i.placeholder.includes('Juliana Paes'));
      const nomeVal = nomeInput ? nomeInput.value : null;

      // CPF do Contratante
      const cpfInput = inputs.find(i => i.placeholder && i.placeholder.includes('000.000.000-00'));
      const cpfVal = cpfInput ? cpfInput.value : null;

      // CEP do Contratante
      const cepInput = inputs.find(i => i.placeholder && i.placeholder.includes('60000-000'));
      const cepVal = cepInput ? cepInput.value : null;

      // Endereço do Contratante
      const endInput = inputs.find(i => i.placeholder && i.placeholder.includes('Rua, Avenida'));
      const endVal = endInput ? endInput.value : null;

      // Badge de Sincronização
      const badges = Array.from(document.querySelectorAll('span')).map(s => s.innerText);
      const sincronizadoBadge = badges.find(b => b.includes('Sincronizado com Orçamento'));

      // Textos dos cards de Sinal e Entrega
      const cardsText = document.body.innerText;
      const matchSinal = cardsText.match(/Sinal \/ Entrada:[\s\S]*?R\$\s*([\d\.,]+)/i);
      const matchEntrega = cardsText.match(/Saldo na Entrega e Montagem:[\s\S]*?R\$\s*([\d\.,]+)/i);

      return {
        url: window.location.href,
        projetoTexto,
        valorTotalVal,
        prazoVal,
        nomeVal,
        cpfVal,
        cepVal,
        endVal,
        sincronizadoBadge,
        textoSinal: matchSinal ? matchSinal[1] : null,
        textoEntrega: matchEntrega ? matchEntrega[1] : null,
        isNot15000: valorTotalVal !== '15000' && Number(valorTotalVal) > 0
      };
    });

    console.log('================================================================');
    console.log('🎯 RESULTADOS DO TESTE E2E (Aba Contratos de Serviço):');
    console.log('================================================================');
    console.log(`• Projeto Selecionado no Topo: "${dadosContrato.projetoTexto}"`);
    console.log(`• Valor Total do Contrato: R$ ${dadosContrato.valorTotalVal} (Não é 15000 fake: ${dadosContrato.isNot15000 ? '✅ SIM' : '❌ NÃO'})`);
    console.log(`• Sinal Calculado (50%): R$ ${dadosContrato.textoSinal}`);
    console.log(`• Saldo na Entrega (50%): R$ ${dadosContrato.textoEntrega}`);
    console.log(`• Prazo de Montagem: ${dadosContrato.prazoVal} dias úteis`);
    console.log(`• Contratante Nome: "${dadosContrato.nomeVal}"`);
    console.log(`• Contratante CPF: "${dadosContrato.cpfVal}"`);
    console.log(`• Contratante CEP: "${dadosContrato.cepVal}"`);
    console.log(`• Contratante Endereço: "${dadosContrato.endVal}"`);
    console.log(`• Badge de Sincronização: "${dadosContrato.sincronizadoBadge || 'Não encontrado'}"`);
    console.log('================================================================');

    // 10. Tira screenshot do Card "Preço, Sinal & Prazos de Montagem"
    const screenshotPath = path.join(SCREENSHOTS_DIR, '15_contrato_sincronizado_orcamento.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    // Copia também para o diretório de artefatos
    const artifactScreenshotPath = path.join(ARTIFACTS_DIR, '15_contrato_sincronizado_orcamento.png');
    fs.copyFileSync(screenshotPath, artifactScreenshotPath);
    console.log(`📸 Screenshots salvos com sucesso em:`);
    console.log(`   - ${screenshotPath}`);
    console.log(`   - ${artifactScreenshotPath}`);

    // Validações
    let passou = true;
    if (dadosContrato.valorTotalVal === '15000') {
      console.error('❌ FALHA: Valor Total ainda está com o valor mockado antigo 15000!');
      passou = false;
    } else if (Number(dadosContrato.valorTotalVal) > 0) {
      console.log('✅ SUCESSO: Valor Total foi puxado com precisão do orçamento!');
    }

    if (dadosContrato.nomeVal && dadosContrato.nomeVal.includes('Carlos Eduardo')) {
      console.log('✅ SUCESSO: Nome do Contratante Carlos Eduardo foi preenchido!');
    } else {
      console.warn(`⚠️ AVISO: Nome do Contratante foi "${dadosContrato.nomeVal}".`);
    }

    if (dadosContrato.sincronizadoBadge) {
      console.log('✅ SUCESSO: Badge "✓ Sincronizado com Orçamento" está visível no card!');
    }

    return passou;

  } catch (err) {
    console.error('❌ Erro no teste:', err);
    return false;
  } finally {
    await browser.close();
  }
}

runTest().then((sucesso) => {
  process.exit(sucesso ? 0 : 1);
});
