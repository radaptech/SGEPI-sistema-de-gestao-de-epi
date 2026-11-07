import { useEffect, useState } from "react";
import { useModalEntrega } from "../../../hooks/useModalEntrega";
import { useSignaturePad } from "../../../hooks/useSignaturePad";
import EntregaHeader from "./EntregaHeader";
import EntregaForm from "./EntregaForm";
import EntregaItensForm from "./EntregaItensForm";
import EntregaFooter from "./EntregaFooter";
import ModalAssinatura from "./ModalAssinatura";
import ModalFoto from "./ModalFoto";

function ModalEntrega({ onClose, onSalvar, funcionarios = [], epis = [] }) {
  const assinatura = useSignaturePad();
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState(null);
  const previewFinal = fotoCapturada || assinatura.assinaturaPreview;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const entrega = useModalEntrega({
    assinaturaPreview: previewFinal,
    onClose,
    onSalvar,
    funcionarios,
  });

  const handleMudancaEpi = (valor) => {
    entrega.setIdEpiTemp(valor);
    entrega.setIdTamanhoTemp("");
  };

  const handleLimparConfirmacao = () => {
    if (fotoCapturada) {
      setFotoCapturada(null);
    } else {
      assinatura.limparAssinatura();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm text-slate-700 dark:text-slate-300 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
          <EntregaHeader onClose={onClose} />

          <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-slate-50/50 dark:bg-slate-900/50 space-y-6 custom-scrollbar transition-colors duration-300">
            <EntregaForm
              carregandoDados={false}
              buscaFuncionario={entrega.buscaFuncionario}
              setBuscaFuncionario={entrega.setBuscaFuncionario}
              funcionariosFiltrados={entrega.funcionariosFiltrados}
              funcionario={entrega.funcionario}
              setFuncionario={entrega.setFuncionario}
              funcionarioSelecionado={entrega.funcionarioSelecionado}
              dataEntrega={entrega.dataEntrega}
              setDataEntrega={entrega.setDataEntrega}
              assinaturaPreview={previewFinal}
              limparAssinatura={handleLimparConfirmacao}
              abrirAssinatura={assinatura.abrirModalAssinatura}
              abrirCamera={() => setModalFotoAberto(true)}
            />

            <EntregaItensForm
              epis={epis}
              tamanhos={entrega.tamanhosFiltrados || []}
              carregandoTamanhos={entrega.carregandoTamanhos}
              idEpiTemp={entrega.idEpiTemp}
              setIdEpiTemp={handleMudancaEpi}
              idTamanhoTemp={entrega.idTamanhoTemp}
              setIdTamanhoTemp={entrega.setIdTamanhoTemp}
              qtdTemp={entrega.qtdTemp}
              setQtdTemp={entrega.setQtdTemp}
              adicionarItem={entrega.adicionarItem}
              itensParaEntregar={entrega.itensParaEntregar}
              removerItem={entrega.removerItem}
              tamanhoSelecionadoObj={entrega.tamanhoSelecionadoObj}
              kitPendente={entrega.kitPendente}
              usarItemKit={entrega.usarItemKit}
            />
          </div>

          <EntregaFooter
            onClose={onClose}
            onSalvar={entrega.salvarEntrega}
            carregando={entrega.carregando}
          />
        </div>
      </div>

      <ModalAssinatura
        aberto={assinatura.modalAssinaturaAberto}
        isMobileViewport={assinatura.isMobileViewport}
        canvasRef={assinatura.canvasRef}
        canvasWrapperRef={assinatura.canvasWrapperRef}
        startDrawing={assinatura.startDrawing}
        draw={assinatura.draw}
        finishDrawing={assinatura.finishDrawing}
        assinaturaVazia={assinatura.assinaturaVazia}
        ferramentaAtiva={assinatura.ferramentaAtiva}
        setFerramentaAtiva={assinatura.setFerramentaAtiva}
        limparAssinatura={assinatura.limparAssinatura}
        concluirAssinatura={assinatura.concluirAssinatura}
        fecharAssinatura={assinatura.fecharModalAssinatura}
        painelFerramentasAberto={assinatura.painelFerramentasAberto}
        setPainelFerramentasAberto={assinatura.setPainelFerramentasAberto}
      />
      
      <ModalFoto
        aberto={modalFotoAberto}
        fecharFoto={() => setModalFotoAberto(false)}
        onFotoCapturada={(url) => setFotoCapturada(url)}
      />
    </>
  );
}

export default ModalEntrega;