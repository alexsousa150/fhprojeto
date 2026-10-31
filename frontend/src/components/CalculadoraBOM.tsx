import React, { useState, useMemo, useEffect } from 'react';
import { api, Insumo } from '../services/api';
import { podeEditarMovel, StatusProjeto } from '../types/marcenaria';
import {
  MaterialPlanilha,
  carregarCatalogoMdfs,
  salvarCatalogoMdfs,
  carregarCatalogoFerramentas,
  salvarCatalogoFerramentas,
} from '../data/catalogoPlanilhaPadrao';
import {
  Calculator,
  Plus,
  Trash2,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Edit3,
  User,
  Phone,
  Home,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  X,
  MessageSquare,
  Printer,
  FileText,
  Users,
  Lock,
  FileSignature,
  FileSpreadsheet,
  Search,
  Filter,
  MapPin,
  Building,
  Check,
  Loader2,
} from 'lucide-react';

interface PecaItem {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  tipoChapaManual: string;
  comprimentoMm?: number;
  larguraMm?: number;
  espessuraMm?: number;
  chapaInsumoId?: string;
  opcaoBorda?: 'FRENTE' | '4_LADOS' | 'FRENTE_TOPO' | 'SEM_BORDA';
  orientacaoVeio?: 'LONGITUDINAL' | 'TRANSVERSAL';
}

interface FerragemItem {
  id: string;
  nome: string;
  quantidade: number;
  custoUnitario: number;
  unidade: string;
  valorTotal?: number;
}

export interface ClienteOpcao {
  id?: string;
  nome: string;
  telefone: string;
  cpf?: string;
  cep?: string;
  ambiente?: string;
  endereco?: string;
  codigo?: string;
  status?: StatusProjeto;
  sinalPago?: boolean;
  produtos?: any[];
  valorTotal?: number;
  prazoDias?: number;
  dataCriacao?: string;
}

export const UNIDADES_MARCENARIA = [
  { valor: 'un', label: 'un — Unidade (Puxador, Dobradiça, Pistão, Pé)' },
  { valor: 'par', label: 'par — Par (Corrediça Telescópica / Oculta, Articulador)' },
  { valor: 'kit', label: 'kit — Kit (Porta de Correr, Kit Fixação / Montagem)' },
  { valor: 'barra', label: 'barra — Barra (Tubo Cabideiro, Perfil Alumínio 3m, Cremalheira)' },
  { valor: 'metro', label: 'metro — Metro Linear (Perfil LED, Fita LED, Trilho)' },
  { valor: 'cento', label: 'cento — Cento (Parafusos, Cavilhas, Minifix, Tapa-Furos)' },
  { valor: 'conjunto', label: 'conjunto — Conjunto (Fechadura, Fecho Magnético)' },
  { valor: 'jogo', label: 'jogo — Jogo (Jogo de Guias, Gabaritos)' },
  { valor: 'caixa', label: 'caixa — Caixa (Caixa Parafusos, Pregos)' },
  { valor: 'rolo', label: 'rolo — Rolo (Fita de Borda, Fita Dupla Face)' },
  { valor: 'tubo', label: 'tubo — Tubo / Bisnaga (Silicone, Cola PU, Selante)' },
  { valor: 'litro', label: 'litro — Litro (Cola de Contato, Thinner, Verniz)' },
  { valor: 'kg', label: 'kg — Quilo / Kg (Cola Granulada, Pregos)' },
  { valor: 'm2', label: 'm² — Metro Quadrado (Vidro, Espelho, Revestimento)' },
];

interface CalculadoraBOMProps {
  onIrParaBancada?: () => void;
  onIrParaKanban?: () => void;
  clientesExistentes?: ClienteOpcao[];
  clienteInicial?: string;
  onPedidoCriado?: (pedido: any) => void;
  onGerarContrato?: (clienteNome?: string, codigoProjeto?: string) => void;
}

export const CalculadoraBOM: React.FC<CalculadoraBOMProps> = ({
  onIrParaBancada,
  onIrParaKanban,
  clientesExistentes,
  clienteInicial,
  onPedidoCriado,
  onGerarContrato,
}) => {
  // 1. Dados do Cliente e do Móvel (Human-friendly)
  const [passoAtivo, setPassoAtivo] = useState<1 | 2 | 3>(1);
  const [clienteCardExpandido, setClienteCardExpandido] = useState<boolean>(!clienteInicial);
  const [clienteSelecionadoKey, setClienteSelecionadoKey] = useState<string>('__novo__');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteCpf, setClienteCpf] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteCep, setClienteCep] = useState('');
  const [clienteEndereco, setClienteEndereco] = useState('');
  const [nomeMovel, setNomeMovel] = useState('');
  const [ambiente, setAmbiente] = useState('');

  const [gavetaClienteAberta, setGavetaClienteAberta] = useState<boolean>(false);
  const [buscandoCep, setBuscandoCep] = useState<boolean>(false);

  const buscarCep = async (cepValor: string) => {
    const limpo = cepValor.replace(/\D/g, '');
    if (limpo.length === 8) {
      try {
        setBuscandoCep(true);
        const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          const rua = data.logradouro || '';
          const bairro = data.bairro || '';
          const cidade = data.localidade || '';
          const uf = data.uf || '';
          const partes = [rua, bairro, cidade ? `${cidade}/${uf}` : ''].filter(Boolean);
          setClienteEndereco(partes.join(' - '));
        }
      } catch (e) {
        // Fallback silencioso se offline ou erro
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  // Modais de PDF e Material
  const [modalPdfAberto, setModalPdfAberto] = useState(false);

  // 2. Catálogo de Materiais (MDFs e Ferramentas da Planilha)
  const [listaMdfs, setListaMdfs] = useState<MaterialPlanilha[]>(() => carregarCatalogoMdfs());
  const [listaFerramentas, setListaFerramentas] = useState<MaterialPlanilha[]>(() => carregarCatalogoFerramentas());
  const [buscaFerramenta, setBuscaFerramenta] = useState('');
  const [filtroApenasSelecionadosMdf, setFiltroApenasSelecionadosMdf] = useState(false);
  const [filtroApenasSelecionadosFerr, setFiltroApenasSelecionadosFerr] = useState(false);

  // Formulário de Novo MDF no rodapé da tabela
  const [novoMdfNome, setNovoMdfNome] = useState('');
  const [novoMdfPreco, setNovoMdfPreco] = useState<number | ''>('');
  const [novoMdfEspessura, setNovoMdfEspessura] = useState<number>(15);

  // Formulário de Nova Ferramenta/Insumo no rodapé da tabela
  const [novaFerrNome, setNovaFerrNome] = useState('');
  const [novaFerrPreco, setNovaFerrPreco] = useState<number | ''>('');
  const [novaFerrUnidade, setNovaFerrUnidade] = useState('un');

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [modalNovoMaterialAberto, setModalNovoMaterialAberto] = useState(false);
  const [salvandoPedido, setSalvandoPedido] = useState(false);
  const [sucessoMensagem, setSucessoMensagem] = useState<string | null>(null);
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);

  // 5. Parâmetros de Marcenaria
  const [percaPercent, setPercaPercent] = useState<number>(15); // % de perda de corte da serra
  const [multiplicador, setMultiplicador] = useState<number>(2.0); // Multiplicador padrão 2x sobre materiais
  const [percentualSinal, setPercentualSinal] = useState<number>(50); // % de sinal selecionável (padrão 50%)
  const [valorSinalManual, setValorSinalManual] = useState<number | null>(null); // Valor customizado em R$ do sinal

  // Carrega insumos do Backend H2 com atualização automática
  useEffect(() => {
    carregarInsumos();

    const onSync = () => carregarInsumos();
    window.addEventListener('focus', onSync);
    window.addEventListener('marcenaria:sync', onSync);

    return () => {
      window.removeEventListener('focus', onSync);
      window.removeEventListener('marcenaria:sync', onSync);
    };
  }, []);

  // 6. Salvamento Automático (Rascunho Local da Planilha e Orçamento)
  useEffect(() => {
    if (clienteSelecionadoKey !== '__novo__') return;
    
    const rascunho = {
      clienteNome,
      clienteCpf,
      clienteTelefone,
      clienteCep,
      clienteEndereco,
      nomeMovel,
      ambiente,
      multiplicador,
      percentualSinal,
      listaMdfs,
      listaFerramentas,
    };
    localStorage.setItem('rascunho_calculadora_planilha', JSON.stringify(rascunho));
  }, [
    clienteSelecionadoKey, clienteNome, clienteCpf, clienteTelefone,
    clienteCep, clienteEndereco, nomeMovel, ambiente, multiplicador, percentualSinal,
    listaMdfs, listaFerramentas
  ]);

  // Carregar Rascunho Inicial se houver
  useEffect(() => {
    if (!clienteInicial) {
      const rascunho = localStorage.getItem('rascunho_calculadora_planilha');
      if (rascunho) {
        try {
          const dados = JSON.parse(rascunho);
          if (dados.clienteNome) setClienteNome(dados.clienteNome);
          if (dados.clienteCpf) setClienteCpf(dados.clienteCpf);
          if (dados.clienteTelefone) setClienteTelefone(dados.clienteTelefone);
          if (dados.clienteCep) setClienteCep(dados.clienteCep);
          if (dados.clienteEndereco) setClienteEndereco(dados.clienteEndereco);
          if (dados.nomeMovel) setNomeMovel(dados.nomeMovel);
          if (dados.ambiente) setAmbiente(dados.ambiente);
          if (dados.multiplicador) setMultiplicador(dados.multiplicador);
          if (dados.percentualSinal) setPercentualSinal(dados.percentualSinal);
          if (dados.listaMdfs && Array.isArray(dados.listaMdfs)) setListaMdfs(dados.listaMdfs);
          if (dados.listaFerramentas && Array.isArray(dados.listaFerramentas)) setListaFerramentas(dados.listaFerramentas);
        } catch (e) {
          console.warn('Erro ao carregar rascunho da planilha', e);
        }
      }
    }
  }, [clienteInicial]);

  const carregarInsumos = async () => {
    try {
      const lista = await api.listarInsumos();
      if (lista && lista.length > 0) {
        setInsumos(lista);
      }
    } catch (err) {
      console.warn('Backend offline ou inicializando, usando catálogo base da planilha.');
    }
  };

  const salvarNovoMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoMdfNome) return;
    try {
      const novo = await api.cadastrarInsumo({
        nome: novoMdfNome,
        tipo: 'CHAPA',
        custoUnitario: Number(novoMdfPreco) || 250,
        unidadeMedida: 'UN',
      });
      setInsumos((prev) => [...prev, novo]);
      setModalNovoMaterialAberto(false);
      setNovoMdfNome('');
      setSucessoMensagem(`Material "${novo.nome}" cadastrado com sucesso no H2!`);
      setTimeout(() => setSucessoMensagem(null), 4000);
      window.dispatchEvent(new CustomEvent('marcenaria:sync'));
    } catch (err) {
      alert('Não foi possível salvar no banco H2. Verifique se o backend está em execução.');
    }
  };

  // Lista de clientes disponíveis para seleção: estritamente projetos na aba de Orçamento ou na aba de Aprovados
  const clientesNoOrcamento = useMemo(() => {
    if (!clientesExistentes) return [];
    return clientesExistentes.filter((c) => c.status === 'ORCAMENTO' || c.status === 'APROVADO');
  }, [clientesExistentes]);

  const clienteSelecionadoObj = useMemo(() => {
    if (clienteSelecionadoKey === '__novo__') return null;
    return clientesExistentes?.find((c) => c.nome === clienteSelecionadoKey) || null;
  }, [clienteSelecionadoKey, clientesExistentes]);

  // Validação estrita: O orçamento só pode ser iniciado/editado se houver cliente informado
  const temClienteInformado = useMemo(() => {
    return Boolean(clienteNome && clienteNome.trim().length > 0);
  }, [clienteNome]);

  // Edição liberada para novos orçamentos, projetos em Orçamento e projetos Aprovados
  const bloqueadoParaEdicao = useMemo(() => {
    if (!clienteSelecionadoObj) return false;
    const st = clienteSelecionadoObj.status;
    if (st === 'EM_PRODUCAO' || st === 'MONTAGEM' || st === 'CONCLUIDO' || st === 'CANCELADO') {
      return true;
    }
    return false;
  }, [clienteSelecionadoObj]);

  const tentarMudarPasso = (novoPasso: 1 | 2 | 3) => {
    setPassoAtivo(novoPasso);
  };

  useEffect(() => {
    if (clienteInicial) {
      handleSelecionarClienteExistente(clienteInicial);
    }
  }, [clienteInicial]);

  // Itens selecionados com Quantidade > 0
  const mdfsAtivos = useMemo(() => {
    return listaMdfs.filter((m) => (Number(m.quantidade) || 0) > 0);
  }, [listaMdfs]);

  const ferramentasAtivas = useMemo(() => {
    return listaFerramentas.filter((f) => (Number(f.quantidade) || 0) > 0);
  }, [listaFerramentas]);

  // Ações de Atualização dos MDFs
  const atualizarQtdMdf = (id: string, qtd: number) => {
    if (bloqueadoParaEdicao) {
      alert('Edição bloqueada: este projeto já foi aprovado com sinal pago (50%) ou está em produção/montagem.');
      return;
    }
    setListaMdfs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantidade: Math.max(0, qtd) } : item))
    );
  };

  const alterarQtdMdfPorDelta = (id: string, delta: number) => {
    if (bloqueadoParaEdicao) {
      alert('Edição bloqueada: este projeto já foi aprovado com sinal pago (50%) ou está em produção/montagem.');
      return;
    }
    setListaMdfs((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantidade: Math.max(0, (Number(item.quantidade) || 0) + delta) } : item
      )
    );
  };

  const atualizarPrecoMdf = (id: string, preco: number) => {
    if (bloqueadoParaEdicao) {
      alert('Edição bloqueada: este projeto já foi aprovado.');
      return;
    }
    setListaMdfs((prev) => {
      const atualizados = prev.map((item) =>
        item.id === id ? { ...item, custoUnitario: Math.max(0, preco) } : item
      );
      salvarCatalogoMdfs(atualizados);
      return atualizados;
    });
  };

  const adicionarNovoMdf = async () => {
    if (!temClienteInformado) {
      setErroMensagem('Orçamento bloqueado: informe o nome do cliente antes de cadastrar materiais.');
      setGavetaClienteAberta(true);
      return;
    }
    if (bloqueadoParaEdicao) {
      alert('Edição bloqueada.');
      return;
    }
    if (!novoMdfNome || !novoMdfNome.trim()) return;

    const vPreco = Number(novoMdfPreco) > 0 ? Number(novoMdfPreco) : 250;
    const novo: MaterialPlanilha = {
      id: `mdf-custom-${Date.now()}`,
      codigo: `mdf-custom-${Date.now()}`,
      nome: novoMdfNome.trim().toUpperCase(),
      tipo: 'CHAPA',
      custoUnitarioPadrao: vPreco,
      custoUnitario: vPreco,
      quantidade: 1, // Já adiciona com 1 chapa para conveniência
      unidadeMedida: 'UN',
      espessuraMm: Number(novoMdfEspessura) || 15,
      personalizado: true,
    };

    setListaMdfs((prev) => {
      const atualizado = [...prev, novo];
      salvarCatalogoMdfs(atualizado);
      return atualizado;
    });

    try {
      await api.cadastrarInsumo({
        nome: novo.nome,
        tipo: 'CHAPA',
        custoUnitario: novo.custoUnitario,
        unidadeMedida: 'UN',
      });
    } catch (e) {
      // Salvo em localStorage
    }

    setNovoMdfNome('');
    setNovoMdfPreco('');
    setSucessoMensagem(`MDF "${novo.nome}" cadastrado com sucesso e adicionado ao orçamento!`);
    setTimeout(() => setSucessoMensagem(null), 4000);
  };

  const removerMdf = (id: string) => {
    if (bloqueadoParaEdicao) return;
    setListaMdfs((prev) => {
      const filtrado = prev.filter((m) => m.id !== id);
      salvarCatalogoMdfs(filtrado);
      return filtrado;
    });
  };

  // Ações de Atualização das Ferramentas
  const atualizarQtdFerramenta = (id: string, qtd: number) => {
    if (bloqueadoParaEdicao) {
      alert('Edição bloqueada: este projeto já foi aprovado com sinal pago (50%) ou está em produção/montagem.');
      return;
    }
    setListaFerramentas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantidade: Math.max(0, qtd) } : item))
    );
  };

  const alterarQtdFerramentaPorDelta = (id: string, delta: number) => {
    if (bloqueadoParaEdicao) {
      alert('Edição bloqueada: este projeto já foi aprovado com sinal pago (50%) ou está em produção/montagem.');
      return;
    }
    setListaFerramentas((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantidade: Math.max(0, (Number(item.quantidade) || 0) + delta) } : item
      )
    );
  };

  const atualizarPrecoFerramenta = (id: string, preco: number) => {
    if (bloqueadoParaEdicao) {
      alert('Edição bloqueada: este projeto já foi aprovado.');
      return;
    }
    setListaFerramentas((prev) => {
      const atualizados = prev.map((item) =>
        item.id === id ? { ...item, custoUnitario: Math.max(0, preco) } : item
      );
      salvarCatalogoFerramentas(atualizados);
      return atualizados;
    });
  };

  const adicionarNovaFerramenta = async () => {
    if (!temClienteInformado) {
      setErroMensagem('Orçamento bloqueado: informe o nome do cliente antes de cadastrar ferramentas.');
      setGavetaClienteAberta(true);
      return;
    }
    if (bloqueadoParaEdicao) {
      alert('Edição bloqueada.');
      return;
    }
    if (!novaFerrNome || !novaFerrNome.trim()) return;

    const vPreco = Number(novaFerrPreco) > 0 ? Number(novaFerrPreco) : 20;
    const novo: MaterialPlanilha = {
      id: `ferr-custom-${Date.now()}`,
      codigo: `ferr-custom-${Date.now()}`,
      nome: novaFerrNome.trim().toUpperCase(),
      tipo: 'FERRAGEM',
      custoUnitarioPadrao: vPreco,
      custoUnitario: vPreco,
      quantidade: 1, // Já adiciona com 1 unidade para conveniência
      unidadeMedida: novaFerrUnidade || 'un',
      personalizado: true,
    };

    setListaFerramentas((prev) => {
      const atualizado = [...prev, novo];
      salvarCatalogoFerramentas(atualizado);
      return atualizado;
    });

    try {
      await api.cadastrarInsumo({
        nome: novo.nome,
        tipo: 'FERRAGEM',
        custoUnitario: novo.custoUnitario,
        unidadeMedida: novo.unidadeMedida,
      });
    } catch (e) {
      // Salvo em localStorage
    }

    setNovaFerrNome('');
    setNovaFerrPreco('');
    setSucessoMensagem(`Item "${novo.nome}" cadastrado com sucesso e adicionado ao orçamento!`);
    setTimeout(() => setSucessoMensagem(null), 4000);
  };

  const removerFerramenta = (id: string) => {
    if (bloqueadoParaEdicao) return;
    setListaFerramentas((prev) => {
      const filtrado = prev.filter((f) => f.id !== id);
      salvarCatalogoFerramentas(filtrado);
      return filtrado;
    });
  };

  // Mapeamento dinâmico de compatibilidade (para Bancada, Contratos e PDFs)
  const pecas = useMemo<PecaItem[]>(() => {
    return mdfsAtivos.map((m, idx) => ({
      id: `mdf-item-${idx}-${m.id}`,
      descricao: m.nome,
      quantidade: m.quantidade,
      valorUnitario: m.custoUnitario,
      valorTotal: m.quantidade * m.custoUnitario,
      tipoChapaManual: m.nome,
      comprimentoMm: 2750,
      larguraMm: 1850,
      espessuraMm: m.espessuraMm || 15,
      chapaInsumoId: m.id,
      orientacaoVeio: 'LONGITUDINAL',
    }));
  }, [mdfsAtivos]);

  const ferragens = useMemo<FerragemItem[]>(() => {
    return ferramentasAtivas.map((f, idx) => ({
      id: `ferr-${idx}-${f.id}`,
      nome: f.nome,
      quantidade: f.quantidade,
      custoUnitario: f.custoUnitario,
      valorTotal: f.quantidade * f.custoUnitario,
      unidade: f.unidadeMedida || 'un',
    }));
  }, [ferramentasAtivas]);

  // Engenharia de Custos e Precificação (Baseado nas Tabelas da Planilha)
  const calculo = useMemo(() => {
    // 1. Somatório das chapas de MDF (VALOR TOTAL DOS MDFs SOMADOS)
    const totalMdfsSomados = listaMdfs.reduce((acc, m) => {
      const qtd = Number(m.quantidade) || 0;
      const preco = Number(m.custoUnitario) || 0;
      return acc + (qtd * preco);
    }, 0);

    const totalChapasInteiras = listaMdfs.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0);

    // 2. Custo Ferramentas, Fitas e Insumos (VALOR TOTAL DAS FERRAMENTAS SOMADAS)
    const custoFerragens = listaFerramentas.reduce((acc, f) => {
      const qtd = Number(f.quantidade) || 0;
      const preco = Number(f.custoUnitario) || 0;
      return acc + (qtd * preco);
    }, 0);

    // 3. Custo Total dos Materiais (VALOR FINAL DO MATERIAL da Planilha)
    const custoTotalMateriais = totalMdfsSomados + custoFerragens;

    // 4. Preço Final de Venda (Multiplicador comercial)
    const valorFinalVenda = custoTotalMateriais * multiplicador;

    // 5. Cálculo Dinâmico do Sinal e Entrega Selecionados pelo Usuário
    let valorSinal = 0;
    let percentualEfetivo = percentualSinal;
    if (valorSinalManual !== null && valorSinalManual >= 0 && valorFinalVenda > 0) {
      valorSinal = Math.min(valorFinalVenda, valorSinalManual);
      percentualEfetivo = Math.round((valorSinal / valorFinalVenda) * 100);
    } else {
      valorSinal = valorFinalVenda * (percentualSinal / 100);
    }
    const valorEntrega = Math.max(0, valorFinalVenda - valorSinal);
    const percentualEntrega = Math.max(0, 100 - percentualEfetivo);
    const lucroBruto = valorFinalVenda - custoTotalMateriais;

    return {
      areaTotalChapaM2: 0,
      areaComPercaM2: 0,
      totalChapasInteiras,
      custoChapas: totalMdfsSomados,
      metrosFitaBorda: 0,
      custoFitas: 0,
      totalPecasSomadas: totalMdfsSomados,
      totalMdfsSomados,
      custoFerragens,
      custoTotalMateriais,
      multiplicadorMateriais: multiplicador,
      valorFinalVenda,
      percentualSinal: percentualEfetivo,
      percentualEntrega,
      valorSinal,
      valorEntrega,
      valorSinal50: valorSinal,
      valorEntrega50: valorEntrega,
      lucroBruto,
    };
  }, [listaMdfs, listaFerramentas, multiplicador, percentualSinal, valorSinalManual]);

  // Salva ou altera o orçamento no Kanban na etapa especificada ('ORCAMENTO' ou 'APROVADO')
  const handleSalvarOrcamento = async (statusDestino?: 'ORCAMENTO' | 'APROVADO') => {
    if (!clienteNome || !clienteNome.trim()) {
      setErroMensagem('Por favor, preencha o Nome do Cliente para salvar o orçamento.');
      setGavetaClienteAberta(true);
      return;
    }
    if (mdfsAtivos.length === 0 && ferramentasAtivas.length === 0) {
      setErroMensagem('Informe a quantidade de pelo menos um MDF ou ferramenta antes de salvar o orçamento.');
      return;
    }

    setSalvandoPedido(true);
    setErroMensagem(null);

    try {
      const codProjeto = clienteSelecionadoObj?.codigo || `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`;
      const statusFinal: StatusProjeto = statusDestino || (clienteSelecionadoObj?.status === 'APROVADO' ? 'APROVADO' : 'ORCAMENTO');

      const pecas: PecaItem[] = mdfsAtivos.map((m) => ({
        id: `mdf-${m.id}`,
        descricao: m.nome,
        quantidade: m.quantidade,
        espessuraMm: m.espessuraMm || 15,
        tipoChapaManual: m.nome,
        valorUnitario: m.custoUnitario,
        valorTotal: m.custoUnitario * m.quantidade,
      }));

      const ferragens: FerragemItem[] = ferramentasAtivas.map((f) => ({
        id: `ferr-${f.id}`,
        nome: f.nome,
        quantidade: f.quantidade,
        custoUnitario: f.custoUnitario,
        unidade: f.unidadeMedida || 'un',
        valorTotal: f.custoUnitario * f.quantidade,
      }));

      const proximoPrj = {
        id: clienteSelecionadoObj?.id || clienteSelecionadoObj?.codigo || Math.random().toString(),
        codigo: codProjeto,
        cliente: clienteNome.trim(),
        cpf: clienteCpf,
        cep: clienteCep,
        telefone: clienteTelefone || '(11) 90000-0000',
        endereco: clienteEndereco || clienteSelecionadoObj?.endereco || 'Endereço cadastrado no orçamento',
        ambiente: ambiente || 'Móvel Sob Medida',
        status: statusFinal,
        valorTotal: calculo.valorFinalVenda,
        percentualSinal: calculo.percentualSinal,
        valorSinal: calculo.valorSinal,
        valorEntrega: calculo.valorEntrega,
        sinalPago: statusFinal === 'ORCAMENTO' ? false : (clienteSelecionadoObj?.sinalPago ?? false),
        prazoDias: clienteSelecionadoObj?.prazoDias || 15,
        horasEstimadas: Math.max(8, calculo.totalChapasInteiras * 4),
        dataCriacao: clienteSelecionadoObj?.dataCriacao || new Date().toISOString(),
        produtos: [
          {
            id: clienteSelecionadoObj?.produtos?.[0]?.id || Math.random().toString(),
            nome: nomeMovel || 'Móvel Sob Medida',
            descricao: `Orçamento com ${calculo.totalChapasInteiras} chapas MDF e ${ferramentasAtivas.length} ferramentas/insumos`,
            quantidade: 1,
            dimensoes: 'Sob Medida',
            material: mdfsAtivos.map((m) => `${m.quantidade}x ${m.nome}`).join(' + ') || 'MDF Sob Medida',
            ferragensResumo: ferramentasAtivas.map((f) => `${f.quantidade}x ${f.nome}`).slice(0, 4).join(', ') || 'Insumos gerais',
            pecasQtd: calculo.totalChapasInteiras || 1,
            pecas: pecas,
            ferragens: ferragens,
          },
        ],
      };

      if (onPedidoCriado) {
        onPedidoCriado(proximoPrj);
      }

      // Sincroniza status e valores exatos no backend caso exista projeto com esse código
      api.atualizarStatusProjeto(codProjeto, statusFinal, {
        cliente: clienteNome,
        telefone: clienteTelefone,
        ambiente: ambiente,
        valorTotal: calculo.valorFinalVenda,
        custoMateriais: calculo.custoTotalMateriais,
      }).catch(() => {});

      const nomeFase = statusFinal === 'ORCAMENTO' ? '2. Orçamento (BOM)' : '3. Aprovado';
      setSucessoMensagem(
        `Orçamento de "${clienteNome}" salvo com sucesso! O projeto foi atualizado na etapa "${nomeFase}" no Kanban.`
      );
      setTimeout(() => setSucessoMensagem(null), 8000);
    } catch (err) {
      setErroMensagem('Não foi possível salvar o orçamento. Tente novamente.');
    } finally {
      setSalvandoPedido(false);
    }
  };

  const handleSalvarOrcamentoAguardandoSinal = () => handleSalvarOrcamento('APROVADO');

  // Envia o pedido direto para o Backend H2 e Folha de Bancada
  const handleAprovarEEnviarParaBancada = async () => {
    if (!clienteNome.trim()) {
      setErroMensagem('Por favor, informe o Nome do Cliente.');
      return;
    }
    if (mdfsAtivos.length === 0 && ferramentasAtivas.length === 0) {
      setErroMensagem('Informe a quantidade de pelo menos um MDF ou ferramenta antes de enviar para a bancada.');
      return;
    }

    setSalvandoPedido(true);
    setErroMensagem(null);

    const payloadPecas = mdfsAtivos.map((m) => ({
      descricao: m.nome,
      quantidade: m.quantidade,
      comprimentoMm: 2750,
      larguraMm: 1850,
      espessuraMm: m.espessuraMm || 15,
      orientacaoVeio: 'LONGITUDINAL' as const,
      fitaComprimento1: false,
      fitaComprimento2: false,
      fitaLargura1: false,
      fitaLargura2: false,
      chapaInsumoId: m.id,
    }));

    try {
      const pedidoCriado = await api.criarPedidoProducao({
        nomeCliente: clienteNome,
        telefone: clienteTelefone,
        nomeMovel: nomeMovel,
        ambiente: ambiente,
        valorTotal: calculo.valorFinalVenda,
        custoMateriais: calculo.custoTotalMateriais,
        pecas: payloadPecas,
      });

      setSucessoMensagem(
        `Sucesso! Pedido do cliente "${clienteNome}" salvo no H2 com a ${pedidoCriado.codigoOP || 'OP'}. Materiais enviados para a Folha de Bancada!`
      );

      if (onPedidoCriado) {
        const proximoPrj = {
          id: Math.random().toString(),
          codigo: pedidoCriado.codigoProjeto || `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`,
          cliente: clienteNome,
          cpf: clienteCpf,
          cep: clienteCep,
          telefone: clienteTelefone,
          endereco: clienteEndereco || 'Endereço cadastrado no orçamento',
          ambiente: ambiente || 'Móvel Sob Medida',
          status: 'EM_PRODUCAO',
          valorTotal: calculo.valorFinalVenda,
          percentualSinal: calculo.percentualSinal,
          valorSinal: calculo.valorSinal,
          valorEntrega: calculo.valorEntrega,
          sinalPago: true,
          prazoDias: 15,
          horasEstimadas: Math.max(8, calculo.totalChapasInteiras * 4),
          produtos: [
            {
              id: pedidoCriado.id || Math.random().toString(),
              nome: nomeMovel,
              descricao: `Módulo sob medida com ${calculo.totalChapasInteiras} chapas MDF`,
              quantidade: 1,
              dimensoes: 'Sob Medida',
              material: mdfsAtivos.map((m) => `${m.quantidade}x ${m.nome}`).join(' + ') || 'MDF Branco 15mm',
              ferragensResumo: ferramentasAtivas.map((f) => `${f.quantidade}x ${f.nome}`).slice(0, 3).join(', '),
              pecasQtd: calculo.totalChapasInteiras || 1,
              pecas: pecas,
              ferragens: ferragens,
            },
          ],
        };
        onPedidoCriado(proximoPrj);
      }

      setTimeout(() => {
        if (onIrParaBancada) {
          onIrParaBancada();
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      setErroMensagem('Não foi possível salvar o pedido no backend H2. Certifique-se de que o backend está rodando.');
    } finally {
      setSalvandoPedido(false);
    }
  };

  // 1.1 Seleção de Cliente Existente com Reidratação Automática de Materiais (Zero Perda de Dados)
  const handleSelecionarClienteExistente = (chave: string) => {
    setClienteSelecionadoKey(chave);
    if (chave === '__novo__') {
      setClienteNome('');
      setClienteTelefone('');
      setClienteCpf('');
      setClienteCep('');
      setClienteEndereco('');
      setAmbiente('');
      setNomeMovel('');
      setListaMdfs((prev) => prev.map((m) => ({ ...m, quantidade: 0 })));
      setListaFerramentas((prev) => prev.map((f) => ({ ...f, quantidade: 0 })));
    } else {
      const encontrado = clientesExistentes?.find((c) => c.nome === chave);
      if (encontrado) {
        setClienteNome(encontrado.nome);
        setClienteTelefone(encontrado.telefone || '');
        setClienteCpf(encontrado.cpf || '');
        setClienteCep(encontrado.cep || '');
        setClienteEndereco(encontrado.endereco || '');
        if (encontrado.ambiente) setAmbiente(encontrado.ambiente);
        if (encontrado.produtos && encontrado.produtos[0]?.nome) {
          setNomeMovel(encontrado.produtos[0].nome);
        } else {
          setNomeMovel(encontrado.ambiente ? `Móvel ${encontrado.ambiente}` : '');
        }

        // Reidratação dos MDFs salvos no projeto
        const pecasSalvas = encontrado.produtos?.[0]?.pecas;
        if (pecasSalvas && pecasSalvas.length > 0) {
          setListaMdfs((prev) =>
            prev.map((mdf) => {
              const peca = pecasSalvas.find(
                (p: any) =>
                  p.descricao?.toLowerCase() === mdf.nome.toLowerCase() ||
                  p.tipoChapaManual?.toLowerCase() === mdf.nome.toLowerCase() ||
                  p.id === `mdf-${mdf.id}`
              );
              return peca
                ? { ...mdf, quantidade: peca.quantidade, custoUnitario: peca.valorUnitario || mdf.custoUnitario }
                : { ...mdf, quantidade: 0 };
            })
          );
        } else {
          setListaMdfs((prev) => prev.map((m) => ({ ...m, quantidade: 0 })));
        }

        // Reidratação das Ferramentas e Insumos salvas no projeto
        const ferragensSalvas = (encontrado.produtos?.[0] as any)?.ferragens as FerragemItem[] | undefined;
        if (ferragensSalvas && ferragensSalvas.length > 0) {
          setListaFerramentas((prev) =>
            prev.map((ferr) => {
              const item = ferragensSalvas.find(
                (f: any) => f.nome?.toLowerCase() === ferr.nome.toLowerCase() || f.id === `ferr-${ferr.id}`
              );
              return item
                ? { ...ferr, quantidade: item.quantidade, custoUnitario: item.custoUnitario || ferr.custoUnitario }
                : { ...ferr, quantidade: 0 };
            })
          );
        } else {
          setListaFerramentas((prev) => prev.map((f) => ({ ...f, quantidade: 0 })));
        }

        setGavetaClienteAberta(false);
      }
    }
  };

  // 1.2 Compartilhar Proposta via WhatsApp
  const handleCompartilharWhatsApp = () => {
    if (!clienteNome.trim()) {
      setErroMensagem('Por favor, informe o Nome do Cliente antes de enviar a proposta.');
      return;
    }

    let fone = clienteTelefone.replace(/\D/g, '');
    if (fone.length === 10 || fone.length === 11) {
      fone = '55' + fone;
    }

    const pecasTexto = mdfsAtivos.length > 0
      ? mdfsAtivos.map((p) => `• ${p.quantidade}x ${p.nome} (R$ ${p.custoUnitario.toFixed(2)}/un)`).join('\n')
      : '• Nenhum MDF selecionado';
    const ferragensTexto = ferramentasAtivas.length > 0
      ? ferramentasAtivas.map((f) => `• ${f.quantidade}x ${f.nome} (R$ ${f.custoUnitario.toFixed(2)}/${f.unidadeMedida || 'un'})`).join('\n')
      : '• Nenhum insumo adicional';
    const valorFormatado = calculo.valorFinalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const sinalFormatado = calculo.valorSinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const entregaFormatado = calculo.valorEntrega.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const mensagem =
      `*PROPOSTA COMERCIAL - MARCENARIA SOB MEDIDA* 🪵🪚\n\n` +
      `Olá, *${clienteNome}*! Segue a proposta detalhada para seu projeto:\n\n` +
      `📍 *Ambiente:* ${ambiente || 'Planejado'}\n` +
      `🚪 *Móvel:* ${nomeMovel || 'Móvel sob medida'}\n\n` +
      `🪵 *Relação de Chapas MDF:*\n${pecasTexto}\n\n` +
      `🔩 *Relação de Ferramentas & Insumos:*\n${ferragensTexto}\n\n` +
      `💰 *VALOR TOTAL DO INVESTIMENTO:* R$ ${valorFormatado}\n\n` +
      `💳 *Condições de Pagamento:* \n` +
      `• Sinal de ${calculo.percentualSinal}% no início da fabricação: R$ ${sinalFormatado}\n` +
      `• Saldo restante de ${calculo.percentualEntrega}% na Entrega e Montagem: R$ ${entregaFormatado}\n\n` +
      `Ficamos à total disposição para alinharmos e iniciarmos a produção!\n` +
      `_FH Móveis Planejados_`;

    const link = fone
      ? `https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(mensagem)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;

    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Mensagens de Feedback */}
      {sucessoMensagem && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-900 text-sm shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{sucessoMensagem}</span>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {onIrParaKanban && (
              <button
                onClick={onIrParaKanban}
                className="px-3 py-1.5 bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
              >
                Ver no Kanban →
              </button>
            )}
            {onIrParaBancada && (
              <button
                onClick={onIrParaBancada}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
              >
                Ver na Bancada →
              </button>
            )}
          </div>
        </div>
      )}

      {erroMensagem && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-800 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="font-medium">{erroMensagem}</span>
        </div>
      )}

      {/* 1. BARRA INTELIGENTE DO CLIENTE (1 LINHA - ULTRA COMPACTA & ÁGIL) */}
      <div className="bg-white border border-[#E7DFD5] rounded-2xl p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Bloco Esquerda: Seletor + Inputs Rápidos em Linha Única */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Seletor de Cliente Existente: Apenas Orçamento ou Aprovados */}
            <div className="min-w-[210px] max-w-[270px] flex-shrink-0">
              <select
                value={clienteSelecionadoKey}
                onChange={(e) => handleSelecionarClienteExistente(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-xl px-2.5 py-1.5 text-xs text-[#543A14] font-semibold focus:outline-none focus:border-[#D3A25D] truncate shadow-2xs"
                title="Selecione um projeto em Orçamento ou Aprovado para alterar"
              >
                <option value="__novo__">+ Novo Orçamento (Limpo)</option>
                {clientesNoOrcamento.map((c, idx) => {
                  const tag = c.status === 'APROVADO' ? '✓ APROVADO' : '📝 ORÇAMENTO';
                  return (
                    <option key={idx} value={c.nome}>
                      [{tag}] {c.nome} — {c.ambiente || 'Projeto'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Badge Indicador de Fase do Projeto Selecionado */}
            {clienteSelecionadoObj && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap hidden sm:inline-flex items-center space-x-1 ${
                  clienteSelecionadoObj.status === 'APROVADO'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                <span>Fase: {clienteSelecionadoObj.status === 'APROVADO' ? '3. Aprovado (Editável)' : '2. Orçamento (Editável)'}</span>
              </span>
            )}

            {/* Input Nome do Cliente */}
            <div className="relative flex-1 min-w-[160px]">
              <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                id="input-nome-cliente"
                type="text"
                value={clienteNome}
                onChange={(e) => {
                  setClienteNome(e.target.value);
                  if (erroMensagem && e.target.value.trim().length > 0) setErroMensagem(null);
                }}
                placeholder="Nome do Cliente *"
                className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-stone-900 font-semibold placeholder:text-stone-400 focus:outline-none focus:border-[#D3A25D]"
              />
            </div>

            {/* Input WhatsApp / Telefone */}
            <div className="relative w-36 sm:w-40 flex-shrink-0">
              <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:border-[#D3A25D]"
              />
            </div>

            {/* Input Ambiente */}
            <div className="relative w-32 sm:w-36 flex-shrink-0">
              <Home className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={ambiente}
                onChange={(e) => setAmbiente(e.target.value)}
                placeholder="Ambiente (Cozinha)"
                className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:border-[#D3A25D]"
              />
            </div>

            {/* Input Móvel */}
            <div className="relative w-36 sm:w-40 flex-shrink-0">
              <Package className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={nomeMovel}
                onChange={(e) => setNomeMovel(e.target.value)}
                placeholder="Móvel (Armário)"
                className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:border-[#D3A25D]"
              />
            </div>
          </div>

          {/* Bloco Direita: Botão de Abertura da Gaveta de Dados Completos */}
          <div className="flex items-center space-x-2 flex-shrink-0 justify-end">
            <button
              type="button"
              onClick={() => setGavetaClienteAberta(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border shadow-2xs ${
                clienteEndereco || clienteCpf
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-[#FAF7F2] text-stone-700 border-[#DFCDB7] hover:bg-[#EFE9DE]'
              }`}
              title="Abrir ficha cadastral completa (Endereço, CEP com busca automática, CPF para Contrato)"
            >
              <MapPin className="w-3.5 h-3.5 text-[#8C5E20]" />
              <span>{clienteEndereco || clienteCpf ? 'Endereço/CPF ✓' : 'Mais Dados / Endereço'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* GAVETA LATERAL DESLIZANTE DE DADOS COMPLETOS (SLIDE-OVER DRAWER) */}
      {gavetaClienteAberta && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setGavetaClienteAberta(false)}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          {/* Painel da Gaveta */}
          <div className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl border-l border-[#DFCDB7] flex flex-col z-10 animate-in slide-in-from-right duration-300">
            {/* Header da Gaveta */}
            <div className="p-4 bg-[#F5EFEB] border-b border-[#E7DFD5] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF5EC] border border-[#DFCDB7] flex items-center justify-center text-[#8C5E20] flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">Ficha Completa do Cliente & Obra</h3>
                  <p className="text-[11px] text-stone-500">Dados cadastrais para Contrato, Frete e Instalação</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGavetaClienteAberta(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-[#EAE1D3] rounded-lg transition-colors"
                title="Fechar gaveta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo com Scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Bloco 1: Identificação do Cliente */}
              <div className="space-y-3 bg-white border border-[#E7DFD5] p-4 rounded-xl shadow-2xs">
                <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-[#8C5E20]" />
                  <span>1. Identificação do Cliente</span>
                </h4>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-[#D3A25D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={clienteTelefone}
                      onChange={(e) => setClienteTelefone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-[#D3A25D]"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">CPF ou CNPJ</label>
                    <input
                      type="text"
                      value={clienteCpf}
                      onChange={(e) => setClienteCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-[#D3A25D]"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Local de Entrega & Montagem (ViaCEP Automático) */}
              <div className="space-y-3 bg-white border border-[#E7DFD5] p-4 rounded-xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#8C5E20]" />
                    <span>2. Local de Entrega & Montagem</span>
                  </h4>
                  <span className="text-[10px] text-[#8C5E20] font-mono">Busca CEP automática</span>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">CEP da Obra</label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={9}
                      value={clienteCep}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClienteCep(val);
                        buscarCep(val);
                      }}
                      placeholder="00000-000 (digite para preencher rua)"
                      className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-[#D3A25D]"
                    />
                    {buscandoCep && (
                      <span className="absolute right-3 top-2.5 text-[10px] text-[#8C5E20] font-semibold animate-pulse flex items-center space-x-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Buscando CEP...</span>
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Endereço Completo (Rua, Número, Bairro, Cidade)</label>
                  <textarea
                    rows={2}
                    value={clienteEndereco}
                    onChange={(e) => setClienteEndereco(e.target.value)}
                    placeholder="Rua das Madeiras, 100 - Bairro Centro - São Paulo/SP"
                    className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-[#D3A25D] resize-none"
                  />
                </div>
              </div>

              {/* Bloco 3: Ambiente & Móvel */}
              <div className="space-y-3 bg-white border border-[#E7DFD5] p-4 rounded-xl shadow-2xs">
                <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <Home className="w-3.5 h-3.5 text-[#8C5E20]" />
                  <span>3. Ambiente & Móvel Planejado</span>
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Ambiente</label>
                    <input
                      type="text"
                      value={ambiente}
                      onChange={(e) => setAmbiente(e.target.value)}
                      placeholder="Ex: Cozinha Gourmet"
                      className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-[#D3A25D]"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Nome do Móvel</label>
                    <input
                      type="text"
                      value={nomeMovel}
                      onChange={(e) => setNomeMovel(e.target.value)}
                      placeholder="Ex: Armário Superior"
                      className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-3 py-2 text-stone-900 font-medium focus:outline-none focus:border-[#D3A25D]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer da Gaveta */}
            <div className="p-4 bg-[#F5EFEB] border-t border-[#E7DFD5]">
              <button
                type="button"
                onClick={() => setGavetaClienteAberta(false)}
                className="w-full py-2.5 px-4 bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950 font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Voltar ao Orçamento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BARRA DO PASSO A PASSO (LIMPA, SEM DUPLICAÇÃO) */}
      <div className="bg-[#F5EFEB] border border-[#E7DFD5] rounded-2xl p-1.5 shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {/* Passo 1 */}
          <button
            type="button"
            onClick={() => tentarMudarPasso(1)}
            className={`p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
              passoAtivo === 1
                ? 'bg-white border-2 border-[#D3A25D] shadow-md shadow-[#D3A25D]/15'
                : 'bg-[#FAF7F2] border border-[#E7DFD5] hover:border-[#D3A25D]/40 hover:bg-white'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  passoAtivo === 1 ? 'bg-[#D3A25D] text-stone-950 shadow-sm' : 'bg-[#EBDDCF] text-stone-700'
                }`}
              >
                1
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-500">Etapa 1</div>
                <div className={`text-xs font-extrabold ${passoAtivo === 1 ? 'text-stone-950' : 'text-stone-700'}`}>
                  🪵 MDF e Madeiras
                </div>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[11px] font-mono font-bold text-[#8C5E20] bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#DFCDB7]">
                R$ {calculo.totalMdfsSomados.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({calculo.totalChapasInteiras} chapas)
              </span>
            </div>
          </button>

          {/* Passo 2 */}
          <button
            type="button"
            onClick={() => tentarMudarPasso(2)}
            className={`p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
              passoAtivo === 2
                ? 'bg-white border-2 border-[#D3A25D] shadow-md shadow-[#D3A25D]/15'
                : 'bg-[#FAF7F2] border border-[#E7DFD5] hover:border-[#D3A25D]/40 hover:bg-white'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  passoAtivo === 2 ? 'bg-[#D3A25D] text-stone-950 shadow-sm' : 'bg-[#EBDDCF] text-stone-700'
                }`}
              >
                2
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-500">Etapa 2</div>
                <div className={`text-xs font-extrabold ${passoAtivo === 2 ? 'text-stone-950' : 'text-stone-700'}`}>
                  🔩 Ferramentas & Insumos
                </div>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[11px] font-mono font-bold text-[#8C5E20] bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#DFCDB7]">
                R$ {calculo.custoFerragens.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({ferramentasAtivas.length} itens)
              </span>
            </div>
          </button>

          {/* Passo 3 */}
          <button
            type="button"
            onClick={() => tentarMudarPasso(3)}
            className={`p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
              passoAtivo === 3
                ? 'bg-white border-2 border-[#D3A25D] shadow-md shadow-[#D3A25D]/15'
                : 'bg-[#FAF7F2] border border-[#E7DFD5] hover:border-[#D3A25D]/40 hover:bg-white'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  passoAtivo === 3 ? 'bg-[#D3A25D] text-stone-950 shadow-sm' : 'bg-[#EBDDCF] text-stone-700'
                }`}
              >
                3
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-500">Etapa 3</div>
                <div className={`text-xs font-extrabold ${passoAtivo === 3 ? 'text-stone-950' : 'text-stone-700'}`}>
                  💰 Valores & Proposta
                </div>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                Total: R$ {calculo.valorFinalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. ETAPAS DO ORÇAMENTO */}
      {passoAtivo === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Tabela de MDFs e Madeiras da Planilha */}
          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-[#E7DFD5] pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#D3A25D]" />
                <h3 className="text-base font-bold text-stone-900 font-serif">1. MDF e Madeiras (Planilha Padrão)</h3>
              </div>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setFiltroApenasSelecionadosMdf(!filtroApenasSelecionadosMdf)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border shadow-xs ${
                    filtroApenasSelecionadosMdf
                      ? 'bg-[#D3A25D] text-stone-950 border-[#B88438]'
                      : 'bg-[#FAF7F2] text-stone-700 border-[#DFCDB7] hover:bg-[#EFE9DE]'
                  }`}
                  title="Ocultar chapas com quantidade 0 para uma visualização enxuta"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{filtroApenasSelecionadosMdf ? `Apenas Selecionados (${mdfsAtivos.length})` : `Ver Todos (${listaMdfs.length})`}</span>
                </button>
                <span className="text-xs text-stone-500 font-medium hidden sm:inline">
                  {calculo.totalChapasInteiras} chapas selecionadas
                </span>
              </div>
            </div>

            {/* Banner de Bloqueio apenas se Projeto Aprovado com Sinal no Kanban */}
            {bloqueadoParaEdicao && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-900 shadow-sm">
                <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm text-amber-800 flex items-center space-x-2">
                    <span>Móveis e Peças Bloqueados para Edição</span>
                    <span className="bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded text-[10px] border border-amber-300">
                      {clienteSelecionadoObj?.status}
                    </span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">
                    Este projeto já possui proposta <strong>aprovada com sinal pago (50%)</strong> ou está em fluxo de fabricação/montagem. Por segurança contratual, a relação de materiais não pode ser alterada.
                  </p>
                </div>
              </div>
            )}

            {/* Tabela de MDFs e Madeiras da Planilha */}
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-[#E7DFD5]">
                <table className="w-full text-xs text-left">
                  <thead className="text-stone-600 bg-[#FAF7F2] border-b border-[#E7DFD5] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">MATERIAL (MDF)</th>
                      <th className="py-2.5 px-3 text-right w-36">VALOR DO ITEM (R$)</th>
                      <th className="py-2.5 px-3 text-center w-36">QUANTIDADE</th>
                      <th className="py-2.5 px-3 text-right w-36">TOTAL (R$)</th>
                      <th className="py-2.5 px-3 text-center w-20">AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DFD5] text-stone-700 bg-white">
                    {listaMdfs
                      .filter((m) => !filtroApenasSelecionadosMdf || (Number(m.quantidade) || 0) > 0)
                      .map((mdf) => {
                        const totalLinha = (Number(mdf.custoUnitario) || 0) * (Number(mdf.quantidade) || 0);
                        const emUso = (Number(mdf.quantidade) || 0) > 0;
                        return (
                          <tr
                            key={mdf.id}
                            className={`transition-colors ${
                              emUso ? 'bg-amber-50/50 hover:bg-amber-50/80 font-medium' : 'hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-stone-900 flex items-center space-x-2">
                                <span>{mdf.nome}</span>
                                {mdf.personalizado && (
                                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-normal">
                                    Personalizado
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-stone-400">
                                Chapa Padrão • {mdf.espessuraMm ? `${mdf.espessuraMm}mm` : '15mm'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center space-x-1 justify-end">
                                <span className="text-stone-400 text-xs font-mono">R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  disabled={bloqueadoParaEdicao}
                                  value={mdf.custoUnitario}
                                  onChange={(e) => atualizarPrecoMdf(mdf.id, Number(e.target.value))}
                                  className="w-24 bg-white border border-[#D5CABE] rounded-lg px-2 py-1 text-right font-mono text-xs text-stone-900 focus:outline-none focus:border-[#D3A25D] focus:ring-1 focus:ring-[#D3A25D]"
                                  title="Editar preço base do MDF"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center space-x-1 justify-center">
                                <button
                                  type="button"
                                  disabled={bloqueadoParaEdicao || mdf.quantidade <= 0}
                                  onClick={() => alterarQtdMdfPorDelta(mdf.id, -1)}
                                  className="w-6 h-6 rounded bg-[#EFE9DE] hover:bg-[#DFCDB7] text-stone-800 font-bold flex items-center justify-center text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Diminuir quantidade"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  disabled={bloqueadoParaEdicao}
                                  placeholder="0"
                                  value={mdf.quantidade === 0 ? '' : mdf.quantidade}
                                  onChange={(e) => atualizarQtdMdf(mdf.id, Number(e.target.value) || 0)}
                                  className={`w-14 border rounded-lg px-1.5 py-1 text-center font-bold text-xs focus:outline-none transition-all ${
                                    emUso
                                      ? 'border-[#D3A25D] bg-amber-50 text-[#8C5E20] ring-1 ring-[#D3A25D]'
                                      : 'border-[#D5CABE] bg-white text-stone-700 hover:border-stone-400'
                                  } ${bloqueadoParaEdicao ? 'cursor-not-allowed opacity-60' : ''}`}
                                />
                                <button
                                  type="button"
                                  disabled={bloqueadoParaEdicao}
                                  onClick={() => alterarQtdMdfPorDelta(mdf.id, 1)}
                                  className="w-6 h-6 rounded bg-[#EFE9DE] hover:bg-[#DFCDB7] text-stone-800 font-bold flex items-center justify-center text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Aumentar quantidade"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span className={emUso ? 'text-emerald-700 text-sm' : 'text-stone-400'}>
                              R$ {totalLinha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {mdf.personalizado ? (
                              <button
                                type="button"
                                disabled={bloqueadoParaEdicao}
                                onClick={() => removerMdf(mdf.id)}
                                className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                                title="Remover MDF personalizado"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-stone-300 font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Linha/Card para adicionar novo MDF */}
              <div className="p-3.5 bg-[#FAF7F2] border border-[#DFCDB7] rounded-xl flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block mb-1">
                    + Cadastrar Novo MDF na Tabela
                  </label>
                  <input
                    type="text"
                    disabled={bloqueadoParaEdicao}
                    placeholder="Nome do MDF (ex: MDF NOGUEIRA 18MM, MDF ROSA GLAMOUR 15MM...)"
                    value={novoMdfNome}
                    onChange={(e) => setNovoMdfNome(e.target.value)}
                    className="w-full bg-white border border-[#D5CABE] rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#D3A25D]"
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block mb-1">
                    Valor Item (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={bloqueadoParaEdicao}
                    placeholder="0,00"
                    value={novoMdfPreco || ''}
                    onChange={(e) => setNovoMdfPreco(Number(e.target.value))}
                    className="w-full bg-white border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-xs text-stone-900 text-right font-mono focus:outline-none focus:border-[#D3A25D]"
                  />
                </div>
                <div className="w-full md:w-28">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block mb-1">
                    Espessura
                  </label>
                  <select
                    disabled={bloqueadoParaEdicao}
                    value={novoMdfEspessura}
                    onChange={(e) => setNovoMdfEspessura(Number(e.target.value))}
                    className="w-full bg-white border border-[#D5CABE] rounded-lg px-2 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#D3A25D]"
                  >
                    <option value={6}>6 mm</option>
                    <option value={15}>15 mm</option>
                    <option value={18}>18 mm</option>
                    <option value={25}>25 mm</option>
                  </select>
                </div>
                <div className="w-full md:w-auto self-end">
                  <button
                    type="button"
                    disabled={bloqueadoParaEdicao || !novoMdfNome.trim()}
                    onClick={adicionarNovoMdf}
                    className={`w-full md:w-auto px-4 py-2 font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-all ${
                      !novoMdfNome.trim()
                        ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                        : 'bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar MDF</span>
                  </button>
                </div>
              </div>

              {/* Totalizador no Canto Inferior Direito: VALOR TOTAL DOS MDFs SOMADOS */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-[#E7DFD5]">
                <div className="text-xs text-stone-500">
                  💡 Digite a quantidade de chapas necessárias para o projeto. O cálculo é atualizado instantaneamente.
                </div>
                <div className="bg-[#FAF7F2] border-2 border-[#D3A25D] rounded-xl p-3.5 text-right shadow-sm min-w-[260px] self-end sm:self-auto">
                  <div className="text-2xl font-mono font-extrabold text-stone-900">
                    R$ {calculo.totalMdfsSomados.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C5E20] block mt-1">
                    VALOR TOTAL DOS MDFs SOMADOS
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé de Navegação da Etapa 1 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E7DFD5] mt-4">
              <div className="text-xs text-stone-600">
                <span className="font-bold text-stone-900">{calculo.totalChapasInteiras} chapas de MDF</span> selecionadas para o projeto
              </div>
              <button
                type="button"
                onClick={() => tentarMudarPasso(2)}
                className={`w-full sm:w-auto px-6 py-2.5 font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-2 ${
                  !temClienteInformado
                    ? 'bg-stone-200 text-stone-500 border border-stone-300'
                    : 'bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950'
                }`}
              >
                {!temClienteInformado && <Lock className="w-3.5 h-3.5" />}
                <span>Avançar para Ferramentas & Insumos (Etapa 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ETAPAS DO ORÇAMENTO - ETAPA 2 */}
      {passoAtivo === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Ferramentas, Fitas e Insumos */}
          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-[#E7DFD5] pb-3">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#D3A25D]" />
                <h3 className="text-base font-bold text-stone-900 font-serif">2. Ferramentas, Fitas e Insumos (Planilha Padrão)</h3>
              </div>
              <span className="text-xs text-stone-500 font-medium">
                {ferramentasAtivas.length} itens selecionados ({listaFerramentas.length} itens cadastrados)
              </span>
            </div>

            {/* Banner de Bloqueio apenas se Projeto Aprovado com Sinal */}
            {bloqueadoParaEdicao && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-900 shadow-sm">
                <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm text-amber-800 flex items-center space-x-2">
                    <span>Ferramentas Bloqueadas para Edição</span>
                    <span className="bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded text-[10px] border border-amber-300">
                      {clienteSelecionadoObj?.status}
                    </span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">
                    Este projeto já possui proposta aprovada com sinal pago ou está em produção/montagem. A relação de insumos está travada para garantir integridade nas compras.
                  </p>
                </div>
              </div>
            )}

            {/* Busca Rápida de Ferramentas / Insumos e Filtro */}
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar ferramenta ou insumo (ex: corrediça, cola, parafuso...)"
                  value={buscaFerramenta}
                  onChange={(e) => setBuscaFerramenta(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#D3A25D]"
                />
              </div>
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setFiltroApenasSelecionadosFerr(!filtroApenasSelecionadosFerr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border shadow-xs ${
                    filtroApenasSelecionadosFerr
                      ? 'bg-[#D3A25D] text-stone-950 border-[#B88438]'
                      : 'bg-[#FAF7F2] text-stone-700 border-[#DFCDB7] hover:bg-[#EFE9DE]'
                  }`}
                  title="Ocultar ferramentas com quantidade 0 para uma visualização enxuta"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{filtroApenasSelecionadosFerr ? `Apenas Selecionados (${ferramentasAtivas.length})` : `Ver Todos (${listaFerramentas.length})`}</span>
                </button>
                <div className="text-xs text-stone-500 font-medium hidden sm:block">
                  {ferramentasAtivas.length} com quantidade lançada
                </div>
              </div>
            </div>

            {/* Tabela de Ferramentas e Insumos da Planilha */}
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-[#E7DFD5] max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-stone-600 bg-[#FAF7F2] border-b border-[#E7DFD5] uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="py-2.5 px-3">FERRAMENTA / INSUMO</th>
                      <th className="py-2.5 px-3 w-24">UNIDADE</th>
                      <th className="py-2.5 px-3 text-right w-36">VALOR DO ITEM (R$)</th>
                      <th className="py-2.5 px-3 text-center w-36">QUANTIDADE</th>
                      <th className="py-2.5 px-3 text-right w-36">TOTAL (R$)</th>
                      <th className="py-2.5 px-3 text-center w-20">AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DFD5] text-stone-700 bg-white">
                    {listaFerramentas
                      .filter((f) => !buscaFerramenta || f.nome.toLowerCase().includes(buscaFerramenta.toLowerCase()))
                      .filter((f) => !filtroApenasSelecionadosFerr || (Number(f.quantidade) || 0) > 0)
                      .map((ferr) => {
                        const totalLinha = (Number(ferr.custoUnitario) || 0) * (Number(ferr.quantidade) || 0);
                        const emUso = (Number(ferr.quantidade) || 0) > 0;
                        return (
                          <tr
                            key={ferr.id}
                            className={`transition-colors ${
                              emUso ? 'bg-amber-50/50 hover:bg-amber-50/80 font-medium' : 'hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-stone-900 flex items-center space-x-2">
                                <span>{ferr.nome}</span>
                                {ferr.personalizado && (
                                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-normal">
                                    Personalizado
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="bg-[#FAF5EC] text-[#8C5E20] border border-[#DFCDB7] px-2 py-0.5 rounded text-[11px] font-mono">
                                {ferr.unidadeMedida || 'un'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center space-x-1 justify-end">
                                <span className="text-stone-400 text-xs font-mono">R$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  disabled={bloqueadoParaEdicao}
                                  value={ferr.custoUnitario}
                                  onChange={(e) => atualizarPrecoFerramenta(ferr.id, Number(e.target.value))}
                                  className="w-24 bg-white border border-[#D5CABE] rounded-lg px-2 py-1 text-right font-mono text-xs text-stone-900 focus:outline-none focus:border-[#D3A25D] focus:ring-1 focus:ring-[#D3A25D]"
                                  title="Editar preço base da ferramenta"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <div className="inline-flex items-center space-x-1 justify-center">
                                <button
                                  type="button"
                                  disabled={bloqueadoParaEdicao || ferr.quantidade <= 0}
                                  onClick={() => alterarQtdFerramentaPorDelta(ferr.id, -1)}
                                  className="w-6 h-6 rounded bg-[#EFE9DE] hover:bg-[#DFCDB7] text-stone-800 font-bold flex items-center justify-center text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Diminuir quantidade"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  disabled={bloqueadoParaEdicao}
                                  placeholder="0"
                                  value={ferr.quantidade === 0 ? '' : ferr.quantidade}
                                  onChange={(e) => atualizarQtdFerramenta(ferr.id, Number(e.target.value) || 0)}
                                  className={`w-14 border rounded-lg px-1.5 py-1 text-center font-bold text-xs focus:outline-none transition-all ${
                                    emUso
                                      ? 'border-[#D3A25D] bg-amber-50 text-[#8C5E20] ring-1 ring-[#D3A25D]'
                                      : 'border-[#D5CABE] bg-white text-stone-700 hover:border-stone-400'
                                  } ${bloqueadoParaEdicao ? 'cursor-not-allowed opacity-60' : ''}`}
                                />
                                <button
                                  type="button"
                                  disabled={bloqueadoParaEdicao}
                                  onClick={() => alterarQtdFerramentaPorDelta(ferr.id, 1)}
                                  className="w-6 h-6 rounded bg-[#EFE9DE] hover:bg-[#DFCDB7] text-stone-800 font-bold flex items-center justify-center text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Aumentar quantidade"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              <span className={emUso ? 'text-emerald-700 text-sm' : 'text-stone-400'}>
                                R$ {totalLinha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {ferr.personalizado ? (
                                <button
                                  type="button"
                                  disabled={bloqueadoParaEdicao}
                                  onClick={() => removerFerramenta(ferr.id)}
                                  className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                                  title="Remover ferramenta personalizada"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-stone-300 font-mono">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Linha/Card para adicionar nova Ferramenta / Insumo */}
              <div className="p-3.5 bg-[#FAF7F2] border border-[#DFCDB7] rounded-xl flex flex-col md:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block mb-1">
                    + Cadastrar Nova Ferramenta / Insumo na Tabela
                  </label>
                  <input
                    type="text"
                    disabled={bloqueadoParaEdicao}
                    placeholder="Nome da ferramenta / insumo (ex: LIXA D'ÁGUA 220, FITA DUPLA FACE 3M...)"
                    value={novaFerrNome}
                    onChange={(e) => setNovaFerrNome(e.target.value)}
                    className="w-full bg-white border border-[#D5CABE] rounded-lg px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#D3A25D]"
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block mb-1">
                    Valor Item (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={bloqueadoParaEdicao}
                    placeholder="0,00"
                    value={novaFerrPreco || ''}
                    onChange={(e) => setNovaFerrPreco(Number(e.target.value))}
                    className="w-full bg-white border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-xs text-stone-900 text-right font-mono focus:outline-none focus:border-[#D3A25D]"
                  />
                </div>
                <div className="w-full md:w-28">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block mb-1">
                    Unidade
                  </label>
                  <select
                    disabled={bloqueadoParaEdicao}
                    value={novaFerrUnidade}
                    onChange={(e) => setNovaFerrUnidade(e.target.value)}
                    className="w-full bg-white border border-[#D5CABE] rounded-lg px-2 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#D3A25D]"
                  >
                    <option value="un">un (unidade)</option>
                    <option value="par">par</option>
                    <option value="rolo">rolo</option>
                    <option value="barra">barra</option>
                    <option value="cento">cento</option>
                    <option value="tubo">tubo</option>
                    <option value="lata">lata</option>
                    <option value="litro">litro</option>
                    <option value="pacote">pacote</option>
                    <option value="kit">kit</option>
                  </select>
                </div>
                <div className="w-full md:w-auto self-end">
                  <button
                    type="button"
                    disabled={bloqueadoParaEdicao || !novaFerrNome.trim()}
                    onClick={adicionarNovaFerramenta}
                    className={`w-full md:w-auto px-4 py-2 font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm transition-all ${
                      !novaFerrNome.trim()
                        ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed'
                        : 'bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Ferramenta</span>
                  </button>
                </div>
              </div>

              {/* Totalizador no Canto Inferior Direito: VALOR TOTAL DAS FERRAMENTAS SOMADAS */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-[#E7DFD5]">
                <div className="text-xs text-stone-500">
                  💡 Os valores de ferramentas e insumos são somados diretamente ao custo dos materiais.
                </div>
                <div className="bg-[#FAF7F2] border-2 border-[#D3A25D] rounded-xl p-3.5 text-right shadow-sm min-w-[260px] self-end sm:self-auto">
                  <div className="text-2xl font-mono font-extrabold text-stone-900">
                    R$ {calculo.custoFerragens.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C5E20] block mt-1">
                    VALOR TOTAL DAS FERRAMENTAS SOMADAS
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé de Navegação da Etapa 2 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E7DFD5] mt-4">
              <button
                type="button"
                onClick={() => tentarMudarPasso(1)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-800 border border-[#DFCDB7] font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para MDF e Madeiras (Etapa 1)</span>
              </button>
              <button
                type="button"
                onClick={() => tentarMudarPasso(3)}
                className={`w-full sm:w-auto px-6 py-2.5 font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-2 ${
                  !temClienteInformado
                    ? 'bg-stone-200 text-stone-500 border border-stone-300'
                    : 'bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950'
                }`}
              >
                {!temClienteInformado && <Lock className="w-3.5 h-3.5" />}
                <span>Avançar para Valores & Proposta (Etapa 3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ETAPAS DO ORÇAMENTO - ETAPA 3: VALORES, CUSTOS & FECHAMENTO */}
      {passoAtivo === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            {/* Cabeçalho da Etapa 3 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7DFD5] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EC] border border-[#DFCDB7] flex items-center justify-center text-[#8C5E20] flex-shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">3. Engenharia de Custos, Precificação & Proposta</h3>
                  <p className="text-xs text-stone-500">
                    Composição somada dos insumos, margem comercial e opções de envio ao cliente ou bancada.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto text-xs font-mono font-bold text-[#8C5E20] bg-[#FAF5EC] px-3 py-1 rounded-full border border-[#DFCDB7]">
                Multiplicador Atual: {multiplicador.toFixed(1)}×
              </span>
            </div>

            {/* Grid Amplo de 2 Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Coluna 1: Custos dos Materiais & Multiplicador */}
              <div className="space-y-5">
                {/* Resumo Consolidado dos Custos */}
                <div className="p-4 bg-[#FAF7F2] border border-[#E7DFD5] rounded-xl space-y-3">
                  <div className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center justify-between border-b border-[#E7DFD5] pb-2">
                    <span>Composição dos Custos Diretos</span>
                    <span className="text-[10px] text-[#8C5E20] font-normal">Soma automática</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-stone-500" />
                      <span className="text-stone-700">1. MDF e Madeiras ({calculo.totalChapasInteiras} chapas / {mdfsAtivos.length} tipos):</span>
                    </div>
                    <span className="font-mono font-bold text-stone-900">
                      R$ {calculo.totalPecasSomadas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-stone-500" />
                      <span className="text-stone-700">2. Ferramentas, Fitas e Insumos ({ferramentasAtivas.length} itens):</span>
                    </div>
                    <span className="font-mono font-bold text-[#8C5E20]">
                      R$ {calculo.custoFerragens.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-[#E7DFD5] flex justify-between items-center text-sm font-bold text-stone-900">
                    <span>VALOR FINAL DO MATERIAL (Planilha):</span>
                    <span className="bg-[#FAF5EC] text-[#8C5E20] border border-[#DFCDB7] px-3 py-1 rounded-lg font-mono text-base font-bold">
                      R$ {calculo.custoTotalMateriais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    Soma exata das chapas de MDF + ferramentas e insumos selecionados na planilha.
                  </p>
                </div>

                {/* Multiplicador Comercial e Lucro Bruto */}
                <div className="p-4 bg-[#FAF7F2] border border-[#DFCDB7] rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-stone-800">
                    <span>Multiplicador Comercial da Oficina:</span>
                    <span className="font-mono text-lg text-stone-900 bg-white px-2.5 py-0.5 rounded border border-[#D5CABE]">
                      {multiplicador.toFixed(1)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="4.5"
                    step="0.1"
                    value={multiplicador}
                    onChange={(e) => setMultiplicador(Number(e.target.value))}
                    className="w-full accent-[#D3A25D] bg-[#E7DFD5] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>1.5× (Custo)</span>
                    <span className="font-bold text-[#8C5E20]">2.0× (Padrão 2x)</span>
                    <span>3.0× (Mercado)</span>
                    <span>4.5× (Alto Padrão)</span>
                  </div>

                  <div className="pt-2 border-t border-[#E7DFD5] flex justify-between items-center text-xs">
                    <span className="text-stone-700">Lucro Bruto Estimado:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      R$ {calculo.lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Preço Final, Condições e Ações */}
              <div className="space-y-5">
                {/* PREÇO FINAL DE VENDA */}
                <div className="bg-[#FAF7F2] border-2 border-[#D3A25D] p-4 rounded-xl space-y-3 shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#8C5E20] block">
                      Valor Total do Projeto ({multiplicador.toFixed(1)}× sobre materiais)
                    </span>
                    <div className="text-3xl font-extrabold text-stone-950 font-mono mt-1">
                      R$ {calculo.valorFinalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* SELEÇÃO DINÂMICA DO SINAL E CONDIÇÕES DE PAGAMENTO */}
                  <div className="p-3.5 bg-white border border-[#E7DFD5] rounded-xl space-y-3 text-xs shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#E7DFD5] pb-2">
                      <span className="text-[11px] uppercase font-extrabold text-stone-800 tracking-wider">
                        Seleção do Sinal / Entrada
                      </span>
                      <span className="font-mono font-bold text-[#8C5E20] bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#DFCDB7] text-[11px]">
                        {calculo.percentualSinal}% de Sinal
                      </span>
                    </div>

                    {/* Botões Rápidos de Porcentagem */}
                    <div>
                      <span className="text-[10px] text-stone-500 font-semibold block mb-1.5">
                        Percentuais recomendados:
                      </span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[30, 40, 50, 60, 70].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setPercentualSinal(pct);
                              setValorSinalManual(null);
                            }}
                            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                              calculo.percentualSinal === pct && valorSinalManual === null
                                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/30 font-extrabold'
                                : 'bg-[#FAF7F2] text-stone-700 hover:bg-[#EFE9DE] border border-[#E7DFD5]'
                            }`}
                          >
                            {pct}% {pct === 50 ? '★' : ''}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Entradas Manuais: Porcentagem e Valor em R$ */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-1">
                          Percentual (%):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="5"
                            max="100"
                            step="1"
                            value={calculo.percentualSinal}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(100, Number(e.target.value) || 0));
                              setPercentualSinal(val);
                              setValorSinalManual(null);
                            }}
                            className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs text-stone-900 focus:outline-none focus:border-[#D3A25D]"
                          />
                          <span className="absolute right-2.5 top-1.5 text-xs text-stone-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block mb-1">
                          Ou Digite o Valor (R$):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max={calculo.valorFinalVenda}
                            step="50"
                            value={valorSinalManual !== null ? valorSinalManual : Math.round(calculo.valorSinal)}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setValorSinalManual(val);
                            }}
                            placeholder="R$ 0,00"
                            className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs text-stone-900 focus:outline-none focus:border-[#D3A25D]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resumo Consolidado: Sinal vs Saldo na Entrega */}
                    <div className="pt-2 border-t border-[#E7DFD5] space-y-1.5">
                      <div className="flex justify-between items-center text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <span>Sinal / Entrada ({calculo.percentualSinal}%):</span>
                        <span className="font-mono text-sm">
                          R$ {calculo.valorSinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sky-800 font-semibold bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-200">
                        <span>Saldo na Entrega ({calculo.percentualEntrega}%):</span>
                        <span className="font-mono text-sm">
                          R$ {calculo.valorEntrega.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AÇÕES DE ENVIO AO CLIENTE (WhatsApp e PDF) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCompartilharWhatsApp}
                    className="py-3 px-3 font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                    title="Compartilhar proposta detalhada no WhatsApp do cliente"
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalPdfAberto(true)}
                    className="py-3 px-3 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-800 border border-[#DFCDB7]"
                    title="Visualizar e Imprimir proposta em PDF para o cliente"
                  >
                    <Printer className="w-4 h-4 text-[#8C5E20] flex-shrink-0" />
                    <span>Gerar PDF / Imprimir</span>
                  </button>

                  {onGerarContrato && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!temClienteInformado) {
                          setGavetaClienteAberta(true);
                          setErroMensagem('Por favor, informe o nome do cliente no topo para gerar o contrato.');
                          return;
                        }

                        const codPrj = clienteSelecionadoObj?.codigo || `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`;
                        const proximoPrj = {
                          id: clienteSelecionadoObj?.codigo || Math.random().toString(),
                          codigo: codPrj,
                          cliente: clienteNome.trim(),
                          cpf: clienteCpf,
                          cep: clienteCep,
                          telefone: clienteTelefone || '(11) 90000-0000',
                          endereco: clienteEndereco || clienteSelecionadoObj?.endereco || 'Endereço cadastrado no orçamento',
                          ambiente: ambiente || 'Móvel Sob Medida',
                          status: (clienteSelecionadoObj?.status || 'APROVADO') as StatusProjeto,
                          valorTotal: calculo.valorFinalVenda,
                          percentualSinal: calculo.percentualSinal,
                          valorSinal: calculo.valorSinal,
                          valorEntrega: calculo.valorEntrega,
                          sinalPago: clienteSelecionadoObj?.sinalPago || false,
                          prazoDias: 15,
                          horasEstimadas: Math.max(8, calculo.totalChapasInteiras * 4),
                          produtos: [
                            {
                              id: Math.random().toString(),
                              nome: nomeMovel || 'Móvel Sob Medida',
                              descricao: `Orçamento com ${calculo.totalChapasInteiras} chapas MDF e ${ferramentasAtivas.length} ferramentas/insumos`,
                              quantidade: 1,
                              dimensoes: 'Sob Medida',
                              material: mdfsAtivos.map((m) => `${m.quantidade}x ${m.nome}`).join(' + ') || 'MDF Sob Medida',
                              ferragensResumo: ferramentasAtivas.map((f) => `${f.quantidade}x ${f.nome}`).slice(0, 4).join(', ') || 'Insumos gerais',
                              pecasQtd: calculo.totalChapasInteiras || 1,
                              pecas: pecas,
                              ferragens: ferragens,
                            },
                          ],
                        };

                        if (onPedidoCriado) {
                          onPedidoCriado(proximoPrj);
                        }

                        onGerarContrato(clienteNome, codPrj);
                      }}
                      className="py-3 px-3 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm bg-[#FAF5EC] hover:bg-[#F3EAD9] text-[#8C5E20] border border-[#DFCDB7]"
                      title="Gerar contrato de prestação de serviços com os móveis deste orçamento"
                    >
                      <FileSignature className="w-4 h-4 text-[#8C5E20] flex-shrink-0" />
                      <span>Gerar Contrato</span>
                    </button>
                  )}
                </div>

                {/* BOTÕES DE AÇÃO DO PROJETO */}
                {bloqueadoParaEdicao ? (
                  <button
                    disabled
                    className="w-full bg-[#FAF7F2] border border-[#E7DFD5] text-stone-500 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center space-x-2 cursor-not-allowed opacity-80"
                  >
                    <Lock className="w-4 h-4 text-[#8C5E20]" />
                    <span>Projeto Já em Produção / Concluído (Edição Bloqueada)</span>
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    {/* Botões contextuais de acordo com o projeto selecionado */}
                    {clienteSelecionadoObj?.status === 'ORCAMENTO' ? (
                      <>
                        {/* Projeto em Orçamento: Opção 1: Salvar Alterações no Orçamento */}
                        <button
                          disabled={salvandoPedido}
                          onClick={() => handleSalvarOrcamento('ORCAMENTO')}
                          className="w-full font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center space-x-2 bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950 disabled:opacity-50"
                          title="Salva as alterações e mantém o projeto na coluna 2. Orçamento no Kanban"
                        >
                          {salvandoPedido ? (
                            <span className="animate-pulse">Salvando alterações...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Salvar Alterações no Orçamento (Etapa 2)</span>
                            </>
                          )}
                        </button>

                        {/* Projeto em Orçamento: Opção 2: Aprovar Orçamento */}
                        <button
                          disabled={salvandoPedido}
                          onClick={() => handleSalvarOrcamento('APROVADO')}
                          className="w-full font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 disabled:opacity-50"
                          title={`Aprova este orçamento e move o projeto para a coluna 3. Aprovado (Aguardando Sinal ${calculo.percentualSinal}%) no Kanban`}
                        >
                          <span>Aprovar Orçamento (Mover para 3. Aprovado)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : clienteSelecionadoObj?.status === 'APROVADO' ? (
                      <>
                        {/* Projeto já Aprovado: Salvar Alterações no Projeto Aprovado */}
                        <button
                          disabled={salvandoPedido}
                          onClick={() => handleSalvarOrcamento('APROVADO')}
                          className="w-full font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center space-x-2 bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950 disabled:opacity-50"
                          title="Atualiza os materiais, MDFs e valores mantendo o projeto na coluna 3. Aprovado"
                        >
                          {salvandoPedido ? (
                            <span className="animate-pulse">Salvando alterações...</span>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Salvar Alterações do Orçamento Aprovado</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Novo Orçamento: Opções de Salvar como Orçamento ou Aprovado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            disabled={salvandoPedido}
                            onClick={() => handleSalvarOrcamento('ORCAMENTO')}
                            className="font-bold py-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-900 border border-[#DFCDB7] disabled:opacity-50"
                            title="Salva na coluna 2. Orçamento no Kanban para negociação"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-[#8C5E20]" />
                            <span>Salvar na Aba de Orçamento</span>
                          </button>

                          <button
                            disabled={salvandoPedido}
                            onClick={() => handleSalvarOrcamento('APROVADO')}
                            className="font-bold py-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950 disabled:opacity-50"
                            title={`Salva direto na coluna 3. Aprovado (Aguardando Sinal ${calculo.percentualSinal}%) no Kanban`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Salvar como Aprovado</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Botão de Envio Direto para a Bancada */}
                    <button
                      disabled={salvandoPedido}
                      onClick={handleAprovarEEnviarParaBancada}
                      className="w-full font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 disabled:opacity-50"
                      title="Envia o pedido para o Backend H2 e abre a Folha de Bancada para corte das chapas."
                    >
                      <span>Sinal Confirmado? Enviar Direto para a Bancada (Corte)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé de Navegação da Etapa 3 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E7DFD5] mt-2">
              <button
                type="button"
                onClick={() => tentarMudarPasso(2)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-800 border border-[#DFCDB7] font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Ferragens e Acessórios (Etapa 2)</span>
              </button>
              <div className="text-right text-xs text-stone-500 hidden sm:block">
                Etapa Final: Orçamento pronto para envio ao cliente e bancada
              </div>
            </div>
          </div>
        </div>
      )}



      {/* MODAL: VISUALIZAÇÃO E IMPRESSÃO DA PROPOSTA EM PDF */}
      {modalPdfAberto && (
        <div
          onClick={() => setModalPdfAberto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F2] text-stone-900 border border-[#DFCDB7] w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto"
          >
            {/* Barra de Ações Superior (Não aparece na impressão) */}
            <div className="p-4 bg-[#F5EFEB] text-stone-900 flex items-center justify-between border-b border-[#E7DFD5] print:hidden">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#8C5E20]" />
                <span className="font-bold text-sm text-stone-900">Visualização da Proposta Comercial (PDF)</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar em PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalPdfAberto(false)}
                  className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Documento Formatado em Papel Timbrado A4 */}
            <div className="p-8 space-y-6 flex-1 overflow-y-auto bg-white text-stone-900 font-sans">
              {/* Cabeçalho com Logo FH */}
              <div className="border-b-2 border-stone-800 pb-4 flex justify-between items-start">
                <div className="flex items-center space-x-3.5">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D3A25D] shadow-sm bg-transparent flex items-center justify-center flex-shrink-0">
                    <img src="/logo-fh.png" alt="FH Móveis Planejados" className="w-full h-full object-cover object-center" />
                  </div>
                  <div>
                    <div className="flex items-baseline font-serif">
                      <span className="font-bold text-3xl text-[#3D230A] tracking-tight leading-none">FH</span>
                      <span className="font-normal text-3xl text-[#966226] tracking-normal leading-none ml-2">Móveis planejados</span>
                    </div>
                    <p className="text-xs text-stone-800 font-sans mt-1 font-bold">FH Móveis Planejados LTDA • Mobiliário Sob Medida de Alto Padrão</p>
                    <p className="text-xs text-stone-600 font-sans">contato@fhmoveisplanejados.com.br • (11) 98877-6655</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold bg-[#FAF5EC] text-[#3B270C] px-2.5 py-1 rounded border border-[#DFCDB7]">
                    ORÇAMENTO Nº 2026-{Math.floor(1000 + Math.random() * 9000)}
                  </span>
                  <p className="text-xs text-stone-600 mt-1 font-medium">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="bg-[#FAF7F2] border border-[#E7DFD5] rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-500 block font-semibold">Cliente:</span>
                  <span className="text-sm font-bold text-stone-900">{clienteNome || 'Cliente não identificado'}</span>
                </div>
                <div>
                  <span className="text-stone-500 block font-semibold">Telefone / WhatsApp:</span>
                  <span className="text-sm font-bold text-stone-900">{clienteTelefone || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-stone-500 block font-semibold">Ambiente / Local:</span>
                  <span className="text-sm font-bold text-stone-900">{ambiente || 'Geral'}</span>
                </div>
                <div>
                  <span className="text-stone-500 block font-semibold">Móvel Solicitado:</span>
                  <span className="text-sm font-bold text-stone-900">{nomeMovel || 'Módulo Sob Medida'}</span>
                </div>
              </div>

              {/* Detalhamento das Peças de MDF e Madeiras */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 mb-2">
                  Especificações de MDF e Madeiras ({mdfsAtivos.length} tipos / {calculo.totalChapasInteiras} chapas)
                </h3>
                <table className="w-full text-left text-xs border border-[#E7DFD5] rounded-lg overflow-hidden">
                  <thead className="bg-[#FAF7F2] text-stone-700 font-bold border-b border-[#E7DFD5]">
                    <tr>
                      <th className="py-2 px-3">Item / MDF</th>
                      <th className="py-2 px-3 text-center">Qtd</th>
                      <th className="py-2 px-3">Espessura</th>
                      <th className="py-2 px-3 text-right">Valor Unit.</th>
                      <th className="py-2 px-3 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DFD5] bg-white">
                    {mdfsAtivos.map((m) => {
                      const vUnit = m.custoUnitario || 0;
                      const vTot = vUnit * m.quantidade;
                      return (
                        <tr key={m.id}>
                          <td className="py-2 px-3 font-semibold text-stone-900">{m.nome}</td>
                          <td className="py-2 px-3 text-center text-stone-700 font-bold">{m.quantidade}x</td>
                          <td className="py-2 px-3 text-stone-700">{m.espessuraMm ? `${m.espessuraMm}mm` : '15mm'}</td>
                          <td className="py-2 px-3 text-right font-mono text-stone-700">R$ {vUnit.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">R$ {vTot.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Ferragens e Acessórios */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 mb-2">
                  Ferramentas, Fitas e Insumos ({ferramentasAtivas.length} itens)
                </h3>
                <table className="w-full text-left text-xs border border-[#E7DFD5] rounded-lg overflow-hidden">
                  <thead className="bg-[#FAF7F2] text-stone-700 font-bold border-b border-[#E7DFD5]">
                    <tr>
                      <th className="py-2 px-3">Item / Insumo</th>
                      <th className="py-2 px-3 text-center">Qtd</th>
                      <th className="py-2 px-3">Unidade</th>
                      <th className="py-2 px-3 text-right">Valor Unit.</th>
                      <th className="py-2 px-3 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DFD5] bg-white">
                    {ferramentasAtivas.map((f) => {
                      const vUnit = f.custoUnitario || 0;
                      const vTot = vUnit * f.quantidade;
                      return (
                        <tr key={f.id}>
                          <td className="py-2 px-3 font-semibold text-stone-900">{f.nome}</td>
                          <td className="py-2 px-3 text-center text-stone-700 font-bold">{f.quantidade}x</td>
                          <td className="py-2 px-3 text-stone-600 font-mono">{f.unidadeMedida || 'un'}</td>
                          <td className="py-2 px-3 text-right font-mono text-stone-700">R$ {vUnit.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">R$ {vTot.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Valores e Condições de Pagamento */}
              <div className="bg-[#FAF7F2] border-2 border-[#D3A25D] text-stone-900 rounded-xl p-5 space-y-3 shadow-sm">
                <div className="flex justify-between items-center border-b border-[#E7DFD5] pb-3">
                  <span className="text-sm font-bold text-stone-800">VALOR TOTAL DO INVESTIMENTO:</span>
                  <span className="text-2xl font-black font-mono text-[#8C5E20]">
                    R$ {calculo.valorFinalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div className="bg-white border border-[#E7DFD5] p-2.5 rounded-lg shadow-sm">
                    <span className="text-stone-600 block text-[11px] font-medium">{calculo.percentualSinal}% Sinal (Aprovação e Início):</span>
                    <span className="text-sm font-bold text-emerald-700 font-mono">
                      R$ {calculo.valorSinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="bg-white border border-[#E7DFD5] p-2.5 rounded-lg shadow-sm">
                    <span className="text-stone-600 block text-[11px] font-medium">{calculo.percentualEntrega}% Restante (Entrega e Montagem Final):</span>
                    <span className="text-sm font-bold text-sky-700 font-mono">
                      R$ {calculo.valorEntrega.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validade e Assinatura */}
              <div className="pt-6 border-t border-[#E7DFD5] text-xs text-stone-600 flex justify-between items-end">
                <div>
                  <p>• Proposta comercial válida por 15 dias corridos.</p>
                  <p>• Fabricação iniciada mediante confirmação do sinal de {calculo.percentualSinal}%.</p>
                </div>
                <div className="text-center w-64 pt-6 border-t border-stone-400">
                  <span className="text-stone-800 font-semibold block">{clienteNome || 'Assinatura do Cliente'}</span>
                  <span className="text-[10px] text-stone-500">De acordo com as especificações</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
