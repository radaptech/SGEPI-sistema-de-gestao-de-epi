import { useState } from "react";
import { api } from "../services/api";

function EsqueciSenha({ onVoltar }) {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  const limparMensagens = () => {
    setErro("");
    setSucesso("");
  };

  const handleEsqueciSenha = async (e) => {
    e.preventDefault();
    limparMensagens();

    const emailLimpo = email.trim();

    if (!emailLimpo) {
      setErro("Informe o seu e-mail para recuperar a senha.");
      return;
    }

    try {
      setCarregando(true);
      const hostname = window.location.hostname;
      const slugEmpresa = hostname.split(".")[0]; 
      await api.post("/esqueci-minha-senha", {
        empresa: slugEmpresa,
        email: emailLimpo,
      });

      setSucesso(
        "Se o e-mail estiver cadastrado, enviaremos as instruções para redefinir sua senha."
      );

      setEmail("");
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans transition-colors duration-500">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-[420px] animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100/50 text-blue-600 text-[10px] font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              Recuperação de Acesso
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            SGEPI
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
            Informe seu e-mail cadastrado. Enviaremos as instruções para redefinir sua senha.
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-3 font-medium animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="mb-6 p-5 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-100/50 flex items-start gap-3 font-medium animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="leading-relaxed">{sucesso}</span>
          </div>
        )}

        <form onSubmit={handleEsqueciSenha} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              E-mail ou Login
            </label>
            <input
              type="text"
              className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button
              type="submit"
              disabled={carregando}
              className={`w-full py-3.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                carregando
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.98]"
              }`}
            >
              {carregando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                "Enviar Instruções"
              )}
            </button>

            <button
              type="button"
              onClick={onVoltar}
              className="w-full py-3.5 rounded-xl bg-white text-slate-600 border border-slate-200 text-sm font-semibold hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para o Login
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            SGEPI © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default EsqueciSenha;