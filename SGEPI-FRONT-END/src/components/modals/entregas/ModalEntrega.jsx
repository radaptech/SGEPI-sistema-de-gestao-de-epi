import { useEffect, useState } from "react";
import { useModalEntrega } from "../../../hooks/useModalEntrega";
import { useSignaturePad } from "../../../hooks/useSignaturePad";
import EntregaHeader from "./EntregaHeader";
import EntregaForm from "./EntregaForm";
import AssinaturaPreview from "./AssinaturaPreview";
import EntregaItensForm from "./EntregaItensForm";
import EntregaFooter from "./EntregaFooter";
import ModalAssinatura from "./ModalAssinatura";
import ModalFoto from "./ModalFoto";
import Dialogo from "../../Dialogo";

function ModalEntrega({ onClose, onSalvar }) {
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
      <Dialogo onClose={onClose} className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink ">
        <div className="bg-surface rounded-md shadow-modal w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-line transition-colors duration-300">
          <EntregaHeader onClose={onClose} />

          <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-surface divide-y divide-line [&>*]:py-6 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
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
            />

            <EntregaItensForm
              epis={entrega.epis}
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

            <AssinaturaPreview
              assinaturaPreview={previewFinal}
              limparAssinatura={handleLimparConfirmacao}
              abrirAssinatura={assinatura.abrirModalAssinatura}
              abrirCamera={() => setModalFotoAberto(true)}
            />
          </div>

          <EntregaFooter
            onClose={onClose}
            onSalvar={entrega.salvarEntrega}
            carregando={entrega.carregando}
          />
        </div>
      </Dialogo>

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