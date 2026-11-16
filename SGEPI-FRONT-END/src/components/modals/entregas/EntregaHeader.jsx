import { X } from "lucide-react";

function EntregaHeader({ onClose, titulo = "Nova entrega", subtitulo = "Entrega com funcionário, itens e assinatura digital." }) {
  return (
    <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-4">

        <div>
          <h2 className="text-2xl font-bold text-ink tracking-tight transition-colors">
            {titulo}
          </h2>
          <p className="text-sm text-ink-2 mt-1 transition-colors">
            {subtitulo}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors"
        title="Fechar"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

export default EntregaHeader;