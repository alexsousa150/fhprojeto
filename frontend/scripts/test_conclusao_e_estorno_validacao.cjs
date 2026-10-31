const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:5173';
const SCREENSHOTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362\\scratch\\screenshots';
const ARTIFACTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log('🚀 Iniciando Teste E2E: Validação de Conclusão (Prevenção de Erros) & Estorno de Saldo na Reabertura...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    // 1. Prepara projeto de teste em "5. Montagem / Entrega"
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(1000);

    console.log('📦 Configurando projeto de teste em "5. Montagem / Entrega"...');
    await page.evaluate(() => {
      const STORAGE_KEY = 'marcenaria_projetos_v3';
      const projetosTeste = [
        {
          id: 'prj-montagem-teste',
          codigo: 'PRJ-2026-223',
          cliente: 'Carlos Eduardo - Cozinha Planejada QA',
          ambiente: 'Cozinha com Ilha Gourmet',
          status: 'MONTAGEM',
          valorTotal: 5000,
          percentualSinal: 50,
          valorSinal: 2500,
          valorEntrega: 2500,
          sinalPago: true,
          saldoPago: false,
          quitado: false,
          prazoDias: 15,
          produtos: [{
            id: 'p1',
            nome: 'Ilha Gourmet MDF Grafite',
            descricao: 'Bancada com portas e gavetões',
            quantidade: 1,
            dimensoes: 'Sob Medida',
            material: 'MDF 18mm Grafite',
            ferragensResumo: 'Corrediças Ocultas Slow',
            pecasQtd: 6
          }],
          dataCriacao: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projetosTeste));
    });
    await delay(500);

    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1200);

    // Garante que estamos na aba Kanban
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header nav button'));
      const kanbanBtn = btns.find(b => b.innerText.includes('Projetos') || b.innerText.includes('Fila de Produção') || b.innerText.includes('Kanban'));
      if (kanbanBtn) kanbanBtn.click();
    });
    await delay(1000);

    // 2. Teste de Prevenção de Erros: Clica no botão CONCLUIR no card da coluna Montagem
    console.log('🛡️ Clicando em CONCLUIR para testar modal de confirmação / prevenção de erros...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
      const cardProj = cards.find(c => c.innerText.includes('Carlos Eduardo'));
      if (cardProj) {
        const concluirBtn = Array.from(cardProj.querySelectorAll('button')).find(b => b.innerText.includes('CONCLUIR'));
        if (concluirBtn) concluirBtn.click();
      }
    });
    await delay(1000);

    // Inspeciona se o modal de confirmação abriu e o projeto AINDA NÃO foi concluído
    const validacaoModalConclusao = await page.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(e => e.innerText.includes('Confirmar Conclusão'));
      const STORAGE_KEY = 'marcenaria_projetos_v3';
      const projetos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const proj = projetos.find(p => p.codigo === 'PRJ-2026-223');

      return {
        modalAberto: Boolean(h3),
        statusAtualAntesConfirmar: proj ? proj.status : null,
        saldoPagoAntesConfirmar: proj ? proj.saldoPago : null
      };
    });

    console.log('   - Modal de Confirmação aberto?', validacaoModalConclusao.modalAberto ? '✅ SIM' : '❌ NÃO');
    console.log('   - Status do projeto permaneceu MONTAGEM (sem concluir direto)?', validacaoModalConclusao.statusAtualAntesConfirmar === 'MONTAGEM' ? '✅ SIM' : '❌ NÃO');

    // Screenshot do Modal de Prevenção de Erro ao Concluir
    const shotModalConfirmar = path.join(SCREENSHOTS_DIR, '24_modal_confirmar_conclusao_prevencao.png');
    await page.screenshot({ path: shotModalConfirmar, fullPage: false });
    fs.copyFileSync(shotModalConfirmar, path.join(ARTIFACTS_DIR, '24_modal_confirmar_conclusao_prevencao.png'));
    console.log(`📸 Screenshot salvo em: ${shotModalConfirmar}`);

    // 3. Clica em "Sim, Concluir & Liquidar O.S."
    console.log('✅ Confirmando conclusão no modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnConfirmar = btns.find(b => b.innerText.includes('Sim, Concluir'));
      if (btnConfirmar) btnConfirmar.click();
    });
    await delay(1200);

    // Valida status após confirmação
    const resultadoAposConfirmar = await page.evaluate(() => {
      const STORAGE_KEY = 'marcenaria_projetos_v3';
      const projetos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const proj = projetos.find(p => p.codigo === 'PRJ-2026-223');
      return {
        status: proj?.status,
        quitado: proj?.quitado,
        saldoPago: proj?.saldoPago,
        valorRecebido: proj?.valorRecebido,
        dataConclusao: proj?.dataConclusao
      };
    });
    console.log('   - Pós Conclusão Confirmada:', resultadoAposConfirmar);

    // 4. Teste de Reabertura e Estorno de Saldo: Abre o modal do projeto ou clica no botão de voltar
    console.log('📂 Abrindo modal de detalhes do projeto concluído para testar retorno...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
      const cardProj = cards.find(c => c.innerText.includes('Carlos Eduardo'));
      if (cardProj) {
        const h4 = cardProj.querySelector('h4') || cardProj;
        h4.click();
      }
    });
    await delay(1000);

    // Clica no botão "Reabrir O.S. (Voltar para Entrega)"
    console.log('🔄 Clicando em "Reabrir O.S. (Voltar para Entrega)" no modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reabrirBtn = btns.find(b => b.innerText.includes('Reabrir O.S.'));
      if (reabrirBtn) reabrirBtn.click();
    });
    await delay(1000);

    // Inspeciona se o modal de estorno abriu
    const validacaoModalEstorno = await page.evaluate(() => {
      const h3 = Array.from(document.querySelectorAll('h3')).find(e => e.innerText.includes('Reabrir O.S. e Retornar para Montagem'));
      return {
        modalEstornoAberto: Boolean(h3)
      };
    });
    console.log('   - Modal de Confirmação de Estorno aberto?', validacaoModalEstorno.modalEstornoAberto ? '✅ SIM' : '❌ NÃO');

    // Screenshot do Modal de Estorno Financeiro
    const shotModalEstorno = path.join(SCREENSHOTS_DIR, '25_modal_confirmar_estorno_saldo.png');
    await page.screenshot({ path: shotModalEstorno, fullPage: false });
    fs.copyFileSync(shotModalEstorno, path.join(ARTIFACTS_DIR, '25_modal_confirmar_estorno_saldo.png'));
    console.log(`📸 Screenshot salvo em: ${shotModalEstorno}`);

    // 5. Clica em "Sim, Retornar para Entrega & Estornar"
    console.log('↩️ Confirmando retorno para Entrega com Estorno do saldo...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnEstornar = btns.find(b => b.innerText.includes('Sim, Retornar para Entrega'));
      if (btnEstornar) btnEstornar.click();
    });
    await delay(1500);

    // Fecha modal de detalhes caso ainda esteja visível
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const fecharBtn = btns.find(b => b.innerText.trim() === 'Fechar');
      if (fecharBtn) fecharBtn.click();
    });
    await delay(800);

    // 6. Validação dos Resultados Pós-Estorno
    const resultadoPosEstorno = await page.evaluate(() => {
      const STORAGE_KEY = 'marcenaria_projetos_v3';
      const projetos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const proj = projetos.find(p => p.codigo === 'PRJ-2026-223');

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
    console.log('🎯 RESULTADOS APÓS ESTORNO E RETORNO PARA MONTAGEM / ENTREGA:');
    console.log('================================================================');
    console.log(`• Status do Projeto: "${resultadoPosEstorno.status}" (Esperado: MONTAGEM)`);
    console.log(`• Sinal Inicial Pago: ${resultadoPosEstorno.sinalPago ? '✅ SIM (Preservado)' : '❌ NÃO'}`);
    console.log(`• Saldo de Entrega Quitado: ${!resultadoPosEstorno.saldoPago ? '✅ NÃO (Estornado com Sucesso)' : '❌ ERRO: continuou pago'}`);
    console.log(`• Projeto Quitado: ${!resultadoPosEstorno.quitado ? '✅ NÃO (Voltou a ter saldo pendente)' : '❌ ERRO: continuou quitado'}`);
    console.log(`• Valor Efetivamente em Caixa: R$ ${resultadoPosEstorno.valorRecebido} (Apenas o sinal de 50%)`);
    console.log(`• Data de Conclusão: ${resultadoPosEstorno.dataConclusao === undefined ? '✅ Limpa (undefined)' : '❌ Mantida'}`);
    console.log('• Métricas Financeiras no Topo:', resultadoPosEstorno.metricasText);
    console.log('================================================================');

    // Screenshot do Kanban com o projeto de volta na coluna Montagem e saldo pendente recalculado
    const shotFinal = path.join(SCREENSHOTS_DIR, '26_kanban_pos_estorno_saldo_reaberto.png');
    await page.screenshot({ path: shotFinal, fullPage: false });
    fs.copyFileSync(shotFinal, path.join(ARTIFACTS_DIR, '26_kanban_pos_estorno_saldo_reaberto.png'));
    console.log(`📸 Screenshot salvo em: ${shotFinal}`);

    // Validações
    let passou = true;
    if (!validacaoModalConclusao.modalAberto) {
      console.error('❌ FALHA: Modal de confirmação para prevenir clique acidental não abriu!');
      passou = false;
    }
    if (resultadoAposConfirmar.status !== 'CONCLUIDO' || !resultadoAposConfirmar.quitado) {
      console.error('❌ FALHA: Projeto não foi concluído e liquidado após confirmação!');
      passou = false;
    }
    if (!validacaoModalEstorno.modalEstornoAberto) {
      console.error('❌ FALHA: Modal de estorno ao retornar não abriu!');
      passou = false;
    }
    if (resultadoPosEstorno.status !== 'MONTAGEM') {
      console.error('❌ FALHA: Projeto não retornou para MONTAGEM!');
      passou = false;
    }
    if (resultadoPosEstorno.saldoPago || resultadoPosEstorno.quitado) {
      console.error('❌ FALHA: Saldo da entrega ou status quitado não foram estornados!');
      passou = false;
    }

    if (passou) {
      console.log('🎉 TODOS OS REQUISITOS DE PREVENÇÃO DE ERROS E ESTORNO FORAM ATENDIDOS COM 100% DE SUCESSO!');
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
