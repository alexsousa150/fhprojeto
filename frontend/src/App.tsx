import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { KanbanProjetos, PROJETOS_INICIAIS } from './components/KanbanProjetos';
import { CalculadoraBOM } from './components/CalculadoraBOM';
import { FolhaBancadaOP } from './components/FolhaBancadaOP';
import { ContratoServico } from './components/ContratoServico';
import { ProjetoKanban, ContratoServicoData, ProdutoProjeto } from './types/marcenaria';
import { api } from './services/api';

const STORAGE_KEY = 'marcenaria_projetos_v3';

export const App: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<'kanban' | 'calculadora' | 'bancada' | 'contratos'>('kanban');

  // Estado centralizado e persistente dos projetos
  const [projetos, setProjetos] = useState<ProjetoKanban[]>(() => {
    try {
      // Limpa dados legados mockados para inicialização do sistema bruto/limpo
      localStorage.removeItem('marcenaria_projetos_v1');
      localStorage.removeItem('marcenaria_projetos_v2');
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar projetos do localStorage:', err);
    }
    return [];
  });

  // Salva no localStorage a cada modificação e notifica abas
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projetos));
    } catch (err) {
      console.warn('Erro ao salvar projetos no localStorage:', err);
    }
  }, [projetos]);

  // Sincronização em tempo real e reativa com o Backend e entre abas
  const sincronizarComBackend = useCallback(async () => {
    try {
      const produtosProducao = await api.listarProdutosProducao();
      if (produtosProducao && produtosProducao.length > 0) {
        setProjetos((prev) => {
          let alterou = false;
          const atualizados = [...prev];

          produtosProducao.forEach((prod) => {
            const idx = atualizados.findIndex(
              (p) =>
                (prod.codigoProjeto && p.codigo.toLowerCase() === prod.codigoProjeto.toLowerCase()) ||
                (prod.clienteNome && p.cliente.toLowerCase() === prod.clienteNome.toLowerCase())
            );

            if (idx >= 0) {
              const prj = atualizados[idx];
              // Se o móvel foi marcado como pronto na bancada e ainda está em produção no Kanban, move para Montagem
              if (prod.pronto && prj.status === 'EM_PRODUCAO') {
                atualizados[idx] = { ...prj, status: 'MONTAGEM' };
                alterou = true;
              }
            } else {
              // Se for um novo pedido gravado no backend (via Calculadora ou banco), reflete no Kanban
              atualizados.unshift({
                id: prod.id || Math.random().toString(),
                codigo: prod.codigoProjeto || `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`,
                cliente: prod.clienteNome,
                telefone: prod.clienteTelefone || '(11) 90000-0000',
                endereco: 'Endereço cadastrado na produção',
                ambiente: prod.ambiente || 'Cozinha',
                status: prod.pronto ? 'MONTAGEM' : 'EM_PRODUCAO',
                valorTotal: prod.valorTotal || 0,
                sinalPago: true,
                prazoDias: 15,
                horasEstimadas: prod.pecas.length * 4,
                produtos: [
                  {
                    id: prod.id,
                    nome: prod.nome,
                    descricao: 'Módulo sob medida em produção',
                    quantidade: 1,
                    dimensoes: 'Sob medida',
                    material: prod.pecas[0]?.materialNome || 'MDF 18mm',
                    ferragensResumo: 'Ferragens completas',
                    pecasQtd: prod.pecas.length,
                  },
                ],
              });
              alterou = true;
            }
          });

          return alterou ? atualizados : prev;
        });
      }
    } catch (err) {
      // Backend em inicialização ou offline - mantém estado local íntegro
    }
  }, []);

  useEffect(() => {
    // Sincroniza ao montar
    sincronizarComBackend();

    // 1. Ouvinte para sincronizar abas diferentes do navegador
    const sincronizarStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setProjetos(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    // 2. Ouvinte de eventos customizados da aplicação
    const onCustomSync = () => {
      sincronizarComBackend();
    };

    window.addEventListener('storage', sincronizarStorage);
    window.addEventListener('focus', onCustomSync);
    window.addEventListener('marcenaria:sync', onCustomSync);

    // 3. Polling suave em segundo plano (a cada 4s) para manter a tela sempre atualizada
    const interval = setInterval(sincronizarComBackend, 4000);

    return () => {
      window.removeEventListener('storage', sincronizarStorage);
      window.removeEventListener('focus', onCustomSync);
      window.removeEventListener('marcenaria:sync', onCustomSync);
      clearInterval(interval);
    };
  }, [sincronizarComBackend]);

  const [clientePreSelecionado, setClientePreSelecionado] = useState<string | undefined>(undefined);

  // Lista de clientes ativos extraída dos projetos para o seletor da Calculadora
  const clientesExistentes = projetos
    .filter((p) => !p.cancelado && p.status !== 'CANCELADO')
    .map((p) => ({
      id: p.id,
      nome: p.cliente,
      cpf: p.cpf,
      cep: p.cep,
      telefone: p.telefone,
      ambiente: p.ambiente,
      endereco: p.endereco,
      codigo: p.codigo,
      status: p.status,
      sinalPago: p.sinalPago,
      produtos: p.produtos,
      valorTotal: p.valorTotal,
      prazoDias: p.prazoDias,
      dataCriacao: p.dataCriacao,
    }));

  // Quando um pedido ou orçamento é salvo na Calculadora, reflete no Kanban com o status correspondente
  const handlePedidoCriado = (novoProjeto: ProjetoKanban) => {
    setProjetos((prev) => {
      const index = prev.findIndex(
        (p) =>
          (novoProjeto.codigo && p.codigo.toLowerCase() === novoProjeto.codigo.toLowerCase()) ||
          (novoProjeto.cliente && p.cliente.toLowerCase() === novoProjeto.cliente.toLowerCase())
      );
      if (index !== -1) {
        const atualizados = [...prev];
        atualizados[index] = {
          ...atualizados[index],
          ...novoProjeto,
          codigo: atualizados[index].codigo || novoProjeto.codigo,
        };
        return atualizados;
      }
      return [{ ...novoProjeto, dataCriacao: novoProjeto.dataCriacao || new Date().toISOString() }, ...prev];
    });
    window.dispatchEvent(new CustomEvent('marcenaria:sync'));
  };

  // Quando um móvel fica pronto na Folha de Bancada, move o projeto para 5. Montagem / Entrega
  const handleMoverParaMontagem = (codigoProjeto: string, clienteNome: string) => {
    setProjetos((prev) =>
      prev.map((proj) => {
        if (
          (codigoProjeto && proj.codigo.toLowerCase() === codigoProjeto.toLowerCase()) ||
          (clienteNome && proj.cliente.toLowerCase() === clienteNome.toLowerCase())
        ) {
          api.atualizarStatusProjeto(proj.codigo, 'MONTAGEM').catch(() => {});
          return {
            ...proj,
            status: 'MONTAGEM',
          };
        }
        return proj;
      })
    );
    window.dispatchEvent(new CustomEvent('marcenaria:sync'));
  };

  const [clienteContratoPreSelecionado, setClienteContratoPreSelecionado] = useState<string | undefined>(undefined);
  const [projetoContratoPreSelecionado, setProjetoContratoPreSelecionado] = useState<string | undefined>(undefined);

  const handleAbrirOrcamento = (clienteNome?: string) => {
    if (clienteNome) {
      setClientePreSelecionado(clienteNome);
    }
    setAbaAtiva('calculadora');
  };

  const handleAbrirContrato = (codigoProjeto?: string, clienteNome?: string) => {
    if (codigoProjeto) {
      setProjetoContratoPreSelecionado(codigoProjeto);
    }
    if (clienteNome) {
      setClienteContratoPreSelecionado(clienteNome);
    }
    setAbaAtiva('contratos');
  };

  const handleSalvarContratoNoProjeto = (
    codigoProjeto: string,
    contrato: ContratoServicoData,
    novosMoveisProjeto?: ProdutoProjeto[]
  ) => {
    setProjetos((prev) =>
      prev.map((proj) => {
        if (proj.codigo.toLowerCase() === codigoProjeto.toLowerCase()) {
          return {
            ...proj,
            contrato,
            valorTotal: contrato.pagamento?.valorTotal ?? proj.valorTotal,
            percentualSinal: contrato.pagamento?.percentualSinal ?? proj.percentualSinal,
            valorSinal: contrato.pagamento?.valorSinal ?? proj.valorSinal,
            valorEntrega: contrato.pagamento?.valorEntrega ?? proj.valorEntrega,
            prazoDias: contrato.prazoDiasUteis ?? proj.prazoDias,
            cpf: contrato.contratante?.cpfCnpj || proj.cpf,
            cep: contrato.contratante?.cep || proj.cep,
            telefone: contrato.contratante?.telefone || proj.telefone,
            endereco: contrato.contratante?.endereco || proj.endereco,
            produtos: novosMoveisProjeto && novosMoveisProjeto.length > 0 ? novosMoveisProjeto : proj.produtos,
          };
        }
        return proj;
      })
    );
    window.dispatchEvent(new CustomEvent('marcenaria:sync'));
  };

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-stone-900 flex flex-col print:bg-white print:min-h-0">
      <Navbar
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 print:p-0 print:m-0 print:max-w-none print:w-full">
        {abaAtiva === 'kanban' && (
          <KanbanProjetos
            projetos={projetos}
            setProjetos={setProjetos}
            onAbrirOrcamento={handleAbrirOrcamento}
            onAbrirContrato={handleAbrirContrato}
          />
        )}

        {abaAtiva === 'calculadora' && (
          <CalculadoraBOM
            clientesExistentes={clientesExistentes}
            clienteInicial={clientePreSelecionado}
            onPedidoCriado={handlePedidoCriado}
            onIrParaBancada={() => setAbaAtiva('bancada')}
            onIrParaKanban={() => setAbaAtiva('kanban')}
            onGerarContrato={(cliente, codPrj) => handleAbrirContrato(codPrj, cliente)}
          />
        )}

        {abaAtiva === 'bancada' && (
          <FolhaBancadaOP
            projetos={projetos}
            onMoverParaMontagem={handleMoverParaMontagem}
            onIrParaKanban={() => setAbaAtiva('kanban')}
          />
        )}

        {abaAtiva === 'contratos' && (
          <ContratoServico
            projetos={projetos}
            codigoProjetoInicial={projetoContratoPreSelecionado}
            clienteInicial={clienteContratoPreSelecionado}
            onSalvarContratoNoProjeto={handleSalvarContratoNoProjeto}
            onIrParaKanban={() => setAbaAtiva('kanban')}
          />
        )}
      </main>
    </div>
  );
};

export default App;
