export type Role = 'ADMIN' | 'VENDEDOR' | 'MARCENEIRO_PRODUCAO';

export type StatusProjeto =
  | 'VISITA_TECNICA'
  | 'ORCAMENTO'
  | 'APROVADO'
  | 'EM_PRODUCAO'
  | 'MONTAGEM'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type OrientacaoVeio = 'LONGITUDINAL' | 'TRANSVERSAL' | 'SEM_VEIO';

export interface UsuarioAutenticado {
  nome: string;
  email: string;
  cargo: Role;
  mfaAtivo: boolean;
  accessToken: string;
}

export interface PecaCorte {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario?: number;
  valorTotal?: number;
  tipoChapaManual?: string;
  comprimentoMm?: number;
  larguraMm?: number;
  espessuraMm?: number;
  orientacaoVeio?: OrientacaoVeio;
  fitaComprimento1?: boolean;
  fitaComprimento2?: boolean;
  fitaLargura1?: boolean;
  fitaLargura2?: boolean;
  chapaInsumoId?: string;
  fitaInsumoId?: string;
}

export interface FerragemItem {
  id: string;
  nome: string;
  quantidade: number;
  custoUnitario: number;
  unidade: string;
  valorTotal?: number;
}

export interface ResumoOrcamentoCalculado {
  areaTotalChapaM2: number;
  areaComPercaM2: number;
  totalChapasInteiras: number;
  custoChapas: number;
  metrosFitaBorda: number;
  custoFitas: number;
  custoFerragens: number;
  custoTotalMateriais: number;
  multiplicadorMateriais: number;
  valorFinalVenda: number;
  percentualSinal?: number;
  percentualEntrega?: number;
  valorSinal: number;
  valorEntrega: number;
  valorSinal50: number;
  valorEntrega50: number;
  lucroBruto: number;
}

export interface ProdutoProjeto {
  id: string;
  nome: string;
  descricao: string;
  quantidade: number;
  dimensoes: string; // Ex: "1200 x 850 x 580 mm"
  material: string;  // Ex: "MDF Branco TX 18mm + Fita 22mm"
  ferragensResumo: string; // Ex: "4x Dobradiças Slow + 3x Corrediças Telescópicas"
  pecasQtd: number;
  pecas?: PecaCorte[];
  ferragens?: FerragemItem[];
}

export interface MovelContrato {
  id: string;
  ambiente: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  dimensoes: string; // Ex: "1800 x 850 x 600 mm"
  material: string;  // Ex: "MDF Branco TX 18mm com fita PVC 1mm"
  ferragensResumo: string; // Ex: "4x Dobradiças Slow + 3x Corrediças com amortecimento"
  observacoes?: string; // Ex: "Furo técnico para fiação"
}

export interface ClientesInfoContrato {
  nome: string;
  tipoPessoa: 'PF' | 'PJ';
  cpfCnpj: string;
  rgIe?: string;
  telefone: string;
  email?: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  cep?: string;
}

export interface MarcenariaInfoContrato {
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  ie?: string;
  responsavelTecnico: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  uf: string;
}

export interface CondicoesPagamentoContrato {
  valorTotal: number;
  percentualSinal: number; // Ex: 50
  valorSinal: number;
  percentualEntrega: number; // Ex: 50
  valorEntrega: number;
  formaPagamentoSinal: string; // Ex: "PIX", "Transferência", "Boleto"
  formaPagamentoRestante: string; // Ex: "PIX na entrega e montagem", "Cartão de Crédito 3x"
  detalhesParcelamento?: string;
}

export interface ClausulasContrato {
  objeto: string;
  medicaoEProjeto: string;
  precoEPagamento: string;
  prazosEInstalacao: string;
  obrigacoesContratada: string;
  obrigacoesContratante: string;
  garantia: string;
  rescisaoEMultas: string;
  foro: string;
}

export interface ContratoServicoData {
  id: string;
  codigoContrato: string; // Ex: "CT-2026-081"
  codigoProjeto?: string;
  dataEmissao: string; // ISO ou YYYY-MM-DD
  prazoDiasUteis: number;
  dataPrevisaoEntrega?: string;
  contratante: ClientesInfoContrato;
  contratada: MarcenariaInfoContrato;
  moveis: MovelContrato[];
  pagamento: CondicoesPagamentoContrato;
  clausulas: ClausulasContrato;
  testemunhas?: {
    nome1?: string;
    cpf1?: string;
    nome2?: string;
    cpf2?: string;
  };
}

export interface ProjetoKanban {
  id: string;
  codigo: string;
  cliente: string;
  cpf?: string;
  cep?: string;
  telefone: string;
  endereco: string;
  ambiente: string;
  status: StatusProjeto;
  valorTotal: number;
  percentualSinal?: number;
  valorSinal?: number;
  valorEntrega?: number;
  sinalPago: boolean;
  saldoPago?: boolean;       // Saldo na entrega/montagem pago
  quitado?: boolean;         // Todos os recebimentos liquidados sem pendências
  valorRecebido?: number;    // Valor total já recebido (100% quando concluído)
  prazoDias: number;
  horasEstimadas: number;
  produtos: ProdutoProjeto[];
  contrato?: ContratoServicoData;
  cancelado?: boolean;
  dataCriacao?: string;      // ISO string YYYY-MM-DD
  dataCancelamento?: string; // ISO string do momento do cancelamento
  dataAprovacao?: string;    // ISO string da confirmação do sinal
  dataConclusao?: string;    // ISO string do momento da conclusão da O.S.
}

/**
 * Regra de negócio: Edição dos móveis e orçamento é permitida nas fases preliminares (Visita Técnica, Orçamento e Aprovado).
 * Uma vez iniciado o processo de fabricação (Em Produção, Montagem, Concluído ou Cancelado), a edição fabril é bloqueada.
 */
export const podeEditarMovel = (status: StatusProjeto, sinalPago?: boolean): boolean => {
  if (status === 'CANCELADO') return false;
  if (status === 'CONCLUIDO' || status === 'MONTAGEM' || status === 'EM_PRODUCAO') return false;
  return true; // VISITA_TECNICA, ORCAMENTO ou APROVADO (edição e ajustes permitidos de acordo)
};

/**
 * Regra de negócio: Projetos cancelados ficam disponíveis para reativação por no máximo 7 dias.
 * Após 7 dias da data de cancelamento, a reativação é permanentemente bloqueada.
 */
export const verificarPrazoReativacao = (
  dataCancelamento?: string
): { podeReativar: boolean; diasRestantes: number; diasPassados: number } => {
  if (!dataCancelamento) {
    return { podeReativar: true, diasRestantes: 7, diasPassados: 0 };
  }
  const diffMs = Date.now() - new Date(dataCancelamento).getTime();
  const diasPassados = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const diasRestantes = Math.max(0, 7 - diasPassados);
  return {
    podeReativar: diasPassados <= 7,
    diasRestantes,
    diasPassados,
  };
};
