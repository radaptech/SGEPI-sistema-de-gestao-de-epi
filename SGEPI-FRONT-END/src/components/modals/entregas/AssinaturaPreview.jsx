import { useState } from "react";
import { Camera, PenLine, ZoomIn, X, FileSignature, Trash2 } from "lucide-react";
import Dialogo from "../../Dialogo";

function AssinaturaPreview({
  assinaturaPreview,
  limparAssinatura,
  abrirAssinatura,
  abrirCamera,
  titulo = "Confirmação de recebimento",
}) {
  const [telaCheia, setTelaCheia] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1 transition-colors">
            {titulo}
          </h3>
          <p className="text-sm text-ink-2 transition-colors">
            {assinaturaPreview
              ? "Confirmação registrada."
              : "Peça ao funcionário que assine na tela ou tire uma foto do comprovante."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {assinaturaPreview ? (
            <button
              type="button"
              onClick={limparAssinatura}
              className="flex items-center gap-1.5 text-xs font-bold text-erro hover:text-erro transition-colors px-2 py-1 rounded-md hover:bg-erro-soft "
            >
              <Trash2 className="w-4 h-4" />
              Remover
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={abrirCamera}
                className="px-4 py-2.5 flex items-center gap-2 border border-line bg-surface text-ink hover:border-line-strong text-sm font-semibold rounded-md transition-colors flex-1 sm:flex-none justify-center"
              >
                <Camera className="w-4 h-4" /> Foto
              </button>
              <button
                type="button"
                onClick={abrirAssinatura}
                className="px-4 py-2.5 flex items-center gap-2 border border-line bg-surface text-ink hover:border-line-strong text-sm font-semibold rounded-md transition-colors flex-1 sm:flex-none justify-center"
              >
                <PenLine className="w-4 h-4" /> Assinar
              </button>
            </>
          )}
        </div>
      </div>

      <div>
        {assinaturaPreview ? (
          <>
            <div className="relative rounded-md border border-line bg-surface overflow-hidden flex items-center justify-center min-h-[170px] group transition-colors">
              <img
                src={assinaturaPreview}
                alt="Comprovação da entrega"
                className="block max-w-full max-h-[170px] object-contain bg-surface transition-opacity group-hover:opacity-80"
              />
              <button
                type="button"
                onClick={() => setTelaCheia(true)}
                className="absolute inset-0 flex items-center justify-center bg-overlay opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <div className="bg-surface text-ink px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 shadow-modal transform scale-95 group-hover:scale-100 transition-all">
                  <ZoomIn className="w-5 h-5" />
                  Ampliar
                </div>
              </button>
            </div>
            
            <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-ink-3 transition-colors">
              <span>Pré-visualização</span>
              <span className="text-ok ">Capturado</span>
            </div>
          </>
        ) : (
          <div className="rounded-md border-2 border-dashed border-line-strong h-40 flex flex-col items-center justify-center text-ink-3 bg-surface transition-colors">
            <FileSignature className="w-8 h-8 mb-3 opacity-80" strokeWidth={1.5} />
            <div className="text-sm font-bold text-ink-2 ">Nenhuma confirmação</div>
            <div className="text-xs mt-1">Use a câmera ou assine na tela</div>
          </div>
        )}
      </div>

      {telaCheia && (
        <Dialogo onClose={() => setTelaCheia(false)} className="fixed inset-0 z-[150] bg-overlay flex flex-col items-center justify-center p-4 sm:p-6 ">
          <div className="w-full flex justify-end mb-4 max-w-5xl">
            <button
              type="button"
              onClick={() => setTelaCheia(false)}
              className="bg-black/40 hover:bg-black/60 text-white rounded-md p-3 transition-colors"
              title="Fechar tela cheia"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 w-full flex items-center justify-center max-w-5xl overflow-hidden rounded-md">
            <img
              src={assinaturaPreview}
              alt="Comprovação da entrega ampliada"
              className="max-w-full max-h-full object-contain rounded-md shadow-modal bg-surface "
            />
          </div>
        </Dialogo>
      )}
    </div>
  );
}

export default AssinaturaPreview;