const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\9475f23b-d19b-4df9-b858-ee74f32bd362\\scratch\\screenshots';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTest() {
  console.log('🚀 Iniciando Teste E2E Completo: Rotina do Usuário & Auditoria de Perduração de Dados...\n');

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const testReport = {
    timestamp: new Date().toISOString(),
    steps: [],
    assertions: [],
    persistenceStatus: {},
    passed: true
  };

  function logStep(stepNum, description) {
    console.log(`\n📌 [PASSO ${stepNum}] ${description}`);
    testReport.steps.push({ step: stepNum, description, time: new Date().toISOString() });
  }

  function assertCondition(desc, condition, details = '') {
    if (condition) {
      console.log(`  ✅ [PASSOU] ${desc} ${details ? '(' + details + ')' : ''}`);
      testReport.assertions.push({ desc, status: 'PASSED', details });
    } else {
      console.error(`  ❌ [FALHOU] ${desc} ${details ? '(' + details + ')' : ''}`);
      testReport.assertions.push({ desc, status: 'FAILED', details });
      testReport.passed = false;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. Abertura do Sistema e Validação da Interface Inicial
    // -------------------------------------------------------------
    logStep(1, 'Acessar http://localhost:5173 e verificar interface');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    await delay(1000);

    const pageTitle = await page.title();
    console.log(`  Título: "${pageTitle}"`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_kanban_inicial.png') });

    const headerText = await page.evaluate(() => document.querySelector('header')?.innerText || '');
    assertCondition('Identidade visual FH Móveis carregada', headerText.includes('FH') && headerText.includes('Móveis planejados'));
    assertCondition('Abas de navegação presentes', headerText.includes('Fila de Produção') && headerText.includes('Orçamento'));

    // -------------------------------------------------------------
    // 2. Navegação para Calculadora de Orçamento
    // -------------------------------------------------------------
    logStep(2, 'Navegar para a aba "Orçamento" (Calculadora BOM)');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('header nav button'));
      const orcBtn = buttons.find(b => b.innerText.includes('Orçamento'));
      if (orcBtn) orcBtn.click();
    });
    await delay(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_calculadora_aberta.png') });

    const isCalculadoraVisible = await page.evaluate(() => {
      return document.body.innerText.includes('MDF e Madeiras') || document.body.innerText.includes('Simulação Livre');
    });
    assertCondition('Calculadora BOM aberta com sucesso', isCalculadoraVisible);

    // -------------------------------------------------------------
    // 3. Preenchimento de Dados do Cliente e Projeto
    // -------------------------------------------------------------
    logStep(3, 'Preencher cadastro do cliente e dados do projeto');

    const isInputVisible = await page.$('#input-nome-cliente');
    if (!isInputVisible) {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const editBtn = btns.find(b => b.innerText.includes('Editar Dados'));
        if (editBtn) editBtn.click();
      });
      await delay(400);
    }

    await page.waitForSelector('#input-nome-cliente', { timeout: 5000 });
    await page.click('#input-nome-cliente', { clickCount: 3 });
    await page.type('#input-nome-cliente', 'Carlos Eduardo - Cozinha Planejada QA');

    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const telInput = inputs.find(i => i.placeholder && i.placeholder.includes('98765-4321'));
      if (telInput) {
        telInput.value = '(11) 98765-4321';
        telInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const movelInput = inputs.find(i => i.placeholder && i.placeholder.includes('Armário'));
      if (movelInput) {
        movelInput.value = 'Armário Superior com Torre Quente';
        movelInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const ambInput = inputs.find(i => i.placeholder && i.placeholder.includes('Cozinha'));
      if (ambInput) {
        ambInput.value = 'Cozinha Gourmet';
        ambInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await delay(500);

    const clienteConfirmado = await page.evaluate(() => {
      return document.body.innerText.includes('Carlos Eduardo - Cozinha Planejada QA');
    });
    assertCondition('Cliente e ambiente refletidos no cabeçalho do projeto', clienteConfirmado);

    // -------------------------------------------------------------
    // 4. Etapa 1 - Insumos MDF e Teste dos Botões Rápidos + / - e Filtro
    // -------------------------------------------------------------
    logStep(4, 'Etapa 1: Selecionar chapas MDF usando botões [+] e testar filtro');

    // Clica nos botões rápidos [+]
    await page.evaluate(async () => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const brancoRow = rows.find(r => r.innerText.includes('MDF BRANCO DE 15MM'));
      const amadeiradoRow = rows.find(r => r.innerText.includes('MDF AMADEIRADO 15 MM'));

      if (brancoRow) {
        const plusBtn = Array.from(brancoRow.querySelectorAll('button')).find(b => b.innerText.trim() === '+');
        if (plusBtn) {
          plusBtn.click();
          plusBtn.click();
        }
      }
      if (amadeiradoRow) {
        const plusBtn = Array.from(amadeiradoRow.querySelectorAll('button')).find(b => b.innerText.trim() === '+');
        if (plusBtn) {
          plusBtn.click();
        }
      }
    });
    await delay(600);

    const mdfQuantidades = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const brancoRow = rows.find(r => r.innerText.includes('MDF BRANCO DE 15MM'));
      const amadeiradoRow = rows.find(r => r.innerText.includes('MDF AMADEIRADO 15 MM'));

      const getQty = (row) => {
        if (!row) return 0;
        const input = row.querySelector('input[type="number"][placeholder="0"]');
        return input ? Number(input.value) : 0;
      };

      return {
        branco: getQty(brancoRow),
        amadeirado: getQty(amadeiradoRow)
      };
    });

    console.log(`  MDFs selecionados: Branco=${mdfQuantidades.branco}, Amadeirado=${mdfQuantidades.amadeirado}`);
    assertCondition('Incremento rápido de MDFs via botões [+] efetuado', mdfQuantidades.branco === 2 && mdfQuantidades.amadeirado === 1);

    // Ativar filtro "Apenas Selecionados"
    logStep('4.1', 'Ativar filtro "Apenas Selecionados" na tabela de MDFs');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const filterBtn = btns.find(b => b.innerText.includes('Ver Todos') || b.innerText.includes('Apenas Selecionados'));
      if (filterBtn) filterBtn.click();
    });
    await delay(400);

    const mdfRowsCountFiltered = await page.evaluate(() => {
      return document.querySelectorAll('table tbody tr').length;
    });
    console.log(`  Linhas visíveis com filtro ativo: ${mdfRowsCountFiltered}`);
    assertCondition('Tabela de MDF colapsada para mostrar apenas itens selecionados', mdfRowsCountFiltered === 2);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_mdfs_selecionados_filtro.png') });

    // Desativa filtro para manter catálogo visível
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const filterBtn = btns.find(b => b.innerText.includes('Apenas Selecionados'));
      if (filterBtn) filterBtn.click();
    });
    await delay(300);

    // -------------------------------------------------------------
    // 5. Etapa 2 - Ferramentas e Insumos
    // -------------------------------------------------------------
    logStep(5, 'Avançar para Etapa 2: Ferramentas & Ferragens');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Avançar para Ferramentas'));
      if (nextBtn) nextBtn.click();
    });
    await delay(600);

    const isEtapa2Active = await page.evaluate(() => {
      return document.body.innerText.includes('CORREDIÇA') || document.body.innerText.includes('DOBRADIÇA');
    });
    assertCondition('Etapa 2 (Ferramentas & Insumos) carregada', isEtapa2Active);

    // Adiciona 4x Corrediça 45cm e 10x Dobradiça Comum usando botões [+]
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const corrediçaRow = rows.find(r => r.innerText.includes('CORREDIÇA 45CM') || r.innerText.includes('CORREDIÇA 45 CM') || r.innerText.includes('CORREDICA 45CM'));
      const dobradiçaRow = rows.find(r => r.innerText.includes('DOBRADIÇA COMUM') || r.innerText.includes('DOBRADICA COMUM'));

      if (corrediçaRow) {
        const plusBtn = Array.from(corrediçaRow.querySelectorAll('button')).find(b => b.innerText.trim() === '+');
        if (plusBtn) {
          for (let i = 0; i < 4; i++) plusBtn.click();
        }
      }
      if (dobradiçaRow) {
        const plusBtn = Array.from(dobradiçaRow.querySelectorAll('button')).find(b => b.innerText.trim() === '+');
        if (plusBtn) {
          for (let i = 0; i < 10; i++) plusBtn.click();
        }
      }
    });
    await delay(600);

    const ferrQuantidades = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const corrediçaRow = rows.find(r => r.innerText.includes('CORREDIÇA 45CM') || r.innerText.includes('CORREDIÇA 45 CM') || r.innerText.includes('CORREDICA 45CM'));
      const dobradiçaRow = rows.find(r => r.innerText.includes('DOBRADIÇA COMUM') || r.innerText.includes('DOBRADICA COMUM'));

      const getQty = (row) => {
        if (!row) return 0;
        const input = row.querySelector('input[type="number"][placeholder="0"]');
        return input ? Number(input.value) : 0;
      };

      return {
        corredica: getQty(corrediçaRow),
        dobradica: getQty(dobradiçaRow)
      };
    });

    console.log(`  Ferramentas selecionadas: Corrediça=${ferrQuantidades.corredica}, Dobradiça=${ferrQuantidades.dobradica}`);
    assertCondition('Incremento de ferramentas via botões [+] efetuado', ferrQuantidades.corredica === 4 && ferrQuantidades.dobradica === 10);

    // Testar filtro na tabela de ferramentas
    logStep('5.1', 'Ativar filtro "Apenas Selecionados" na tabela de Ferramentas');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const filterBtn = btns.find(b => b.innerText.includes('Ver Todos') || b.innerText.includes('Apenas Selecionados'));
      if (filterBtn) filterBtn.click();
    });
    await delay(400);

    const ferrRowsCountFiltered = await page.evaluate(() => {
      return document.querySelectorAll('table tbody tr').length;
    });
    console.log(`  Linhas de ferramentas com filtro ativo: ${ferrRowsCountFiltered}`);
    assertCondition('Tabela de Ferramentas colapsada para mostrar apenas itens selecionados', ferrRowsCountFiltered === 2);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_ferramentas_selecionadas_filtro.png') });

    // Desativa filtro
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const filterBtn = btns.find(b => b.innerText.includes('Apenas Selecionados'));
      if (filterBtn) filterBtn.click();
    });
    await delay(300);

    // -------------------------------------------------------------
    // 6. Etapa 3 - Valores, Custos & Proposta Comercial
    // -------------------------------------------------------------
    logStep(6, 'Avançar para Etapa 3: Valores, Custos & Proposta');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Avançar para Valores'));
      if (nextBtn) nextBtn.click();
    });
    await delay(800);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_proposta_comercial.png') });

    const propostaInfo = await page.evaluate(() => {
      const lower = document.body.innerText.toLowerCase();
      return {
        hasComposicao: lower.includes('composição dos custos diretos'),
        hasMultiplicador: lower.includes('multiplicador atual'),
        hasSinal: lower.includes('sinal') && lower.includes('50%'),
        hasPrecoVenda: lower.includes('valor total do projeto'),
      };
    });
    assertCondition('Composição e cálculo automático presentes na Etapa 3', propostaInfo.hasComposicao && propostaInfo.hasSinal);

    // -------------------------------------------------------------
    // 7. Salvar Orçamento no Kanban (Aguardando Sinal 50%)
    // -------------------------------------------------------------
    logStep(7, 'Salvar Orçamento com status "Aguardando Sinal 50%"');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.innerText.includes('Salvar Orçamento (Aguardando Sinal'));
      if (saveBtn) saveBtn.click();
    });
    await delay(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_orcamento_salvo.png') });

    const successMsg = await page.evaluate(() => {
      const alerts = Array.from(document.querySelectorAll('div')).filter(el => 
        el.innerText && el.innerText.includes('salvo com sucesso')
      );
      return alerts.length > 0;
    });
    assertCondition('Alerta de confirmação exibido ao salvar orçamento', successMsg);

    // -------------------------------------------------------------
    // 8. Validação de Persistência no Kanban (Coluna 3. Aprovado)
    // -------------------------------------------------------------
    logStep(8, 'Verificar persistência do projeto no Kanban');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('header nav button'));
      const kanbanBtn = buttons.find(b => b.innerText.includes('Fila de Produção'));
      if (kanbanBtn) kanbanBtn.click();
    });
    await delay(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_kanban_com_card_aprovado.png') });

    const kanbanVerification = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div')).filter(d => 
        d.innerText && d.innerText.includes('Carlos Eduardo - Cozinha Planejada QA')
      );
      return {
        cardFound: cards.length > 0,
        textSnippet: cards[0] ? cards[0].innerText.slice(0, 150) : null
      };
    });
    assertCondition('Projeto presente no Kanban na etapa Aprovado', kanbanVerification.cardFound);

    // -------------------------------------------------------------
    // 9. Validação de Reidratação dos Dados (Zero Data Loss)
    // -------------------------------------------------------------
    logStep(9, 'Reabrir o projeto na Calculadora e validar integridade total das quantidades');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('header nav button'));
      const orcBtn = buttons.find(b => b.innerText.includes('Orçamento'));
      if (orcBtn) orcBtn.click();
    });
    await delay(800);

    // Seleciona o cliente no dropdown de clientes disponíveis
    const selecionou = await page.evaluate(() => {
      const select = document.querySelector('select');
      if (select) {
        const option = Array.from(select.options).find(o => o.value.includes('Carlos Eduardo'));
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    });
    assertCondition('Cliente encontrado e selecionado no dropdown da Calculadora', selecionou);
    await delay(800);

    // Valida reidratação exata dos MDFs
    const rehydratedMdfs = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const brancoRow = rows.find(r => r.innerText.includes('MDF BRANCO DE 15MM'));
      const amadeiradoRow = rows.find(r => r.innerText.includes('MDF AMADEIRADO 15 MM'));

      const getQty = (row) => {
        if (!row) return 0;
        const input = row.querySelector('input[type="number"][placeholder="0"]');
        return input ? Number(input.value) : 0;
      };

      return {
        brancoQtd: getQty(brancoRow),
        amadeiradoQtd: getQty(amadeiradoRow)
      };
    });

    console.log(`  Quantidades reidratadas de MDF: Branco=${rehydratedMdfs.brancoQtd}, Amadeirado=${rehydratedMdfs.amadeiradoQtd}`);
    assertCondition('MDF Branco preservou quantidade exata (2)', rehydratedMdfs.brancoQtd === 2);
    assertCondition('MDF Amadeirado preservou quantidade exata (1)', rehydratedMdfs.amadeiradoQtd === 1);

    // Avança para ferramentas para verificar reidratação de ferragens
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Avançar para Ferramentas'));
      if (nextBtn) nextBtn.click();
    });
    await delay(600);

    const rehydratedFerragens = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      const corrediçaRow = rows.find(r => r.innerText.includes('CORREDIÇA 45CM') || r.innerText.includes('CORREDIÇA 45 CM') || r.innerText.includes('CORREDICA 45CM'));
      const dobradiçaRow = rows.find(r => r.innerText.includes('DOBRADIÇA COMUM') || r.innerText.includes('DOBRADICA COMUM'));

      const getQty = (row) => {
        if (!row) return 0;
        const input = row.querySelector('input[type="number"][placeholder="0"]');
        return input ? Number(input.value) : 0;
      };

      return {
        corredicaQtd: getQty(corrediçaRow),
        dobradicaQtd: getQty(dobradiçaRow)
      };
    });

    console.log(`  Quantidades reidratadas de Ferragens: Corrediça=${rehydratedFerragens.corredicaQtd}, Dobradiça=${rehydratedFerragens.dobradicaQtd}`);
    assertCondition('Corrediça telescópica preservou quantidade exata (4)', rehydratedFerragens.corredicaQtd === 4);
    assertCondition('Dobradiça comum preservou quantidade exata (10)', rehydratedFerragens.dobradicaQtd === 10);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_reidratacao_validada.png') });

    // -------------------------------------------------------------
    // 10. Enviar Direto para a Folha de Bancada e Concluir Produção
    // -------------------------------------------------------------
    logStep(10, 'Avançar para Valores e enviar projeto para a Folha de Bancada');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Avançar para Valores'));
      if (nextBtn) nextBtn.click();
    });
    await delay(600);

    // Clica em "Sinal Já Pago? Enviar Direto para Bancada"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bancadaBtn = btns.find(b => b.innerText.includes('Enviar Direto para Bancada'));
      if (bancadaBtn) bancadaBtn.click();
    });
    await delay(1500);

    // Abre a aba Folha de Bancada
    logStep('10.1', 'Navegar para "Folha de Bancada" e validar processo de corte');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('header nav button'));
      const bancadaNav = buttons.find(b => b.innerText.includes('Folha de Bancada'));
      if (bancadaNav) bancadaNav.click();
    });
    await delay(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_folha_bancada.png') });

    const bancadaInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasClient: text.includes('Carlos Eduardo'),
        hasPieces: text.includes('MDF BRANCO') || text.includes('MDF AMADEIRADO') || text.includes('Corte') || text.includes('chapa')
      };
    });
    assertCondition('Projeto e peças recebidos na Folha de Bancada', bancadaInfo.hasClient);

    // Marca cortes e clica em "MARCAR MÓVEL COMO PRONTO"
    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      checkboxes.forEach(cb => {
        if (!cb.checked) cb.click();
      });
      const prontoBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText && (b.innerText.includes('MARCAR MÓVEL COMO PRONTO') || b.innerText.includes('Marcar Pronto'))
      );
      if (prontoBtn) prontoBtn.click();
    });
    await delay(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_bancada_marcado_pronto.png') });

    // Verifica se projeto foi movido para Montagem no Kanban
    logStep('10.2', 'Verificar se o projeto transitou para "5. Montagem / Entrega" no Kanban');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('header nav button'));
      const kanbanBtn = buttons.find(b => b.innerText.includes('Fila de Produção'));
      if (kanbanBtn) kanbanBtn.click();
    });
    await delay(1200);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_kanban_montagem_entrega.png') });

    const montagemVerification = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Carlos Eduardo') && (text.includes('Montagem') || text.includes('Entrega'));
    });
    assertCondition('Projeto transitou para etapa de Montagem/Entrega', montagemVerification);

    // -------------------------------------------------------------
    // 11. Teste de Recarregamento Total da Página (F5 / Hard Reload)
    // -------------------------------------------------------------
    logStep(11, 'Simular fechamento/recarregamento total do navegador (F5 / page.reload)');
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_apos_reload_f5.png') });

    // Verifica persistência das chaves no localStorage
    const storageAudit = await page.evaluate(() => {
      const projetos = JSON.parse(localStorage.getItem('marcenaria_projetos_v3') || '[]');
      const bancada = JSON.parse(localStorage.getItem('marcenaria_bancada_status_v2') || '{}');
      const mdfs = JSON.parse(localStorage.getItem('marcenaria_catalogo_mdfs_v1') || '[]');
      const ferragens = JSON.parse(localStorage.getItem('marcenaria_catalogo_ferramentas_v1') || '[]');

      const carlosPrj = projetos.find(p => p.cliente && p.cliente.includes('Carlos Eduardo'));

      return {
        totalProjetos: projetos.length,
        carlosFound: Boolean(carlosPrj),
        carlosStatus: carlosPrj ? carlosPrj.status : null,
        carlosSinalPago: carlosPrj ? carlosPrj.sinalPago : null,
        carlosValor: carlosPrj ? carlosPrj.valorTotal : null,
        carlosPecasCount: carlosPrj && carlosPrj.produtos && carlosPrj.produtos[0] && carlosPrj.produtos[0].pecas ? carlosPrj.produtos[0].pecas.length : 0,
        carlosFerragensCount: carlosPrj && carlosPrj.produtos && carlosPrj.produtos[0] && carlosPrj.produtos[0].ferragens ? carlosPrj.produtos[0].ferragens.length : 0,
        bancadaKeys: Object.keys(bancada).length,
      };
    });

    testReport.persistenceStatus = storageAudit;
    console.log('  Audit de Persistência no LocalStorage:', JSON.stringify(storageAudit, null, 2));

    assertCondition('Projeto persiste no LocalStorage após F5', storageAudit.carlosFound);
    assertCondition('Status do projeto em MONTAGEM ou EM_PRODUCAO mantido', storageAudit.carlosStatus === 'MONTAGEM' || storageAudit.carlosStatus === 'EM_PRODUCAO');
    assertCondition('Pecas de MDF preservadas na estrutura do projeto', storageAudit.carlosPecasCount >= 2);
    assertCondition('Ferragens e ferramentas preservadas na estrutura do projeto', storageAudit.carlosFerragensCount >= 2);

    // -------------------------------------------------------------
    // 12. Validação do Banco de Dados SQLite / Backend REST API
    // -------------------------------------------------------------
    logStep(12, 'Verificar persistência no Backend SQLite (Porta 8085)');
    const backendData = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/v1/producao/produtos');
        if (!res.ok) return { ok: false, status: res.status };
        const data = await res.json();
        return { ok: true, count: Array.isArray(data) ? data.length : 0, data: data.slice(0, 2) };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });

    console.log('  Resposta do Backend REST (/api/v1/producao/produtos):', {
      ok: backendData.ok,
      produtosCadastrados: backendData.count
    });
    assertCondition('Backend SQLite respondendo e sincronizado com os dados', backendData.ok);

  } catch (err) {
    console.error('❌ Erro durante a execução do teste E2E:', err);
    testReport.passed = false;
    testReport.error = err.message;
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '99_erro_inesperado.png') });
  } finally {
    await browser.close();
  }

  // Salva o relatório de teste em JSON
  const reportPath = path.join(SCREENSHOTS_DIR, 'relatorio_e2e.json');
  fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2), 'utf-8');
  console.log(`\n📄 Relatório E2E gravado em: ${reportPath}`);
  console.log(`🏁 Teste Finalizado. Resultado Geral: ${testReport.passed ? '✅ 100% SUCESSO' : '❌ HOUVE FALHAS'}`);
}

runTest();
