import { CheckCircle2 } from "lucide-react";

function EntregaFooter({ onClose, onSalvar, carregando, rotulo = "Confirmar entrega" }) {
  return (
    <div className="px-6 sm:px-8 py-5 border-t border-line flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-center bg-surface shrink-0 rounded-b-md transition-colors duration-300">
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2.5 text-sm font-bold text-ink-2 hover:bg-sunken rounded-md transition-colors w-full sm:w-auto order-2 sm:order-1"
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={onSalvar}
        disabled={carregando}
        className="px-6 py-2.5 flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-on-action font-bold rounded-md text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2"
      >
        {carregando ? (
          <>
            <span className="w-4 h-4 border-2 border-on-action/30 border-t-on-action rounded-full animate-spin"></span> 
            Salvando...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" /> 
            {rotulo}
          </>
        )}
      </button>
    </div>
  );
}

export default EntregaFooter;