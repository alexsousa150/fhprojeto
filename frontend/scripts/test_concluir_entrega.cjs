const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:5173';
const SCREENSHOTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362\\scratch\\screenshots';
const ARTIFACTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log('🚀 Iniciando Teste E2E: Botão CONCLUIR na Entrega & Liquidação Total dos Recebimentos...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    // 1. Acessa Kanban
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(1200);

    // Garante que estamos na aba Kanban
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header nav button'));
      const kanbanBtn = btns.find(b => b.innerText.includes('Projetos (Kanban)') || b.innerText.includes('Kanban'));
      if (kanbanBtn) kanbanBtn.click();
    });
    await delay(800);

    // 2. Cria ou prepara um projeto na coluna "5. Montagem / Entrega"
    console.log('📦 Inserindo/Movendo projeto de teste para "5. Montagem / Entrega"...');
    await page.evaluate(() => {
      const STORAGE_KEY = 'marcenaria_projetos_v3';
      const salvo = localStorage.getItem(STORAGE_KEY);
      let projetos = salvo ? JSON.parse(salvo) : [];

      const idx = projetos.findIndex(p => p.cliente.includes('Carlos Eduardo'));
      if (idx >= 0) {
        projetos[idx].status = 'MONTAGEM';
        projetos[idx].valorTotal = 1916;
        projetos[idx].percentualSinal = 50;
        projetos[idx].valorSinal = 958;
        projetos[idx].valorEntrega = 958;
        projetos[idx].sinalPago = true;
        projetos[idx].saldoPago = false;
        projetos[idx].quitado = false;
      } else {
        projetos.unshift({
          id: 'prj-teste-montagem',
          codigo: 'PRJ-2026-999',
          cliente: 'Carlos Eduardo Teste Entrega',
          ambiente: 'Cozinha Gourmet',
          status: 'MONTAGEM',
          valorTotal: 3500,
          percentualSinal: 50,
          valorSinal: 1750,
          valorEntrega: 1750,
          sinalPago: true,
          saldoPago: false,
          quitado: false,
          prazoDias: 15,
          horasEstimadas: 16,
          produtos: [{
            id: 'p1',
            nome: 'Armário Aéreo e Balcão',
            descricao: 'MDF Branco TX',
            quantidade: 1,
            dimensoes: 'Sob medida',
            material: 'MDF 18mm',
            ferragensResumo: '4x Dobradiças Slow',
            pecasQtd: 8
          }],
          dataCriacao: new Date().toISOString()
        });
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projetos));
      window.dispatchEvent(new CustomEvent('marcenaria:sync'));
    });
    await delay(1000);

    // Recarrega para ler o estado
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1200);

    // 3. Verifica o botão na coluna "5. Montagem / Entrega"
    console.log('🔍 Verificando botão CONCLUIR no card da coluna "Montagem / Entrega"...');
    const botaoCardColuna = await page.evaluate(() => {
      // Procura cards na coluna de Montagem
      const colunas = Array.from(document.querySelectorAll('.flex.flex-col'));
      const colunaMontagem = colunas.find(c => c.innerText.includes('5. Montagem') || c.innerText.includes('Entrega'));
      if (!colunaMontagem) return null;

      const btns = Array.from(colunaMontagem.querySelectorAll('button'));
      const concluirBtn = btns.find(b => b.innerText.includes('CONCLUIR'));
      return {
        temBotaoConcluir: Boolean(concluirBtn),
        textoBotao: concluirBtn ? concluirBtn.innerText : null,
        titleBotao: concluirBtn ? concluirBtn.title : null
      };
    });
    console.log('   - Botão no card da coluna:', botaoCardColuna);

    // 4. Clica no card para abrir o Modal de Detalhes
    console.log('📂 Abrindo modal de detalhes do projeto...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
      const cardCarlos = cards.find(c => c.innerText.includes('Carlos Eduardo'));
      if (cardCarlos) {
        // Clica no título ou área do card para não clicar em botões internos
        const h4 = cardCarlos.querySelector('h4') || cardCarlos;
        h4.click();
      }
    });
    await delay(1000);

    // 5. Inspeciona o botão do rodapé no modal
    const botaoModal = await page.evaluate(() => {
      const modal = document.querySelector('.max-w-2xl') || document.querySelector('.fixed.inset-0.z-50');
      if (!modal) return null;

      const btns = Array.from(modal.querySelectorAll('button'));
      const concluirBtn = btns.find(b => b.innerText.includes('CONCLUIR'));
      const avancarEtapaBtn = btns.find(b => b.innerText.includes('Avançar Etapa'));

      return {
        temBotaoConcluir: Boolean(concluirBtn),
        textoConcluir: concluirBtn ? concluirBtn.innerText.trim() : null,
        temAvancarEtapa: Boolean(avancarEtapaBtn)
      };
    });
    console.log('   - Botão no modal de detalhes:', botaoModal);

    // Screenshot do Modal antes de concluir mostrando o botão [✓ CONCLUIR]
    const shotModalConcluir = path.join(SCREENSHOTS_DIR, '16_modal_botao_concluir_entrega.png');
    await page.screenshot({ path: shotModalConcluir, fullPage: false });
    fs.copyFileSync(shotModalConcluir, path.join(ARTIFACTS_DIR, '16_modal_botao_concluir_entrega.png'));
    console.log(`📸 Screenshot salvo em: ${shotModalConcluir}`);

    // 6. Clica no botão CONCLUIR no modal
    console.log('🎯 Clicando em "CONCLUIR" no modal...');
    await page.evaluate(() => {
      const modal = document.querySelector('.max-w-2xl') || document.querySelector('.fixed.inset-0.z-50');
      if (!modal) return;
      const btns = Array.from(modal.querySelectorAll('button'));
      const concluirBtn = btns.find(b => b.innerText.includes('CONCLUIR'));
      if (concluirBtn) concluirBtn.click();
    });
    await delay(1500);

    // 7. Agora inspeciona os resultados pós-conclusão no sistema
    const resultadoPosConclusao = await page.evaluate(() => {
      const STORAGE_KEY = 'marcenaria_projetos_v3';
      const salvo = localStorage.getItem(STORAGE_KEY);
      const projetos = salvo ? JSON.parse(salvo) : [];
      const proj = projetos.find(p => p.cliente.includes('Carlos Eduardo'));

      // Textos das métricas no topo do Kanban
      const metricas = Array.from(document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-4 > div')).map(d => d.innerText);

      return {
        status: proj?.status,
        sinalPago: proj?.sinalPago,
        saldoPago: proj?.saldoPago,
        quitado: proj?.quitado,
        valorRecebido: proj?.valorRecebido,
        valorTotal: proj?.valorTotal,
        dataConclusao: proj?.dataConclusao,
        metricasText: metricas
      };
    });

    console.log('================================================================');
    console.log('🎯 RESULTADOS APÓS CLICAR EM CONCLUIR:');
    console.log('================================================================');
    console.log(`• Status do Projeto: "${resultadoPosConclusao.status}" (Esperado: CONCLUIDO)`);
    console.log(`• Sinal Pago: ${resultadoPosConclusao.sinalPago ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`• Saldo de Entrega Pago: ${resultadoPosConclusao.saldoPago ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`• Quitado sem Pendências: ${resultadoPosConclusao.quitado ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`• Valor Recebido em Caixa: R$ ${resultadoPosConclusao.valorRecebido} (100% de R$ ${resultadoPosConclusao.valorTotal})`);
    console.log(`• Data de Conclusão: ${resultadoPosConclusao.dataConclusao}`);
    console.log('• Métricas Financeiras no Topo:', resultadoPosConclusao.metricasText);
    console.log('================================================================');

    // Screenshot final do Kanban com a O.S. Concluída e Métricas Quitadas
    const shotFinal = path.join(SCREENSHOTS_DIR, '17_kanban_os_concluida_e_liquidada.png');
    await page.screenshot({ path: shotFinal, fullPage: false });
    fs.copyFileSync(shotFinal, path.join(ARTIFACTS_DIR, '17_kanban_os_concluida_e_liquidada.png'));
    console.log(`📸 Screenshot salvo em: ${shotFinal}`);

    // Validações
    let passou = true;
    if (resultadoPosConclusao.status !== 'CONCLUIDO') {
      console.error('❌ FALHA: Projeto não avançou para CONCLUIDO');
      passou = false;
    }
    if (!resultadoPosConclusao.quitado || !resultadoPosConclusao.saldoPago) {
      console.error('❌ FALHA: Recebimentos não foram marcados como quitados/saldo pago!');
      passou = false;
    }
    if (botaoModal && botaoModal.temAvancarEtapa) {
      console.error('❌ FALHA: Modal ainda exibia "Avançar Etapa" em vez de "CONCLUIR"');
      passou = false;
    }

    if (passou) {
      console.log('🎉 TODOS OS REQUISITOS FORAM ATENDIDOS COM 100% DE SUCESSO!');
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
