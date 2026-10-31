export interface Insumo {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'CHAPA' | 'FITA_BORDA' | 'FERRAGEM' | 'QUIMICO' | 'ACESSORIO';
  unidadeMedida: string;
  custoUnitario: number;
  comprimentoMm?: number;
  larguraMm?: number;
  espessuraMm?: number;
  acabamento?: string;
}

export interface PecaProducao {
  id: string;
  descricao: string;
  quantidade: number;
  comprimentoMm: number;
  larguraMm: number;
  espessuraMm: number;
  orientacaoVeio: string;
  fitaResumo: string;
  materialNome: string;
  cortada: boolean;
  bordeada: boolean;
}

export interface ProdutoProducao {
  id: string;
  nome: string;
  clienteNome: string;
  clienteTelefone: string;
  codigoProjeto: string;
  codigoOP: string;
  ambiente: string;
  valorTotal?: number;
  pronto: boolean;
  criadoEm?: string;
  pecas: PecaProducao[];
}

export interface CriarPedidoPayload {
  nomeCliente: string;
  telefone?: string;
  nomeMovel: string;
  ambiente?: string;
  valorTotal: number;
  custoMateriais: number;
  pecas: {
    descricao: string;
    quantidade: number;
    comprimentoMm: number;
    larguraMm: number;
    espessuraMm: number;
    orientacaoVeio: 'LONGITUDINAL' | 'TRANSVERSAL';
    fitaComprimento1: boolean;
    fitaComprimento2: boolean;
    fitaLargura1: boolean;
    fitaLargura2: boolean;
    chapaInsumoId?: string;
    fitaInsumoId?: string;
  }[];
}

const API_BASE = '/api/v1';

export const api = {
  // Insumos
  async listarInsumos(): Promise<Insumo[]> {
    const res = await fetch(`${API_BASE}/insumos`);
    if (!res.ok) throw new Error('Falha ao listar insumos');
    return res.json();
  },

  async cadastrarInsumo(dados: {
    nome: string;
    tipo: 'CHAPA' | 'FITA_BORDA' | 'FERRAGEM';
    custoUnitario: number;
    unidadeMedida?: string;
    comprimentoMm?: number;
    larguraMm?: number;
    espessuraMm?: number;
    acabamento?: string;
  }): Promise<Insumo> {
    const res = await fetch(`${API_BASE}/insumos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error('Falha ao cadastrar insumo');
    return res.json();
  },

  // Produção e Folha de Bancada
  async listarProdutosProducao(): Promise<ProdutoProducao[]> {
    const res = await fetch(`${API_BASE}/producao/produtos`);
    if (!res.ok) throw new Error('Falha ao carregar produtos da bancada');
    return res.json();
  },

  async criarPedidoProducao(dados: CriarPedidoPayload): Promise<ProdutoProducao> {
    const res = await fetch(`${API_BASE}/producao/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error('Falha ao enviar pedido para produção');
    return res.json();
  },

  async alternarStatusProduto(id: string, pronto?: boolean): Promise<ProdutoProducao> {
    const res = await fetch(`${API_BASE}/producao/produtos/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pronto !== undefined ? { pronto } : {}),
    });
    if (!res.ok) throw new Error('Falha ao atualizar status do produto');
    return res.json();
  },

  async atualizarStatusPeca(id: string, dados: { cortada?: boolean; bordeada?: boolean }): Promise<PecaProducao> {
    const res = await fetch(`${API_BASE}/producao/pecas/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error('Falha ao atualizar status da peça');
    return res.json();
  },

  async atualizarStatusProjeto(
    codigo: string,
    status: string,
    dadosExtras?: { cliente?: string; telefone?: string; ambiente?: string; valorTotal?: number; custoMateriais?: number }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/producao/projetos/${codigo}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(dadosExtras || {}) }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar status do projeto');
    return res.json();
  },
};
