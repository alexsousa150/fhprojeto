export interface MaterialPlanilha {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'CHAPA' | 'FITA_BORDA' | 'FERRAGEM' | 'PERFIL' | 'QUIMICO' | 'FIXACAO' | 'INSUMO';
  custoUnitarioPadrao: number;
  custoUnitario: number;
  quantidade: number;
  unidadeMedida: string;
  espessuraMm?: number;
  personalizado?: boolean;
}

export const MDFS_PLANILHA_PADRAO: MaterialPlanilha[] = [
  {
    id: 'mdf-branco-15',
    codigo: 'mdf-branco-15',
    nome: 'MDF BRANCO DE 15MM',
    tipo: 'CHAPA',
    custoUnitarioPadrao: 289,
    custoUnitario: 289,
    quantidade: 0,
    unidadeMedida: 'UN',
    espessuraMm: 15,
  },
  {
    id: 'mdf-branco-6',
    codigo: 'mdf-branco-6',
    nome: 'MDF BRANCO 6MM',
    tipo: 'CHAPA',
    custoUnitarioPadrao: 221,
    custoUnitario: 221,
    quantidade: 0,
    unidadeMedida: 'UN',
    espessuraMm: 6,
  },
  {
    id: 'mdf-naval-15',
    codigo: 'mdf-naval-15',
    nome: 'MDF NAVAL 15MM',
    tipo: 'CHAPA',
    custoUnitarioPadrao: 420,
    custoUnitario: 420,
    quantidade: 0,
    unidadeMedida: 'UN',
    espessuraMm: 15,
  },
  {
    id: 'mdf-naval-6',
    codigo: 'mdf-naval-6',
    nome: 'MDF NAVAL 6MM',
    tipo: 'CHAPA',
    custoUnitarioPadrao: 360,
    custoUnitario: 360,
    quantidade: 0,
    unidadeMedida: 'UN',
    espessuraMm: 6,
  },
  {
    id: 'mdf-brilhante-15',
    codigo: 'mdf-brilhante-15',
    nome: 'MDF BRILHANTE 15MM',
    tipo: 'CHAPA',
    custoUnitarioPadrao: 550,
    custoUnitario: 550,
    quantidade: 0,
    unidadeMedida: 'UN',
    espessuraMm: 15,
  },
  {
    id: 'mdf-brilhante-6',
    codigo: 'mdf-brilhante-6',
    nome: 'MDF BRILHANTE 6MM',
    tipo: 'CHAPA',
    custoUnitarioPadrao: 490,
    custoUnitario: 490,
    quantidade: 0,
    unidadeMedida: 'UN',
    espessuraMm: 6,
  },
  {
    id: 'mdf-amadeirado-15',
    codigo: 'mdf-amadeirado-15',
    nome: 'MDF AMADEIRADO 15 MM',
    tipo: 'CHAPA',
    custoUnitarioPadrao: 490,
    custoUnitario: 490,
    quantidade: 0,
    unidadeMedida: 'UN',
    espessuraMm: 15,
  },
  {
    id: 'mdf-amadeirado-6',
    codigo: 'mdf-amadeirado-6',
    nome: 'MDF AMADEIRADO 6MM',
    tipo: 'CHAPA',
    custoUnitarioPadrao: 460,
    custoUnitario: 460,
    quantidade: 0,
    unidadeMedida: 'UN',
    espessuraMm: 6,
  },
];

export const FERRAMENTAS_PLANILHA_PADRAO: MaterialPlanilha[] = [
  {
    id: 'fita-amadeirada-64',
    codigo: 'fita-amadeirada-64',
    nome: 'FITA AMADEIRADA 64MM',
    tipo: 'FITA_BORDA',
    custoUnitarioPadrao: 95,
    custoUnitario: 95,
    quantidade: 0,
    unidadeMedida: 'rolo',
  },
  {
    id: 'fita-branca-22',
    codigo: 'fita-branca-22',
    nome: 'FITA BRANCA 22MM',
    tipo: 'FITA_BORDA',
    custoUnitarioPadrao: 20,
    custoUnitario: 20,
    quantidade: 0,
    unidadeMedida: 'rolo',
  },
  {
    id: 'fita-branca-35',
    codigo: 'fita-branca-35',
    nome: 'FITA BRANCA 35MM',
    tipo: 'FITA_BORDA',
    custoUnitarioPadrao: 30,
    custoUnitario: 30,
    quantidade: 0,
    unidadeMedida: 'rolo',
  },
  {
    id: 'fita-branca-64',
    codigo: 'fita-branca-64',
    nome: 'FITA BRANCA 64MM',
    tipo: 'FITA_BORDA',
    custoUnitarioPadrao: 40,
    custoUnitario: 40,
    quantidade: 0,
    unidadeMedida: 'rolo',
  },
  {
    id: 'corredica-50cm',
    codigo: 'corredica-50cm',
    nome: 'CORREDIÇA 50CM',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 30,
    custoUnitario: 30,
    quantidade: 0,
    unidadeMedida: 'par',
  },
  {
    id: 'corredica-45cm',
    codigo: 'corredica-45cm',
    nome: 'CORREDIÇA 45CM',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 25,
    custoUnitario: 25,
    quantidade: 0,
    unidadeMedida: 'par',
  },
  {
    id: 'corredica-40cm',
    codigo: 'corredica-40cm',
    nome: 'CORREDIÇA 40CM',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 17,
    custoUnitario: 17,
    quantidade: 0,
    unidadeMedida: 'par',
  },
  {
    id: 'corredica-35cm',
    codigo: 'corredica-35cm',
    nome: 'CORREDIÇA 35 CM',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 12,
    custoUnitario: 12,
    quantidade: 0,
    unidadeMedida: 'par',
  },
  {
    id: 'dobradica-inox',
    codigo: 'dobradica-inox',
    nome: 'DOBRADIÇA INOX',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 10,
    custoUnitario: 10,
    quantidade: 0,
    unidadeMedida: 'un',
  },
  {
    id: 'dobradica-comum',
    codigo: 'dobradica-comum',
    nome: 'DOBRADIÇA COMUM',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 7,
    custoUnitario: 7,
    quantidade: 0,
    unidadeMedida: 'un',
  },
  {
    id: 'pistao',
    codigo: 'pistao',
    nome: 'PISTÂO',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 10,
    custoUnitario: 10,
    quantidade: 0,
    unidadeMedida: 'un',
  },
  {
    id: 'ro-47',
    codigo: 'ro-47',
    nome: 'RO-47',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 35,
    custoUnitario: 35,
    quantidade: 0,
    unidadeMedida: 'kit',
  },
  {
    id: 'ro-21',
    codigo: 'ro-21',
    nome: 'RO-21',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 25,
    custoUnitario: 25,
    quantidade: 0,
    unidadeMedida: 'kit',
  },
  {
    id: 'roldana-porta-correr',
    codigo: 'roldana-porta-correr',
    nome: 'ROLDANA PORTA CORRER',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 60,
    custoUnitario: 60,
    quantidade: 0,
    unidadeMedida: 'kit',
  },
  {
    id: 'calha-4x4',
    codigo: 'calha-4x4',
    nome: 'CALHA 4X4',
    tipo: 'PERFIL',
    custoUnitarioPadrao: 100,
    custoUnitario: 100,
    quantidade: 0,
    unidadeMedida: 'barra',
  },
  {
    id: 'perfil-superior',
    codigo: 'perfil-superior',
    nome: 'PERFIL SUPERIOR',
    tipo: 'PERFIL',
    custoUnitarioPadrao: 50,
    custoUnitario: 50,
    quantidade: 0,
    unidadeMedida: 'barra',
  },
  {
    id: 'perfil-inferior',
    codigo: 'perfil-inferior',
    nome: 'PERFIL INFERIOR',
    tipo: 'PERFIL',
    custoUnitarioPadrao: 40,
    custoUnitario: 40,
    quantidade: 0,
    unidadeMedida: 'barra',
  },
  {
    id: 'perfil-1036',
    codigo: 'perfil-1036',
    nome: 'PERFIL 1036',
    tipo: 'PERFIL',
    custoUnitarioPadrao: 60,
    custoUnitario: 60,
    quantidade: 0,
    unidadeMedida: 'barra',
  },
  {
    id: 'cola-formica',
    codigo: 'cola-formica',
    nome: 'COLA FÓRMICA',
    tipo: 'QUIMICO',
    custoUnitarioPadrao: 100,
    custoUnitario: 100,
    quantidade: 0,
    unidadeMedida: 'lata',
  },
  {
    id: 'cola-instantanea-100ml',
    codigo: 'cola-instantanea-100ml',
    nome: 'COLA INSTANTANEA 100ML',
    tipo: 'QUIMICO',
    custoUnitarioPadrao: 40,
    custoUnitario: 40,
    quantidade: 0,
    unidadeMedida: 'tubo',
  },
  {
    id: 'parafuso-4x40',
    codigo: 'parafuso-4x40',
    nome: 'PARAFUSO 4X40',
    tipo: 'FIXACAO',
    custoUnitarioPadrao: 50,
    custoUnitario: 50,
    quantidade: 0,
    unidadeMedida: 'cento',
  },
  {
    id: 'parafuso-4x25',
    codigo: 'parafuso-4x25',
    nome: 'PARAFUSO 4X25',
    tipo: 'FIXACAO',
    custoUnitarioPadrao: 45,
    custoUnitario: 45,
    quantidade: 0,
    unidadeMedida: 'cento',
  },
  {
    id: 'parafuso-4x16',
    codigo: 'parafuso-4x16',
    nome: 'PARAFUSO 4X16',
    tipo: 'FIXACAO',
    custoUnitarioPadrao: 30,
    custoUnitario: 30,
    quantidade: 0,
    unidadeMedida: 'cento',
  },
  {
    id: 'parafuso-6x60',
    codigo: 'parafuso-6x60',
    nome: 'PARAFUSO 6X60',
    tipo: 'FIXACAO',
    custoUnitarioPadrao: 65,
    custoUnitario: 65,
    quantidade: 0,
    unidadeMedida: 'cento',
  },
  {
    id: 'suporte-invisivel',
    codigo: 'suporte-invisivel',
    nome: 'SUPORTE INVISÍVEL',
    tipo: 'FERRAGEM',
    custoUnitarioPadrao: 15,
    custoUnitario: 15,
    quantidade: 0,
    unidadeMedida: 'un',
  },
  {
    id: 'bucha',
    codigo: 'bucha',
    nome: 'BUCHA',
    tipo: 'FIXACAO',
    custoUnitarioPadrao: 20,
    custoUnitario: 20,
    quantidade: 0,
    unidadeMedida: 'cento',
  },
  {
    id: 'solvente',
    codigo: 'solvente',
    nome: 'SOLVENTE',
    tipo: 'QUIMICO',
    custoUnitarioPadrao: 25,
    custoUnitario: 25,
    quantidade: 0,
    unidadeMedida: 'litro',
  },
  {
    id: 'estopa',
    codigo: 'estopa',
    nome: 'ESTOPA',
    tipo: 'INSUMO',
    custoUnitarioPadrao: 20,
    custoUnitario: 20,
    quantidade: 0,
    unidadeMedida: 'pacote',
  },
  {
    id: 'perfil-facetado',
    codigo: 'perfil-facetado',
    nome: 'PERFIL FACETADO',
    tipo: 'PERFIL',
    custoUnitarioPadrao: 40,
    custoUnitario: 40,
    quantidade: 0,
    unidadeMedida: 'barra',
  },
  {
    id: 'acabamento-facetado',
    codigo: 'acabamento-facetado',
    nome: 'ACABAMENTO FACETADO',
    tipo: 'PERFIL',
    custoUnitarioPadrao: 7,
    custoUnitario: 7,
    quantidade: 0,
    unidadeMedida: 'un',
  },
  {
    id: 'fixa-tudo',
    codigo: 'fixa-tudo',
    nome: 'FIXA TUDO',
    tipo: 'QUIMICO',
    custoUnitarioPadrao: 40,
    custoUnitario: 40,
    quantidade: 0,
    unidadeMedida: 'tubo',
  },
  {
    id: 'silicone',
    codigo: 'silicone',
    nome: 'SILICONE',
    tipo: 'QUIMICO',
    custoUnitarioPadrao: 30,
    custoUnitario: 30,
    quantidade: 0,
    unidadeMedida: 'tubo',
  },
];

const STORAGE_CATALOGO_MDFS = 'marcenaria_catalogo_mdfs_v1';
const STORAGE_CATALOGO_FERRAMENTAS = 'marcenaria_catalogo_ferramentas_v1';

export const carregarCatalogoMdfs = (): MaterialPlanilha[] => {
  try {
    const salvo = localStorage.getItem(STORAGE_CATALOGO_MDFS);
    if (salvo) {
      const itensSalvos: MaterialPlanilha[] = JSON.parse(salvo);
      // Mescla com os padrões para garantir que todos os 8 existam
      const idsExistentes = new Set(itensSalvos.map((i) => i.id || i.codigo));
      const faltantes = MDFS_PLANILHA_PADRAO.filter((p) => !idsExistentes.has(p.id));
      return [...itensSalvos, ...faltantes].map((item) => ({
        ...item,
        quantidade: 0, // Inicia quantidade zerada para novo orçamento
      }));
    }
  } catch (err) {
    console.warn('Erro ao carregar catálogo de MDFs do localStorage:', err);
  }
  return MDFS_PLANILHA_PADRAO.map((m) => ({ ...m, quantidade: 0 }));
};

export const salvarCatalogoMdfs = (lista: MaterialPlanilha[]): void => {
  try {
    // Salva os itens e preços base (sem as quantidades transitórias do orçamento)
    const paraSalvar = lista.map((item) => ({
      ...item,
      custoUnitarioPadrao: item.custoUnitario,
      quantidade: 0,
    }));
    localStorage.setItem(STORAGE_CATALOGO_MDFS, JSON.stringify(paraSalvar));
  } catch (err) {
    console.warn('Erro ao salvar catálogo de MDFs no localStorage:', err);
  }
};

export const carregarCatalogoFerramentas = (): MaterialPlanilha[] => {
  try {
    const salvo = localStorage.getItem(STORAGE_CATALOGO_FERRAMENTAS);
    if (salvo) {
      const itensSalvos: MaterialPlanilha[] = JSON.parse(salvo);
      const idsExistentes = new Set(itensSalvos.map((i) => i.id || i.codigo));
      const faltantes = FERRAMENTAS_PLANILHA_PADRAO.filter((p) => !idsExistentes.has(p.id));
      return [...itensSalvos, ...faltantes].map((item) => ({
        ...item,
        quantidade: 0,
      }));
    }
  } catch (err) {
    console.warn('Erro ao carregar catálogo de ferramentas do localStorage:', err);
  }
  return FERRAMENTAS_PLANILHA_PADRAO.map((f) => ({ ...f, quantidade: 0 }));
};

export const salvarCatalogoFerramentas = (lista: MaterialPlanilha[]): void => {
  try {
    const paraSalvar = lista.map((item) => ({
      ...item,
      custoUnitarioPadrao: item.custoUnitario,
      quantidade: 0,
    }));
    localStorage.setItem(STORAGE_CATALOGO_FERRAMENTAS, JSON.stringify(paraSalvar));
  } catch (err) {
    console.warn('Erro ao salvar catálogo de ferramentas no localStorage:', err);
  }
};
