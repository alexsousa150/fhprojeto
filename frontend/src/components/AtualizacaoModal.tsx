import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Sparkles,
  X,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface AtualizacaoInfo {
  status: 'SEM_INTERNET' | 'ATUALIZADO' | 'ATUALIZACAO_DISPONIVEL' | 'ERRO';
  versaoAtual?: string;
  versaoNova?: string;
  titulo?: string;
  novidades?: string;
  tamanhoBytes?: number;
  urlDownload?: string;
  mensagem?: string;
}

interface ProgressoDownload {
  baixando: boolean;
  progressoPercentual: number;
  bytesBaixados: number;
  totalBytes: number;
  concluido: boolean;
  erro?: string;
  mensagem?: string;
}

interface AtualizacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  versaoAtual: string;
}

export const AtualizacaoModal: React.FC<AtualizacaoModalProps> = ({
  isOpen,
  onClose,
  versaoAtual
}) => {
  const [etapa, setEtapa] = useState<
    'verificando' | 'sem_internet' | 'atualizado' | 'disponivel' | 'baixando' | 'concluido' | 'erro'
  >('verificando');

  const [info, setInfo] = useState<AtualizacaoInfo | null>(null);
  const [progresso, setProgresso] = useState<ProgressoDownload | null>(null);
  const [reiniciando, setReiniciando] = useState(false);
  const pollingRef = useRef<any>(null);

  const limparPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Executa checagem quando o modal abre e limpa intervalos ao fechar
  useEffect(() => {
    if (isOpen) {
      verificarAtualizacao();
    } else {
      setReiniciando(false);
      limparPolling();
    }
    return () => limparPolling();
  }, [isOpen]);

  const verificarAtualizacao = async () => {
    try {
      setEtapa('verificando');
      const res = await fetch('/api/v1/sistema/atualizacao/verificar');
      if (!res.ok) {
        throw new Error(`Servidor respondeu com código ${res.status}`);
      }
      const data: AtualizacaoInfo = await res.json();
      setInfo(data);

      if (data.status === 'SEM_INTERNET') {
        setEtapa('sem_internet');
      } else if (data.status === 'ATUALIZACAO_DISPONIVEL') {
        setEtapa('disponivel');
      } else if (data.status === 'ATUALIZADO') {
        setEtapa('atualizado');
      } else {
        setEtapa('erro');
      }
    } catch {
      setEtapa('erro');
      setInfo({
        status: 'ERRO',
        mensagem: 'Não foi possível conectar ao serviço de verificação do sistema.'
      });
    }
  };

  const iniciarDownload = async () => {
    if (!info?.urlDownload) {
      alert('Link do instalador não disponível no momento.');
      return;
    }

    try {
      setEtapa('baixando');
      setProgresso({
        baixando: true,
        progressoPercentual: 0,
        bytesBaixados: 0,
        totalBytes: info.tamanhoBytes || 0,
        concluido: false
      });

      const res = await fetch('/api/v1/sistema/atualizacao/baixar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlDownload: info.urlDownload,
          versaoNova: info.versaoNova
        })
      });

      if (!res.ok) {
        throw new Error('Falha ao iniciar o download.');
      }

      // Inicia polling seguro de progresso
      limparPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const resProg = await fetch('/api/v1/sistema/atualizacao/progresso');
          if (resProg.ok) {
            const dataProg: ProgressoDownload = await resProg.json();
            setProgresso(dataProg);

            if (dataProg.erro) {
              limparPolling();
              setEtapa('erro');
              setInfo(prev => ({
                status: 'ERRO',
                ...prev,
                mensagem: dataProg.erro
              }));
            } else if (dataProg.concluido) {
              limparPolling();
              setEtapa('concluido');
              setReiniciando(true);
              setTimeout(() => {
                aplicarEReiniciar();
              }, 1200);
            }
          }
        } catch {
          // Ignora falhas pontuais de polling
        }
      }, 700);

    } catch (e: any) {
      limparPolling();
      setEtapa('erro');
      setInfo(prev => ({
        status: 'ERRO',
        ...prev,
        mensagem: e.message || 'Erro ao iniciar download.'
      }));
    }
  };

  const aplicarEReiniciar = async () => {
    try {
      setReiniciando(true);
      await fetch('/api/v1/sistema/atualizacao/aplicar', { method: 'POST' });
    } catch {
      // O backend fecha após disparar o instalador
      setReiniciando(true);
    }
  };

  if (!isOpen) return null;

  const formatarTamanho = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Tamanho desconhecido';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] border border-[#E7DFD5] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabeçalho do Modal */}
        <div className="bg-[#EFE9DE] px-6 py-4 border-b border-[#DFCDB7] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D3A25D]/20 border border-[#D3A25D]/40 text-[#8C5E20] flex items-center justify-center">
              <RefreshCw className={`w-5 h-5 ${etapa === 'verificando' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-serif leading-tight">
                Atualização do Sistema
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                FH Móveis Planejados • Versão Atual: <span className="font-bold text-[#8C5E20]">v{versaoAtual}</span>
              </p>
            </div>
          </div>

          {!reiniciando && etapa !== 'baixando' && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 hover:bg-[#E5DDCF] p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Conteúdo Central */}
        <div className="p-6 space-y-4">

          {/* 1. VERIFICANDO */}
          {etapa === 'verificando' && (
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <RefreshCw className="w-10 h-10 text-[#D3A25D] animate-spin" />
              <h4 className="text-base font-bold text-stone-900">Verificando atualizações disponíveis...</h4>
              <p className="text-xs text-stone-500 max-w-xs">
                Checando conexão com a internet e consultando o servidor oficial de lançamentos.
              </p>
            </div>
          )}

          {/* 2. SEM INTERNET (O AVISO OBRIGATÓRIO SOLICITADO) */}
          {etapa === 'sem_internet' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-3.5 shadow-xs">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0 mt-0.5">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                    Conexão com a Internet Necessária
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Não foi possível verificar ou baixar atualizações porque este computador <strong>não está conectado à internet</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 space-y-1.5">
                <p className="font-semibold text-stone-800">O que fazer:</p>
                <ul className="list-disc list-inside space-y-1 text-stone-600 pl-1">
                  <li>Verifique o seu cabo de rede ou conexão Wi-Fi.</li>
                  <li>Após conectar-se, clique no botão <strong>"Tentar Novamente"</strong> abaixo.</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold transition-all"
                >
                  Fechar
                </button>
                <button
                  onClick={verificarAtualizacao}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#D3A25D] hover:bg-[#C2914A] text-stone-950 font-bold rounded-xl text-xs shadow-md shadow-[#D3A25D]/20 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar Novamente</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. SISTEMA ATUALIZADO */}
          {etapa === 'atualizado' && (
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-stone-900">Seu sistema está atualizado!</h4>
              <p className="text-xs text-stone-600 max-w-sm">
                Você já está utilizando a versão mais recente (<strong className="text-stone-900">v{versaoAtual}</strong>). Todos os recursos, cálculos de orçamentos e relatórios estão em dia.
              </p>

              <div className="pt-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-xl text-xs transition-all"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          {/* 4. NOVA VERSÃO DISPONÍVEL */}
          {etapa === 'disponivel' && info && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      Nova Versão Disponível
                    </span>
                    <h4 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                      <span>v{info.versaoAtual}</span>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                      <span className="text-[#8C5E20] font-black underline decoration-2">v{info.versaoNova}</span>
                    </h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-stone-500 font-medium block">Tamanho</span>
                  <span className="text-xs font-bold text-stone-800">{formatarTamanho(info.tamanhoBytes)}</span>
                </div>
              </div>

              {/* Novidades */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800">Novidades desta versão:</label>
                <div className="bg-white border border-[#E7DFD5] rounded-xl p-3 max-h-32 overflow-y-auto text-xs text-stone-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {info.novidades || 'Melhorias de desempenho, orçamentação e estabilidade geral.'}
                </div>
              </div>

              {/* Blindagem de Segurança (Backup) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start space-x-2.5 text-xs text-amber-950">
                <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Seus dados estão 100% seguros:</strong> Um backup automático do seu banco de dados de clientes e orçamentos é feito antes da atualização. Nenhum dado é perdido.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold transition-all"
                >
                  Lembrar Mais Tarde
                </button>
                <button
                  onClick={iniciarDownload}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-[#D3A25D] hover:bg-[#C2914A] text-stone-950 font-bold rounded-xl text-xs shadow-md shadow-[#D3A25D]/25 transition-all"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Baixar Atualização</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. BAIXANDO COM PROGRESSO */}
          {etapa === 'baixando' && (
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                <span className="flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-[#D3A25D] animate-bounce" />
                  Baixando atualização oficial...
                </span>
                <span className="text-[#8C5E20] font-mono text-sm">
                  {progresso?.progressoPercentual || 0}%
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="w-full bg-[#E5DDCF] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#DFCDB7]">
                <div
                  className="bg-gradient-to-r from-[#D3A25D] to-[#B88438] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, progresso?.progressoPercentual || 0)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                <span>
                  {progresso?.bytesBaixados ? formatarTamanho(progresso.bytesBaixados) : '0 MB'} de{' '}
                  {formatarTamanho(progresso?.totalBytes || info?.tamanhoBytes)}
                </span>
                <span>Não feche o programa enquanto o download é concluído</span>
              </div>
            </div>
          )}

          {/* 6. CONCLUÍDO / PRONTO PARA INSTALAR */}
          {etapa === 'concluido' && (
            <div className="py-4 space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-950">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">Download Concluído com Sucesso!</h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    O pacote da versão <strong className="text-stone-950">v{info?.versaoNova}</strong> foi baixado e verificado com segurança.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-stone-100 rounded-xl text-center space-y-2 border border-stone-200">
                <RefreshCw className="w-6 h-6 text-[#D3A25D] animate-spin mx-auto" />
                <p className="text-xs font-bold text-stone-900">
                  Instalando atualização e reiniciando automaticamente...
                </p>
                <p className="text-[11px] text-stone-500">
                  O instalador está atualizando os arquivos em segundo plano. O sistema reabrirá sozinho em instantes!
                </p>
              </div>
            </div>
          )}

          {/* 7. ERRO */}
          {etapa === 'erro' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-950">
                <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">Não foi possível concluir</h4>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {info?.mensagem || 'Ocorreu uma falha ao tentar verificar ou baixar a atualização.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold transition-all"
                >
                  Fechar
                </button>
                <button
                  onClick={verificarAtualizacao}
                  className="flex items-center space-x-2 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar Novamente</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
