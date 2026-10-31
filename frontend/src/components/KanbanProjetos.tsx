import React, { useState, useMemo } from 'react';
import {
  ProjetoKanban,
  StatusProjeto,
  ProdutoProjeto,
  podeEditarMovel,
  verificarPrazoReativacao,
} from '../types/marcenaria';
import { api } from '../services/api';
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Plus,
  CheckCircle2,
  Truck,
  Wrench,
  FileSpreadsheet,
  X,
  Package,
  MapPin,
  Phone,
  Layers,
  Calendar,
  Check,
  UserPlus,
  Trash2,
  RotateCcw,
  Lock,
  Edit3,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileSignature,
  Search,
  Archive,
} from 'lucide-react';

const COLUNAS: { status: StatusProjeto; label: string; cor: string; icone: any }[] = [
  { status: 'VISITA_TECNICA', label: '1. Visita Técnica', cor: 'border-blue-500/40 text-blue-400', icone: Clock },
  { status: 'ORCAMENTO', label: '2. Orçamento (BOM)', cor: 'border-amber-500/40 text-amber-400', icone: FileSpreadsheet },
  { status: 'APROVADO', label: '3. Aprovado (Sinal / Entrada)', cor: 'border-emerald-500/40 text-emerald-400', icone: CheckCircle2 },
  { status: 'EM_PRODUCAO', label: '4. Em Produção (Corte/Bancada)', cor: 'border-purple-500/40 text-purple-400', icone: Wrench },
  { status: 'MONTAGEM', label: '5. Montagem / Entrega', cor: 'border-orange-500/40 text-orange-400', icone: Truck },
  { status: 'CONCLUIDO', label: '6. Concluído', cor: 'border-green-500/40 text-green-400', icone: CheckCircle2 },
];

export const PROJETOS_INICIAIS: ProjetoKanban[] = [];


interface KanbanProjetosProps {
  onAbrirOrcamento?: (clienteNome?: string) => void;
  onAbrirContrato?: (codigoProjeto?: string, clienteNome?: string) => void;
  projetos?: ProjetoKanban[];
  setProjetos?: React.Dispatch<React.SetStateAction<ProjetoKanban[]>>;
}

export const KanbanProjetos: React.FC<KanbanProjetosProps> = ({
  onAbrirOrcamento,
  onAbrirContrato,
  projetos: propsProjetos,
  setProjetos: propsSetProjetos,
}) => {
  const [internalProjetos, setInternalProjetos] = useState<ProjetoKanban[]>(PROJETOS_INICIAIS);
  const projetos = propsProjetos ?? internalProjetos;
  const setProjetos = propsSetProjetos ?? setInternalProjetos;

  const [mostrarCancelados, setMostrarCancelados] = useState<boolean>(false);
  const [projetoSelecionado, setProjetoSelecionado] = useState<ProjetoKanban | null>(null);
  const [modalNovoProjetoAberto, setModalNovoProjetoAberto] = useState<boolean>(false);

  // Estados de O.S. Concluídas e Histórico
  const [modalConcluidosAberto, setModalConcluidosAberto] = useState<boolean>(false);
  const [buscaConcluidos, setBuscaConcluidos] = useState<string>('');

  // Estados de Drag and Drop para o Kanban
  const [dragOverColuna, setDragOverColuna] = useState<StatusProjeto | null>(null);
  const [projetoArrastadoId, setProjetoArrastadoId] = useState<string | null>(null);

  // Estados de Filtro Financeiro por Data
  type FiltroPeriodo = 'TUDO' | 'MES_ATUAL' | 'MES_ANTERIOR' | 'ULTIMOS_30_DIAS' | 'PERSONALIZADO';
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('TUDO');
  const [dataInicioFiltro, setDataInicioFiltro] = useState<string>('');
  const [dataFimFiltro, setDataFimFiltro] = useState<string>('');
  const [modalExtratoAberto, setModalExtratoAberto] = useState(false);

  // Estados para Validação e Confirmação de Conclusão e Estorno/Reabertura de O.S. (Prevenção de Erros)
  const [projetoParaConcluir, setProjetoParaConcluir] = useState<ProjetoKanban | null>(null);
  const [projetoParaReabrir, setProjetoParaReabrir] = useState<ProjetoKanban | null>(null);

  // Estados de Edição Inline de Móveis no Projeto Selecionado
  const [movelEmEdicaoId, setMovelEmEdicaoId] = useState<string | null>(null);
  const [movelEmEdicaoDados, setMovelEmEdicaoDados] = useState<Partial<ProdutoProjeto>>({});
  const [formAdicionarMovelAberto, setFormAdicionarMovelAberto] = useState<boolean>(false);
  const [novoMovelInline, setNovoMovelInline] = useState<Partial<ProdutoProjeto>>({
    nome: '',
    dimensoes: '',
    material: 'MDF 18mm',
    ferragensResumo: '',
    quantidade: 1,
    pecasQtd: 8,
  });

  // Form State para Novo Cliente e Projeto
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    cpf: '',
    cep: '',
    telefone: '',
    endereco: '',
    ambiente: '',
    valorTotal: 0,
    prazoDias: 15,
  });

  // Lista de móveis temporários do novo projeto (inicia vazio, sem móveis pré-selecionados)
  const [novosProdutos, setNovosProdutos] = useState<ProdutoProjeto[]>([]);

  // Móvel em edição para adicionar na lista
  const [tempProduto, setTempProduto] = useState<Partial<ProdutoProjeto>>({
    nome: '',
    descricao: '',
    quantidade: 1,
    dimensoes: '800 x 700 x 350 mm',
    material: 'MDF Branco TX 18mm',
    ferragensResumo: 'Dobradiças com amortecedor slow',
    pecasQtd: 8,
  });

  const adicionarMovelTemporario = () => {
    if (!tempProduto.nome) return;
    const novoProduto: ProdutoProjeto = {
      id: Math.random().toString(),
      nome: tempProduto.nome,
      descricao: tempProduto.descricao || 'Módulo sob medida personalizado',
      quantidade: tempProduto.quantidade || 1,
      dimensoes: tempProduto.dimensoes || '1000 x 800 x 500 mm',
      material: tempProduto.material || 'MDF Branco TX 18mm',
      ferragensResumo: tempProduto.ferragensResumo || 'Ferragens padrão marcenaria',
      pecasQtd: tempProduto.pecasQtd || 6,
    };
    setNovosProdutos((prev) => [...prev, novoProduto]);
    setTempProduto({
      nome: '',
      descricao: '',
      quantidade: 1,
      dimensoes: '800 x 700 x 350 mm',
      material: 'MDF Branco TX 18mm',
      ferragensResumo: 'Dobradiças com amortecedor slow',
      pecasQtd: 8,
    });
  };

  const removerMovelTemporario = (id: string) => {
    setNovosProdutos((prev) => prev.filter((p) => p.id !== id));
  };

  // Funções de Edição Inline de Móveis do Projeto Selecionado
  const salvarEdicaoMovelInline = (produtoId: string) => {
    if (!projetoSelecionado) return;
    const produtosAtualizados = projetoSelecionado.produtos.map((prod) =>
      prod.id === produtoId ? { ...prod, ...movelEmEdicaoDados } : prod
    );
    const projAtualizado = { ...projetoSelecionado, produtos: produtosAtualizados };
    setProjetoSelecionado(projAtualizado);
    setProjetos((prev) => prev.map((p) => (p.id === projAtualizado.id ? projAtualizado : p)));
    setMovelEmEdicaoId(null);
    setMovelEmEdicaoDados({});
    window.dispatchEvent(new CustomEvent('marcenaria:sync'));
  };

  const removerMovelDoProjeto = (produtoId: string) => {
    if (!projetoSelecionado) return;
    if (projetoSelecionado.produtos.length <= 1) {
      alert('O projeto precisa manter pelo menos 1 móvel.');
      return;
    }
    if (!window.confirm('Deseja remover este móvel do projeto?')) return;
    const produtosAtualizados = projetoSelecionado.produtos.filter((prod) => prod.id !== produtoId);
    const projAtualizado = { ...projetoSelecionado, produtos: produtosAtualizados };
    setProjetoSelecionado(projAtualizado);
    setProjetos((prev) => prev.map((p) => (p.id === projAtualizado.id ? projAtualizado : p)));
    window.dispatchEvent(new CustomEvent('marcenaria:sync'));
  };

  const adicionarMovelAoProjetoInline = () => {
    if (!projetoSelecionado || !novoMovelInline.nome) return;
    const novoProduto: ProdutoProjeto = {
      id: Math.random().toString(),
      nome: novoMovelInline.nome,
      descricao: novoMovelInline.descricao || 'Módulo sob medida personalizado',
      quantidade: novoMovelInline.quantidade || 1,
      dimensoes: novoMovelInline.dimensoes || '1000 x 800 x 500 mm',
      material: novoMovelInline.material || 'MDF Branco TX 18mm',
      ferragensResumo: novoMovelInline.ferragensResumo || 'Ferragens padrão',
      pecasQtd: novoMovelInline.pecasQtd || 6,
    };
    const produtosAtualizados = [...projetoSelecionado.produtos, novoProduto];
    const projAtualizado = { ...projetoSelecionado, produtos: produtosAtualizados };
    setProjetoSelecionado(projAtualizado);
    setProjetos((prev) => prev.map((p) => (p.id === projAtualizado.id ? projAtualizado : p)));
    setFormAdicionarMovelAberto(false);
    setNovoMovelInline({
      nome: '',
      dimensoes: '',
      material: 'MDF 18mm',
      ferragensResumo: '',
      quantidade: 1,
      pecasQtd: 8,
    });
    window.dispatchEvent(new CustomEvent('marcenaria:sync'));
  };

  // --- Formatadores e Buscadores ---
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (v.length > 6) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    setNovoCliente((prev) => ({ ...prev, telefone: v }));
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setNovoCliente((prev) => ({ ...prev, cpf: v }));
  };

  const buscarCep = async (cepBuscado: string) => {
    const cepLimpo = cepBuscado.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setNovoCliente((prev) => ({
            ...prev,
            endereco: `${data.logradouro}, Número: , ${data.bairro} - ${data.localidade}/${data.uf}`,
          }));
        }
      } catch (err) {
        console.warn('Erro ao buscar CEP', err);
      }
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    setNovoCliente((prev) => ({ ...prev, cep: v }));
    if (v.replace(/\D/g, '').length === 8) {
      buscarCep(v);
    }
  };

  const STORAGE_KEY = 'marcenaria_projetos_v3';

  const salvarNovoProjeto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCliente.nome || !novoCliente.ambiente) return;

    const proximoNum = 80 + projetos.length + 1;
    const valorEstimado = Number(novoCliente.valorTotal) || 0;
    const novoPrj: ProjetoKanban = {
      id: Math.random().toString(),
      codigo: `PRJ-2026-${proximoNum.toString().padStart(3, '0')}`,
      cliente: novoCliente.nome,
      cpf: novoCliente.cpf,
      cep: novoCliente.cep,
      telefone: novoCliente.telefone || '(11) 90000-0000',
      endereco: novoCliente.endereco || 'Endereço a confirmar na medição',
      ambiente: novoCliente.ambiente,
      status: 'VISITA_TECNICA',
      valorTotal: valorEstimado,
      sinalPago: false,
      prazoDias: Number(novoCliente.prazoDias) || 20,
      horasEstimadas: novosProdutos.length > 0 ? novosProdutos.length * 6 : 0,
      dataCriacao: new Date().toISOString(),
      produtos: novosProdutos, // Sem móveis fictícios pré-selecionados
    };

    setProjetos((prev) => {
      const atualizados = [novoPrj, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
      } catch (err) {}
      return atualizados;
    });

    setModalNovoProjetoAberto(false);
    api.atualizarStatusProjeto(novoPrj.codigo, novoPrj.status, {
      cliente: novoPrj.cliente,
      telefone: novoPrj.telefone,
      ambiente: novoPrj.ambiente,
    }).catch(() => {});

    // Reset form
    setNovoCliente({
      nome: '',
      cpf: '',
      cep: '',
      telefone: '',
      endereco: '',
      ambiente: '',
      valorTotal: 0,
      prazoDias: 15,
    });
    setNovosProdutos([]);
  };

  // Limite de tolerância em dias para manter O.S. concluída visível no Kanban antes de ir para o Histórico de Concluídas
  const DIAS_LIMITE_CONCLUIDO_KANBAN = 7;

  const calcularDiasDesdeConclusao = (dataConclusao?: string) => {
    if (!dataConclusao) return 0;
    const dataMs = new Date(dataConclusao).getTime();
    const agoraMs = new Date().getTime();
    return Math.max(0, Math.floor((agoraMs - dataMs) / (1000 * 60 * 60 * 24)));
  };

  // Move o projeto entre colunas com persistência síncrona imediata no localStorage
  const moverProjetoParaStatus = (id: string, novoStatus: StatusProjeto) => {
    setProjetos((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const projAtual = prev[idx];
      if (projAtual.status === novoStatus) return prev;

      const isConcluindo = novoStatus === 'CONCLUIDO';
      const isVoltandoDeConcluido = projAtual.status === 'CONCLUIDO' && novoStatus !== 'CONCLUIDO';
      const valorTotal = projAtual.valorTotal || 0;
      const pctSinal = projAtual.percentualSinal ?? 50;
      const vSinal = projAtual.valorSinal ?? (valorTotal * (pctSinal / 100));
      const vEntrega = projAtual.valorEntrega ?? Math.max(0, valorTotal - vSinal);

      const atualizado: ProjetoKanban = {
        ...projAtual,
        status: novoStatus,
        sinalPago:
          novoStatus === 'VISITA_TECNICA' || novoStatus === 'ORCAMENTO'
            ? false
            : novoStatus === 'APROVADO' || isConcluindo || isVoltandoDeConcluido
            ? true
            : projAtual.sinalPago,
        saldoPago: isConcluindo ? true : isVoltandoDeConcluido ? false : projAtual.saldoPago,
        quitado: isConcluindo ? true : isVoltandoDeConcluido ? false : projAtual.quitado,
        valorRecebido: isConcluindo ? valorTotal : (projAtual.sinalPago || isVoltandoDeConcluido ? vSinal : 0),
        dataConclusao: isConcluindo
          ? projAtual.dataConclusao || new Date().toISOString()
          : isVoltandoDeConcluido
          ? undefined
          : projAtual.dataConclusao,
        contrato: projAtual.contrato ? {
          ...projAtual.contrato,
          pagamento: {
            ...projAtual.contrato.pagamento,
            ...(isConcluindo ? { quitado: true, saldoPago: true, valorSinal: vSinal, valorEntrega: vEntrega } : {}),
            ...(isVoltandoDeConcluido ? { quitado: false, saldoPago: false, valorSinal: vSinal, valorEntrega: vEntrega } : {})
          }
        } : undefined,
      };

      const novosProjetos = prev.map((p) => (p.id === id ? atualizado : p));

      // Persistência síncrona imediata no localStorage para não haver perda ao recarregar ou navegar
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(novosProjetos));
      } catch (err) {
        console.warn('Erro ao salvar no localStorage:', err);
      }

      // Se o modal de detalhes estiver aberto com este projeto, atualiza o modal também
      if (projetoSelecionado && projetoSelecionado.id === id) {
        setProjetoSelecionado(atualizado);
      }

      // Persiste no backend em segundo plano de forma resiliente
      api.atualizarStatusProjeto(projAtual.codigo, novoStatus, {
        cliente: projAtual.cliente,
        telefone: projAtual.telefone,
        ambiente: projAtual.ambiente,
        valorTotal: valorTotal,
      }).catch(() => {});

      window.dispatchEvent(new CustomEvent('marcenaria:sync'));
      return novosProjetos;
    });
  };

  const avancarStatus = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const proj = projetos.find((p) => p.id === id);
    if (!proj) return;
    if (proj.status === 'MONTAGEM') {
      // Abre modal de validação para prevenir cliques acidentais em CONCLUIR
      setProjetoParaConcluir(proj);
      return;
    }
    const ordem: StatusProjeto[] = [
      'VISITA_TECNICA',
      'ORCAMENTO',
      'APROVADO',
      'EM_PRODUCAO',
      'MONTAGEM',
      'CONCLUIDO',
    ];
    const idxAtual = ordem.indexOf(proj.status);
    if (idxAtual < ordem.length - 1) {
      moverProjetoParaStatus(id, ordem[idxAtual + 1]);
    }
  };

  const retrocederStatus = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const proj = projetos.find((p) => p.id === id);
    if (!proj) return;
    if (proj.status === 'CONCLUIDO') {
      // Abre modal de validação para estornar quitação e retornar para Montagem / Entrega
      setProjetoParaReabrir(proj);
      return;
    }
    const ordem: StatusProjeto[] = [
      'VISITA_TECNICA',
      'ORCAMENTO',
      'APROVADO',
      'EM_PRODUCAO',
      'MONTAGEM',
      'CONCLUIDO',
    ];
    const idxAtual = ordem.indexOf(proj.status);
    if (idxAtual > 0) {
      moverProjetoParaStatus(id, ordem[idxAtual - 1]);
    }
  };

  const cancelarProjeto = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Deseja realmente cancelar este projeto? (Ele ficará disponível para reativação por até 7 dias)')) {
      return;
    }
    const agora = new Date().toISOString();
    const proj = projetos.find((p) => p.id === id);
    setProjetos((prev) => {
      const atualizados = prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          status: 'CANCELADO' as StatusProjeto,
          cancelado: true,
          dataCancelamento: agora,
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
      } catch (err) {}
      return atualizados;
    });
    if (projetoSelecionado && projetoSelecionado.id === id) {
      setProjetoSelecionado(null);
    }
    if (proj) {
      api.atualizarStatusProjeto(proj.codigo, 'CANCELADO', {
        cliente: proj.cliente,
        telefone: proj.telefone,
        ambiente: proj.ambiente,
      }).catch(() => {});
    }
  };

  const reativarProjeto = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const proj = projetos.find((p) => p.id === id);
    if (!proj) return;

    const { podeReativar, diasPassados } = verificarPrazoReativacao(proj.dataCancelamento);
    if (!podeReativar) {
      alert(`Reativação bloqueada: este projeto foi cancelado há ${diasPassados} dias. O limite máximo de tolerância para reativação é de 7 dias.`);
      return;
    }

    setProjetos((prev) => {
      const atualizados = prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          status: 'ORCAMENTO' as StatusProjeto,
          cancelado: false,
          dataCancelamento: undefined,
          sinalPago: false,
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
      } catch (err) {}
      return atualizados;
    });

    if (projetoSelecionado && projetoSelecionado.id === id) {
      setProjetoSelecionado((prev) =>
        prev
          ? {
              ...prev,
              status: 'ORCAMENTO',
              cancelado: false,
              dataCancelamento: undefined,
              sinalPago: false,
            }
          : null
      );
    }

    api.atualizarStatusProjeto(proj.codigo, 'ORCAMENTO', {
      cliente: proj.cliente,
      telefone: proj.telefone,
      ambiente: proj.ambiente,
    }).catch(() => {});
  };

  // Cálculo financeiro reativo ao período selecionado
  const projetosFiltradosFinanceiro = useMemo(() => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    return projetos.filter((p) => {
      if (p.cancelado || p.status === 'CANCELADO') return false;
      if (!p.dataCriacao) return true;
      const dt = new Date(p.dataCriacao);

      if (filtroPeriodo === 'TUDO') return true;
      if (filtroPeriodo === 'MES_ATUAL') {
        return dt.getFullYear() === anoAtual && dt.getMonth() === mesAtual;
      }
      if (filtroPeriodo === 'MES_ANTERIOR') {
        const mesAnt = mesAtual === 0 ? 11 : mesAtual - 1;
        const anoAnt = mesAtual === 0 ? anoAtual - 1 : anoAtual;
        return dt.getFullYear() === anoAnt && dt.getMonth() === mesAnt;
      }
      if (filtroPeriodo === 'ULTIMOS_30_DIAS') {
        const diffDias = (hoje.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
        return diffDias >= 0 && diffDias <= 30;
      }
      if (filtroPeriodo === 'PERSONALIZADO') {
        if (dataInicioFiltro && p.dataCriacao < dataInicioFiltro) return false;
        if (dataFimFiltro && p.dataCriacao > dataFimFiltro) return false;
        return true;
      }
      return true;
    });
  }, [projetos, filtroPeriodo, dataInicioFiltro, dataFimFiltro]);

  const totalFechadoPeriodo = projetosFiltradosFinanceiro.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
  
  // Total efetivamente recebido (sinais pagos em projetos ativos + 100% de projetos concluídos/quitados)
  const totalRecebidoPeriodo = useMemo(() => {
    return projetosFiltradosFinanceiro.reduce((acc, p) => {
      if (p.status === 'CONCLUIDO' || p.quitado) {
        return acc + (p.valorTotal || 0);
      }
      if (p.sinalPago) {
        return acc + (p.valorSinal ?? ((p.valorTotal || 0) * ((p.percentualSinal ?? 50) / 100)));
      }
      return acc;
    }, 0);
  }, [projetosFiltradosFinanceiro]);

  // Saldo restante pendente a receber (apenas de projetos ainda não concluídos)
  const totalPendenteReceberPeriodo = useMemo(() => {
    return projetosFiltradosFinanceiro.reduce((acc, p) => {
      if (p.status === 'CONCLUIDO' || p.quitado || p.status === 'CANCELADO' || p.cancelado) {
        return acc;
      }
      const valorTotal = p.valorTotal || 0;
      const vSinal = p.sinalPago ? (p.valorSinal ?? (valorTotal * ((p.percentualSinal ?? 50) / 100))) : 0;
      return acc + Math.max(0, valorTotal - vSinal);
    }, 0);
  }, [projetosFiltradosFinanceiro]);

  const totalEmProducaoPeriodo = projetosFiltradosFinanceiro
    .filter((p) => p.status === 'EM_PRODUCAO')
    .reduce((acc, p) => acc + (p.valorTotal || 0), 0);

  // Lista e filtragem de O.S. Concluídas
  const projetosConcluidosTotal = useMemo(() => {
    return projetos.filter((p) => p.status === 'CONCLUIDO' && !p.cancelado);
  }, [projetos]);

  const projetosConcluidosFiltrados = useMemo(() => {
    if (!buscaConcluidos.trim()) return projetosConcluidosTotal;
    const termo = buscaConcluidos.toLowerCase();
    return projetosConcluidosTotal.filter(
      (p) =>
        p.cliente.toLowerCase().includes(termo) ||
        p.codigo.toLowerCase().includes(termo) ||
        p.ambiente.toLowerCase().includes(termo)
    );
  }, [projetosConcluidosTotal, buscaConcluidos]);

  return (
    <div className="space-y-6 text-stone-900">
      {/* BARRA DE FILTRO FINANCEIRO POR DATA & EXTRATO */}
      <div className="bg-white border border-[#E7DFD5] p-3.5 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-stone-900">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-stone-700 flex items-center space-x-1.5 mr-1">
            <Calendar className="w-4 h-4 text-[#8C5E20]" />
            <span>Período Financeiro:</span>
          </span>

          <button
            onClick={() => setFiltroPeriodo('TUDO')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filtroPeriodo === 'TUDO'
                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/20'
                : 'bg-[#FAF7F2] text-stone-700 hover:bg-[#EFE9DE] border border-[#E7DFD5]'
            }`}
          >
            Todo o Período
          </button>

          <button
            onClick={() => setFiltroPeriodo('MES_ATUAL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filtroPeriodo === 'MES_ATUAL'
                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/20'
                : 'bg-[#FAF7F2] text-stone-700 hover:bg-[#EFE9DE] border border-[#E7DFD5]'
            }`}
          >
            Mês Atual
          </button>

          <button
            onClick={() => setFiltroPeriodo('MES_ANTERIOR')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filtroPeriodo === 'MES_ANTERIOR'
                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/20'
                : 'bg-[#FAF7F2] text-stone-700 hover:bg-[#EFE9DE] border border-[#E7DFD5]'
            }`}
          >
            Mês Anterior
          </button>

          <button
            onClick={() => setFiltroPeriodo('ULTIMOS_30_DIAS')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filtroPeriodo === 'ULTIMOS_30_DIAS'
                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/20'
                : 'bg-[#FAF7F2] text-stone-700 hover:bg-[#EFE9DE] border border-[#E7DFD5]'
            }`}
          >
            Últimos 30 Dias
          </button>

          <button
            onClick={() => setFiltroPeriodo('PERSONALIZADO')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              filtroPeriodo === 'PERSONALIZADO'
                ? 'bg-[#D3A25D] text-stone-950 shadow-sm border border-[#B88438]/20'
                : 'bg-[#FAF7F2] text-stone-700 hover:bg-[#EFE9DE] border border-[#E7DFD5]'
            }`}
          >
            Personalizado
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {filtroPeriodo === 'PERSONALIZADO' && (
            <div className="flex items-center space-x-1.5 bg-[#FAF7F2] px-2 py-1 rounded-xl border border-[#E7DFD5]">
              <span className="text-[10px] text-stone-600 font-semibold">De:</span>
              <input
                type="date"
                value={dataInicioFiltro}
                onChange={(e) => setDataInicioFiltro(e.target.value)}
                className="bg-white border border-[#D8CCBE] rounded-lg px-2 py-0.5 text-stone-900 text-xs outline-none focus:border-[#D3A25D]"
              />
              <span className="text-[10px] text-stone-600 font-semibold">Até:</span>
              <input
                type="date"
                value={dataFimFiltro}
                onChange={(e) => setDataFimFiltro(e.target.value)}
                className="bg-white border border-[#D8CCBE] rounded-lg px-2 py-0.5 text-stone-900 text-xs outline-none focus:border-[#D3A25D]"
              />
            </div>
          )}

          <button
            onClick={() => setModalConcluidosAberto(true)}
            className="px-3.5 py-1.5 bg-[#4A3B2C] hover:bg-[#3D2F22] text-[#F3E8DB] font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm border border-[#5C4B3A]"
            title="Ver histórico de Ordens de Serviço (O.S.) concluídas"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>O.S. Concluídas ({projetosConcluidosTotal.length})</span>
          </button>

          <button
            onClick={() => setModalExtratoAberto(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Extrato Financeiro por Data</span>
          </button>
        </div>
      </div>

      {/* Metrics Header no Tema Creme Claro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E7DFD5] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-600 font-bold uppercase">
            <span>Volume em Carteira</span>
            <span className="text-[10px] text-[#8C5E20] font-mono">
              {filtroPeriodo === 'TUDO' && 'Geral'}
              {filtroPeriodo === 'MES_ATUAL' && 'Mês Atual'}
              {filtroPeriodo === 'MES_ANTERIOR' && 'Mês Anterior'}
              {filtroPeriodo === 'ULTIMOS_30_DIAS' && '30 dias'}
              {filtroPeriodo === 'PERSONALIZADO' && 'Filtrado'}
            </span>
          </div>
          <div className="text-2xl font-bold text-stone-950 mt-1 font-mono">
            R$ {totalFechadoPeriodo.toLocaleString('pt-BR')}
          </div>
          <span className="text-xs text-[#8C5E20] font-bold">
            {projetosFiltradosFinanceiro.length} projetos no período
          </span>
        </div>

        <div className="bg-white border border-[#E7DFD5] p-4 rounded-xl shadow-xs">
          <span className="text-xs text-stone-600 font-bold uppercase">Na Bancada (Produção)</span>
          <div className="text-2xl font-bold text-purple-800 mt-1 font-mono">
            R$ {totalEmProducaoPeriodo.toLocaleString('pt-BR')}
          </div>
          <span className="text-xs text-stone-500 font-medium">Corte, borda e usinagem</span>
        </div>

        <div className="bg-white border border-[#E7DFD5] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-600 font-bold uppercase">
            <span>Recebimentos Liquidados</span>
            <span className="text-[10px] text-emerald-700 font-mono font-bold">100% em Caixa</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
            R$ {totalRecebidoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-xs text-stone-600 font-medium">
            {totalPendenteReceberPeriodo > 0
              ? `R$ ${totalPendenteReceberPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber em aberto`
              : 'Nenhum saldo pendente (Tudo Quitado ✓)'}
          </span>
        </div>

        <div className="bg-white border border-[#E7DFD5] p-4 rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-600 font-bold uppercase">Cadastrar Projeto</span>
            <p className="text-xs text-stone-700 font-medium mt-1">Cliente, Endereço & Móveis</p>
          </div>
          <button
            onClick={() => setModalNovoProjetoAberto(true)}
            className="p-3 bg-[#D3A25D] hover:bg-[#C4934E] text-stone-950 font-bold rounded-xl transition-all shadow-md shadow-[#D3A25D]/20 flex items-center space-x-1.5"
            title="Cadastrar Novo Cliente e Móveis"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Barra de Projetos Cancelados (Soft Delete) */}
      {projetos.some((p) => p.cancelado || p.status === 'CANCELADO') && (
        <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span className="text-slate-300 font-semibold">
              Projetos Cancelados / Arquivados ({projetos.filter((p) => p.cancelado || p.status === 'CANCELADO').length})
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              • Tolerância de 7 dias para reativação; após o prazo, a reativação é bloqueada
            </span>
          </div>
          <button
            onClick={() => setMostrarCancelados(!mostrarCancelados)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
          >
            {mostrarCancelados ? 'Ocultar Cancelados' : 'Visualizar / Reativar Cancelados'}
          </button>
        </div>
      )}

      {/* Lista de Projetos Cancelados quando expandida */}
      {mostrarCancelados && projetos.some((p) => p.cancelado || p.status === 'CANCELADO') && (
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center space-x-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Projetos Arquivados / Cancelados</span>
            </h4>
            <span className="text-[11px] text-slate-400">Reativação permitida apenas dentro da janela de 7 dias após cancelamento</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projetos
              .filter((p) => p.cancelado || p.status === 'CANCELADO')
              .map((item) => {
                const prazo = verificarPrazoReativacao(item.dataCancelamento);
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-rose-900/40 p-4 rounded-xl flex items-center justify-between gap-3 shadow-md"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-400">{item.codigo}</span>
                        <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-500/30">
                          CANCELADO
                        </span>
                        {prazo.podeReativar ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                            ⏳ {prazo.diasRestantes}d restantes
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-rose-400 font-semibold px-2 py-0.5 rounded border border-rose-900/50">
                            🔒 Expirado ({prazo.diasPassados}d)
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-white text-sm">{item.cliente}</h5>
                      <p className="text-xs text-slate-400">{item.ambiente}</p>
                      <p className="text-xs font-bold text-slate-300 mt-1">R$ {item.valorTotal.toLocaleString('pt-BR')}</p>
                    </div>

                    {prazo.podeReativar ? (
                      <button
                        onClick={(e) => reativarProjeto(item.id, e)}
                        title="Reativar projeto e mover para Orçamento (dentro do prazo de 7 dias)"
                        className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md flex-shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reativar</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Prazo limite de 7 dias para reativação expirou. O registro fica arquivado para histórico."
                        className="px-3 py-2 bg-slate-800/80 text-slate-500 border border-slate-700/60 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-not-allowed flex-shrink-0 opacity-70"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reativação Bloqueada</span>
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Kanban Board com colunas responsivas e cards enxutos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4 items-start min-w-full select-none">
        {COLUNAS.map((col) => {
          const Icone = col.icone;

          // Na coluna 'CONCLUIDO', exibe apenas O.S. finalizadas nos últimos DIAS_LIMITE_CONCLUIDO_KANBAN (7 dias).
          // As concluídas há mais de 7 dias são preservadas e consultadas no botão "O.S. Concluídas".
          const itensColuna = projetos.filter((p) => {
            if (mostrarCancelados) {
              return p.status === col.status;
            }
            if (p.cancelado || p.status === 'CANCELADO') return false;
            if (p.status !== col.status) return false;
            if (col.status === 'CONCLUIDO') {
              const dias = calcularDiasDesdeConclusao(p.dataConclusao);
              return dias <= DIAS_LIMITE_CONCLUIDO_KANBAN;
            }
            return true;
          });

          const isDragOver = dragOverColuna === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => setDragOverColuna(col.status)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverColuna(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverColuna(null);
                const id = e.dataTransfer.getData('text/plain');
                if (id) {
                  const p = projetos.find((item) => item.id === id);
                  if (p) {
                    if (col.status === 'CONCLUIDO' && p.status === 'MONTAGEM') {
                      setProjetoParaConcluir(p);
                      return;
                    }
                    if (p.status === 'CONCLUIDO' && col.status !== 'CONCLUIDO') {
                      setProjetoParaReabrir(p);
                      return;
                    }
                  }
                  moverProjetoParaStatus(id, col.status);
                }
              }}
              className={`min-w-[195px] xl:min-w-0 flex-1 w-full bg-[#F5EFEB] border rounded-2xl p-3 flex flex-col min-h-[480px] transition-all duration-150 ${
                isDragOver ? 'border-[#D3A25D] bg-[#F1E8DC] ring-2 ring-[#D3A25D]/40' : 'border-[#E2D9CC]'
              }`}
            >
              {/* Coluna Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E7DFD5]">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <Icone className={`w-3.5 h-3.5 flex-shrink-0 ${col.cor}`} />
                  <span className="text-xs font-bold text-stone-900 truncate">{col.label}</span>
                </div>
                <span className="text-[11px] bg-[#EFE9DE] text-stone-800 font-bold px-2 py-0.5 rounded-full border border-[#DFCDB7] flex-shrink-0">
                  {itensColuna.length}
                </span>
              </div>

              {/* Botão de Atalho para Histórico Completo de O.S. Concluídas */}
              {col.status === 'CONCLUIDO' && (
                <button
                  type="button"
                  onClick={() => setModalConcluidosAberto(true)}
                  className="mb-2.5 w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center justify-between transition-colors shadow-2xs"
                  title="Ver todas as Ordens de Serviço concluídas"
                >
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">Todas O.S. Concluídas</span>
                  </span>
                  <span className="bg-emerald-200/80 text-emerald-950 font-mono px-1.5 py-0.2 rounded-full text-[10px]">
                    {projetosConcluidosTotal.length}
                  </span>
                </button>
              )}

              {/* Cards Interativos Enxutos */}
              <div className="space-y-2.5 flex-1">
                {itensColuna.map((item) => {
                  const isArrastando = projetoArrastadoId === item.id;

                  return (
                    <div
                      key={item.id}
                      draggable={!item.cancelado && item.status !== 'CANCELADO'}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setProjetoArrastadoId(item.id);
                      }}
                      onDragEnd={() => {
                        setProjetoArrastadoId(null);
                        setDragOverColuna(null);
                      }}
                      onClick={() => setProjetoSelecionado(item)}
                      className={`bg-white border hover:border-[#D3A25D] p-3 rounded-xl shadow-xs transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer group relative text-stone-900 ${
                        isArrastando ? 'opacity-40 border-dashed border-[#D3A25D]' : 'border-[#E7DFD5]'
                      }`}
                    >
                      {/* Topo do Card: Código e Prazo */}
                      <div className="flex items-center justify-between text-xs mb-1.5 gap-1">
                        <span className="font-mono font-bold text-[#8C5E20] text-[11px] bg-[#FAF5EC] px-1.5 py-0.5 rounded border border-[#DFCDB7] whitespace-nowrap">
                          {item.codigo}
                        </span>
                        <span className="text-[10px] text-stone-500 font-medium whitespace-nowrap">
                          {item.prazoDias}d rest.
                        </span>
                      </div>

                      {/* Nome do Cliente e Ambiente */}
                      <div className="mb-2">
                        <h4 className="text-xs sm:text-sm font-bold text-stone-950 group-hover:text-[#8C5E20] transition-colors truncate">
                          {item.cliente}
                        </h4>
                        <p className="text-[11px] text-stone-500 font-medium truncate">
                          {item.ambiente || 'Geral'}
                        </p>
                      </div>

                      {/* Rodapé Enxuto: Valor e Setinhas de Movimentação */}
                      <div className="pt-2 border-t border-[#EFE8DE] flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-900 text-xs truncate">
                          {item.valorTotal > 0 ? `R$ ${item.valorTotal.toLocaleString('pt-BR')}` : 'A calcular'}
                        </span>

                        <div className="flex items-center space-x-0.5" onClick={(e) => e.stopPropagation()}>
                          {col.status !== 'VISITA_TECNICA' && !item.cancelado && item.status !== 'CANCELADO' && (
                            <button
                              type="button"
                              onClick={(e) => retrocederStatus(item.id, e)}
                              title="Voltar etapa"
                              className="p-1 hover:bg-[#EBDDCF] text-stone-400 hover:text-stone-800 rounded transition-colors"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {col.status !== 'CONCLUIDO' && !item.cancelado && item.status !== 'CANCELADO' && (
                            <button
                              type="button"
                              onClick={(e) => avancarStatus(item.id, e)}
                              title={col.status === 'MONTAGEM' ? 'Concluir Ordem de Serviço e liquidar todos os recebimentos sem pendências' : 'Avançar etapa'}
                              className={col.status === 'MONTAGEM'
                                ? 'px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-lg transition-all shadow-xs flex items-center space-x-1 ring-1 ring-emerald-400/40'
                                : 'p-1 hover:bg-[#D3A25D] hover:text-stone-950 text-stone-400 rounded transition-colors'
                              }
                            >
                              {col.status === 'MONTAGEM' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                  <span>CONCLUIR</span>
                                </>
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {itensColuna.length === 0 && (
                  <div className="h-28 border-2 border-dashed border-[#E2D9CC] rounded-xl flex items-center justify-center text-xs text-stone-400 font-medium text-center p-2">
                    Nenhum projeto
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL HISTÓRICO DE O.S. CONCLUÍDAS */}
      {modalConcluidosAberto && (
        <div
          onClick={() => setModalConcluidosAberto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F2] border border-[#E7DFD5] w-full max-w-4xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-stone-900"
          >
            {/* Header do Modal */}
            <div className="p-5 bg-[#F5EFEB] border-b border-[#E7DFD5] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-950">
                    Histórico de Ordens de Serviço (O.S.) Concluídas
                  </h3>
                  <p className="text-xs text-stone-600">
                    Todos os projetos concluídos e entregues pela marcenaria • Total: {projetosConcluidosTotal.length} O.S.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalConcluidosAberto(false)}
                className="text-stone-500 hover:text-stone-900 p-1.5 hover:bg-[#EBDDCF] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Busca e Faturamento */}
            <div className="p-4 bg-white border-b border-[#E7DFD5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, código da O.S. ou ambiente..."
                  value={buscaConcluidos}
                  onChange={(e) => setBuscaConcluidos(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#D5CABE] rounded-xl text-xs text-stone-900 outline-none focus:border-[#D3A25D]"
                />
              </div>
              <div className="text-xs text-stone-600 bg-[#FAF7F2] px-3 py-2 rounded-xl border border-[#E7DFD5] text-right">
                <span className="block text-[11px] text-stone-500">Faturamento Entregue:</span>
                <span className="text-sm font-bold text-emerald-800 font-mono">
                  R$ {projetosConcluidosTotal.reduce((acc, p) => acc + (p.valorTotal || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Lista das O.S. Concluídas */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {projetosConcluidosFiltrados.length === 0 ? (
                <div className="text-center py-12 text-stone-500 text-xs">
                  Nenhuma Ordem de Serviço concluída encontrada.
                </div>
              ) : (
                projetosConcluidosFiltrados.map((item) => {
                  const dias = calcularDiasDesdeConclusao(item.dataConclusao);
                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-[#E7DFD5] hover:border-[#D3A25D] p-4 rounded-xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs bg-[#FAF5EC] text-[#8C5E20] px-2 py-0.5 rounded border border-[#DFCDB7]">
                            {item.codigo}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-300">
                            ✓ Concluído
                          </span>
                          {item.dataConclusao && (
                            <span className="text-[11px] text-stone-500 font-mono">
                              • Entregue em {new Date(item.dataConclusao).toLocaleDateString('pt-BR')} ({dias === 0 ? 'Hoje' : `há ${dias} dias`})
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-stone-950 truncate">
                          {item.cliente}
                        </h4>
                        <p className="text-xs text-stone-600">
                          {item.ambiente} • {item.produtos.length} {item.produtos.length === 1 ? 'móvel' : 'móveis'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-xs text-stone-500 block">Valor Final</span>
                          <span className="text-sm font-bold text-stone-950 font-mono">
                            R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setModalConcluidosAberto(false);
                              setProjetoSelecionado(item);
                            }}
                            className="px-3 py-1.5 bg-[#FAF5EC] hover:bg-[#EBDDCF] text-stone-800 border border-[#DFCDB7] rounded-lg text-xs font-semibold transition-colors"
                          >
                            Ver Ficha
                          </button>
                          {onAbrirContrato && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalConcluidosAberto(false);
                                onAbrirContrato(item.codigo, item.cliente);
                              }}
                              className="px-3 py-1.5 bg-[#D3A25D] hover:bg-[#C4934E] text-stone-950 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                              title="Visualizar contrato assinado deste cliente"
                            >
                              Contrato
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Deseja reabrir a O.S. "${item.codigo}" para Montagem / Ajustes pós-entrega?`)) {
                                moverProjetoParaStatus(item.id, 'MONTAGEM');
                                setModalConcluidosAberto(false);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 border border-stone-200 rounded-lg text-xs font-medium transition-colors"
                            title="Reabrir O.S. para garantia ou assistência técnica"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer do Modal */}
            <div className="p-4 bg-[#F5EFEB] border-t border-[#E7DFD5] flex justify-end">
              <button
                onClick={() => setModalConcluidosAberto(false)}
                className="px-4 py-2 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 font-semibold rounded-xl text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALHADO DOS PRODUTOS DO PROJETO SELECIONADO */}
      {projetoSelecionado && (
        <div
          onClick={() => setProjetoSelecionado(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F2] border border-[#E7DFD5] w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-stone-900"
          >
            {/* Header do Modal */}
            <div className="p-5 bg-[#F5EFEB] border-b border-[#E7DFD5] flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold bg-[#D3A25D]/20 text-[#543A14] px-2 py-0.5 rounded border border-[#D3A25D]/40">
                    {projetoSelecionado.codigo}
                  </span>
                  <span className="text-xs bg-[#EBDDCF] text-stone-700 font-semibold px-2 py-0.5 rounded">
                    {projetoSelecionado.ambiente}
                  </span>
                  {podeEditarMovel(projetoSelecionado.status, projetoSelecionado.sinalPago) ? (
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300 flex items-center space-x-1">
                      <Edit3 className="w-3 h-3" />
                      <span>Móveis Editáveis</span>
                    </span>
                  ) : (
                    <span className="text-[11px] bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded border border-amber-300 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-[#8C5E20]" />
                      <span>Móveis Travados (Sinal Confirmado)</span>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-stone-950">{projetoSelecionado.cliente}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 mt-1">
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{projetoSelecionado.telefone}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{projetoSelecionado.endereco}</span>
                  </span>
                  {projetoSelecionado.dataCriacao && (
                    <span className="flex items-center space-x-1 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>Entrada: {new Date(projetoSelecionado.dataCriacao).toLocaleDateString('pt-BR')}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onAbrirContrato && (
                  <button
                    onClick={() => {
                      onAbrirContrato(projetoSelecionado.codigo, projetoSelecionado.cliente);
                      setProjetoSelecionado(null);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition-all"
                    title="Gerar ou editar o contrato de prestação de serviços com os móveis deste projeto"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Contrato de Serviço</span>
                  </button>
                )}
                <button
                  onClick={() => setProjetoSelecionado(null)}
                  className="text-stone-500 hover:text-stone-900 p-1.5 hover:bg-[#EBDDCF] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Resumo Financeiro do Projeto */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#F5EFEB]/60 border-b border-[#E7DFD5] text-xs">
              <div className="bg-white border border-[#E7DFD5] p-2.5 rounded-xl shadow-xs">
                <span className="text-stone-500 text-[11px] block">Valor Total Fechado</span>
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <span className="text-sm font-bold text-stone-950 font-mono">
                    R$ {projetoSelecionado.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {(projetoSelecionado.status === 'CONCLUIDO' || projetoSelecionado.quitado) && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                      100% Quitado ✓
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white border border-[#E7DFD5] p-2.5 rounded-xl shadow-xs">
                <span className="text-stone-500 text-[11px] block">
                  {projetoSelecionado.percentualSinal ?? 50}% Sinal (Fechamento)
                </span>
                <span className={`text-sm font-bold font-mono ${projetoSelecionado.sinalPago || projetoSelecionado.status === 'CONCLUIDO' || projetoSelecionado.quitado ? 'text-emerald-700' : 'text-amber-700'}`}>
                  R$ {(projetoSelecionado.valorSinal ?? (projetoSelecionado.valorTotal * ((projetoSelecionado.percentualSinal ?? 50) / 100))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {projetoSelecionado.sinalPago || projetoSelecionado.status === 'CONCLUIDO' || projetoSelecionado.quitado ? ' (Pago ✓)' : ' (Pendente)'}
                </span>
              </div>
              <div className="bg-white border border-[#E7DFD5] p-2.5 rounded-xl shadow-xs">
                <span className="text-stone-500 text-[11px] block">
                  {100 - (projetoSelecionado.percentualSinal ?? 50)}% na Entrega
                </span>
                <span className={`text-sm font-bold font-mono ${projetoSelecionado.status === 'CONCLUIDO' || projetoSelecionado.quitado ? 'text-emerald-700' : 'text-blue-700'}`}>
                  R$ {(projetoSelecionado.valorEntrega ?? (projetoSelecionado.valorTotal - (projetoSelecionado.valorSinal ?? (projetoSelecionado.valorTotal * ((projetoSelecionado.percentualSinal ?? 50) / 100))))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  {projetoSelecionado.status === 'CONCLUIDO' || projetoSelecionado.quitado ? ' (Quitado na Entrega ✓)' : ' (A Receber)'}
                </span>
              </div>
            </div>

            {/* Lista dos Produtos / Módulos Cadastrados */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Banner de Bloqueio ou Barra de Ações de Edição */}
              {!podeEditarMovel(projetoSelecionado.status, projetoSelecionado.sinalPago) ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-xs text-amber-900">
                  <Lock className="w-4 h-4 text-[#8C5E20] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-950">Móveis Bloqueados para Edição</span>
                    <p className="text-stone-600 text-[11px] mt-0.5 leading-relaxed">
                      Este projeto já foi <strong>Aprovado com Sinal Pago</strong> ou está em fabricação/montagem. Por integridade fabril e fidelidade contratual, a lista de móveis e medidas está protegida contra alterações.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold">
                    <Edit3 className="w-4 h-4" />
                    <span>Edição Liberada (Fase de Negociação / Sem Sinal Pago)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onAbrirOrcamento && (
                      <button
                        onClick={() => {
                          onAbrirOrcamento(projetoSelecionado.cliente);
                          setProjetoSelecionado(null);
                        }}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                        title="Abrir este cliente diretamente na Calculadora BOM"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Calculadora BOM</span>
                      </button>
                    )}
                    <button
                      onClick={() => setFormAdicionarMovelAberto(!formAdicionarMovelAberto)}
                      className="px-2.5 py-1 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 border border-[#D5CABE] rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{formAdicionarMovelAberto ? 'Fechar' : '+ Novo Móvel'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Formulário Rápido para Adicionar Novo Móvel ao Projeto Existente */}
              {podeEditarMovel(projetoSelecionado.status, projetoSelecionado.sinalPago) && formAdicionarMovelAberto && (
                <div className="bg-white border border-[#D3A25D]/60 p-3.5 rounded-xl space-y-3 text-xs animate-in fade-in duration-150 shadow-xs">
                  <span className="font-bold text-[#8C5E20] block">Adicionar Móvel a este Projeto:</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Nome do móvel (ex: Balcão Ilha, Nicho)"
                      value={novoMovelInline.nome || ''}
                      onChange={(e) => setNovoMovelInline({ ...novoMovelInline, nome: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none focus:border-[#D3A25D] text-xs md:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="Dimensões (ex: 1200 x 800 x 600 mm)"
                      value={novoMovelInline.dimensoes || ''}
                      onChange={(e) => setNovoMovelInline({ ...novoMovelInline, dimensoes: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none focus:border-[#D3A25D] text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Material (ex: MDF Branco TX 18mm)"
                      value={novoMovelInline.material || ''}
                      onChange={(e) => setNovoMovelInline({ ...novoMovelInline, material: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none focus:border-[#D3A25D] text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Ferragens (ex: 4x Dobradiças Slow)"
                      value={novoMovelInline.ferragensResumo || ''}
                      onChange={(e) => setNovoMovelInline({ ...novoMovelInline, ferragensResumo: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none focus:border-[#D3A25D] text-xs md:col-span-2"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      onClick={() => setFormAdicionarMovelAberto(false)}
                      className="px-3 py-1 bg-[#EBDDCF] text-stone-800 rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={adicionarMovelAoProjetoInline}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      Salvar e Incluir
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-[#8C5E20]" />
                  <span>Móveis e Módulos Cadastrados ({projetoSelecionado.produtos.length})</span>
                </h4>
                <span className="text-xs text-stone-500">Total de {projetoSelecionado.produtos.reduce((a, b) => a + b.pecasQtd, 0)} peças de corte</span>
              </div>

              <div className="space-y-3">
                {projetoSelecionado.produtos.map((prod, idx) => {
                  const podeEditarEste = podeEditarMovel(projetoSelecionado.status, projetoSelecionado.sinalPago);
                  const estaEmEdicao = movelEmEdicaoId === prod.id;

                  if (estaEmEdicao) {
                    return (
                      <div
                        key={prod.id}
                        className="bg-white border border-[#D3A25D] p-4 rounded-xl space-y-3 text-xs shadow-xs"
                      >
                        <span className="font-bold text-[#8C5E20] block">Editando Móvel #{idx + 1}:</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-600 block mb-0.5 font-medium">Nome do Móvel</label>
                            <input
                              type="text"
                              value={movelEmEdicaoDados.nome ?? prod.nome}
                              onChange={(e) => setMovelEmEdicaoDados({ ...movelEmEdicaoDados, nome: e.target.value })}
                              className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none focus:border-[#D3A25D]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-600 block mb-0.5 font-medium">Dimensões (mm)</label>
                            <input
                              type="text"
                              value={movelEmEdicaoDados.dimensoes ?? prod.dimensoes}
                              onChange={(e) => setMovelEmEdicaoDados({ ...movelEmEdicaoDados, dimensoes: e.target.value })}
                              className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none focus:border-[#D3A25D] font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-600 block mb-0.5 font-medium">Material & Chapas</label>
                            <input
                              type="text"
                              value={movelEmEdicaoDados.material ?? prod.material}
                              onChange={(e) => setMovelEmEdicaoDados({ ...movelEmEdicaoDados, material: e.target.value })}
                              className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none focus:border-[#D3A25D]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-600 block mb-0.5 font-medium">Ferragens e Acessórios</label>
                            <input
                              type="text"
                              value={movelEmEdicaoDados.ferragensResumo ?? prod.ferragensResumo}
                              onChange={(e) => setMovelEmEdicaoDados({ ...movelEmEdicaoDados, ferragensResumo: e.target.value })}
                              className="w-full bg-[#FAF7F2] border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-stone-900 outline-none focus:border-[#D3A25D]"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-1 border-t border-[#E7DFD5]">
                          <button
                            onClick={() => {
                              setMovelEmEdicaoId(null);
                              setMovelEmEdicaoDados({});
                            }}
                            className="px-3 py-1 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 rounded-lg text-xs"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => salvarEdicaoMovelInline(prod.id)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                          >
                            Salvar Alteração
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={prod.id}
                      className="bg-white border border-[#E7DFD5] hover:border-[#D3A25D]/60 p-4 rounded-xl space-y-2 transition-all shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-[#D3A25D]/20 text-[#543A14] font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h5 className="text-sm font-bold text-stone-950">{prod.nome}</h5>
                          </div>
                          <p className="text-xs text-stone-600 mt-1 pl-7">{prod.descricao}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-[#8C5E20] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex-shrink-0">
                            {prod.quantidade}x unidade
                          </span>

                          {podeEditarEste && (
                            <div className="flex items-center space-x-1 pl-1">
                              <button
                                onClick={() => {
                                  setMovelEmEdicaoId(prod.id);
                                  setMovelEmEdicaoDados(prod);
                                }}
                                className="p-1 text-stone-500 hover:text-[#8C5E20] hover:bg-[#F5EFEB] rounded transition-colors"
                                title="Editar especificações deste móvel"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => removerMovelDoProjeto(prod.id)}
                                className="p-1 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Remover este móvel do projeto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-[#E7DFD5] text-[11px] pl-7">
                        <div>
                          <span className="text-stone-500 block">Dimensões (C × L × P):</span>
                          <span className="text-stone-900 font-mono font-semibold">{prod.dimensoes}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block">Material & Chapas:</span>
                          <span className="text-stone-900 font-semibold">{prod.material}</span>
                        </div>
                        <div>
                          <span className="text-stone-500 block">Peças de Corte:</span>
                          <span className="text-[#8C5E20] font-semibold">{prod.pecasQtd} peças detalhadas</span>
                        </div>
                      </div>

                      <div className="pt-1.5 pl-7 text-[11px]">
                        <span className="text-stone-500 font-semibold">Ferragens: </span>
                        <span className="text-stone-800">{prod.ferragensResumo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-[#F5EFEB] border-t border-[#E7DFD5] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setProjetoSelecionado(null)}
                  className="px-4 py-2 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 font-semibold rounded-xl text-xs transition-colors"
                >
                  Fechar
                </button>

                {!projetoSelecionado.cancelado && projetoSelecionado.status !== 'CANCELADO' && (
                  <button
                    onClick={(e) => cancelarProjeto(projetoSelecionado.id, e)}
                    className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
                    title="Cancelar projeto mantendo no histórico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancelar Projeto</span>
                  </button>
                )}

                {(projetoSelecionado.cancelado || projetoSelecionado.status === 'CANCELADO') && (
                  <button
                    onClick={(e) => reativarProjeto(projetoSelecionado.id, e)}
                    className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reativar Projeto</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {projetoSelecionado.status !== 'VISITA_TECNICA' && !projetoSelecionado.cancelado && projetoSelecionado.status !== 'CANCELADO' && (
                  <button
                    onClick={(e) => retrocederStatus(projetoSelecionado.id, e)}
                    className="px-3.5 py-2 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 border border-[#D5CABE] rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                    title={projetoSelecionado.status === 'CONCLUIDO' ? 'Reabrir Ordem de Serviço e retornar para Montagem com estorno do saldo' : 'Voltar etapa'}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{projetoSelecionado.status === 'CONCLUIDO' ? 'Reabrir O.S. (Voltar para Entrega)' : 'Voltar Etapa'}</span>
                  </button>
                )}

                {projetoSelecionado.status !== 'CONCLUIDO' && !projetoSelecionado.cancelado && projetoSelecionado.status !== 'CANCELADO' && (
                  <button
                    onClick={(e) => avancarStatus(projetoSelecionado.id, e)}
                    className={projetoSelecionado.status === 'MONTAGEM'
                      ? 'px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black rounded-xl text-xs transition-all flex items-center space-x-2 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                      : 'px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center space-x-2 shadow-lg shadow-amber-500/20'
                    }
                    title={projetoSelecionado.status === 'MONTAGEM' ? 'Concluir Ordem de Serviço e liquidar todos os recebimentos sem pendências' : 'Avançar para a próxima etapa'}
                  >
                    {projetoSelecionado.status === 'MONTAGEM' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span className="tracking-wide">CONCLUIR</span>
                      </>
                    ) : (
                      <>
                        <span>Avançar Etapa</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}

                {projetoSelecionado.status === 'CONCLUIDO' && (
                  <div className="px-3.5 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>O.S. Concluída & 100% Liquidada ✓</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO DE NOVO CLIENTE E MÓVEIS */}
      {modalNovoProjetoAberto && (
        <div
          onClick={() => setModalNovoProjetoAberto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F2] border border-[#E7DFD5] w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto text-stone-900"
          >
            {/* Header */}
            <div className="p-5 bg-[#F5EFEB] border-b border-[#E7DFD5] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#8C5E20] flex items-center justify-center border border-amber-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-950">Cadastrar Novo Projeto & Cliente</h3>
                  <p className="text-xs text-stone-600">Insira os dados do cliente e cadastre os móveis sob medida a serem produzidos</p>
                </div>
              </div>
              <button
                onClick={() => setModalNovoProjetoAberto(false)}
                className="text-stone-500 hover:text-stone-900 p-1.5 hover:bg-[#EBDDCF] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarNovoProjeto} className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Seção 1: Dados do Cliente e Local de Instalação */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#8C5E20] uppercase tracking-wider flex items-center space-x-1.5">
                  <span>1. Dados do Cliente & Local de Entrega</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nome do Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo de Souza"
                      value={novoCliente.nome}
                      onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                      className="w-full bg-white border border-[#D5CABE] focus:border-[#D3A25D] rounded-xl px-3 py-2 text-sm text-stone-900 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Telefone / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (11) 98765-4321"
                      value={novoCliente.telefone}
                      onChange={handleTelefoneChange}
                      className="w-full bg-white border border-[#D5CABE] focus:border-[#D3A25D] rounded-xl px-3 py-2 text-sm text-stone-900 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      CPF (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={novoCliente.cpf}
                      onChange={handleCpfChange}
                      className="w-full bg-white border border-[#D5CABE] focus:border-[#D3A25D] rounded-xl px-3 py-2 text-sm text-stone-900 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      CEP (Busca Automática)
                    </label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={novoCliente.cep}
                      onChange={handleCepChange}
                      className="w-full bg-white border border-[#D5CABE] focus:border-[#D3A25D] rounded-xl px-3 py-2 text-sm text-stone-900 outline-none transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Endereço Completo (Medição & Montagem)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rua das Palmeiras, 350 - Apto 41 - Moema, São Paulo - SP"
                      value={novoCliente.endereco}
                      onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
                      className="w-full bg-white border border-[#D5CABE] focus:border-[#D3A25D] rounded-xl px-3 py-2 text-sm text-stone-900 outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Ambiente / Projeto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Cozinha Integrada & Lavanderia"
                      value={novoCliente.ambiente}
                      onChange={(e) => setNovoCliente({ ...novoCliente, ambiente: e.target.value })}
                      className="w-full bg-white border border-[#D5CABE] focus:border-[#D3A25D] rounded-xl px-3 py-2 text-sm text-stone-900 outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Valor Venda Estimado (R$)
                      </label>
                      <input
                        type="number"
                        placeholder="0,00 (Definido no Orçamento)"
                        value={novoCliente.valorTotal || ''}
                        onChange={(e) => setNovoCliente({ ...novoCliente, valorTotal: Number(e.target.value) })}
                        className="w-full bg-white border border-[#D5CABE] focus:border-[#D3A25D] rounded-xl px-3 py-2 text-sm font-mono text-emerald-700 font-bold outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Prazo (Dias)
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 20"
                        value={novoCliente.prazoDias}
                        onChange={(e) => setNovoCliente({ ...novoCliente, prazoDias: Number(e.target.value) })}
                        className="w-full bg-white border border-[#D5CABE] focus:border-[#D3A25D] rounded-xl px-3 py-2 text-sm text-stone-900 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 2: Cadastro dos Móveis a serem Vendidos */}
              <div className="space-y-3 pt-4 border-t border-[#E7DFD5]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#8C5E20] uppercase tracking-wider flex items-center space-x-1.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>2. Móveis & Módulos ({novosProdutos.length})</span>
                  </h4>
                  <span className="text-[11px] text-stone-500">Opcional na visita (pode ser definido no Orçamento)</span>
                </div>

                {/* Lista de Móveis Já Adicionados ou Aviso de Nenhum Móvel */}
                {novosProdutos.length === 0 ? (
                  <div className="bg-white border border-dashed border-[#D5CABE] rounded-xl p-3 text-center text-xs text-stone-600">
                    Nenhum móvel pré-cadastrado. O projeto iniciará na etapa de <strong>Visita Técnica</strong> e os móveis, chapas e ferragens serão compostos e calculados na <strong>Calculadora BOM</strong>.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {novosProdutos.map((prod, idx) => (
                      <div
                        key={prod.id}
                        className="bg-white border border-[#E7DFD5] p-3 rounded-xl flex items-center justify-between gap-3 text-xs shadow-xs"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-[#D3A25D]/20 text-[#543A14] font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-stone-950">{prod.nome}</span>
                            <span className="text-stone-500 font-mono">({prod.dimensoes})</span>
                            <span className="bg-[#EBDDCF] text-stone-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              {prod.quantidade}x un
                            </span>
                          </div>
                          <div className="text-stone-600 mt-1 pl-7 text-[11px] flex flex-wrap gap-x-3">
                            <span><strong className="text-stone-500">MDF:</strong> {prod.material}</span>
                            <span><strong className="text-stone-500">Ferragens:</strong> {prod.ferragensResumo}</span>
                            <span><strong className="text-stone-500">Peças:</strong> {prod.pecasQtd} un</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerMovelTemporario(prod.id)}
                          className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remover móvel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário para Adicionar Mais um Móvel */}
                <div className="bg-[#F5EFEB]/50 border border-dashed border-[#D5CABE] p-3.5 rounded-xl space-y-3">
                  <span className="text-xs font-semibold text-stone-700 block">
                    + Adicionar Móvel ao Projeto:
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Nome do móvel (ex: Balcão Pia, Armário Aéreo, Nicho)"
                        value={tempProduto.nome || ''}
                        onChange={(e) => setTempProduto({ ...tempProduto, nome: e.target.value })}
                        className="w-full bg-white border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-[#D3A25D]"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Dimensões (ex: 1800 x 850 x 600 mm)"
                        value={tempProduto.dimensoes || ''}
                        onChange={(e) => setTempProduto({ ...tempProduto, dimensoes: e.target.value })}
                        className="w-full bg-white border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-[#D3A25D] font-mono"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Material (ex: MDF Branco TX 18mm)"
                        value={tempProduto.material || ''}
                        onChange={(e) => setTempProduto({ ...tempProduto, material: e.target.value })}
                        className="w-full bg-white border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-[#D3A25D]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Ferragens (ex: 4x Dobradiças Slow, 3x Corrediças 450mm)"
                        value={tempProduto.ferragensResumo || ''}
                        onChange={(e) => setTempProduto({ ...tempProduto, ferragensResumo: e.target.value })}
                        className="w-full bg-white border border-[#D5CABE] rounded-lg px-2.5 py-1.5 text-xs text-stone-900 outline-none focus:border-[#D3A25D]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={adicionarMovelTemporario}
                      className="px-3 py-1.5 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition-colors border border-[#D5CABE]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Incluir Móvel na Lista</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Informação sobre os 50% */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                <div className="text-stone-700">
                  <span className="font-semibold text-[#8C5E20] block">Condição de Recebimento Padrão do Sistema:</span>
                  <span>Sinal no fechamento + Saldo na entrega final e montagem.</span>
                </div>
                {novoCliente.valorTotal > 0 && (
                  <div className="text-right font-mono">
                    <span className="text-stone-500 text-[10px] block">Sinal de Fechamento:</span>
                    <span className="font-bold text-emerald-700">
                      R$ {(novoCliente.valorTotal * 0.5).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Rodapé e Botão de Salvar */}
              <div className="pt-3 border-t border-[#E7DFD5] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalNovoProjetoAberto(false)}
                  className="px-4 py-2 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Cadastrar Projeto & Móveis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXTRATO FINANCEIRO POR DATA */}
      {modalExtratoAberto && (
        <div
          onClick={() => setModalExtratoAberto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F2] border border-[#E7DFD5] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-stone-900"
          >
            {/* Modal Header */}
            <div className="p-5 bg-[#F5EFEB] border-b border-[#E7DFD5] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-950 flex items-center space-x-2">
                    <span>Extrato Financeiro por Data & Recebíveis</span>
                    <span className="text-xs bg-[#EBDDCF] text-stone-800 font-semibold px-2 py-0.5 rounded border border-[#D5CABE]">
                      {filtroPeriodo === 'TUDO' && 'Todo o Período'}
                      {filtroPeriodo === 'MES_ATUAL' && 'Mês Atual'}
                      {filtroPeriodo === 'MES_ANTERIOR' && 'Mês Anterior'}
                      {filtroPeriodo === 'ULTIMOS_30_DIAS' && 'Últimos 30 Dias'}
                      {filtroPeriodo === 'PERSONALIZADO' && 'Intervalo Personalizado'}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-600">
                    Acompanhamento de fluxo de caixa, sinais de fechamento e recebimentos na entrega
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalExtratoAberto(false)}
                className="text-stone-500 hover:text-stone-900 p-1.5 hover:bg-[#EBDDCF] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo do Período */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#F5EFEB]/50 border-b border-[#E7DFD5] text-xs">
              <div className="bg-white border border-[#E7DFD5] p-3 rounded-xl shadow-xs">
                <span className="text-stone-500 text-[11px] block">Volume Total Faturado</span>
                <span className="text-base font-bold text-stone-950 font-mono mt-0.5 block">
                  R$ {totalFechadoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-[#8C5E20]">{projetosFiltradosFinanceiro.length} projetos ativos</span>
              </div>

              <div className="bg-white border border-[#E7DFD5] p-3 rounded-xl shadow-xs">
                <span className="text-stone-500 text-[11px] block">Recebido em Caixa</span>
                <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                  R$ {totalRecebidoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-800 font-medium">Entradas + O.S. Concluídas</span>
              </div>

              <div className="bg-white border border-[#E7DFD5] p-3 rounded-xl shadow-xs">
                <span className="text-stone-500 text-[11px] block">Pendente a Receber</span>
                <span className="text-base font-bold text-blue-700 font-mono mt-0.5 block">
                  R$ {totalPendenteReceberPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-blue-700 font-medium">Projetos em andamento</span>
              </div>

              <div className="bg-white border border-[#E7DFD5] p-3 rounded-xl shadow-xs">
                <span className="text-stone-500 text-[11px] block">Ticket Médio por Projeto</span>
                <span className="text-base font-bold text-[#8C5E20] font-mono mt-0.5 block">
                  R$ {projetosFiltradosFinanceiro.length > 0
                    ? (totalFechadoPeriodo / projetosFiltradosFinanceiro.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                    : '0,00'}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">Média por cliente</span>
              </div>
            </div>

            {/* Tabela Cronológica dos Projetos */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-stone-600 border-b border-[#E7DFD5] bg-[#F5EFEB]/50 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Código / Cliente</th>
                      <th className="py-2.5 px-3">Ambiente</th>
                      <th className="py-2.5 px-3">Status na Fila</th>
                      <th className="py-2.5 px-3 text-right">Valor Total</th>
                      <th className="py-2.5 px-3 text-right">Valor Sinal</th>
                      <th className="py-2.5 px-3 text-right">Valor Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DFD5] text-stone-800">
                    {projetosFiltradosFinanceiro.map((p) => (
                      <tr key={p.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="py-3 px-3 font-mono text-stone-500 whitespace-nowrap">
                          {p.dataCriacao ? new Date(p.dataCriacao).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[#8C5E20] font-bold block text-[11px]">{p.codigo}</span>
                          <span className="font-bold text-stone-950 text-sm">{p.cliente}</span>
                        </td>
                        <td className="py-3 px-3 text-stone-700">
                          {p.ambiente}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBDDCF] text-stone-800 border border-[#D5CABE]">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-stone-950 whitespace-nowrap">
                          R$ {p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          {p.sinalPago || p.status === 'CONCLUIDO' || p.quitado ? (
                            <span className="text-emerald-700 font-bold">
                              R$ {(p.valorSinal ?? (p.valorTotal * 0.5)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Pago ✓)
                            </span>
                          ) : (
                            <span className="text-amber-700">
                              R$ {(p.valorSinal ?? (p.valorTotal * 0.5)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Pendente)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                          {p.status === 'CONCLUIDO' || p.quitado ? (
                            <span className="text-emerald-700 font-bold">
                              R$ {(p.valorEntrega ?? (p.valorTotal * 0.5)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Quitado ✓)
                            </span>
                          ) : (
                            <span className="text-blue-700">
                              R$ {(p.valorEntrega ?? (p.valorTotal * 0.5)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (A Receber)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {projetosFiltradosFinanceiro.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-stone-400 italic">
                          Nenhum projeto registrado no período selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#F5EFEB] border-t border-[#E7DFD5] flex items-center justify-between">
              <span className="text-xs text-stone-600">
                Total de {projetosFiltradosFinanceiro.length} projetos discriminados
              </span>
              <button
                onClick={() => setModalExtratoAberto(false)}
                className="px-4 py-2 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 font-semibold rounded-xl text-xs transition-colors"
              >
                Fechar Extrato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: VALIDAÇÃO DE CONGRUÊNCIA / CONFIRMAÇÃO DE CONCLUSÃO (PREVENÇÃO DE ERROS) */}
      {projetoParaConcluir && (
        <div
          onClick={() => setProjetoParaConcluir(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F2] border border-[#DFCDB7] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-stone-900 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start space-x-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-stone-950 font-serif">
                  Confirmar Conclusão da Ordem de Serviço?
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Prevenção de clique acidental: certifique-se de que a entrega foi realizada e o cliente finalizou o recebimento.
                </p>
              </div>
            </div>

            {/* Dados do Projeto */}
            <div className="bg-white border border-[#E7DFD5] rounded-xl p-3.5 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Ordem de Serviço:</span>
                <span className="font-mono font-bold text-[#8C5E20] bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#DFCDB7]">
                  {projetoParaConcluir.codigo}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Cliente & Ambiente:</span>
                <span className="font-bold text-stone-900">{projetoParaConcluir.cliente} ({projetoParaConcluir.ambiente || 'Geral'})</span>
              </div>
            </div>

            {/* Resumo Financeiro da Liquidação */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 mb-4 space-y-2 text-xs">
              <span className="font-bold text-emerald-950 block text-[11px] uppercase tracking-wider">
                Liquidação Financeira Automática:
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
                  <span className="text-[10px] text-stone-500 block">Sinal Já Recebido:</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    R$ {(projetoParaConcluir.valorSinal ?? ((projetoParaConcluir.valorTotal || 0) * ((projetoParaConcluir.percentualSinal ?? 50) / 100))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Pago ✓)
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-200/60">
                  <span className="text-[10px] text-stone-500 block">Saldo na Entrega (a Quitar):</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    R$ {(projetoParaConcluir.valorEntrega ?? Math.max(0, (projetoParaConcluir.valorTotal || 0) - (projetoParaConcluir.valorSinal ?? ((projetoParaConcluir.valorTotal || 0) * ((projetoParaConcluir.percentualSinal ?? 50) / 100))))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Liquidar)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-emerald-200 text-stone-900">
                <span className="font-semibold text-[11px]">Total Liquidado em Caixa:</span>
                <span className="font-mono font-black text-emerald-900 text-sm">
                  R$ {(projetoParaConcluir.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-stone-600 mb-5 leading-relaxed bg-[#FAF5EC] p-2.5 rounded-xl border border-[#EBDDCF]">
              ℹ️ Ao confirmar, o projeto será movido para <strong>6. Concluído</strong> e todo o saldo pendente será 100% quitado sem deixar pendências financeiras.
            </p>

            {/* Ações */}
            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setProjetoParaConcluir(null)}
                className="px-4 py-2.5 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancelar / Manter em Montagem
              </button>
              <button
                type="button"
                onClick={() => {
                  moverProjetoParaStatus(projetoParaConcluir.id, 'CONCLUIDO');
                  setProjetoParaConcluir(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 ring-2 ring-emerald-400/40"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sim, Concluir & Liquidar O.S.</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VALIDAÇÃO DE RETORNO / REABERTURA DE O.S. (ESTORNO DO SALDO DA ENTREGA) */}
      {projetoParaReabrir && (
        <div
          onClick={() => setProjetoParaReabrir(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF7F2] border border-[#DFCDB7] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-stone-900 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-start space-x-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300 flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-stone-950 font-serif">
                  Reabrir O.S. e Retornar para Montagem?
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Validação de estorno financeiro e reabertura de pendências de entrega.
                </p>
              </div>
            </div>

            {/* Dados do Projeto */}
            <div className="bg-white border border-[#E7DFD5] rounded-xl p-3.5 mb-4 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <span className="text-stone-500 font-medium">Ordem de Serviço:</span>
                <span className="font-mono font-bold text-[#8C5E20] bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#DFCDB7]">
                  {projetoParaReabrir.codigo}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Cliente & Ambiente:</span>
                <span className="font-bold text-stone-900">{projetoParaReabrir.cliente} ({projetoParaReabrir.ambiente || 'Geral'})</span>
              </div>
            </div>

            {/* Aviso do Estorno Financeiro */}
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3.5 mb-4 space-y-2 text-xs">
              <span className="font-bold text-amber-950 block text-[11px] uppercase tracking-wider">
                Atenção ao Estorno Financeiro:
              </span>
              <p className="text-stone-700 leading-relaxed text-[11px]">
                Ao retornar para a etapa de <strong>5. Montagem / Entrega</strong>, a quitação final será <strong>estornada</strong>:
              </p>
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Sinal mantido em caixa:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    R$ {(projetoParaReabrir.valorSinal ?? ((projetoParaReabrir.valorTotal || 0) * ((projetoParaReabrir.percentualSinal ?? 50) / 100))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Pago)
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                  <span className="text-amber-900 font-semibold">Saldo que volta a ficar PENDENTE:</span>
                  <span className="font-mono font-black text-rose-600">
                    R$ {(projetoParaReabrir.valorEntrega ?? Math.max(0, (projetoParaReabrir.valorTotal || 0) - (projetoParaReabrir.valorSinal ?? ((projetoParaReabrir.valorTotal || 0) * ((projetoParaReabrir.percentualSinal ?? 50) / 100))))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (A Receber)
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setProjetoParaReabrir(null)}
                className="px-4 py-2.5 bg-[#EBDDCF] hover:bg-[#DFCDBB] text-stone-800 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancelar / Manter Concluído
              </button>
              <button
                type="button"
                onClick={() => {
                  moverProjetoParaStatus(projetoParaReabrir.id, 'MONTAGEM');
                  setProjetoParaReabrir(null);
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 ring-2 ring-amber-400/40"
              >
                <RotateCcw className="w-4 h-4 text-white" />
                <span>Sim, Retornar para Entrega & Estornar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
