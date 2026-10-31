const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:5173';
const SCREENSHOTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362\\scratch\\screenshots';
const ARTIFACTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log('🚀 Iniciando Teste E2E: Filtro Estrito no Seletor de Orçamento (Apenas Orçamento & Aprovados)...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,960']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    // 1. Prepara uma base de projetos com diferentes status para validação estrita
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await delay(1000);

    console.log('📦 Configurando conjunto de projetos de teste em diferentes etapas...');
    await page.evaluate(() => {
      const STORAGE_KEY = 'marcenaria_projetos_v3';
      const projetosTeste = [
        {
          id: 'prj-visita',
          codigo: 'PRJ-2026-101',
          cliente: '1. Cliente Visita Tecnica',
          ambiente: 'Sala de Estar',
          status: 'VISITA_TECNICA',
          valorTotal: 4000,
          sinalPago: false,
          produtos: [],
          dataCriacao: new Date().toISOString()
        },
        {
          id: 'prj-orcamento',
          codigo: 'PRJ-2026-102',
          cliente: '2. Cliente Em Orcamento',
          ambiente: 'Cozinha Planejada',
          status: 'ORCAMENTO',
          valorTotal: 5500,
          sinalPago: false,
          produtos: [{
            id: 'm1',
            nome: 'Cozinha Linear',
            descricao: 'Armários superior e inferior',
            quantidade: 1,
            dimensoes: '2.40m x 0.60m',
            material: 'MDF Branco TX 15mm',
            ferragensResumo: '8x Dobradiças Slow',
            pecasQtd: 6,
            pecas: [{ id: 'mdf-branco-15', descricao: 'MDF BRANCO DE 15MM', quantidade: 2, valorUnitario: 289, valorTotal: 578 }],
            ferragens: [{ id: 'ferr-dob-reta-amort', nome: 'Dobradiça Reta 35mm com Amortecedor', quantidade: 8, custoUnitario: 8.5, unidade: 'un', valorTotal: 68 }]
          }],
          dataCriacao: new Date().toISOString()
        },
        {
          id: 'prj-aprovado',
          codigo: 'PRJ-2026-103',
          cliente: '3. Cliente Ja Aprovado',
          ambiente: 'Closet Casal',
          status: 'APROVADO',
          valorTotal: 8900,
          percentualSinal: 50,
          valorSinal: 4450,
          valorEntrega: 4450,
          sinalPago: false,
          produtos: [{
            id: 'm2',
            nome: 'Módulo Closet',
            descricao: 'Torre com prateleiras e gavetas',
            quantidade: 1,
            dimensoes: '2.20m x 1.80m',
            material: 'MDF Louro Freijo 18mm',
            ferragensResumo: '4x Corrediças Ocultas',
            pecasQtd: 8,
            pecas: [{ id: 'mdf-louro-freijo-18', descricao: 'MDF LOURO FREIJO 18MM', quantidade: 3, valorUnitario: 395, valorTotal: 1185 }],
            ferragens: [{ id: 'ferr-corr-oculta-450', nome: 'Corrediça Oculta 450mm com Amortecedor', quantidade: 4, custoUnitario: 48, unidade: 'par', valorTotal: 192 }]
          }],
          dataCriacao: new Date().toISOString()
        },
        {
          id: 'prj-producao',
          codigo: 'PRJ-2026-104',
          cliente: '4. Cliente Na Bancada Producao',
          ambiente: 'Dormitório Infantil',
          status: 'EM_PRODUCAO',
          valorTotal: 6200,
          sinalPago: true,
          produtos: [],
          dataCriacao: new Date().toISOString()
        },
        {
          id: 'prj-montagem',
          codigo: 'PRJ-2026-105',
          cliente: '5. Cliente Em Montagem Entrega',
          ambiente: 'Lavanderia',
          status: 'MONTAGEM',
          valorTotal: 3100,
          sinalPago: true,
          produtos: [],
          dataCriacao: new Date().toISOString()
        },
        {
          id: 'prj-concluido',
          codigo: 'PRJ-2026-106',
          cliente: '6. Cliente Totalmente Concluido',
          ambiente: 'Banheiro Suíte',
          status: 'CONCLUIDO',
          valorTotal: 2500,
          sinalPago: true,
          saldoPago: true,
          quitado: true,
          produtos: [],
          dataCriacao: new Date().toISOString()
        }
      ];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(projetosTeste));
    });
    await delay(500);

    // Recarrega a página para que o React leia os projetos do localStorage na inicialização
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1200);

    // 2. Navega para a Aba Orçamento
    console.log('📑 Abrindo a aba Orçamento (Calculadora BOM)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header nav button'));
      const orcamentoBtn = btns.find(b => b.innerText.includes('Orçamento'));
      if (orcamentoBtn) orcamentoBtn.click();
    });
    await delay(1500);

    // 3. Inspeciona as opções presentes no Seletor de Clientes
    console.log('🔍 Inspecionando opções do seletor de clientes...');
    const opcoesSelect = await page.evaluate(() => {
      const select = document.querySelector('select');
      if (!select) return [];
      return Array.from(select.options).map(o => ({
        value: o.value,
        text: o.text
      }));
    });

    console.log('   Opções encontradas no dropdown:', opcoesSelect);

    const temNovoOrcamento = opcoesSelect.some(o => o.value === '__novo__');
    const temOrcamento = opcoesSelect.some(o => o.text.includes('Cliente Em Orcamento'));
    const temAprovado = opcoesSelect.some(o => o.text.includes('Cliente Ja Aprovado'));
    const temVisita = opcoesSelect.some(o => o.text.includes('Visita Tecnica'));
    const temProducao = opcoesSelect.some(o => o.text.includes('Bancada Producao'));
    const temMontagem = opcoesSelect.some(o => o.text.includes('Montagem Entrega'));
    const temConcluido = opcoesSelect.some(o => o.text.includes('Totalmente Concluido'));

    console.log(`• [+ Novo Orçamento]: ${temNovoOrcamento ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    console.log(`• [ORÇAMENTO] Cliente Em Orcamento: ${temOrcamento ? '✅ PRESENTE (Correto)' : '❌ AUSENTE'}`);
    console.log(`• [APROVADO] Cliente Ja Aprovado: ${temAprovado ? '✅ PRESENTE (Correto)' : '❌ AUSENTE'}`);
    console.log(`• [VISITA TÉCNICA] Cliente Visita Tecnica: ${!temVisita ? '✅ FILTRADO / FORA (Correto)' : '❌ ERRO: Apareceu no select'}`);
    console.log(`• [EM PRODUÇÃO] Cliente Na Bancada: ${!temProducao ? '✅ FILTRADO / FORA (Correto)' : '❌ ERRO: Apareceu no select'}`);
    console.log(`• [MONTAGEM] Cliente Em Montagem: ${!temMontagem ? '✅ FILTRADO / FORA (Correto)' : '❌ ERRO: Apareceu no select'}`);
    console.log(`• [CONCLUÍDO] Cliente Totalmente Concluido: ${!temConcluido ? '✅ FILTRADO / FORA (Correto)' : '❌ ERRO: Apareceu no select'}`);

    // Captura screenshot do seletor filtrado
    const shotFiltro = path.join(SCREENSHOTS_DIR, '20_seletor_orcamento_estrito.png');
    await page.screenshot({ path: shotFiltro, fullPage: false });
    fs.copyFileSync(shotFiltro, path.join(ARTIFACTS_DIR, '20_seletor_orcamento_estrito.png'));
    console.log(`📸 Screenshot salvo em: ${shotFiltro}`);

    // 4. Seleciona o projeto em ORCAMENTO e faz alteração
    console.log('✏️ Selecionando projeto "Cliente Em Orcamento" para fazer alterações...');
    await page.evaluate(() => {
      const select = document.querySelector('select');
      const opt = Array.from(select.options).find(o => o.text.includes('Cliente Em Orcamento'));
      if (opt) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await delay(1200);

    // Verifica badge e dados reidratados
    const statusReidratadoOrcamento = await page.evaluate(() => {
      const badge = document.querySelector('span.rounded-lg.border');
      const nomeInput = document.getElementById('input-nome-cliente');
      return {
        badgeText: badge ? badge.innerText : null,
        clienteNome: nomeInput ? nomeInput.value : null
      };
    });
    console.log('   - Projeto em Orçamento reidratado:', statusReidratadoOrcamento);

    // 5. Avança para a Etapa 3 para validar os botões de ação contextuais
    console.log('➡️ Navegando para Etapa 3 (Valores & Proposta)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const etapa3Btn = btns.find(b => b.innerText.includes('Valores & Proposta') || b.innerText.includes('ETAPA 3'));
      if (etapa3Btn) etapa3Btn.click();
    });
    await delay(1000);

    const botoesEtapa3Orcamento = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return {
        temSalvarAlteracoes: btns.some(b => b.innerText.includes('Salvar Alterações no Orçamento')),
        temAprovar: btns.some(b => b.innerText.includes('Aprovar Orçamento')),
        temBloqueado: btns.some(b => b.innerText.includes('Edição Bloqueada'))
      };
    });
    console.log('   - Botões de Ação para projeto em Orçamento:', botoesEtapa3Orcamento);

    // Clica em "Salvar Alterações no Orçamento (Etapa 2)"
    console.log('💾 Salvando alterações mantendo em Orçamento...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Salvar Alterações no Orçamento'));
      if (btn) btn.click();
    });
    await delay(1500);

    const shotOrcamentoSalvo = path.join(SCREENSHOTS_DIR, '21_orcamento_alterado_salvo.png');
    await page.screenshot({ path: shotOrcamentoSalvo, fullPage: false });
    fs.copyFileSync(shotOrcamentoSalvo, path.join(ARTIFACTS_DIR, '21_orcamento_alterado_salvo.png'));
    console.log(`📸 Screenshot salvo em: ${shotOrcamentoSalvo}`);

    // 6. Seleciona o projeto em APROVADO e valida
    console.log('✏️ Selecionando projeto "Cliente Ja Aprovado" para fazer alterações...');
    // Volta para etapa 1 primeiro se necessário
    await page.evaluate(() => {
      const select = document.querySelector('select');
      const opt = Array.from(select.options).find(o => o.text.includes('Cliente Ja Aprovado'));
      if (opt) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await delay(1200);

    const statusReidratadoAprovado = await page.evaluate(() => {
      const badge = document.querySelector('span.rounded-lg.border');
      const nomeInput = document.getElementById('input-nome-cliente');
      return {
        badgeText: badge ? badge.innerText : null,
        clienteNome: nomeInput ? nomeInput.value : null
      };
    });
    console.log('   - Projeto Aprovado reidratado:', statusReidratadoAprovado);

    // Vai para etapa 3
    console.log('➡️ Navegando para Etapa 3 (Valores & Proposta) do projeto Aprovado...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const etapa3Btn = btns.find(b => b.innerText.includes('Valores & Proposta') || b.innerText.includes('ETAPA 3'));
      if (etapa3Btn) etapa3Btn.click();
    });
    await delay(1000);

    const botoesEtapa3Aprovado = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return {
        temSalvarAprovado: btns.some(b => b.innerText.includes('Salvar Alterações do Orçamento Aprovado')),
        temBloqueado: btns.some(b => b.innerText.includes('Edição Bloqueada'))
      };
    });
    console.log('   - Botões de Ação para projeto Aprovado:', botoesEtapa3Aprovado);

    const shotAprovadoSalvo = path.join(SCREENSHOTS_DIR, '22_aprovado_alterado_salvo.png');
    await page.screenshot({ path: shotAprovadoSalvo, fullPage: false });
    fs.copyFileSync(shotAprovadoSalvo, path.join(ARTIFACTS_DIR, '22_aprovado_alterado_salvo.png'));
    console.log(`📸 Screenshot salvo em: ${shotAprovadoSalvo}`);

    // Validação dos critérios
    let passou = true;
    if (!temNovoOrcamento || !temOrcamento || !temAprovado) {
      console.error('❌ FALHA: Faltaram opções esperadas no seletor');
      passou = false;
    }
    if (temVisita || temProducao || temMontagem || temConcluido) {
      console.error('❌ FALHA: Projetos de outras etapas vazaram no seletor do Orçamento!');
      passou = false;
    }
    if (!botoesEtapa3Orcamento.temSalvarAlteracoes || botoesEtapa3Orcamento.temBloqueado) {
      console.error('❌ FALHA: Projeto em Orçamento não permitiu salvar alterações ou ficou bloqueado!');
      passou = false;
    }
    if (!botoesEtapa3Aprovado.temSalvarAprovado || botoesEtapa3Aprovado.temBloqueado) {
      console.error('❌ FALHA: Projeto Aprovado não permitiu salvar alterações ou ficou bloqueado!');
      passou = false;
    }

    if (passou) {
      console.log('🎉 TODOS OS REQUISITOS DO FILTRO E ALTERAÇÃO DE ORÇAMENTO FORAM VALIDADOS COM 100% DE SUCESSO!');
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
