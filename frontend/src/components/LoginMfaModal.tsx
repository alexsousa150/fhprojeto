import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { UsuarioAutenticado } from '../types/marcenaria';

interface LoginMfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSucesso: (usuario: UsuarioAutenticado) => void;
}

export const LoginMfaModal: React.FC<LoginMfaModalProps> = ({
  isOpen,
  onClose,
  onLoginSucesso,
}) => {
  const [etapa, setEtapa] = useState<'CREDENCIAIS' | 'MFA'>('CREDENCIAIS');
  const [email, setEmail] = useState('marceneiro.mestre@marcenariapro.com');
  const [senha, setSenha] = useState('Marcenaria@2026!');
  const [codigoMfa, setCodigoMfa] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitCredenciais = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    // Simulação de chamada segura à API Spring Boot (/api/v1/auth/login)
    setTimeout(() => {
      setLoading(false);
      // Quando 2FA está ativado, a API retorna status "MFA_REQUIRED"
      setEtapa('MFA');
    }, 600);
  };

  const handleSubmitMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    if (codigoMfa.length !== 6) {
      setErro('Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.');
      setLoading(false);
      return;
    }

    // Simulação de validação do código TOTP com a API (/api/v1/auth/mfa/verify)
    setTimeout(() => {
      setLoading(false);
      onLoginSucesso({
        nome: 'Carlos Eduardo (Marceneiro Chefe)',
        email: email,
        cargo: 'ADMIN',
        mfaAtivo: true,
        accessToken: 'mock_jwt_access_token_secure_xyz',
      });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Modal */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            {etapa === 'CREDENCIAIS' ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-6 h-6 text-emerald-400" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {etapa === 'CREDENCIAIS' ? 'Acesso Seguro' : 'Verificação em Duas Etapas'}
            </h2>
            <p className="text-xs text-slate-400">
              {etapa === 'CREDENCIAIS'
                ? 'Painel de Gestão e Produção de Móveis'
                : 'Proteção avançada contra acessos não autorizados'}
            </p>
          </div>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* ETAPA 1: Email e Senha */}
        {etapa === 'CREDENCIAIS' ? (
          <form onSubmit={handleSubmitCredenciais} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@marcenaria.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Senha Master</label>
                <span className="text-[11px] text-amber-400/80 hover:underline cursor-pointer">Esqueceu?</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">Validando credenciais...</span>
                ) : (
                  <>
                    <span>Prosseguir</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protegido contra força bruta & bloqueio por IP</span>
              </p>
            </div>
          </form>
        ) : (
          /* ETAPA 2: 2FA TOTP (6 dígitos) */
          <form onSubmit={handleSubmitMfa} className="space-y-5 animate-in slide-in-from-right duration-300">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300">
              O 2FA está ativo para <strong>{email}</strong>. Abra seu <strong>Google Authenticator</strong> ou <strong>Authy</strong> e digite o código de 6 dígitos.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                Código de Autenticação (6 Dígitos)
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                value={codigoMfa}
                onChange={(e) => setCodigoMfa(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold bg-slate-950 border-2 border-emerald-500/40 rounded-xl py-3 text-emerald-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setEtapa('CREDENCIAIS')}
                className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>

              <button
                type="submit"
                disabled={loading || codigoMfa.length !== 6}
                className="w-2/3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? <span>Verificando TOTP...</span> : <span>Confirmar e Entrar</span>}
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-500">
              Dica: O código é renovado a cada 30 segundos no app autenticador.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
