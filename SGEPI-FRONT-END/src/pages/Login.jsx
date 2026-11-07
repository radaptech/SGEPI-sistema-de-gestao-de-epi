import { useState } from "react";
import { api } from "../services/api";
import EsqueciSenha from "./EsqueciSenha";

function Login({ onLogin }) {
  const [mostrarEsqueciSenha, setMostrarEsqueciSenha] = useState(false);
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const limparMensagens = () => {
    setErro("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    limparMensagens();

    const loginLimpo = login.trim();
    const senhaLimpa = senha.trim();

    if (!loginLimpo || !senhaLimpa) {
      setErro("Preencha login e senha.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await api.post("/login", {
        email: loginLimpo,
        senha: senhaLimpa,
      });

      const usuario = resposta?.usuario;

      if (!usuario) {
        throw new Error("Dados do usuário não retornados pelo servidor.");
      }

      sessionStorage.setItem("usuario", JSON.stringify(usuario));

      if (onLogin) {
        onLogin({
          usuario,
        });
      }
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  if (mostrarEsqueciSenha) {
    return <EsqueciSenha onVoltar={() => setMostrarEsqueciSenha(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-blue-600 font-sans">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl shadow-blue-900/50 w-full max-w-[400px] animate-fade-in">
        
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            SGEPI
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            Gestão de Estoque
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-3.5 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2.5 font-medium animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[13px] font-semibold text-slate-700 mb-2">
              Endereço de Email
            </label>
            <input
              type="text"
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="seu@email.com"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[13px] font-semibold text-slate-700">
                Senha
              </label>
              <button
                type="button"
                onClick={() => setMostrarEsqueciSenha(true)}
                className="text-[13px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
            <input
              type="password"
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 tracking-wider"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all mt-2 flex items-center justify-center gap-2 ${
              carregando
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            {carregando ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </>
            ) : (
              "Entrar no Sistema"
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            SGEPI © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;