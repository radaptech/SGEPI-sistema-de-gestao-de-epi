import { useRef, useEffect, useState } from 'react';
import { CameraOff, X, Aperture } from 'lucide-react';
import Dialogo from "../../Dialogo";

// O sensor do celular entrega 1080p ou mais. A foto vai em base64 dentro do JSON
// da entrega e depois fica no bucket, entao nao vale a pena passar disso.
const LARGURA_MAXIMA = 1280;

function ModalFoto({ aberto, fecharFoto, onFotoCapturada }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  // O stream fica em ref, e nao em state: o cleanup do efeito precisa enxergar
  // o valor atual para desligar a camera quando o modal desmonta.
  const streamRef = useRef(null);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [erroCamera, setErroCamera] = useState('');

  useEffect(() => {
    if (aberto) {
      iniciarCamera();
    } else {
      pararCamera();
    }
    return () => pararCamera();
  }, [aberto]);

  const iniciarCamera = async () => {
    setErroCamera('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = mediaStream;
      setCameraPronta(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err);
      setErroCamera('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraPronta(false);
  };

  const tirarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Sem isso, um clique antes do primeiro frame gera um canvas 0x0 e manda
      // um data URL vazio para o back-end.
      if (!video.videoWidth || !video.videoHeight) return;

      const escala = Math.min(1, LARGURA_MAXIMA / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * escala);
      canvas.height = Math.round(video.videoHeight * escala);

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const fotoBase64 = canvas.toDataURL('image/jpeg', 0.8);

      onFotoCapturada(fotoBase64);
      pararCamera();
      fecharFoto();
    }
  };

  const handleFechar = () => {
    pararCamera();
    fecharFoto();
  };

  if (!aberto) return null;

  return (
    <Dialogo onClose={fecharFoto} className="fixed inset-0 z-[120] bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink ">
      <div className="w-full max-w-lg bg-surface rounded-md shadow-modal border border-line overflow-hidden flex flex-col transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-ink tracking-tight transition-colors">
                Capturar Foto
              </h3>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Fotografia de perfil do funcionário.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFechar}
            className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:px-8 bg-sunken transition-colors">
          <div className="relative bg-overlay rounded-md overflow-hidden aspect-video flex items-center justify-center border border-line ">
            {erroCamera ? (
              <div className="text-erro flex flex-col items-center text-center p-6 ">
                <CameraOff className="w-10 h-10 mb-3 opacity-80" />
                <p className="text-sm font-medium">{erroCamera}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              ></video>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-line flex flex-col sm:flex-row sm:justify-end gap-3 bg-surface shrink-0 rounded-b-md transition-colors duration-300">
          <button
            type="button"
            onClick={handleFechar}
            className="px-6 py-2.5 bg-sunken text-ink text-sm font-bold rounded-md hover:bg-line transition-colors w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={tirarFoto}
            disabled={!!erroCamera || !cameraPronta}
            className="px-6 py-2.5 flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-on-action font-bold rounded-md text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2"
          >
            <Aperture className="w-4 h-4" /> Tirar Foto
          </button>
        </div>

      </div>
    </Dialogo>
  );
}

export default ModalFoto;