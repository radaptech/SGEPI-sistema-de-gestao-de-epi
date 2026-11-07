import { useState } from "react";
import { criarFornecedor } from "../../services/fornecedorService";
import { X, Building2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

function ModalCriarFornecedor({ aberto, onClose, onSucesso }) {
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  if (!aberto) return null;

  const limparFormulario = () => {
    setRazaoSocial("");
    setNomeFantasia("");
    setCnpj("");
    setInscricaoEstadual("");
    setErro("");
  };

  const handleClose = () => {
    if (!salvando) {
      limparFormulario();
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!razaoSocial.trim()) {
      setErro("A Razão Social é obrigatória.");
      return;
    }

    try {
      setSalvando(true);

      await criarFornecedor({
        razao_social: razaoSocial.trim(),
        nome_fantasia: nomeFantasia.trim(),
        cnpj: cnpj.trim(),
        inscricao_estadual: inscricaoEstadual.trim(),
      });

      limparFormulario();
      onSucesso();
      onClose();
    } catch (err) {
      console.error("❌ ERRO AO SALVAR FORNECEDOR:", err);
      setErro(err?.message || "Erro ao salvar o fornecedor.");
    } finally {
      setSalvando(false);
    }
  };

  const baseInputClass = "w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white placeholder-slate-400";
  const labelClass = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 transition-colors";

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in text-slate-700 dark:text-slate-300">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-start shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 transition-colors">
              <Building2 className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Novo Fornecedor
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                Cadastre um novo fornecedor no sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:px-8 space-y-5 overflow-y-auto custom-scrollbar">
          {erro && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-2xl border border-red-100 dark:border-red-900/30 font-medium flex items-center gap-2.5 transition-colors">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label className={labelClass}>
              Razão Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              className={baseInputClass}
              placeholder="Ex: Empresa Silva LTDA"
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>
              Nome Fantasia
            </label>
            <input
              type="text"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              className={baseInputClass}
              placeholder="Ex: Mercadinho Silva"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>
                CNPJ
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className={`${baseInputClass} font-mono`}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <label className={labelClass}>
                Inscrição Estadual
              </label>
              <input
                type="text"
                value={inscricaoEstadual}
                onChange={(e) => setInscricaoEstadual(e.target.value)}
                className={baseInputClass}
                placeholder="000.000.000.000"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end pt-6 gap-3 border-t border-slate-100 dark:border-slate-800/60 mt-6 transition-colors">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className={`px-6 py-2.5 flex items-center justify-center gap-2 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] w-full sm:w-auto order-1 sm:order-2 ${
                salvando
                  ? "bg-indigo-400 dark:bg-indigo-600/50 cursor-not-allowed opacity-80"
                  : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm shadow-indigo-600/20"
              }`}
            >
              {salvando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Salvar Fornecedor</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCriarFornecedor;