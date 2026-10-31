import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ProjetoKanban,
  ContratoServicoData,
  MovelContrato,
  ClientesInfoContrato,
  MarcenariaInfoContrato,
  CondicoesPagamentoContrato,
  ClausulasContrato,
  ProdutoProjeto,
} from '../types/marcenaria';
import {
  FileText,
  Printer,
  Copy,
  Save,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  User,
  Building2,
  CreditCard,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Package,
  Wrench,
  HelpCircle,
  FileSignature,
  FileCheck,
  Clock,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
} from 'lucide-react';

const MARCENARIA_PADRAO_KEY = 'marcenaria_dados_oficina_fh_v1';

const DADOS_MARCENARIA_PADRAO: MarcenariaInfoContrato = {
  razaoSocial: 'FH Planejados',
  nomeFantasia: 'FH Móveis Planejados',
  cnpjCpf: '41.437.092/0001-59',
  ie: '',
  responsavelTecnico: 'Felipe Harison',
  telefone: '(85) 9 8524-1098',
  email: 'FELIPELEONOR85@GMAIL.COM',
  endereco: 'Rua Doutor Waldemar de Alcantara, 1323',
  cidade: 'Fortaleza',
  uf: 'CE',
};

const getClausulasPadrao = (sinalPct: number = 50): ClausulasContrato => ({
  objeto:
    'O presente contrato tem por objeto a PRESTAÇÃO DE SERVIÇOS DE MARCENARIA SOB MEDIDA, compreendendo o desenvolvimento do projeto executivo técnico, fabricação artesanal sob encomenda, acabamento, transporte, entrega e instalação/montagem dos móveis planejados e sob medida expressamente discriminados e detalhados na Cláusula 2ª deste instrumento.',
  medicaoEProjeto:
    'Os móveis serão fabricados estritamente em conformidade com as medidas conferidas na vistoria técnica in loco no imóvel indicado pelo(a) CONTRATANTE. Pequenos ajustes milimétricos no momento da instalação são tecnicamente naturais ao processo artesanal de marcenaria fina e não configuram imperfeição.',
  precoEPagamento:
    `Pelos serviços de marcenaria e materiais contratados, o(a) CONTRATANTE pagará à CONTRATADA o valor total ajustado neste instrumento, sendo ${sinalPct}% a título de Entrada/Sinal no ato da aprovação e assinatura deste contrato para compra de matérias-primas e início de produção, e o saldo restante de ${100 - sinalPct}% na entrega e conclusão da montagem dos móveis.`,
  prazosEInstalacao:
    'O prazo para fabricação e início da montagem dos móveis é o acordado neste instrumento, contado em dias úteis a partir da confirmação do pagamento do Sinal e da liberação do imóvel com piso, alvenaria, pintura e pontos elétricos e hidráulicos devidamente finalizados pelo CONTRATANTE.',
  obrigacoesContratada:
    'A CONTRATADA compromete-se a: a) Empregar materiais de primeira linha e ferragens especificadas; b) Executar os serviços com fino padrão de marcenaria; c) Cumprir os prazos acordados; d) Entregar os móveis devidamente limpos e regulados; e) Fornecer garantia dos serviços.',
  obrigacoesContratante:
    'O(A) CONTRATANTE compromete-se a: a) Efetuar pontualmente os pagamentos ajustados; b) Fornecer acesso livre e seguro ao imóvel para a equipe de montagem no horário comercial; c) Indicar com exatidão a tubulação embutida (água, gás, conduítes elétricos); d) Não alterar a alvenaria ou piso após a medição técnica sem prévia notificação.',
  garantia:
    'A CONTRATADA oferece garantia de 01 (um) ano sobre a estrutura de marcenaria (MDF/compensado) contra defeitos de fabricação e montagem. Ferragens com amortecimento (dobradiças, corrediças, pistões) possuem garantia adicional conforme os termos do fabricante. A garantia não cobre danos decorrentes de umidade externa, infiltrações pré-existentes, pragas biológicas ou mau uso.',
  rescisaoEMultas:
    'Em caso de rescisão imotivada por parte do CONTRATANTE após o corte das chapas de madeira ou compra de materiais personalizados, o valor pago a título de Sinal será retido para indenizar os custos irrecuperáveis de matérias-primas e horas de oficina, nos termos do Código Civil Brasileiro.',
  foro:
    'Para dirimir quaisquer controvérsias ou litígios oriundos do presente contrato, as partes elegem expressamente o Foro da Comarca de Fortaleza - Estado do Ceará, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
});

interface ContratoServicoProps {
  projetos: ProjetoKanban[];
  codigoProjetoInicial?: string;
  clienteInicial?: string;
  onSalvarContratoNoProjeto?: (
    codigoProjeto: string,
    contrato: ContratoServicoData,
    novosMoveisProjeto?: ProdutoProjeto[]
  ) => void;
  onIrParaKanban?: () => void;
}

export const ContratoServico: React.FC<ContratoServicoProps> = ({
  projetos,
  codigoProjetoInicial,
  clienteInicial,
  onSalvarContratoNoProjeto,
  onIrParaKanban,
}) => {
  // Lista de projetos disponíveis para emissão de contrato (todos os clientes e orçamentos ativos)
  const projetosAprovados = useMemo(() => {
    return projetos.filter((p) => !p.cancelado && p.status !== 'CANCELADO');
  }, [projetos]);

  // 1. Projeto Selecionado (apenas dentre os aprovados)
  const projetoInicialEncontrado = useMemo(() => {
    if (codigoProjetoInicial) {
      const p = projetosAprovados.find((pr) => pr.codigo === codigoProjetoInicial);
      if (p) return p;
    }
    if (clienteInicial) {
      const p = projetosAprovados.find((pr) => pr.cliente.toLowerCase() === clienteInicial.toLowerCase());
      if (p) return p;
    }
    return projetosAprovados.length > 0 ? projetosAprovados[0] : null;
  }, [projetosAprovados, codigoProjetoInicial, clienteInicial]);

  const [projetoSelecionadoCodigo, setProjetoSelecionadoCodigo] = useState<string>(() => {
    return projetoInicialEncontrado ? projetoInicialEncontrado.codigo : '';
  });

  // Atualiza seleção caso a lista de aprovados seja modificada ou novos props cheguem
  useEffect(() => {
    if (codigoProjetoInicial && projetosAprovados.some((p) => p.codigo === codigoProjetoInicial)) {
      setProjetoSelecionadoCodigo(codigoProjetoInicial);
      return;
    }
    if (clienteInicial) {
      const p = projetosAprovados.find((proj) => proj.cliente.toLowerCase() === clienteInicial.toLowerCase());
      if (p) {
        setProjetoSelecionadoCodigo(p.codigo);
        return;
      }
    }
    if (projetosAprovados.length > 0) {
      if (!projetoSelecionadoCodigo || !projetosAprovados.some((p) => p.codigo === projetoSelecionadoCodigo)) {
        setProjetoSelecionadoCodigo(projetosAprovados[0].codigo);
      }
    } else {
      setProjetoSelecionadoCodigo('');
    }
  }, [projetosAprovados, codigoProjetoInicial, clienteInicial, projetoSelecionadoCodigo]);

  // Modo de visualização: 'editor' (Formulários), 'moveis' (Móveis Projetados), 'clausulas' (Texto legal), 'preview' (A4 timbrado para impressão)
  const [modoAba, setModoAba] = useState<'editor' | 'moveis' | 'clausulas' | 'preview'>('editor');

  // Notificações e feedbacks visuais
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);
  const [copiadoMsg, setCopiadoMsg] = useState(false);

  // Dados da Marcenaria (Contratada)
  const [marcenaria, setMarcenaria] = useState<MarcenariaInfoContrato>(() => {
    try {
      const salvo = localStorage.getItem(MARCENARIA_PADRAO_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        // Corrige automaticamente se estiver salvo com dados antigos de SP
        if (!parsed.cidade || parsed.cidade === 'São Paulo' || !parsed.uf || parsed.uf === 'SP') {
          return {
            ...parsed,
            razaoSocial: parsed.razaoSocial && parsed.razaoSocial !== 'FH MÓVEIS PLANEJADOS LTDA' ? parsed.razaoSocial : 'FH Planejados',
            cnpjCpf: parsed.cnpjCpf && parsed.cnpjCpf !== '38.452.890/0001-14' ? parsed.cnpjCpf : '41.437.092/0001-59',
            responsavelTecnico: parsed.responsavelTecnico && !parsed.responsavelTecnico.includes('Fábio Henrique') ? parsed.responsavelTecnico : 'Felipe Harison',
            telefone: parsed.telefone && !parsed.telefone.includes('(11)') ? parsed.telefone : '(85) 9 8524-1098',
            email: parsed.email && !parsed.email.includes('@fhmoveisplanejados') ? parsed.email : 'FELIPELEONOR85@GMAIL.COM',
            endereco: parsed.endereco && !parsed.endereco.includes('Rua das Madeiras') ? parsed.endereco : 'Rua Doutor Waldemar de Alcantara, 1323',
            cidade: 'Fortaleza',
            uf: 'CE',
          };
        }
        return parsed;
      }
    } catch (e) {}
    return DADOS_MARCENARIA_PADRAO;
  });

  // Salva dados da oficina para contratos futuros
  useEffect(() => {
    try {
      localStorage.setItem(MARCENARIA_PADRAO_KEY, JSON.stringify(marcenaria));
    } catch (e) {}
  }, [marcenaria]);

  // Dados do Contratante (Cliente)
  const [contratante, setContratante] = useState<ClientesInfoContrato>({
    nome: '',
    tipoPessoa: 'PF',
    cpfCnpj: '',
    rgIe: '',
    telefone: '',
    email: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Fortaleza',
    uf: 'CE',
    cep: '',
  });

  // Metadados do Contrato
  const [codigoContrato, setCodigoContrato] = useState<string>(`CT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [dataEmissao, setDataEmissao] = useState<string>(new Date().toISOString().split('T')[0]);
  const [prazoDiasUteis, setPrazoDiasUteis] = useState<number>(25);

  // Lista dos Móveis Projetados (O Cerne da Solicitação do Usuário!)
  const [moveis, setMoveis] = useState<MovelContrato[]>([]);

  // Condições de Pagamento inicializadas dinamicamente a partir do projeto selecionado
  const [valorTotal, setValorTotal] = useState<number>(() => {
    return typeof projetoInicialEncontrado?.valorTotal === 'number' ? projetoInicialEncontrado.valorTotal : 0;
  });
  const [percentualSinal, setPercentualSinal] = useState<number>(() => {
    return projetoInicialEncontrado?.percentualSinal || 50;
  });
  const [formaPagamentoSinal, setFormaPagamentoSinal] = useState<string>('PIX ou Transferência Bancária');
  const [formaPagamentoRestante, setFormaPagamentoRestante] = useState<string>(
    'PIX, Transferência ou Cartão de Crédito na entrega e montagem'
  );
  const [detalhesParcelamento, setDetalhesParcelamento] = useState<string>('50% Sinal + 50% na Conclusão da Montagem');

  // Cláusulas Contratuais
  const [clausulas, setClausulas] = useState<ClausulasContrato>(getClausulasPadrao(50));

  // Opção de Sincronizar móveis novos com o Projeto no Kanban
  const [sincronizarComKanban, setSincronizarComKanban] = useState<boolean>(true);

  // Estado para inserção de novo móvel
  const [formNovoMovelAberto, setFormNovoMovelAberto] = useState(false);
  const [novoMovel, setNovoMovel] = useState<Partial<MovelContrato>>({
    ambiente: 'Cozinha',
    nome: '',
    descricao: '',
    quantidade: 1,
    dimensoes: '1200 x 850 x 600 mm',
    material: 'MDF Branco TX 18mm com fita de borda PVC 1mm',
    ferragensResumo: 'Dobradiças com amortecimento slow e corrediças telescópicas',
    observacoes: '',
  });

  // Móvel em edição inline
  const [movelEmEdicaoId, setMovelEmEdicaoId] = useState<string | null>(null);
  const [movelEmEdicaoDados, setMovelEmEdicaoDados] = useState<Partial<MovelContrato>>({});

  // Objeto completo do projeto selecionado no momento
  const projetoAtual = useMemo(() => {
    return projetos.find((p) => p.codigo === projetoSelecionadoCodigo);
  }, [projetos, projetoSelecionadoCodigo]);

  // Carrega os dados do projeto quando selecionado (sincronização do orçamento do cliente)
  const carregarDadosDoProjeto = useCallback((cod: string) => {
    const proj = projetos.find((p) => p.codigo === cod);
    if (!proj) return;

    setCodigoContrato(`CT-${proj.codigo}`);
    setPrazoDiasUteis(proj.prazoDias || 15);
    setValorTotal(typeof proj.valorTotal === 'number' ? proj.valorTotal : 0);

    // Se o projeto já tiver contrato salvo, carrega o contrato salvo na íntegra
    if (proj.contrato) {
      const c = proj.contrato;
      setCodigoContrato(c.codigoContrato);
      setDataEmissao(c.dataEmissao || new Date().toISOString().split('T')[0]);
      setPrazoDiasUteis(c.prazoDiasUteis || proj.prazoDias || 15);
      setContratante(c.contratante);
      setMarcenaria(c.contratada);
      setMoveis(c.moveis || []);
      setValorTotal(c.pagamento?.valorTotal ?? (typeof proj.valorTotal === 'number' ? proj.valorTotal : 0));
      setPercentualSinal(c.pagamento?.percentualSinal || proj.percentualSinal || 50);
      setFormaPagamentoSinal(c.pagamento?.formaPagamentoSinal || 'PIX ou Transferência Bancária');
      setFormaPagamentoRestante(c.pagamento?.formaPagamentoRestante || 'PIX na entrega e montagem');
      setDetalhesParcelamento(c.pagamento?.detalhesParcelamento || '');
      setClausulas(c.clausulas || getClausulasPadrao(c.pagamento?.percentualSinal || proj.percentualSinal || 50));
      return;
    }

    // Caso contrário, gera a partir dos dados do projeto e orçamento existente
    const sinalFinal = proj.percentualSinal || 50;
    setPercentualSinal(sinalFinal);
    setClausulas(getClausulasPadrao(sinalFinal));
    setDetalhesParcelamento(`${sinalFinal}% Sinal + ${100 - sinalFinal}% na Conclusão da Montagem`);

    setContratante((prev) => ({
      ...prev,
      nome: proj.cliente || '',
      cpfCnpj: proj.cpf || '',
      cep: proj.cep || '',
      telefone: proj.telefone || '',
      endereco: proj.endereco || '',
      cidade: prev.cidade === 'São Paulo' ? 'Fortaleza' : prev.cidade || 'Fortaleza',
      uf: prev.uf === 'SP' ? 'CE' : prev.uf || 'CE',
    }));

    // Converte os produtos do projeto em móveis do contrato com seus materiais e ferragens do orçamento
    if (proj.produtos && proj.produtos.length > 0) {
      const moveisMapeados: MovelContrato[] = proj.produtos.map((p, idx) => ({
        id: p.id || `m-${idx + 1}`,
        ambiente: proj.ambiente || 'Geral',
        nome: p.nome || 'Móvel Sob Medida',
        descricao: p.descricao || `Fabricado conforme orçamento ${proj.codigo}`,
        quantidade: p.quantidade || 1,
        dimensoes: p.dimensoes || 'Sob medida conforme projeto',
        material: p.material || 'MDF Sob Medida',
        ferragensResumo: p.ferragensResumo || 'Ferragens e acessórios inclusos',
        observacoes: '',
      }));
      setMoveis(moveisMapeados);
    } else {
      setMoveis([
        {
          id: 'm1',
          ambiente: proj.ambiente || 'Cozinha',
          nome: 'Módulo de Marcenaria Sob Medida',
          descricao: `Fabricado de acordo com orçamento ${proj.codigo}`,
          quantidade: 1,
          dimensoes: '1800 x 850 x 600 mm',
          material: 'MDF Branco TX 18mm com bordas em fita PVC',
          ferragensResumo: 'Dobradiças Slow 35mm e corrediças telescópicas',
          observacoes: '',
        },
      ]);
    }
  }, [projetos]);

  // Efeito para carregar o projeto sempre que a seleção ou a lista for atualizada
  useEffect(() => {
    if (projetoSelecionadoCodigo) {
      carregarDadosDoProjeto(projetoSelecionadoCodigo);
    }
  }, [projetoSelecionadoCodigo, carregarDadosDoProjeto]);

  // Cálculos financeiros do contrato
  const valorSinalCalculado = useMemo(() => {
    return valorTotal * (percentualSinal / 100);
  }, [valorTotal, percentualSinal]);

  const valorEntregaCalculado = useMemo(() => {
    return Math.max(0, valorTotal - valorSinalCalculado);
  }, [valorTotal, valorSinalCalculado]);

  // Formatação de Moeda
  const formatarMoeda = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Ações de Inserção e Edição de Móveis
  const adicionarNovoMovel = () => {
    if (!novoMovel.nome?.trim()) {
      alert('Por favor, informe o nome ou descrição do móvel a ser projetado.');
      return;
    }

    const item: MovelContrato = {
      id: Math.random().toString(36).substring(2, 9),
      ambiente: novoMovel.ambiente || 'Geral',
      nome: novoMovel.nome.trim(),
      descricao: novoMovel.descricao?.trim() || '',
      quantidade: novoMovel.quantidade && novoMovel.quantidade > 0 ? novoMovel.quantidade : 1,
      dimensoes: novoMovel.dimensoes?.trim() || 'Sob medida',
      material: novoMovel.material?.trim() || 'MDF 18mm com fita de borda',
      ferragensResumo: novoMovel.ferragensResumo?.trim() || 'Ferragens padrão marcenaria',
      observacoes: novoMovel.observacoes?.trim() || '',
    };

    setMoveis((prev) => [...prev, item]);
    setFormNovoMovelAberto(false);
    setNovoMovel({
      ambiente: item.ambiente,
      nome: '',
      descricao: '',
      quantidade: 1,
      dimensoes: '1200 x 850 x 600 mm',
      material: 'MDF Branco TX 18mm com fita de borda PVC 1mm',
      ferragensResumo: 'Dobradiças com amortecimento slow e corrediças telescópicas',
      observacoes: '',
    });

    setSucessoMsg(`Móvel "${item.nome}" inserido no contrato com sucesso!`);
    setTimeout(() => setSucessoMsg(null), 3000);
  };

  const salvarEdicaoMovelInline = (id: string) => {
    setMoveis((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...movelEmEdicaoDados } : m))
    );
    setMovelEmEdicaoId(null);
    setMovelEmEdicaoDados({});
  };

  const removerMovel = (id: string) => {
    if (moveis.length <= 1) {
      if (!window.confirm('O contrato ficará sem nenhum móvel especificado. Deseja remover mesmo assim?')) {
        return;
      }
    }
    setMoveis((prev) => prev.filter((m) => m.id !== id));
  };

  const duplicarMovel = (m: MovelContrato) => {
    const duplicado: MovelContrato = {
      ...m,
      id: Math.random().toString(36).substring(2, 9),
      nome: `${m.nome} (Cópia)`,
    };
    setMoveis((prev) => [...prev, duplicado]);
  };

  // Salvar Contrato e Sincronizar com o Projeto no Kanban
  const handleSalvarContrato = () => {
    const dadosContrato: ContratoServicoData = {
      id: Math.random().toString(36).substring(2, 9),
      codigoContrato,
      codigoProjeto: projetoSelecionadoCodigo,
      dataEmissao,
      prazoDiasUteis,
      contratante,
      contratada: marcenaria,
      moveis,
      pagamento: {
        valorTotal,
        percentualSinal,
        valorSinal: valorSinalCalculado,
        percentualEntrega: 100 - percentualSinal,
        valorEntrega: valorEntregaCalculado,
        formaPagamentoSinal,
        formaPagamentoRestante,
        detalhesParcelamento,
      },
      clausulas,
    };

    // Converte os móveis do contrato para produtos do projeto no Kanban caso a opção esteja ativa
    let novosProdutosParaKanban: ProdutoProjeto[] | undefined = undefined;
    if (sincronizarComKanban) {
      novosProdutosParaKanban = moveis.map((m, idx) => ({
        id: m.id || `prod-${idx}`,
        nome: m.nome,
        descricao: m.descricao || `${m.ambiente} - Móvel projetado no contrato`,
        quantidade: m.quantidade || 1,
        dimensoes: m.dimensoes,
        material: m.material,
        ferragensResumo: m.ferragensResumo,
        pecasQtd: Math.max(4, (m.quantidade || 1) * 8), // estimativa técnica de peças
      }));
    }

    if (onSalvarContratoNoProjeto && projetoSelecionadoCodigo) {
      onSalvarContratoNoProjeto(projetoSelecionadoCodigo, dadosContrato, novosProdutosParaKanban);
    }

    setSucessoMsg('✅ Contrato e móveis projetados salvos com sucesso no sistema!');
    setTimeout(() => setSucessoMsg(null), 4000);
  };

  // Copiar Texto Completo do Contrato
  const copiarTextoContrato = () => {
    const texto = `
================================================================================
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARCENARIA
CONTRATO Nº ${codigoContrato}
================================================================================

1. DAS PARTES CONTRATANTES:

CONTRATADA (MARCENARIA):
Razão Social: ${marcenaria.razaoSocial}
Nome Fantasia: ${marcenaria.nomeFantasia}
CNPJ/CPF: ${marcenaria.cnpjCpf} | IE: ${marcenaria.ie || 'Isento'}
Responsável Técnico: ${marcenaria.responsavelTecnico}
Endereço: ${marcenaria.endereco}, ${marcenaria.cidade} - ${marcenaria.uf}
Telefone/WhatsApp: ${marcenaria.telefone} | E-mail: ${marcenaria.email}

CONTRATANTE (CLIENTE):
Nome/Razão Social: ${contratante.nome || 'Não informado'}
Tipo de Pessoa: ${contratante.tipoPessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
CPF/CNPJ: ${contratante.cpfCnpj || 'Pendente de preenchimento'} | RG/IE: ${contratante.rgIe || 'Não informado'}
Endereço de Instalação: ${contratante.endereco || ''} ${contratante.numero ? `, nº ${contratante.numero}` : ''} ${contratante.complemento ? `- ${contratante.complemento}` : ''} - ${contratante.bairro || ''}, ${contratante.cidade} - ${contratante.uf} ${contratante.cep ? `(CEP: ${contratante.cep})` : ''}
Telefone/WhatsApp: ${contratante.telefone} | E-mail: ${contratante.email || 'Não informado'}

--------------------------------------------------------------------------------
2. DO OBJETO E ESPECIFICAÇÕES DOS MÓVEIS PROJETADOS:
${clausulas.objeto}

RELAÇÃO TÉCNICA DE MÓVEIS PROJETADOS:
${moveis
  .map(
    (m, idx) => `
[Móvel ${idx + 1}] Ambiente: ${m.ambiente} | Móvel: ${m.nome} (Qtd: ${m.quantidade} un)
- Dimensões: ${m.dimensoes}
- Estrutura e MDF: ${m.material}
- Ferragens e Acessórios: ${m.ferragensResumo}
${m.observacoes ? `- Observações Técnicas: ${m.observacoes}` : ''}`
  )
  .join('\n')}

--------------------------------------------------------------------------------
3. DA MEDIÇÃO TÉCNICA E APROVAÇÃO DO PROJETO:
${clausulas.medicaoEProjeto}

--------------------------------------------------------------------------------
4. DO VALOR E CONDIÇÕES DE PAGAMENTO:
${clausulas.precoEPagamento}

- Valor Total dos Serviços e Móveis: ${formatarMoeda(valorTotal)}
- Sinal / Entrada (${percentualSinal}%): ${formatarMoeda(valorSinalCalculado)} (Forma: ${formaPagamentoSinal})
- Saldo Restante (${100 - percentualSinal}%): ${formatarMoeda(valorEntregaCalculado)} (Forma: ${formaPagamentoRestante})
${detalhesParcelamento ? `- Condições Adicionais: ${detalhesParcelamento}` : ''}

--------------------------------------------------------------------------------
5. DO PRAZO DE FABRICAÇÃO E INSTALAÇÃO:
${clausulas.prazosEInstalacao}
Prazo estimado: ${prazoDiasUteis} dias úteis após a confirmação do sinal e medição final.

--------------------------------------------------------------------------------
6. DAS OBRIGAÇÕES DA CONTRATADA:
${clausulas.obrigacoesContratada}

--------------------------------------------------------------------------------
7. DAS OBRIGAÇÕES DO CONTRATANTE:
${clausulas.obrigacoesContratante}

--------------------------------------------------------------------------------
8. DA GARANTIA E ASSISTÊNCIA TÉCNICA:
${clausulas.garantia}

--------------------------------------------------------------------------------
9. DA RESCISÃO E PENALIDADES:
${clausulas.rescisaoEMultas}

--------------------------------------------------------------------------------
10. DO FORO:
${clausulas.foro}

E, por estarem assim justos e contratados, firmam o presente instrumento particular em 02 (duas) vias de igual teor e forma, para que produza todos os seus jurídicos e legais efeitos.

${marcenaria.cidade || 'Fortaleza'} - ${marcenaria.uf === 'CE' ? 'Ceará' : (marcenaria.uf || 'Ceará')}, ${new Date(dataEmissao + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}.


________________________________________________
CONTRATANTE: ${contratante.nome || 'Assinatura do Cliente'}
CPF/CNPJ: ${contratante.cpfCnpj || ''}


________________________________________________
CONTRATADA: ${marcenaria.razaoSocial}
Representante Técnico: ${marcenaria.responsavelTecnico}
CNPJ: ${marcenaria.cnpjCpf}
    `.trim();

    navigator.clipboard.writeText(texto).then(() => {
      setCopiadoMsg(true);
      setTimeout(() => setCopiadoMsg(false), 2500);
    });
  };

  return (
    <div className="space-y-6 text-stone-900">
      {/* 1. TOPO: BARRA DE CONTROLE, SELETOR DE PROJETO E AÇÕES NO TEMA CREME */}
      <div className="bg-[#FAF7F2] border border-[#E7DFD5] rounded-2xl p-5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Brand com a Logo Atualizada e Tipografia da Marca */}
          <div className="flex items-center space-x-3.5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#D3A25D] shadow-sm bg-transparent flex items-center justify-center flex-shrink-0">
              <img
                src="/logo-fh.png"
                alt="FH Móveis Planejados"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-baseline font-serif">
                <span className="font-bold text-2xl md:text-3xl text-[#3D230A] tracking-tight leading-none">
                  FH
                </span>
                <span className="font-normal text-2xl md:text-3xl text-[#966226] tracking-normal leading-none ml-2">
                  Móveis planejados
                </span>
              </div>
              <h1 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2 mt-0.5">
                <span>Contrato de Prestação de Serviços</span>
                <span className="text-[10px] bg-[#D3A25D] text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase">
                  Sob Medida
                </span>
              </h1>
              <p className="text-xs text-stone-600 font-medium">
                Puxe os dados do sistema, personalize cláusulas e insira os móveis projetados
              </p>
            </div>
          </div>

          {/* Seletor do Projeto para Puxar Informações (Apenas Clientes Aprovados) */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Projetos & Orçamentos Disponíveis ({projetosAprovados.length}):
                </label>
                <span className="text-[10px] text-[#8C5E20] font-bold bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#DFCDB7]">
                  Sincronizado
                </span>
              </div>
              <select
                value={projetoSelecionadoCodigo}
                onChange={(e) => {
                  setProjetoSelecionadoCodigo(e.target.value);
                  carregarDadosDoProjeto(e.target.value);
                }}
                disabled={projetosAprovados.length === 0}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] text-stone-900 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#D3A25D] focus:ring-1 focus:ring-[#D3A25D] font-bold shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {projetosAprovados.length === 0 ? (
                  <option value="">Nenhum orçamento disponível no momento</option>
                ) : (
                  projetosAprovados.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.codigo} — {p.cliente} ({p.ambiente || 'Projeto'}) • R$ {Number(p.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Botões de Ação Principais */}
            <div className="flex items-end gap-2 pt-4 lg:pt-0">
              <button
                onClick={handleSalvarContrato}
                disabled={projetosAprovados.length === 0 || !projetoSelecionadoCodigo}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                title="Salvar o contrato e os móveis no projeto do sistema"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Contrato</span>
              </button>

              <button
                onClick={copiarTextoContrato}
                disabled={projetosAprovados.length === 0 || !projetoSelecionadoCodigo}
                className="px-3.5 py-2 bg-[#EFE9DE] hover:bg-[#E5DDCF] disabled:opacity-50 disabled:cursor-not-allowed text-stone-800 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-all border border-[#DFCDB7]"
                title="Copiar texto completo para área de transferência"
              >
                {copiadoMsg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-700" />}
                <span>{copiadoMsg ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={() => {
                  setModoAba('preview');
                  setTimeout(() => window.print(), 300);
                }}
                disabled={projetosAprovados.length === 0 || !projetoSelecionadoCodigo}
                className="px-4 py-2 bg-[#D3A25D] hover:bg-[#C4934E] disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-[#D3A25D]/25"
                title="Visualizar e Imprimir em papel A4 ou gerar PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Aviso amigável caso não haja clientes aprovados */}
        {projetosAprovados.length === 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 text-xs shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-xl text-[#8C5E20] flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block text-stone-900">
                  Apenas projetos na etapa "3. Aprovado (Aguardando Sinal)" podem emitir contrato.
                </span>
                <span className="text-stone-600">
                  Para gerar um contrato, aprove um orçamento na Calculadora ou mova o cartão do cliente para a coluna "3. Aprovado" no Kanban.
                </span>
              </div>
            </div>
            {onIrParaKanban && (
              <button
                onClick={onIrParaKanban}
                className="px-4 py-2 bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950 font-bold rounded-xl text-xs transition-all shadow-sm flex-shrink-0"
              >
                <span>Ir para o Kanban →</span>
              </button>
            )}
          </div>
        )}

        {/* Mensagem de Feedback */}
        {sucessoMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-semibold">{sucessoMsg}</span>
          </div>
        )}

        {/* Abas Internas no Tema Creme Claro */}
        <div className="flex items-center space-x-1 mt-5 pt-4 border-t border-[#E7DFD5] overflow-x-auto print:hidden">
          <button
            onClick={() => setModoAba('editor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              modoAba === 'editor'
                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-[#EFE9DE]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Dados das Partes & Valores</span>
          </button>

          <button
            onClick={() => setModoAba('moveis')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              modoAba === 'moveis'
                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-[#EFE9DE]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>2. Móveis Projetados ({moveis.length})</span>
            <span className="ml-1 px-1.5 py-0.2 bg-[#FAF5EC] text-[#543A14] border border-[#DFCDB7] rounded text-[10px] font-bold">
              Destaque
            </span>
          </button>

          <button
            onClick={() => setModoAba('clausulas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              modoAba === 'clausulas'
                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-[#EFE9DE]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Cláusulas Jurídicas</span>
          </button>

          <button
            onClick={() => setModoAba('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
              modoAba === 'preview'
                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-[#EFE9DE]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>4. Documento A4 Timbrado (Pré-visualização)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: EDITOR DE DADOS DAS PARTES, PREÇOS E PRAZOS                       */}
      {/* ========================================================================= */}
      {modoAba === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Contratante (Cliente) */}
          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFE9DE] pb-3">
              <div className="flex items-center space-x-2 text-[#7A531C]">
                <User className="w-5 h-5" />
                <h3 className="font-bold text-sm text-stone-900">Contratante (Cliente)</h3>
              </div>
              <span className="text-xs bg-[#FAF5EC] text-stone-700 font-semibold px-2.5 py-0.5 rounded-full border border-[#DFCDB7]">
                Qualificação
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-stone-800 block font-bold mb-1">Nome Completo / Razão Social:</label>
                <input
                  type="text"
                  value={contratante.nome}
                  onChange={(e) => setContratante({ ...contratante, nome: e.target.value })}
                  placeholder="Ex: Juliana Paes"
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 font-bold focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">Tipo de Pessoa:</label>
                <select
                  value={contratante.tipoPessoa}
                  onChange={(e) => setContratante({ ...contratante, tipoPessoa: e.target.value as 'PF' | 'PJ' })}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                >
                  <option value="PF">Pessoa Física (PF)</option>
                  <option value="PJ">Pessoa Jurídica (PJ)</option>
                </select>
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">
                  {contratante.tipoPessoa === 'PF' ? 'CPF:' : 'CNPJ:'}
                </label>
                <input
                  type="text"
                  value={contratante.cpfCnpj}
                  onChange={(e) => setContratante({ ...contratante, cpfCnpj: e.target.value })}
                  placeholder={contratante.tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">Telefone / WhatsApp:</label>
                <input
                  type="text"
                  value={contratante.telefone}
                  onChange={(e) => setContratante({ ...contratante, telefone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">E-mail (opcional):</label>
                <input
                  type="email"
                  value={contratante.email || ''}
                  onChange={(e) => setContratante({ ...contratante, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-stone-800 block font-bold mb-1">
                  Endereço de Entrega e Montagem dos Móveis:
                </label>
                <input
                  type="text"
                  value={contratante.endereco}
                  onChange={(e) => setContratante({ ...contratante, endereco: e.target.value })}
                  placeholder="Rua, Avenida, Número, Bairro, Apto"
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">CEP de Entrega / Instalação:</label>
                <input
                  type="text"
                  maxLength={9}
                  value={contratante.cep || ''}
                  onChange={async (e) => {
                    const novoCep = e.target.value;
                    setContratante(prev => ({ ...prev, cep: novoCep }));
                    const limpo = novoCep.replace(/\D/g, '');
                    if (limpo.length === 8) {
                      try {
                        const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
                        const data = await res.json();
                        if (!data.erro) {
                          const rua = data.logradouro || '';
                          const bairro = data.bairro || '';
                          const cidade = data.localidade || '';
                          const uf = data.uf || '';
                          setContratante(prev => ({
                            ...prev,
                            endereco: [rua, bairro].filter(Boolean).join(' - ') || prev.endereco,
                            cidade: cidade || prev.cidade,
                            uf: uf || prev.uf,
                          }));
                        }
                      } catch (err) {}
                    }
                  }}
                  placeholder="60000-000 (Busca automática)"
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">Cidade:</label>
                <input
                  type="text"
                  value={contratante.cidade}
                  onChange={(e) => setContratante({ ...contratante, cidade: e.target.value })}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">Estado (UF):</label>
                <input
                  type="text"
                  value={contratante.uf}
                  onChange={(e) => setContratante({ ...contratante, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>
            </div>
          </div>

          {/* Card: Contratada (Marcenaria / Oficina FH) */}
          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFE9DE] pb-3">
              <div className="flex items-center space-x-2 text-[#7A531C]">
                <Building2 className="w-5 h-5" />
                <h3 className="font-bold text-sm text-stone-900">Contratada (FH Móveis Planejados)</h3>
              </div>
              <span className="text-xs bg-[#FAF5EC] text-[#543A14] font-bold px-2.5 py-0.5 rounded-full border border-[#DFCDB7]">
                Oficina Ativa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-stone-800 block font-bold mb-1">Razão Social / Nome da Oficina:</label>
                <input
                  type="text"
                  value={marcenaria.razaoSocial}
                  onChange={(e) => setMarcenaria({ ...marcenaria, razaoSocial: e.target.value })}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 font-bold focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">CNPJ ou CPF da Marcenaria:</label>
                <input
                  type="text"
                  value={marcenaria.cnpjCpf}
                  onChange={(e) => setMarcenaria({ ...marcenaria, cnpjCpf: e.target.value })}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">Marceneiro / Responsável Técnico:</label>
                <input
                  type="text"
                  value={marcenaria.responsavelTecnico}
                  onChange={(e) => setMarcenaria({ ...marcenaria, responsavelTecnico: e.target.value })}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">Telefone da Marcenaria:</label>
                <input
                  type="text"
                  value={marcenaria.telefone}
                  onChange={(e) => setMarcenaria({ ...marcenaria, telefone: e.target.value })}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">E-mail da Marcenaria:</label>
                <input
                  type="email"
                  value={marcenaria.email}
                  onChange={(e) => setMarcenaria({ ...marcenaria, email: e.target.value })}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-stone-800 block font-bold mb-1">Endereço da Fábrica / Oficina:</label>
                <input
                  type="text"
                  value={marcenaria.endereco}
                  onChange={(e) => setMarcenaria({ ...marcenaria, endereco: e.target.value })}
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">Cidade da Oficina:</label>
                <input
                  type="text"
                  value={marcenaria.cidade}
                  onChange={(e) => setMarcenaria({ ...marcenaria, cidade: e.target.value })}
                  placeholder="Fortaleza"
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div>
                <label className="text-stone-800 block font-bold mb-1">Estado (UF):</label>
                <input
                  type="text"
                  value={marcenaria.uf}
                  onChange={(e) => setMarcenaria({ ...marcenaria, uf: e.target.value.toUpperCase() })}
                  maxLength={2}
                  placeholder="CE"
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>
            </div>
          </div>

          {/* Card: Condições Comerciais, Pagamento e Prazos */}
          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-5 shadow-xs space-y-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between border-b border-[#EFE9DE] pb-3 gap-2">
              <div className="flex items-center space-x-2 text-[#7A531C]">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-sm text-stone-900">Preço, Sinal & Prazos de Montagem</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {projetoAtual && typeof projetoAtual.valorTotal === 'number' && projetoAtual.valorTotal > 0 && (
                  <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                    <span>✓ Sincronizado com Orçamento ({formatarMoeda(projetoAtual.valorTotal)})</span>
                  </span>
                )}
                {projetoAtual && typeof projetoAtual.valorTotal === 'number' && projetoAtual.valorTotal > 0 && valorTotal !== projetoAtual.valorTotal && (
                  <button
                    type="button"
                    onClick={() => {
                      setValorTotal(projetoAtual.valorTotal);
                      if (projetoAtual.percentualSinal) setPercentualSinal(projetoAtual.percentualSinal);
                      if (projetoAtual.prazoDias) setPrazoDiasUteis(projetoAtual.prazoDias);
                    }}
                    className="text-[11px] text-[#8C5E20] hover:text-[#543A14] font-bold underline cursor-pointer"
                    title="Restaurar o valor calculado na Calculadora"
                  >
                    Restaurar valor do orçamento ({formatarMoeda(projetoAtual.valorTotal)})
                  </button>
                )}
                <span className="text-xs text-stone-600 font-semibold">Proporção Atual ({percentualSinal}% Sinal / {100 - percentualSinal}% Entrega)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E7DFD5]">
                <label className="text-stone-800 block font-bold mb-1">Valor Total do Contrato (R$):</label>
                <input
                  type="number"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(Number(e.target.value))}
                  className="w-full bg-white border border-[#D8CCBE] rounded-lg px-3 py-2 text-stone-950 font-mono font-bold text-base focus:border-[#D3A25D]"
                />
              </div>

              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E7DFD5] space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-stone-800 font-bold">Sinal / Entrada:</label>
                  <span className="text-emerald-700 font-bold font-mono text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {percentualSinal}%
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-emerald-700">
                  {formatarMoeda(valorSinalCalculado)}
                </div>

                {/* Botões Rápidos de Sinal */}
                <div className="grid grid-cols-5 gap-1">
                  {[30, 40, 50, 60, 70].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setPercentualSinal(pct);
                        setDetalhesParcelamento(`${pct}% Sinal + ${100 - pct}% na Conclusão da Montagem`);
                        setClausulas(prev => ({ ...prev, precoEPagamento: getClausulasPadrao(pct).precoEPagamento }));
                      }}
                      className={`py-1 rounded text-[11px] font-bold transition-all ${
                        percentualSinal === pct
                          ? 'bg-[#D3A25D] text-stone-950 shadow-xs border border-[#B88438]/30 font-extrabold'
                          : 'bg-white text-stone-700 hover:bg-[#EFE9DE] border border-[#E7DFD5]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={percentualSinal}
                  onChange={(e) => {
                    const newPct = Number(e.target.value);
                    setPercentualSinal(newPct);
                    setDetalhesParcelamento(`${newPct}% Sinal + ${100 - newPct}% na Conclusão da Montagem`);
                    setClausulas(prev => ({ ...prev, precoEPagamento: getClausulasPadrao(newPct).precoEPagamento }));
                  }}
                  className="w-full accent-[#D3A25D] cursor-pointer"
                />
              </div>

              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E7DFD5]">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-stone-800 font-bold">Saldo na Entrega e Montagem:</label>
                  <span className="text-blue-700 font-bold font-mono">{100 - percentualSinal}%</span>
                </div>
                <div className="text-base font-bold font-mono text-blue-700">
                  {formatarMoeda(valorEntregaCalculado)}
                </div>
                <p className="text-[10px] text-stone-500 mt-1">Pago mediante vistoria final da montagem</p>
              </div>

              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E7DFD5]">
                <label className="text-stone-800 block font-bold mb-1">Prazo de Entrega e Montagem:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={prazoDiasUteis}
                    onChange={(e) => setPrazoDiasUteis(Number(e.target.value))}
                    className="w-20 bg-white border border-[#D8CCBE] rounded-lg px-3 py-2 text-stone-950 font-mono font-bold text-base focus:border-[#D3A25D]"
                  />
                  <span className="text-stone-700 font-semibold">dias úteis</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">A contar da aprovação e sinal</p>
              </div>

              <div className="md:col-span-2">
              <label className="text-stone-800 block font-bold mb-1">Forma de Pagamento do Sinal ({percentualSinal}%):</label>
                <input
                  type="text"
                  value={formaPagamentoSinal}
                  onChange={(e) => setFormaPagamentoSinal(e.target.value)}
                  placeholder="Ex: PIX, Transferência Bancária na assinatura"
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-stone-800 block font-bold mb-1">
                  Forma de Pagamento do Saldo na Entrega:
                </label>
                <input
                  type="text"
                  value={formaPagamentoRestante}
                  onChange={(e) => setFormaPagamentoRestante(e.target.value)}
                  placeholder="Ex: PIX ou Cartão de Crédito em até 3x sem juros"
                  className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                />
              </div>
            </div>

            {/* Opção de sincronização */}
            <div className="pt-2 flex items-center space-x-2">
              <input
                type="checkbox"
                id="syncKanban"
                checked={sincronizarComKanban}
                onChange={(e) => setSincronizarComKanban(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-[#D3A25D] focus:ring-[#D3A25D] bg-[#FCFAF6]"
              />
              <label htmlFor="syncKanban" className="text-xs text-stone-800 font-semibold cursor-pointer">
                Sincronizar automaticamente as alterações e novos móveis projetados com o Projeto no Kanban
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: MÓVEIS PROJETADOS (INSERÇÃO E EDIÇÃO DINÂMICA)                     */}
      {/* ========================================================================= */}
      {modoAba === 'moveis' && (
        <div className="space-y-6">
          {/* Barra Superior da Seção de Móveis */}
          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#8C5E20]" />
                <span>Relação de Móveis Projetados ({moveis.length} módulos)</span>
              </h2>
              <p className="text-xs text-stone-600 font-medium">
                Insira, configure medidas e personalize cada móvel que será fabricado para este contrato
              </p>
            </div>

            <button
              onClick={() => setFormNovoMovelAberto(true)}
              className="px-4 py-2 bg-[#D3A25D] hover:bg-[#C4934E] text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-[#D3A25D]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Inserir Novo Móvel ao Projeto</span>
            </button>
          </div>

          {/* Modal / Formulário de Inserção de Novo Móvel Projetado */}
          {formNovoMovelAberto && (
            <div className="bg-[#FAF7F2] border-2 border-[#D3A25D] rounded-2xl p-5 shadow-md space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-3">
                <div className="flex items-center space-x-2 text-[#7A531C]">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-stone-900">Cadastrar Novo Móvel no Contrato</h3>
                </div>
                <button
                  onClick={() => setFormNovoMovelAberto(false)}
                  className="text-stone-600 hover:text-stone-900 text-xs font-bold px-2 py-1 bg-[#EFE9DE] rounded-lg"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-stone-800 block font-bold mb-1">Ambiente / Cômodo:</label>
                  <input
                    type="text"
                    value={novoMovel.ambiente}
                    onChange={(e) => setNovoMovel({ ...novoMovel, ambiente: e.target.value })}
                    placeholder="Ex: Cozinha, Quarto Casal, Banheiro"
                    className="w-full bg-white border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D] font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-800 block font-bold mb-1">Nome do Móvel / Módulo:</label>
                  <input
                    type="text"
                    value={novoMovel.nome}
                    onChange={(e) => setNovoMovel({ ...novoMovel, nome: e.target.value })}
                    placeholder="Ex: Armário Superior Basculante 1800mm com Vidro Reflecta"
                    className="w-full bg-white border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D] font-bold"
                  />
                </div>

                <div>
                  <label className="text-stone-800 block font-bold mb-1">Quantidade:</label>
                  <input
                    type="number"
                    min="1"
                    value={novoMovel.quantidade}
                    onChange={(e) => setNovoMovel({ ...novoMovel, quantidade: Number(e.target.value) })}
                    className="w-full bg-white border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                  />
                </div>

                <div>
                  <label className="text-stone-800 block font-bold mb-1">
                    Dimensões (Largura x Altura x Profundidade):
                  </label>
                  <input
                    type="text"
                    value={novoMovel.dimensoes}
                    onChange={(e) => setNovoMovel({ ...novoMovel, dimensoes: e.target.value })}
                    placeholder="Ex: 1800 x 850 x 600 mm"
                    className="w-full bg-white border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D] font-mono"
                  />
                </div>

                <div>
                  <label className="text-stone-800 block font-bold mb-1">
                    Materiais, Madeira & Acabamento MDF:
                  </label>
                  <input
                    type="text"
                    value={novoMovel.material}
                    onChange={(e) => setNovoMovel({ ...novoMovel, material: e.target.value })}
                    placeholder="Ex: MDF Branco TX 18mm + Fita de Borda PVC 1mm"
                    className="w-full bg-white border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-stone-800 block font-bold mb-1">
                    Ferragens, Puxadores e Sistemas Amortecidos:
                  </label>
                  <input
                    type="text"
                    value={novoMovel.ferragensResumo}
                    onChange={(e) => setNovoMovel({ ...novoMovel, ferragensResumo: e.target.value })}
                    placeholder="Ex: 4x Dobradiças Slow 35mm, Corrediças ocultas amortecidas, Puxador cava"
                    className="w-full bg-white border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="text-stone-800 block font-bold mb-1">
                    Observações Técnicas de Instalação (opcional):
                  </label>
                  <input
                    type="text"
                    value={novoMovel.observacoes}
                    onChange={(e) => setNovoMovel({ ...novoMovel, observacoes: e.target.value })}
                    placeholder="Ex: Recorte interno para saída de esgoto de 50mm e passa-cabos para forno"
                    className="w-full bg-white border border-[#D8CCBE] rounded-xl px-3 py-2 text-stone-900 focus:border-[#D3A25D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E7DFD5]">
                <button
                  type="button"
                  onClick={() => setFormNovoMovelAberto(false)}
                  className="px-4 py-2 bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-800 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={adicionarNovoMovel}
                  className="px-5 py-2 bg-[#D3A25D] hover:bg-[#C4934E] text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Adicionar ao Contrato</span>
                </button>
              </div>
            </div>
          )}

          {/* Tabela de Móveis Cadastrados no Contrato */}
          <div className="space-y-3">
            {moveis.map((m, index) => {
              const isEditing = movelEmEdicaoId === m.id;

              return (
                <div
                  key={m.id || index}
                  className="bg-white border border-[#E7DFD5] rounded-2xl p-4 shadow-xs transition-all hover:border-[#D3A25D]"
                >
                  {!isEditing ? (
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                      {/* Descrição e Especificações do Móvel */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-[#FAF5EC] text-[#543A14] font-bold px-2 py-0.5 rounded border border-[#DFCDB7]">
                            {m.ambiente || 'Geral'}
                          </span>
                          <h4 className="text-sm font-bold text-stone-900 tracking-tight">
                            {m.nome}
                          </h4>
                          <span className="text-xs text-stone-700 bg-[#F2ECE2] px-2 py-0.5 rounded-full font-bold">
                            Qtd: {m.quantidade}x
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-stone-800 pt-1">
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-stone-500">Medidas:</span>
                            <span className="font-mono text-stone-900 font-semibold">{m.dimensoes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-stone-500">MDF/Material:</span>
                            <span className="text-stone-900 font-medium">{m.material}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-stone-500">Ferragens:</span>
                            <span className="text-stone-900 font-medium">{m.ferragensResumo}</span>
                          </div>
                        </div>

                        {m.observacoes && (
                          <p className="text-[11px] text-[#7A531C] bg-[#FAF5EC] p-1.5 rounded border border-[#DFCDB7] font-medium">
                            <strong>Obs. Técnica:</strong> {m.observacoes}
                          </p>
                        )}
                      </div>

                      {/* Botões de Ação por Móvel */}
                      <div className="flex items-center space-x-1.5 pt-2 lg:pt-0 w-full lg:w-auto justify-end border-t lg:border-t-0 border-[#EFE9DE]">
                        <button
                          onClick={() => {
                            setMovelEmEdicaoId(m.id);
                            setMovelEmEdicaoDados(m);
                          }}
                          className="p-2 bg-[#FAF7F2] hover:bg-[#EFE9DE] text-stone-800 rounded-lg text-xs flex items-center space-x-1 transition-colors border border-[#E7DFD5]"
                          title="Editar especificações do móvel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>

                        <button
                          onClick={() => duplicarMovel(m)}
                          className="p-2 bg-[#FAF7F2] hover:bg-[#EFE9DE] text-stone-800 rounded-lg text-xs flex items-center space-x-1 transition-colors border border-[#E7DFD5]"
                          title="Duplicar este módulo"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Duplicar</span>
                        </button>

                        <button
                          onClick={() => removerMovel(m.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs flex items-center space-x-1 transition-colors border border-rose-200"
                          title="Remover móvel do contrato"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Formulário Inline de Edição */
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between text-xs text-[#543A14] font-bold">
                        <span>Editando Especificações do Móvel</span>
                        <button
                          onClick={() => setMovelEmEdicaoId(null)}
                          className="text-stone-500 hover:text-stone-900"
                        >
                          Fechar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="text-stone-800 font-bold block mb-0.5">Ambiente:</label>
                          <input
                            type="text"
                            value={movelEmEdicaoDados.ambiente || ''}
                            onChange={(e) =>
                              setMovelEmEdicaoDados({ ...movelEmEdicaoDados, ambiente: e.target.value })
                            }
                            className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-lg px-2.5 py-1.5 text-stone-900"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-stone-800 font-bold block mb-0.5">Nome do Móvel:</label>
                          <input
                            type="text"
                            value={movelEmEdicaoDados.nome || ''}
                            onChange={(e) =>
                              setMovelEmEdicaoDados({ ...movelEmEdicaoDados, nome: e.target.value })
                            }
                            className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-lg px-2.5 py-1.5 text-stone-900 font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-stone-800 font-bold block mb-0.5">Quantidade:</label>
                          <input
                            type="number"
                            value={movelEmEdicaoDados.quantidade || 1}
                            onChange={(e) =>
                              setMovelEmEdicaoDados({ ...movelEmEdicaoDados, quantidade: Number(e.target.value) })
                            }
                            className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-lg px-2.5 py-1.5 text-stone-900"
                          />
                        </div>

                        <div>
                          <label className="text-stone-800 font-bold block mb-0.5">Dimensões (mm):</label>
                          <input
                            type="text"
                            value={movelEmEdicaoDados.dimensoes || ''}
                            onChange={(e) =>
                              setMovelEmEdicaoDados({ ...movelEmEdicaoDados, dimensoes: e.target.value })
                            }
                            className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-lg px-2.5 py-1.5 text-stone-900 font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-stone-800 font-bold block mb-0.5">MDF e Acabamento:</label>
                          <input
                            type="text"
                            value={movelEmEdicaoDados.material || ''}
                            onChange={(e) =>
                              setMovelEmEdicaoDados({ ...movelEmEdicaoDados, material: e.target.value })
                            }
                            className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-lg px-2.5 py-1.5 text-stone-900"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-stone-800 font-bold block mb-0.5">Ferragens / Puxadores:</label>
                          <input
                            type="text"
                            value={movelEmEdicaoDados.ferragensResumo || ''}
                            onChange={(e) =>
                              setMovelEmEdicaoDados({ ...movelEmEdicaoDados, ferragensResumo: e.target.value })
                            }
                            className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-lg px-2.5 py-1.5 text-stone-900"
                          />
                        </div>

                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="text-stone-800 font-bold block mb-0.5">Observações Técnicas:</label>
                          <input
                            type="text"
                            value={movelEmEdicaoDados.observacoes || ''}
                            onChange={(e) =>
                              setMovelEmEdicaoDados({ ...movelEmEdicaoDados, observacoes: e.target.value })
                            }
                            className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-lg px-2.5 py-1.5 text-stone-900"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE9DE]">
                        <button
                          onClick={() => setMovelEmEdicaoId(null)}
                          className="px-3 py-1.5 bg-[#EFE9DE] text-stone-700 rounded-lg text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => salvarEdicaoMovelInline(m.id)}
                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar Alterações</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: CLÁUSULAS JURÍDICAS EDITÁVEIS                                     */}
      {/* ========================================================================= */}
      {modoAba === 'clausulas' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#8C5E20]" />
                <span>Cláusulas Contratuais da Prestação de Serviços</span>
              </h2>
              <p className="text-xs text-stone-600 font-medium">
                Personalize o texto jurídico de cada cláusula conforme as regras e garantias da sua oficina
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Deseja restaurar todas as cláusulas para o texto jurídico padrão?')) {
                  setClausulas(getClausulasPadrao(percentualSinal));
                }
              }}
              className="px-3 py-1.5 bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-800 font-semibold rounded-xl text-xs flex items-center space-x-1 border border-[#DFCDB7]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Cláusula 1 */}
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-[#543A14] uppercase tracking-wider block">
                Cláusula 1ª — Do Objeto dos Serviços
              </label>
              <textarea
                rows={3}
                value={clausulas.objeto}
                onChange={(e) => setClausulas({ ...clausulas, objeto: e.target.value })}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl p-3 text-xs text-stone-900 focus:border-[#D3A25D] leading-relaxed font-sans"
              />
            </div>

            {/* Cláusula 2 */}
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-[#543A14] uppercase tracking-wider block">
                Cláusula 2ª — Da Medição Técnica e Aprovação do Projeto Executivo
              </label>
              <textarea
                rows={3}
                value={clausulas.medicaoEProjeto}
                onChange={(e) => setClausulas({ ...clausulas, medicaoEProjeto: e.target.value })}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl p-3 text-xs text-stone-900 focus:border-[#D3A25D] leading-relaxed font-sans"
              />
            </div>

            {/* Cláusula 3 */}
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-[#543A14] uppercase tracking-wider block">
                Cláusula 3ª — Do Preço, Formas de Pagamento e Sinal
              </label>
              <textarea
                rows={3}
                value={clausulas.precoEPagamento}
                onChange={(e) => setClausulas({ ...clausulas, precoEPagamento: e.target.value })}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl p-3 text-xs text-stone-900 focus:border-[#D3A25D] leading-relaxed font-sans"
              />
            </div>

            {/* Cláusula 4 */}
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-[#543A14] uppercase tracking-wider block">
                Cláusula 4ª — Dos Prazos de Fabricação, Entrega e Montagem
              </label>
              <textarea
                rows={3}
                value={clausulas.prazosEInstalacao}
                onChange={(e) => setClausulas({ ...clausulas, prazosEInstalacao: e.target.value })}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl p-3 text-xs text-stone-900 focus:border-[#D3A25D] leading-relaxed font-sans"
              />
            </div>

            {/* Cláusula 5 */}
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-[#543A14] uppercase tracking-wider block">
                Cláusula 5ª — Das Obrigações da Marcenaria Contratada
              </label>
              <textarea
                rows={3}
                value={clausulas.obrigacoesContratada}
                onChange={(e) => setClausulas({ ...clausulas, obrigacoesContratada: e.target.value })}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl p-3 text-xs text-stone-900 focus:border-[#D3A25D] leading-relaxed font-sans"
              />
            </div>

            {/* Cláusula 6 */}
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-[#543A14] uppercase tracking-wider block">
                Cláusula 6ª — Das Obrigações do Cliente Contratante
              </label>
              <textarea
                rows={3}
                value={clausulas.obrigacoesContratante}
                onChange={(e) => setClausulas({ ...clausulas, obrigacoesContratante: e.target.value })}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl p-3 text-xs text-stone-900 focus:border-[#D3A25D] leading-relaxed font-sans"
              />
            </div>

            {/* Cláusula 7 */}
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-[#543A14] uppercase tracking-wider block">
                Cláusula 7ª — Da Garantia e Assistência Técnica
              </label>
              <textarea
                rows={3}
                value={clausulas.garantia}
                onChange={(e) => setClausulas({ ...clausulas, garantia: e.target.value })}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl p-3 text-xs text-stone-900 focus:border-[#D3A25D] leading-relaxed font-sans"
              />
            </div>

            {/* Cláusula 8 */}
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-[#543A14] uppercase tracking-wider block">
                Cláusula 8ª — Da Rescisão Contratual e Penalidades
              </label>
              <textarea
                rows={3}
                value={clausulas.rescisaoEMultas}
                onChange={(e) => setClausulas({ ...clausulas, rescisaoEMultas: e.target.value })}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl p-3 text-xs text-stone-900 focus:border-[#D3A25D] leading-relaxed font-sans"
              />
            </div>

            {/* Cláusula 9 */}
            <div className="bg-white border border-[#E7DFD5] rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-[#543A14] uppercase tracking-wider block">
                Cláusula 9ª — Do Foro e Comarca
              </label>
              <textarea
                rows={2}
                value={clausulas.foro}
                onChange={(e) => setClausulas({ ...clausulas, foro: e.target.value })}
                className="w-full bg-[#FCFAF6] border border-[#D8CCBE] rounded-xl p-3 text-xs text-stone-900 focus:border-[#D3A25D] leading-relaxed font-sans"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: PRÉ-VISUALIZAÇÃO EM PAPEL A4 TIMBRADO COM A LOGO OFICIAL FH        */}
      {/* ========================================================================= */}
      {modoAba === 'preview' && (
        <div className="space-y-4">
          {/* Barra de Ações Rápidas de Impressão */}
          <div className="p-4 bg-white border border-[#E7DFD5] rounded-2xl flex items-center justify-between shadow-xs print:hidden">
            <div className="flex items-center space-x-2 text-[#7A531C]">
              <FileCheck className="w-5 h-5" />
              <span className="font-bold text-sm text-stone-900">
                Documento Oficial em Papel Timbrado FH para Assinatura
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[#D3A25D] hover:bg-[#C4934E] text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-[#D3A25D]/20"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Agora / Salvar PDF</span>
              </button>
            </div>
          </div>

          {/* DOCUMENTO FORMAL EM FOLHA A4 COM CABEÇALHO DA LOGO FH */}
          <div
            id="folha-contrato-a4"
            className="bg-white text-stone-950 rounded-2xl p-8 sm:p-12 shadow-md max-w-4xl mx-auto font-sans text-justify border border-[#E2D9CC] print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none print:w-full print:rounded-none"
          >
            {/* CABEÇALHO TIMBRADO COM A LOGO ATUALIZADA */}
            <div className="border-b-2 border-stone-900 pb-5 mb-6 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#D3A25D] shadow-xs bg-transparent flex items-center justify-center flex-shrink-0">
                  <img
                    src="/logo-fh.png"
                    alt="FH Móveis Planejados"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <div>
                  <div className="flex items-baseline">
                    <span className="font-bold text-3xl text-[#3D230A] tracking-tight leading-none">
                      FH
                    </span>
                    <span className="font-normal text-3xl text-[#966226] tracking-normal leading-none ml-2">
                      Móveis planejados
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-stone-900 font-sans mt-1 font-bold">
                    {marcenaria.razaoSocial} • Mobiliário Sob Medida de Alto Padrão
                  </p>
                  <p className="text-xs text-stone-800 font-sans font-medium">
                    CNPJ: {marcenaria.cnpjCpf} • {marcenaria.telefone} • {marcenaria.email}
                  </p>
                  <p className="text-xs text-stone-700 font-sans">{marcenaria.endereco}</p>
                </div>
              </div>

              <div className="text-right font-sans">
                <span className="text-xs sm:text-sm font-bold font-mono bg-[#FAF5EC] text-[#3B270C] px-3 py-1 rounded border border-[#DFCDB7] inline-block">
                  {codigoContrato}
                </span>
                <p className="text-xs text-stone-600 mt-1 font-medium">
                  Emissão: {new Date(dataEmissao).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* PREÂMBULO E QUALIFICAÇÃO DAS PARTES */}
            <div className="space-y-3.5 text-xs sm:text-[13px] leading-relaxed text-stone-900 font-sans">
              <p className="font-medium text-stone-900">
                Pelo presente instrumento, de um lado:
              </p>
              <p className="bg-[#FAF7F2] p-3.5 rounded-lg border border-[#E7DFD5] font-sans text-xs sm:text-[12.5px] leading-relaxed text-stone-900">
                <strong>CONTRATADA:</strong> <strong>{marcenaria.razaoSocial}</strong>, inscrita no CNPJ sob o nº{' '}
                <strong>{marcenaria.cnpjCpf}</strong>, com sede e oficina na {marcenaria.endereco},{' '}
                {marcenaria.cidade || 'Fortaleza'} - {marcenaria.uf || 'CE'}, neste ato representada por seu responsável técnico{' '}
                <strong>{marcenaria.responsavelTecnico}</strong>, doravante denominada simplesmente <strong>CONTRATADA</strong>; e,
                de outro lado:
              </p>
              <p className="bg-[#FAF7F2] p-3.5 rounded-lg border border-[#E7DFD5] font-sans text-xs sm:text-[12.5px] leading-relaxed text-stone-900">
                <strong>CONTRATANTE:</strong> <strong>{contratante.nome || '______________________________________'}</strong>,{' '}
                inscrito(a) no {contratante.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ'} sob o nº{' '}
                <strong>{contratante.cpfCnpj || '_________________________'}</strong>,{' '}
                {contratante.rgIe && `RG/IE nº ${contratante.rgIe}, `}
                residente/sediado(a) na {contratante.endereco || '________________________________________________'}{' '}
                {contratante.numero ? `, nº ${contratante.numero}` : ''}{' '}
                {contratante.bairro ? `, ${contratante.bairro}` : ''}, {contratante.cidade || 'Fortaleza'} - {contratante.uf || 'CE'},{' '}
                telefone/WhatsApp: <strong>{contratante.telefone}</strong>, doravante denominado(a) simplesmente{' '}
                <strong>CONTRATANTE</strong>;
              </p>
              <p className="font-medium text-stone-900">
                Têm, entre si, justo e contratado o quanto segue nas cláusulas abaixo:
              </p>
            </div>

            {/* CLÁUSULAS */}
            <div className="mt-6 space-y-4 text-xs sm:text-[13px] leading-relaxed text-stone-900 font-sans">
              {/* Cláusula 1ª */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 1ª — DO OBJETO DO CONTRATO
                </h3>
                <p className="mt-1 text-stone-800">{clausulas.objeto}</p>
              </div>

              {/* Cláusula 2ª — RELAÇÃO DOS MÓVEIS PROJETADOS */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 2ª — DOS MÓVEIS PROJETADOS E ESPECIFICAÇÕES TÉCNICAS
                </h3>
                <p className="mt-1 mb-2 text-stone-800">
                  Constituem o objeto da fabricação sob medida as seguintes peças e módulos desenvolvidos para o
                  ambiente e espaço do(a) CONTRATANTE:
                </p>

                {/* Tabela Técnica de Móveis */}
                <table className="w-full text-left text-xs sm:text-[12px] border border-stone-300 rounded-lg overflow-hidden my-3 font-sans">
                  <thead className="bg-[#F5EFEB] text-stone-950 font-bold border-b border-stone-300">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-stone-300">Item</th>
                      <th className="py-2.5 px-3 border-r border-stone-300">Ambiente & Móvel Projetado</th>
                      <th className="py-2.5 px-2.5 text-center border-r border-stone-300">Qtd</th>
                      <th className="py-2.5 px-3 border-r border-stone-300">Dimensões (L x A x P)</th>
                      <th className="py-2.5 px-3 border-r border-stone-300">Estrutura & MDF</th>
                      <th className="py-2.5 px-3">Ferragens / Acessórios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {moveis.map((m, idx) => (
                      <tr key={m.id || idx} className="hover:bg-[#FAF7F2]">
                        <td className="py-2 px-3 font-bold text-stone-700 border-r border-stone-200 text-center">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-bold text-stone-950 border-r border-stone-200">
                          <div>{m.nome}</div>
                          <span className="text-[11px] text-stone-600 font-semibold block">
                            Ambiente: {m.ambiente}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-center font-bold border-r border-stone-200 text-stone-950">
                          {m.quantidade} un
                        </td>
                        <td className="py-2 px-3 font-mono text-stone-900 border-r border-stone-200 font-semibold text-xs">
                          {m.dimensoes}
                        </td>
                        <td className="py-2 px-3 text-stone-900 border-r border-stone-200 font-medium">
                          {m.material}
                        </td>
                        <td className="py-2 px-3 text-stone-900 font-medium">
                          {m.ferragensResumo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cláusula 3ª */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 3ª — DA MEDIÇÃO TÉCNICA E APROVAÇÃO DO PROJETO EXECUTIVO
                </h3>
                <p className="mt-1 text-stone-800">{clausulas.medicaoEProjeto}</p>
              </div>

              {/* Cláusula 4ª */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 4ª — DO PREÇO E DAS CONDIÇÕES DE PAGAMENTO
                </h3>
                <p className="mt-1 text-stone-800">{clausulas.precoEPagamento}</p>
                <div className="my-2.5 p-3.5 bg-[#FAF7F2] border border-[#E7DFD5] rounded-lg font-sans text-xs sm:text-[12.5px] grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-stone-600 font-semibold block">Valor Total Ajustado:</span>
                    <span className="font-bold text-stone-950 text-base font-mono">
                      {formatarMoeda(valorTotal)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-600 font-semibold block">Sinal de Entrada ({percentualSinal}%):</span>
                    <span className="font-bold text-emerald-800 text-sm font-mono block">
                      {formatarMoeda(valorSinalCalculado)}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium block">({formaPagamentoSinal})</span>
                  </div>
                  <div>
                    <span className="text-stone-600 font-semibold block">
                      Saldo Final na Entrega/Montagem ({100 - percentualSinal}%):
                    </span>
                    <span className="font-bold text-blue-800 text-sm font-mono block">
                      {formatarMoeda(valorEntregaCalculado)}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium block">({formaPagamentoRestante})</span>
                  </div>
                </div>
              </div>

              {/* Cláusula 5ª */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 5ª — DO PRAZO DE FABRICAÇÃO E INSTALAÇÃO
                </h3>
                <p className="mt-1 text-stone-800">
                  O prazo acordado para fabricação e montagem é de <strong>{prazoDiasUteis} dias úteis</strong>, a contar
                  da confirmação do sinal e medição final. {clausulas.prazosEInstalacao}
                </p>
              </div>

              {/* Cláusula 6ª */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 6ª — DAS OBRIGAÇÕES DA CONTRATADA
                </h3>
                <p className="mt-1 text-stone-800">{clausulas.obrigacoesContratada}</p>
              </div>

              {/* Cláusula 7ª */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 7ª — DAS OBRIGAÇÕES DO CONTRATANTE
                </h3>
                <p className="mt-1 text-stone-800">{clausulas.obrigacoesContratante}</p>
              </div>

              {/* Cláusula 8ª */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 8ª — DA GARANTIA E ASSISTÊNCIA TÉCNICA
                </h3>
                <p className="mt-1 text-stone-800">{clausulas.garantia}</p>
              </div>

              {/* Cláusula 9ª */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 9ª — DA RESCISÃO E PENALIDADES
                </h3>
                <p className="mt-1 text-stone-800">{clausulas.rescisaoEMultas}</p>
              </div>

              {/* Cláusula 10ª */}
              <div>
                <h3 className="font-bold text-stone-950 font-sans uppercase text-xs sm:text-[13px] tracking-wide">
                  CLÁUSULA 10ª — DO FORO
                </h3>
                <p className="mt-1 text-stone-800">{clausulas.foro}</p>
              </div>
            </div>

            {/* FECHAMENTO E ASSINATURAS */}
            <div className="mt-8 pt-6 border-t border-stone-300 font-sans text-xs sm:text-[13px] space-y-6 text-stone-900 print:break-inside-avoid">
              <p className="text-justify leading-relaxed">
                E, por estarem assim justos e contratados, as partes firmam o presente contrato em 02 (duas) vias de igual teor e forma, para que produza todos os seus jurídicos e legais efeitos.
              </p>

              <p className="text-right font-medium text-stone-900">
                {marcenaria.cidade || 'Fortaleza'} - {marcenaria.uf === 'CE' ? 'Ceará' : (marcenaria.uf || 'Ceará')},{' '}
                {new Date(dataEmissao + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-4">
                {/* Assinatura Contratante */}
                <div className="text-center">
                  <div className="border-b border-stone-900 pb-1 mb-1 font-bold text-stone-950">
                    {contratante.nome || 'CONTRATANTE'}
                  </div>
                  <p className="text-xs text-stone-700 font-semibold">CONTRATANTE</p>
                  <p className="text-[11px] text-stone-500">CPF/CNPJ: {contratante.cpfCnpj || '_________________________'}</p>
                </div>

                {/* Assinatura Contratada */}
                <div className="text-center">
                  <div className="border-b border-stone-900 pb-1 mb-1 font-bold text-stone-950">
                    {marcenaria.razaoSocial}
                  </div>
                  <p className="text-xs text-stone-700 font-semibold">CONTRATADA (Oficina de Marcenaria)</p>
                  <p className="text-[11px] text-stone-500">
                    CNPJ: {marcenaria.cnpjCpf} • Resp: {marcenaria.responsavelTecnico}
                  </p>
                </div>
              </div>

              {/* Rubrica */}
              <div className="pt-4 flex justify-between text-[10px] text-stone-500 border-t border-stone-200">
                <span>Rubrica Contratante: ____________</span>
                <span>Contrato de Marcenaria {codigoContrato}</span>
                <span>Rubrica Contratada: ____________</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
