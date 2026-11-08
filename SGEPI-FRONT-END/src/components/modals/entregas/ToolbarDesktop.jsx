import { PenLine, Eraser, Trash2, EyeOff, X, Check, Settings2 } from "lucide-react";

function ToolbarDesktop({
  ferramentaAtiva,
  setFerramentaAtiva,
  limparAssinatura,
  concluirAssinatura,
  fecharAssinatura,
  painelFerramentasAberto,
  setPainelFerramentasAberto,
}) {
  if (!painelFerramentasAberto) {
    return (
      <div className="absolute top-4 right-4 z-10 ">
        <button
          type="button"
          onClick={() => setPainelFerramentasAberto(true)}
          className="flex items-center gap-2 rounded-md bg-action hover:bg-action-hover text-on-action px-4 py-2.5 text-sm font-bold transition-all"
        >
          <Settings2 className="w-4 h-4" />
          <span>Opções</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-10 max-w-[calc(100vw-2rem)] ">
      <div className="bg-surface border border-line rounded-md shadow-modal p-2 sm:p-2.5 transition-colors">
        <div className="flex flex-wrap items-center justify-end gap-2">
          
          <button
            type="button"
            onClick={() => setFerramentaAtiva("caneta")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-bold transition-all ${
              ferramentaAtiva === "caneta"
                ? "bg-action border-ink text-on-action "
                : "bg-surface text-ink border-line hover:bg-sunken "
            }`}
          >
            <PenLine className="w-4 h-4" />
            <span className="hidden sm:inline">Escrever</span>
          </button>

          <button
            type="button"
            onClick={() => setFerramentaAtiva("borracha")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-bold transition-all ${
              ferramentaAtiva === "borracha"
                ? "bg-action border-line-strong text-on-action "
                : "bg-surface text-ink border-line hover:bg-sunken "
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Borracha</span>
          </button>

          <div className="w-px h-6 bg-line mx-1 hidden sm:block"></div>

          <button
            type="button"
            onClick={limparAssinatura}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-erro-line bg-surface text-erro text-sm font-bold hover:bg-erro-soft transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Limpar</span>
          </button>

          <button
            type="button"
            onClick={() => setPainelFerramentasAberto(false)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-line bg-surface text-ink text-sm font-bold hover:bg-sunken transition-colors"
          >
            <EyeOff className="w-4 h-4" />
            <span className="hidden sm:inline">Ocultar</span>
          </button>

          <button
            type="button"
            onClick={fecharAssinatura}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-line bg-surface text-ink text-sm font-bold hover:bg-sunken transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>

          <div className="w-px h-6 bg-line mx-1 hidden sm:block"></div>

          <button
            type="button"
            onClick={concluirAssinatura}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-action hover:bg-action-hover text-on-action text-sm font-bold transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Concluir</span>
          </button>
          
        </div>
      </div>
    </div>
  );
}

export default ToolbarDesktop;