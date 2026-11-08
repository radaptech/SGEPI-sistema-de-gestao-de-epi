import { PenLine, Eraser, Trash2, X, Check } from "lucide-react";

function ToolbarMobile({
  ferramentaAtiva,
  setFerramentaAtiva,
  limparAssinatura,
  concluirAssinatura,
  fecharAssinatura,
}) {
  return (
    <aside className="w-[86px] h-full absolute top-0 right-0 z-20 border-l border-line bg-surface rounded-l-md shadow-modal flex flex-col items-center py-4 px-2 transition-colors duration-300">
      
      <div className="text-xs font-bold text-ink-3 uppercase tracking-wide rotate-90 mt-8 mb-10 whitespace-nowrap transition-colors">
        Ferramentas
      </div>

      <div className="flex-1 flex flex-col items-center justify-start gap-10 w-full mt-2">
        
        <button
          type="button"
          onClick={() => setFerramentaAtiva("caneta")}
          className={`w-[86px] h-[44px] rounded-md border text-xs font-bold transition-all rotate-90 flex items-center justify-center gap-1.5 active:scale-95 ${
            ferramentaAtiva === "caneta"
              ? "bg-action border-ink text-on-action "
              : "bg-surface text-ink border-line "
          }`}
        >
          <PenLine className="w-3.5 h-3.5" /> Caneta
        </button>

        <button
          type="button"
          onClick={() => setFerramentaAtiva("borracha")}
          className={`w-[86px] h-[44px] rounded-md border text-xs font-bold transition-all rotate-90 flex items-center justify-center gap-1.5 active:scale-95 ${
            ferramentaAtiva === "borracha"
              ? "bg-action border-line-strong text-on-action "
              : "bg-surface text-ink border-line "
          }`}
        >
          <Eraser className="w-3.5 h-3.5" /> Borracha
        </button>

        <button
          type="button"
          onClick={limparAssinatura}
          className="w-[86px] h-[44px] rounded-md border border-erro-line bg-surface text-erro text-xs font-bold hover:bg-erro-soft transition-all rotate-90 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" /> Limpar
        </button>
      </div>

      <div className="flex flex-col items-center gap-12 pb-8">
        
        <button
          type="button"
          onClick={fecharAssinatura}
          className="w-[86px] h-[44px] rounded-md border border-line bg-surface text-ink text-xs font-bold hover:bg-sunken transition-all rotate-90 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <X className="w-3.5 h-3.5" /> Sair
        </button>

        <button
          type="button"
          onClick={concluirAssinatura}
          className="w-[96px] h-[48px] rounded-md bg-action hover:bg-action-hover text-on-action text-xs font-bold transition-all rotate-90 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Check className="w-4 h-4" strokeWidth={2.5} /> Concluir
        </button>
      </div>

    </aside>
  );
}

export default ToolbarMobile;