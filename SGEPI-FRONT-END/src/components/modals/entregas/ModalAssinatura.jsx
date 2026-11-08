import { PenLine } from "lucide-react";
import ToolbarDesktop from "./ToolbarDesktop";
import ToolbarMobile from "./ToolbarMobile";
import Dialogo from "../../Dialogo";

function SignatureCanvasDesktop({
  canvasRef,
  canvasWrapperRef,
  startDrawing,
  draw,
  finishDrawing,
  ferramentaAtiva,
  setFerramentaAtiva,
  limparAssinatura,
  concluirAssinatura,
  fecharAssinatura,
  painelFerramentasAberto,
  setPainelFerramentasAberto,
}) {
  return (
    <div className="absolute inset-0 bg-sunken transition-colors duration-300">
      <div className="absolute inset-0 p-5 sm:p-8">
        <div
          ref={canvasWrapperRef}
          className="relative h-full w-full rounded-md border border-line bg-surface overflow-hidden transition-colors duration-300"
        >
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={finishDrawing}
            onPointerLeave={finishDrawing}
            onPointerCancel={finishDrawing}
            className="absolute inset-0 block w-full h-full touch-none bg-surface cursor-crosshair"
          />

          <div className="absolute top-6 left-6 z-10 pointer-events-none">
            <div className="bg-surface rounded-md px-5 py-4 border border-line flex items-start gap-3 transition-colors duration-300">
              <div>
                <h3 className="text-sm font-bold text-ink tracking-tight transition-colors">
                  Assinatura do colaborador
                </h3>
                <p className="text-xs text-ink-2 mt-0.5 transition-colors">
                  Assine livremente na área em branco.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToolbarDesktop
        ferramentaAtiva={ferramentaAtiva}
        setFerramentaAtiva={setFerramentaAtiva}
        limparAssinatura={limparAssinatura}
        concluirAssinatura={concluirAssinatura}
        fecharAssinatura={fecharAssinatura}
        painelFerramentasAberto={painelFerramentasAberto}
        setPainelFerramentasAberto={setPainelFerramentasAberto}
      />
    </div>
  );
}

function SignatureCanvasMobile({
  canvasRef,
  canvasWrapperRef,
  startDrawing,
  draw,
  finishDrawing,
  ferramentaAtiva,
  setFerramentaAtiva,
  limparAssinatura,
  concluirAssinatura,
  fecharAssinatura,
}) {
  return (
    <div className="h-full w-full flex bg-sunken transition-colors duration-300">
      <div className="relative flex-1 min-w-0">
        <div className="absolute inset-0 p-4 pr-2">
          <div
            ref={canvasWrapperRef}
            className="relative h-full w-full rounded-md border border-line bg-surface overflow-hidden transition-colors duration-300"
          >
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={finishDrawing}
              onPointerLeave={finishDrawing}
              onPointerCancel={finishDrawing}
              className="absolute inset-0 block w-full h-full touch-none bg-surface"
            />

            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <div className="bg-surface rounded-md px-4 py-3 border border-line flex items-center gap-2.5 transition-colors duration-300">
                <div className="w-6 h-6 rounded-md bg-sunken flex items-center justify-center text-ink shrink-0">
                  <PenLine className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink tracking-tight transition-colors">
                    Assinatura
                  </h3>
                  <p className="text-xs text-ink-2 transition-colors uppercase tracking-wide mt-0.5">
                    Assine livremente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToolbarMobile
        ferramentaAtiva={ferramentaAtiva}
        setFerramentaAtiva={setFerramentaAtiva}
        limparAssinatura={limparAssinatura}
        concluirAssinatura={concluirAssinatura}
        fecharAssinatura={fecharAssinatura}
      />
    </div>
  );
}

function ModalAssinatura({
  aberto,
  isMobileViewport,
  canvasRef,
  canvasWrapperRef,
  startDrawing,
  draw,
  finishDrawing,
  assinaturaVazia,
  ferramentaAtiva,
  setFerramentaAtiva,
  limparAssinatura,
  concluirAssinatura,
  fecharAssinatura,
  painelFerramentasAberto,
  setPainelFerramentasAberto,
}) {
  if (!aberto) return null;

  return (
    <Dialogo onClose={fecharAssinatura} className="fixed inset-0 z-[100] bg-sunken overflow-hidden  transition-colors duration-300">
      {isMobileViewport ? (
        <SignatureCanvasMobile
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          startDrawing={startDrawing}
          draw={draw}
          finishDrawing={finishDrawing}
          assinaturaVazia={assinaturaVazia}
          ferramentaAtiva={ferramentaAtiva}
          setFerramentaAtiva={setFerramentaAtiva}
          limparAssinatura={limparAssinatura}
          concluirAssinatura={concluirAssinatura}
          fecharAssinatura={fecharAssinatura}
        />
      ) : (
        <SignatureCanvasDesktop
          canvasRef={canvasRef}
          canvasWrapperRef={canvasWrapperRef}
          startDrawing={startDrawing}
          draw={draw}
          finishDrawing={finishDrawing}
          assinaturaVazia={assinaturaVazia}
          ferramentaAtiva={ferramentaAtiva}
          setFerramentaAtiva={setFerramentaAtiva}
          limparAssinatura={limparAssinatura}
          concluirAssinatura={concluirAssinatura}
          fecharAssinatura={fecharAssinatura}
          painelFerramentasAberto={painelFerramentasAberto}
          setPainelFerramentasAberto={setPainelFerramentasAberto}
        />
      )}
    </Dialogo>
  );
}

export default ModalAssinatura;