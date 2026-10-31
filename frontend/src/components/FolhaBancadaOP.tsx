import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, ProdutoProducao } from '../services/api';
import { ProjetoKanban } from '../types/marcenaria';
import {
  Scissors,
  CheckCircle2,
  Printer,
  Clock,
  Check,
  User,
  RefreshCw,
  Truck,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface FolhaBancadaOPProps {
  projetos?: ProjetoKanban[];
  onMoverParaMontagem?: (codigoProjeto: string, clienteNome: string) => void;
  onIrParaKanban?: () => void;
}

const BANCADA_STATUS_STORAGE = 'marcenaria_bancada_status_v2';

export const FolhaBancadaOP: React.FC<FolhaBancadaOPProps> = ({
  projetos = [],
  onMoverParaMontagem,
  onIrParaKanban,
}) => {
  const [produtos, setProdutos] = useState<ProdutoProducao[]>([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerMontagem, setBannerMontagem] = useState<{ cliente: string; movel: string; op: string } | null>(null);

  // Filtro padrão: mostrar apenas os pendentes de fabricação, ocultando os já concluídos
  const [filtroStatus, setFiltroStatus] = useState<'PENDENTES' | 'CONCLUIDOS'>('PENDENTES');

  // Salva no localStorage as marcações de corte, borda e pronto da bancada
  const salvarStatusLocal = (
    produtoId: string,
    alteracoes: { pronto?: boolean; pecaId?: string; cortada?: boolean; bordeada?: boolean }
  ) => {
    try {
      const salvo = localStorage.getItem(BANCADA_STATUS_STORAGE);
      const statusMap = salvo ? JSON.parse(salvo) : {};
      if (!statusMap[produtoId]) {
        statusMap[produtoId] = { pecas: {} };
      }
      if (alteracoes.pronto !== undefined) {
        statusMap[produtoId].pronto = alteracoes.pronto;
      }
      if (alteracoes.pecaId) {
        if (!statusMap[produtoId].pecas) statusMap[produtoId].pecas = {};
        statusMap[produtoId].pecas[alteracoes.pecaId] = {
          ...(statusMap[produtoId].pecas[alteracoes.pecaId] || {}),
          ...(alteracoes.cortada !== undefined ? { cortada: alteracoes.cortada } : {}),
          ...(alteracoes.bordeada !== undefined ? { bordeada: alteracoes.bordeada } : {}),
        };
      }
      localStorage.setItem(BANCADA_STATUS_STORAGE, JSON.stringify(statusMap));
    } catch (e) {
      console.warn('Erro ao salvar status da bancada no localStorage:', e);
    }
  };

  // Carrega e sincroniza os produtos da bancada combinando Backend H2 e projetos 'EM_PRODUCAO' do Kanban
  const carregarProdutos = useCallback(async (mostrarLoading = false) => {
    if (mostrarLoading) setLoading(true);

    let localStatus: Record<string, { pronto?: boolean; pecas?: Record<string, { cortada?: boolean; bordeada?: boolean }> }> = {};
    try {
      const salvo = localStorage.getItem(BANCADA_STATUS_STORAGE);
      if (salvo) localStatus = JSON.parse(salvo);
    } catch (e) {}

    let listaBackend: ProdutoProducao[] = [];
    try {
      const res = await api.listarProdutosProducao();
      if (Array.isArray(res)) {
        listaBackend = res;
      }
    } catch (err) {
      // Backend offline ou iniciando - prossegue com dados do Kanban
    }

    // Processa projetos do Kanban que estão na etapa 'EM_PRODUCAO'
    const listaKanban: ProdutoProducao[] = [];
    if (projetos && projetos.length > 0) {
      const projsEmProducao = projetos.filter(
        (p) => p.status === 'EM_PRODUCAO' && !p.cancelado
      );

      projsEmProducao.forEach((proj) => {
        const produtosDoProjeto = proj.produtos && proj.produtos.length > 0
          ? proj.produtos
          : [
              {
                id: `prod-${proj.codigo}`,
                nome: proj.ambiente ? `Móvel ${proj.ambiente}` : 'Módulo Sob Medida',
                descricao: 'Módulo sob medida da marcenaria',
                quantidade: 1,
                dimensoes: 'Sob Medida',
                material: 'MDF Branco TX 18mm',
                ferragensResumo: 'Ferragens padrão',
                pecasQtd: 4,
              },
            ];

        produtosDoProjeto.forEach((prod, idx) => {
          const prodId = prod.id || `${proj.codigo}-${idx}`;
          const pecasProducao = (prod.pecas && prod.pecas.length > 0)
            ? prod.pecas.map((peca, pIdx) => {
                const pecaId = peca.id || `${prodId}-peca-${pIdx}`;
                const override = localStatus[prodId]?.pecas?.[pecaId];
                return {
                  id: pecaId,
                  descricao: peca.descricao || `Peça ${pIdx + 1}`,
                  quantidade: peca.quantidade || 1,
                  comprimentoMm: peca.comprimentoMm || 850,
                  larguraMm: peca.larguraMm || 580,
                  espessuraMm: peca.espessuraMm || 18,
                  orientacaoVeio: peca.orientacaoVeio || 'LONGITUDINAL',
                  fitaResumo: peca.fitaComprimento1 ? '1 Comp' : (peca.fitaLargura1 ? '1 Larg' : 'Fita PVC 1mm'),
                  materialNome: peca.tipoChapaManual || prod.material || 'MDF Branco TX 18mm',
                  cortada: override?.cortada ?? false,
                  bordeada: override?.bordeada ?? false,
                };
              })
            : [];

          const isProntoLocal = localStatus[prodId]?.pronto ?? false;

          listaKanban.push({
            id: prodId,
            nome: prod.nome || `Móvel ${proj.ambiente || ''}`,
            clienteNome: proj.cliente,
            clienteTelefone: proj.telefone || '',
            codigoProjeto: proj.codigo,
            codigoOP: `OP-${proj.codigo.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
            ambiente: proj.ambiente || 'Geral',
            pronto: isProntoLocal,
            pecas: pecasProducao,
          });
        });
      });
    }

    // Combina produtos do backend com os projetos em produção do Kanban (sem duplicar)
    const produtosCombinados: ProdutoProducao[] = [...listaBackend];
    listaKanban.forEach((itemK) => {
      const idxExistente = produtosCombinados.findIndex(
        (p) =>
          p.id === itemK.id ||
          (p.codigoProjeto && p.codigoProjeto.toLowerCase() === itemK.codigoProjeto.toLowerCase())
      );
      if (idxExistente === -1) {
        produtosCombinados.push(itemK);
      } else {
        // Se já existe do backend mas o Kanban tem peças detalhadas, preserva
        if ((!produtosCombinados[idxExistente].pecas || produtosCombinados[idxExistente].pecas.length === 0) && itemK.pecas.length > 0) {
          produtosCombinados[idxExistente] = { ...produtosCombinados[idxExistente], pecas: itemK.pecas };
        }
      }
    });

    // Aplica overrides salvos localmente
    const produtosFinais = produtosCombinados.map((p) => {
      const st = localStatus[p.id];
      if (!st) return p;
      return {
        ...p,
        pronto: st.pronto !== undefined ? st.pronto : p.pronto,
        pecas: p.pecas.map((peca) => {
          const pSt = st.pecas?.[peca.id];
          return pSt ? { ...peca, ...pSt } : peca;
        }),
      };
    });

    setProdutos(produtosFinais);
    setProdutoSelecionadoId((prevId) => {
      if (prevId && produtosFinais.some((p) => p.id === prevId)) return prevId;
      return produtosFinais[0]?.id || null;
    });

    if (mostrarLoading) setLoading(false);
  }, [projetos]);

  useEffect(() => {
    carregarProdutos(true);

    const onSync = () => carregarProdutos(false);
    window.addEventListener('focus', onSync);
    window.addEventListener('marcenaria:sync', onSync);
    const interval = setInterval(onSync, 4000);

    return () => {
      window.removeEventListener('focus', onSync);
      window.removeEventListener('marcenaria:sync', onSync);
      clearInterval(interval);
    };
  }, [carregarProdutos]);

  // Filtra itens pendentes vs concluídos
  const pendentes = useMemo(() => produtos.filter((p) => !p.pronto), [produtos]);
  const concluidos = useMemo(() => produtos.filter((p) => p.pronto), [produtos]);

  const produtosExibidos = filtroStatus === 'PENDENTES' ? pendentes : concluidos;
  const produtoAtivo = produtosExibidos.find((p) => p.id === produtoSelecionadoId) || produtosExibidos[0];

  // Alterna o status geral do móvel (Pronto vs Não Pronto)
  const alternarStatusProntoMovel = async (id: string, statusAtual: boolean) => {
    const novoStatus = !statusAtual;
    const produto = produtos.find((p) => p.id === id);

    // Atualiza otimista na tela
    setProdutos((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const pecasAtualizadas = p.pecas.map((peca) =>
            novoStatus ? { ...peca, cortada: true, bordeada: true } : peca
          );
          return { ...p, pronto: novoStatus, pecas: pecasAtualizadas };
        }
        return p;
      })
    );

    salvarStatusLocal(id, { pronto: novoStatus });

    // Se marcou como PRONTO, move imediatamente para a etapa 5. Montagem / Entrega no Kanban!
    if (novoStatus && produto) {
      if (onMoverParaMontagem) {
        onMoverParaMontagem(produto.codigoProjeto, produto.clienteNome);
      }
      setBannerMontagem({
        cliente: produto.clienteNome,
        movel: produto.nome,
        op: produto.codigoOP || 'OP',
      });
      setTimeout(() => setBannerMontagem(null), 8000);
    }

    window.dispatchEvent(new CustomEvent('marcenaria:sync'));

    try {
      await api.alternarStatusProduto(id, novoStatus);
    } catch (err) {
      // Offline ou erro H2 mantido localmente
    }
  };

  // Alterna o corte de uma peça
  const toggleCortePeca = async (pecaId: string, valorAtual: boolean) => {
    const novoValor = !valorAtual;

    setProdutos((prev) =>
      prev.map((p) => {
        if (p.id === produtoAtivo?.id) {
          const pecasAtualizadas = p.pecas.map((peca) =>
            peca.id === pecaId ? { ...peca, cortada: novoValor } : peca
          );
          const todasProntas = pecasAtualizadas.length > 0 && pecasAtualizadas.every((item) => item.cortada && item.bordeada);
          if (todasProntas && !p.pronto) {
            if (onMoverParaMontagem) {
              onMoverParaMontagem(p.codigoProjeto, p.clienteNome);
            }
            setBannerMontagem({
              cliente: p.clienteNome,
              movel: p.nome,
              op: p.codigoOP || 'OP',
            });
            setTimeout(() => setBannerMontagem(null), 8000);
            api.alternarStatusProduto(p.id, true).catch(() => {});
            salvarStatusLocal(p.id, { pronto: true });
            window.dispatchEvent(new CustomEvent('marcenaria:sync'));
            return { ...p, pronto: true, pecas: pecasAtualizadas };
          }
          return { ...p, pecas: pecasAtualizadas };
        }
        return p;
      })
    );

    if (produtoAtivo) {
      salvarStatusLocal(produtoAtivo.id, { pecaId, cortada: novoValor });
    }

    window.dispatchEvent(new CustomEvent('marcenaria:sync'));

    try {
      await api.atualizarStatusPeca(pecaId, { cortada: novoValor });
    } catch (err) {
      // Offline
    }
  };

  // Alterna a borda de uma peça
  const toggleBordaPeca = async (pecaId: string, valorAtual: boolean) => {
    const novoValor = !valorAtual;

    setProdutos((prev) =>
      prev.map((p) => {
        if (p.id === produtoAtivo?.id) {
          const pecasAtualizadas = p.pecas.map((peca) =>
            peca.id === pecaId ? { ...peca, bordeada: novoValor } : peca
          );
          const todasProntas = pecasAtualizadas.length > 0 && pecasAtualizadas.every((item) => item.cortada && item.bordeada);
          if (todasProntas && !p.pronto) {
            if (onMoverParaMontagem) {
              onMoverParaMontagem(p.codigoProjeto, p.clienteNome);
            }
            setBannerMontagem({
              cliente: p.clienteNome,
              movel: p.nome,
              op: p.codigoOP || 'OP',
            });
            setTimeout(() => setBannerMontagem(null), 8000);
            api.alternarStatusProduto(p.id, true).catch(() => {});
            salvarStatusLocal(p.id, { pronto: true });
            window.dispatchEvent(new CustomEvent('marcenaria:sync'));
            return { ...p, pronto: true, pecas: pecasAtualizadas };
          }
          return { ...p, pecas: pecasAtualizadas };
        }
        return p;
      })
    );

    if (produtoAtivo) {
      salvarStatusLocal(produtoAtivo.id, { pecaId, bordeada: novoValor });
    }

    window.dispatchEvent(new CustomEvent('marcenaria:sync'));

    try {
      await api.atualizarStatusPeca(pecaId, { bordeada: novoValor });
    } catch (err) {
      // Offline
    }
  };

  // Cálculos de progresso do produto ativo
  const totalPecas = produtoAtivo?.pecas?.length || 0;
  const totalCortadas = produtoAtivo?.pecas?.filter((p) => p.cortada).length || 0;
  const totalBordeadas = produtoAtivo?.pecas?.filter((p) => p.bordeada).length || 0;
  const pctCorte = totalPecas > 0 ? Math.round((totalCortadas / totalPecas) * 100) : 0;
  const pctBorda = totalPecas > 0 ? Math.round((totalBordeadas / totalPecas) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* BANNER DE TRANSIÇÃO AUTOMÁTICA PARA MONTAGEM / ENTREGA */}
      {bannerMontagem && (
        <div id="banner-montagem-entrega" className="p-4 bg-gradient-to-r from-amber-50 via-emerald-50 to-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-stone-800 text-sm shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-[#8C5E20]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-stone-900 block text-sm">
                🎉 Móvel Finalizado! O projeto de {bannerMontagem.cliente} avançou para "5. Montagem / Entrega" no Kanban!
              </span>
              <span className="text-xs text-stone-600">
                {bannerMontagem.op} • {bannerMontagem.movel} liberado para expedição, transporte e montagem no cliente.
              </span>
            </div>
          </div>
          {onIrParaKanban && (
            <button
              onClick={onIrParaKanban}
              className="px-4 py-2 bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950 font-bold rounded-xl text-xs transition-all flex items-center space-x-1 shadow-sm flex-shrink-0"
            >
              <span>Ver no Kanban →</span>
            </button>
          )}
        </div>
      )}

      {/* CABEÇALHO GERAL DA OFICINA */}
      <div className="bg-[#FAF7F2] border border-[#E7DFD5] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#D3A25D] shadow-xs bg-transparent flex items-center justify-center flex-shrink-0">
            <img src="/logo-fh.png" alt="FH Móveis Planejados" className="w-full h-full object-cover object-center" />
          </div>
          <div>
            <div className="flex items-baseline font-serif">
              <span className="font-bold text-2xl text-[#3D230A] tracking-tight leading-none">FH</span>
              <span className="font-normal text-2xl text-[#966226] tracking-normal leading-none ml-2">Móveis planejados</span>
            </div>
            <h1 className="text-sm font-bold text-stone-900 flex items-center space-x-2 mt-0.5">
              <span>Folha de Bancada & Corte de Produção</span>
            </h1>
            <p className="text-xs text-stone-600 font-medium">
              Acompanhamento operacional: veja o que está pronto ou pendente no corte e colagem de borda
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <button
            onClick={() => carregarProdutos(true)}
            className="px-3.5 py-2 bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-800 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-[#DFCDB7]"
            title="Recarregar dados da bancada"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#D3A25D] hover:bg-[#C4934E] text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-md shadow-[#D3A25D]/25"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Roteiro de Corte</span>
          </button>
        </div>
      </div>

      {/* FILTRO DE STATUS: PENDENTES (PADRÃO) vs CONCLUÍDOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7DFD5] pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setFiltroStatus('PENDENTES');
              if (pendentes.length > 0) setProdutoSelecionadoId(pendentes[0].id);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-xs ${
              filtroStatus === 'PENDENTES'
                ? 'bg-[#D3A25D] text-stone-950 border-2 border-[#B88438]/40 shadow-sm font-extrabold'
                : 'bg-[#FAF7F2] text-stone-700 hover:bg-[#EFE9DE] border border-[#E7DFD5]'
            }`}
          >
            <Clock className="w-4 h-4 text-[#8C5E20]" />
            <span>Pendentes na Bancada ({pendentes.length})</span>
          </button>

          <button
            onClick={() => {
              setFiltroStatus('CONCLUIDOS');
              if (concluidos.length > 0) setProdutoSelecionadoId(concluidos[0].id);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-xs ${
              filtroStatus === 'CONCLUIDOS'
                ? 'bg-emerald-700 text-white border-2 border-emerald-800 shadow-sm font-extrabold'
                : 'bg-[#FAF7F2] text-stone-700 hover:bg-[#EFE9DE] border border-[#E7DFD5]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Concluídos ({concluidos.length})</span>
          </button>
        </div>

        <div className="text-xs text-stone-500 font-medium">
          {filtroStatus === 'PENDENTES'
            ? 'Exibindo apenas móveis com corte e borda pendentes.'
            : 'Móveis finalizados que foram enviados para expedição/montagem.'}
        </div>
      </div>

      {/* SELEÇÃO DE MÓVEL / CLIENTE (TABS VISUAIS) */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
          <span>
            {filtroStatus === 'PENDENTES' ? 'Móveis Pendentes na Oficina' : 'Móveis Concluídos'}{' '}
            ({produtosExibidos.length}):
          </span>
          {produtosExibidos.length > 0 && (
            <span className="text-[11px] font-normal text-stone-500">
              Clique em um móvel para ver suas peças abaixo
            </span>
          )}
        </div>

        {produtosExibidos.length === 0 ? (
          <div className="bg-white border border-[#E7DFD5] rounded-2xl p-10 text-center space-y-4 shadow-sm">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
              filtroStatus === 'PENDENTES'
                ? 'bg-amber-50 border border-amber-200 text-[#8C5E20]'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
            }`}>
              {filtroStatus === 'PENDENTES' ? <Scissors className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900">
                {filtroStatus === 'PENDENTES'
                  ? 'Nenhum móvel pendente de corte na bancada'
                  : 'Nenhum móvel concluído ainda'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {filtroStatus === 'PENDENTES'
                  ? 'Os projetos que estiverem na coluna "4. Em Produção (Corte/Bancada)" do Kanban ou enviados da Calculadora aparecem automaticamente aqui.'
                  : 'Conforme as peças forem cortadas e o móvel for finalizado, ele será registrado como concluído aqui.'}
              </p>
            </div>
            {filtroStatus === 'PENDENTES' && onIrParaKanban && (
              <button
                onClick={onIrParaKanban}
                className="px-5 py-2.5 bg-[#D3A25D] hover:bg-[#c2914c] text-stone-950 font-bold rounded-xl text-xs transition-all shadow-sm inline-flex items-center space-x-2"
              >
                <span>Ir para o Kanban →</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {produtosExibidos.map((p) => {
              const isAtivo = p.id === (produtoAtivo?.id ?? '');
              const cortadas = p.pecas.filter((item) => item.cortada).length;
              const qtdPecas = p.pecas.length;

              return (
                <button
                  key={p.id}
                  onClick={() => setProdutoSelecionadoId(p.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isAtivo
                      ? 'bg-white border-2 border-[#D3A25D] shadow-md shadow-[#D3A25D]/15 ring-2 ring-[#D3A25D]/30'
                      : 'bg-[#FAF7F2] border-[#E7DFD5] hover:bg-white hover:border-[#D3A25D]/40 text-stone-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold text-[#8C5E20] bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#DFCDB7]">
                      {p.codigoOP || 'OP-2026'}
                    </span>

                    {/* BADGE: ESTÁ PRONTO OU NÃO? */}
                    {p.pronto ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>PRONTO ✓</span>
                      </span>
                    ) : cortadas > 0 ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>EM ANDAMENTO</span>
                      </span>
                    ) : (
                      <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <span>NÃO PRONTO</span>
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-stone-950 text-sm truncate">{p.nome}</div>
                  <div className="text-xs text-stone-600 flex items-center space-x-1 mt-0.5">
                    <User className="w-3 h-3 text-stone-400" />
                    <span className="truncate">{p.clienteNome}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500 border-t border-[#E7DFD5] pt-2">
                    <span>{qtdPecas} peças</span>
                    <span className="font-bold text-stone-800">{cortadas}/{qtdPecas} cortadas</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* DETALHES DO MÓVEL SELECIONADO & CONTROLE PRINCIPAL DE STATUS */}
      {produtoAtivo && (
        <div className="space-y-6">
          {/* Card de Destaque: "ESTÁ PRONTO OU NÃO?" */}
          <div
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm ${
              produtoAtivo.pronto
                ? 'bg-emerald-50/80 border-emerald-500/50'
                : 'bg-white border-[#E7DFD5]'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs text-stone-500">Cliente:</span>
                <span className="text-sm font-bold text-stone-950">{produtoAtivo.clienteNome}</span>
                {produtoAtivo.clienteTelefone && (
                  <span className="text-xs text-stone-500">({produtoAtivo.clienteTelefone})</span>
                )}
                <span className="text-stone-300">•</span>
                <span className="text-xs text-[#8C5E20] font-semibold">Ambiente: {produtoAtivo.ambiente}</span>
                <span className="text-stone-300">•</span>
                <span className="text-xs font-mono font-bold text-stone-600">{produtoAtivo.codigoProjeto}</span>
              </div>

              <h2 className="text-2xl font-black text-stone-950">{produtoAtivo.nome}</h2>

              <div className="flex items-center space-x-6 pt-2 text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Progresso de Corte:</span>
                  <span className="font-mono font-bold text-[#8C5E20] text-sm">
                    {totalCortadas} de {totalPecas} ({pctCorte}%)
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Progresso de Borda:</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    {totalBordeadas} de {totalPecas} ({pctBorda}%)
                  </span>
                </div>
              </div>
            </div>

            {/* BOTÃO PRINCIPAL: ALTERNAR ENTRE "PRONTO" OU "NÃO PRONTO" */}
            <div className="flex flex-col items-end space-y-2 w-full md:w-auto">
              <button
                id="btn-alternar-pronto-movel"
                onClick={() => alternarStatusProntoMovel(produtoAtivo.id, produtoAtivo.pronto)}
                className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center space-x-2 shadow-md ${
                  produtoAtivo.pronto
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/40'
                    : 'bg-[#D3A25D] hover:bg-[#C4934E] text-stone-950 shadow-[#D3A25D]/20'
                }`}
              >
                {produtoAtivo.pronto ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>MÓVEL 100% PRONTO (Clique p/ Desmarcar)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>MARCAR MÓVEL COMO PRONTO ✓</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-stone-500">
                {produtoAtivo.pronto
                  ? 'Móvel finalizado e liberado para entrega/montagem.'
                  : 'Ao marcar como pronto, o projeto avança para Montagem no Kanban.'}
              </span>
            </div>
          </div>

          {/* LISTA DE PEÇAS DE CORTE EM FORMATO TÁTIL DE OFICINA */}
          <div className="bg-white border border-[#E7DFD5] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-[#F5EFEB] border-b border-[#E7DFD5] flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center space-x-2">
                <Scissors className="w-4 h-4 text-[#8C5E20]" />
                <span>Roteiro de Bancada: Peças do {produtoAtivo.nome}</span>
              </span>
              <span className="text-xs text-stone-500 font-medium">
                Toque nos botões para registrar o corte e a colagem de fita
              </span>
            </div>

            <div className="divide-y divide-[#E7DFD5]">
              {produtoAtivo.pecas.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    item.cortada && item.bordeada
                      ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600'
                      : item.cortada
                      ? 'bg-amber-50/50 border-l-4 border-l-amber-500'
                      : 'hover:bg-[#FAF7F2]'
                  }`}
                >
                  {/* Informações da Peça em Destaque */}
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-[#EFE9DE] text-stone-800 border border-[#DFCDB7] text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-base font-bold text-stone-950">{item.descricao}</span>
                      <span className="bg-[#FAF5EC] text-[#8C5E20] font-bold text-xs px-2 py-0.5 rounded border border-[#DFCDB7]">
                        {item.quantidade}x
                      </span>
                    </div>

                    <div className="text-xs text-stone-700 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
                      {item.comprimentoMm && item.larguraMm && item.comprimentoMm > 0 && item.larguraMm > 0 && item.comprimentoMm !== 1000 ? (
                        <span className="font-mono font-black text-[#543A14] text-sm bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E7DFD5]">
                          {item.comprimentoMm} × {item.larguraMm} mm
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[#8C5E20] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Corte Sob Medida
                        </span>
                      )}
                      <span className="text-stone-600">
                        Chapa / Madeira: <strong className="text-stone-900">{item.materialNome || 'MDF Branco TX 15mm'}</strong>
                      </span>
                    </div>

                    {item.fitaResumo && item.fitaResumo !== 'Sem Fita' && (
                      <div className="text-xs text-stone-600 flex items-center space-x-1.5">
                        <span className="text-stone-500">Fita de Borda:</span>
                        <span className="text-[#8C5E20] font-semibold bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#DFCDB7] text-[11px]">
                          {item.fitaResumo}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BOTÕES TÁTEIS: CORTADA E BORDEJADA */}
                  <div className="flex items-center space-x-3 w-full md:w-auto justify-end pt-2 md:pt-0">
                    <button
                      onClick={() => toggleCortePeca(item.id, item.cortada)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shadow-sm ${
                        item.cortada
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          : 'bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-800 border border-[#DFCDB7]'
                      }`}
                    >
                      <Scissors className="w-4 h-4" />
                      <span>{item.cortada ? '✓ Cortada' : 'Cortar Peça'}</span>
                    </button>

                    <button
                      onClick={() => toggleBordaPeca(item.id, item.bordeada)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 shadow-sm ${
                        item.bordeada
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                          : 'bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-800 border border-[#DFCDB7]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{item.bordeada ? '✓ Bordejada' : 'Colar Borda'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
