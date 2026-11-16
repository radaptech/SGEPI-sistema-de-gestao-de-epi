import { useState } from "react";
import { criarFornecedor } from "../../services/fornecedorService";
import { X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import Dialogo from "../Dialogo";

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

  const baseInputClass = "w-full px-4 py-2.5 rounded-md text-sm font-medium outline-none transition-all disabled:opacity-50 bg-surface border border-line focus:ring-1 focus:ring-ink focus:border-ink placeholder-ink-3";
  const labelClass = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 transition-colors";

  return (
    <Dialogo onClose={onClose} className="fixed inset-0 z-[120] bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink ">
      <div className="w-full max-w-lg bg-surface rounded-md shadow-modal border border-line overflow-hidden flex flex-col max-h-[95vh] transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-ink tracking-tight transition-colors">
                Novo Fornecedor
              </h3>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Cadastre um novo fornecedor no sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:px-8 space-y-5 overflow-y-auto custom-scrollbar">
          {erro && (
            <div className="p-4 bg-erro-soft text-erro text-sm rounded-md border border-erro-line font-medium flex items-center gap-2.5 transition-colors">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label htmlFor="criarfornecedor-1" className={labelClass}>
              Razão Social <span className="text-erro">*</span>
            </label>
            <input id="criarfornecedor-1"
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
            <label htmlFor="criarfornecedor-2" className={labelClass}>
              Nome Fantasia
            </label>
            <input id="criarfornecedor-2"
              type="text"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              className={baseInputClass}
              placeholder="Ex: Mercadinho Silva"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="criarfornecedor-3" className={labelClass}>
                CNPJ
              </label>
              <input id="criarfornecedor-3"
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className={`${baseInputClass} font-mono`}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <label htmlFor="criarfornecedor-4" className={labelClass}>
                Inscrição Estadual
              </label>
              <input id="criarfornecedor-4"
                type="text"
                value={inscricaoEstadual}
                onChange={(e) => setInscricaoEstadual(e.target.value)}
                className={baseInputClass}
                placeholder="000.000.000.000"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end pt-6 gap-3 border-t border-line mt-6 transition-colors">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-sunken text-ink text-sm font-bold rounded-md hover:bg-line transition-colors w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className={`px-6 py-2.5 flex items-center justify-center gap-2 text-on-action font-bold rounded-md text-sm transition-all w-full sm:w-auto order-1 sm:order-2 ${
                salvando
                  ? "bg-action cursor-not-allowed opacity-80"
                  : "bg-action hover:bg-action-hover "
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
    </Dialogo>
  );
}

export default ModalCriarFornecedor;