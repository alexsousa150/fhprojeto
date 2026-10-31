import React, { useState, useEffect } from 'react';
import { Layers, Calculator, ClipboardList, UserCheck, FileSignature, Power, RefreshCw } from 'lucide-react';
import { AtualizacaoModal } from './AtualizacaoModal';

interface NavbarProps {
  abaAtiva: 'kanban' | 'calculadora' | 'bancada' | 'contratos';
  setAbaAtiva: (aba: 'kanban' | 'calculadora' | 'bancada' | 'contratos') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ abaAtiva, setAbaAtiva }) => {
  const [encerrando, setEncerrando] = useState(false);
  const [encerrado, setEncerrado] = useState(false);
  const [modalAtualizacaoAberto, setModalAtualizacaoAberto] = useState(false);
  const [versaoSistema, setVersaoSistema] = useState('1.0.1');

  useEffect(() => {
    // Obtém versão real informada pelo backend
    fetch('/api/v1/sistema/versao')
      .then(res => res.json())
      .then(data => {
        if (data && data.versao) {
          setVersaoSistema(data.versao);
        }
      })
      .catch(() => {});
  }, []);

  const encerrarSistema = async () => {
    if (!window.confirm('Deseja realmente desligar o sistema de marcenaria e fechar o servidor local?')) {
      return;
    }

    try {
      setEncerrando(true);
      await fetch('/api/v1/sistema/encerrar', { method: 'POST' });
      setEncerrado(true);
    } catch {
      setEncerrado(true);
    }
  };

  if (encerrado) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8F5EE] flex items-center justify-center p-6 text-center">
        <div className="bg-white border border-[#E7DFD5] rounded-2xl p-8 max-w-md shadow-xl">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Power className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2 font-serif">Sistema Encerrado com Sucesso</h2>
          <p className="text-sm text-stone-600 mb-6">
            O servidor local e o banco de dados foram desligados em segurança. Você já pode fechar esta aba do navegador.
          </p>
          <span className="text-xs text-stone-400">Até logo! — FH Móveis Planejados</span>
        </div>
      </div>
    );
  }

  return (
    <header className="bg-[#FAF7F2] border-b border-[#E7DFD5] sticky top-0 z-40 px-6 py-2.5 backdrop-blur-md bg-opacity-95 shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand com a Logo Atualizada e Tipografia de acordo com a Logo */}
        <div className="flex items-center space-x-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#D3A25D] shadow-md shadow-[#D3A25D]/25 bg-transparent flex items-center justify-center flex-shrink-0">
            <img
              src="/logo-fh.png"
              alt="FH Móveis Planejados"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                // Fallback caso a imagem ainda esteja carregando
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline flex-wrap gap-x-2.5">
              <h1 className="font-serif tracking-normal leading-none inline-flex items-baseline">
                <span className="font-bold text-2xl md:text-[27px] text-[#3D230A] tracking-tight">
                  FH
                </span>
                <span className="font-normal text-2xl md:text-[27px] text-[#966226] ml-2">
                  Móveis planejados
                </span>
              </h1>
              <span className="text-[10px] bg-[#EFE6D8] text-[#7A531C] font-bold px-2 py-0.5 rounded-full border border-[#DFCDB7] uppercase tracking-wider self-center">
                Sistema ERP
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium mt-0.5">
              Marcenaria Fina, Gestão Operacional & Contratos
            </p>
          </div>
        </div>

        {/* Navigation Tabs no Tema Creme Claro */}
        <nav className="flex items-center space-x-1 bg-[#EFE9DE] p-1 rounded-xl border border-[#DFCDB7]">
          <button
            onClick={() => setAbaAtiva('kanban')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              abaAtiva === 'kanban'
                ? 'bg-[#D3A25D] text-stone-950 shadow-md shadow-[#D3A25D]/25 font-bold border border-[#B88438]/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-[#E5DDCF]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fila de Produção</span>
          </button>
          <button
            onClick={() => setAbaAtiva('calculadora')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              abaAtiva === 'calculadora'
                ? 'bg-[#D3A25D] text-stone-950 shadow-md shadow-[#D3A25D]/25 font-bold border border-[#B88438]/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-[#E5DDCF]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Orçamento</span>
          </button>
          <button
            onClick={() => setAbaAtiva('bancada')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              abaAtiva === 'bancada'
                ? 'bg-[#D3A25D] text-stone-950 shadow-md shadow-[#D3A25D]/25 font-bold border border-[#B88438]/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-[#E5DDCF]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Folha de Bancada</span>
          </button>
          <button
            onClick={() => setAbaAtiva('contratos')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              abaAtiva === 'contratos'
                ? 'bg-[#D3A25D] text-stone-950 shadow-md shadow-[#D3A25D]/25 font-bold border border-[#B88438]/20'
                : 'text-stone-700 hover:text-stone-950 hover:bg-[#E5DDCF]'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>Contratos de Serviço</span>
          </button>
        </nav>

        {/* Painel do Usuário e Botão de Desligar */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 bg-[#EFE9DE] border border-[#DFCDB7] px-3 py-1.5 rounded-xl shadow-xs">
            <UserCheck className="w-4 h-4 text-[#8C5E20]" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-stone-900 leading-tight">Painel Principal</span>
              <span className="text-[10px] text-emerald-700 font-bold">Felipe Harison</span>
            </div>
          </div>

          {/* Botão de Versão e Atualização */}
          <button
            onClick={() => setModalAtualizacaoAberto(true)}
            title="Verificar atualizações do sistema"
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#EFE9DE] hover:bg-[#E5DDCF] text-stone-800 border border-[#DFCDB7] rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8C5E20]" />
            <span>v{versaoSistema}</span>
          </button>

          <button
            onClick={encerrarSistema}
            disabled={encerrando}
            title="Desligar e Encerrar o Sistema"
            className="flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            <Power className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">{encerrando ? 'Encerrando...' : 'Desligar'}</span>
          </button>
        </div>
      </div>

      {/* Modal de Atualização */}
      <AtualizacaoModal
        isOpen={modalAtualizacaoAberto}
        onClose={() => setModalAtualizacaoAberto(false)}
        versaoAtual={versaoSistema}
      />
    </header>
  );
};
