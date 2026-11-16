import { useEffect, useRef, useState } from "react";
import {
  aplicarFerramentaNoContexto,
  canvasEstaEmBranco,
  gerarAssinaturaAjustada,
  preencherCanvasBranco,
} from "../utils/assinaturaCanvas";
import { toast } from "react-toastify";

export function useSignaturePad() {
  const [modalAssinaturaAberto, setModalAssinaturaAberto] = useState(false);
  const [assinaturaPreview, setAssinaturaPreview] = useState("");
  const [assinaturaEdicao, setAssinaturaEdicao] = useState("");

  const assinaturaPreviewRef = useRef("");
  const assinaturaEdicaoRef = useRef("");

  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const contextRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [assinaturaVazia, setAssinaturaVazia] = useState(true);
  const [ferramentaAtiva, setFerramentaAtiva] = useState("caneta");
  const [painelFerramentasAberto, setPainelFerramentasAberto] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    assinaturaPreviewRef.current = assinaturaPreview;
  }, [assinaturaPreview]);

  useEffect(() => {
    assinaturaEdicaoRef.current = assinaturaEdicao;
  }, [assinaturaEdicao]);

  useEffect(() => {
    function atualizarViewport() {
      setIsMobileViewport(window.innerWidth < 768);
    }

    atualizarViewport();
    window.addEventListener("resize", atualizarViewport);
    window.addEventListener("orientationchange", atualizarViewport);

    return () => {
      window.removeEventListener("resize", atualizarViewport);
      window.removeEventListener("orientationchange", atualizarViewport);
    };
  }, []);

  useEffect(() => {
    if (!modalAssinaturaAberto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function configurarCanvas() {
      const canvas = canvasRef.current;
      const wrapper = canvasWrapperRef.current;

      if (!canvas || !wrapper) return;

      const ratio = window.devicePixelRatio || 1;
      const largura = Math.max(wrapper.clientWidth, 280);
      const altura = Math.max(wrapper.clientHeight, 280);

      canvas.width = largura * ratio;
      canvas.height = altura * ratio;
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${altura}px`;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);

      preencherCanvasBranco(ctx, largura, altura);
      contextRef.current = ctx;

      if (assinaturaEdicaoRef.current) {
        const imagem = new Image();

        imagem.onload = () => {
          preencherCanvasBranco(ctx, largura, altura);
          ctx.drawImage(imagem, 0, 0, largura, altura);
          aplicarFerramentaNoContexto(ctx, ferramentaAtiva);
          setAssinaturaVazia(false);
        };

        imagem.src = assinaturaEdicaoRef.current;
      } else {
        aplicarFerramentaNoContexto(ctx, ferramentaAtiva);
        setAssinaturaVazia(true);
      }
    }

    const id = requestAnimationFrame(configurarCanvas);

    window.addEventListener("resize", configurarCanvas);
    window.addEventListener("orientationchange", configurarCanvas);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", configurarCanvas);
      window.removeEventListener("orientationchange", configurarCanvas);
      document.body.style.overflow = overflowAnterior;
    };
  }, [modalAssinaturaAberto, ferramentaAtiva, isMobileViewport]);

  useEffect(() => {
    if (!contextRef.current) return;
    aplicarFerramentaNoContexto(contextRef.current, ferramentaAtiva);
  }, [ferramentaAtiva]);

  function abrirModalAssinatura() {
    setPainelFerramentasAberto(true);
    setModalAssinaturaAberto(true);
  }

  function fecharModalAssinatura() {
    setModalAssinaturaAberto(false);
  }

  function getCoordenadas(event) {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(event) {
    const ponto = getCoordenadas(event);
    const ctx = contextRef.current;

    if (!ponto || !ctx) return;

    event.preventDefault();

    if (event.target.setPointerCapture) {
      try {
        event.target.setPointerCapture(event.pointerId);
      } catch {
        // ignora
      }
    }

    aplicarFerramentaNoContexto(ctx, ferramentaAtiva);
    ctx.beginPath();
    ctx.moveTo(ponto.x, ponto.y);
    ctx.lineTo(ponto.x + 0.01, ponto.y + 0.01);
    ctx.stroke();

    if (ferramentaAtiva === "caneta") {
      setAssinaturaVazia(false);
    }

    setIsDrawing(true);
  }

  function draw(event) {
    if (!isDrawing || !contextRef.current) return;

    const ponto = getCoordenadas(event);
    if (!ponto) return;

    event.preventDefault();

    contextRef.current.lineTo(ponto.x, ponto.y);
    contextRef.current.stroke();
  }

  function finishDrawing(event) {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;

    if (!ctx || !canvas) return;

    if (event?.target?.releasePointerCapture) {
      try {
        event.target.releasePointerCapture(event.pointerId);
      } catch {}
    }

    ctx.closePath();
    setIsDrawing(false);

    const vaziaAgora = canvasEstaEmBranco(canvas);
    setAssinaturaVazia(vaziaAgora);

    if (vaziaAgora) {
      setAssinaturaPreview("");
      setAssinaturaEdicao("");
      assinaturaPreviewRef.current = "";
      assinaturaEdicaoRef.current = "";
      return;
    }

    const imagemEdicao = canvas.toDataURL("image/png");
    const imagemAjustada = gerarAssinaturaAjustada(canvas);

    setAssinaturaEdicao(imagemEdicao);
    setAssinaturaPreview(imagemAjustada);
    assinaturaEdicaoRef.current = imagemEdicao;
    assinaturaPreviewRef.current = imagemAjustada;
  }

  function limparAssinatura() {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;

    setIsDrawing(false);
    setAssinaturaPreview("");
    setAssinaturaEdicao("");
    assinaturaPreviewRef.current = "";
    assinaturaEdicaoRef.current = "";
    setAssinaturaVazia(true);

    if (!canvas || !ctx) return;

    const largura = canvas.clientWidth;
    const altura = canvas.clientHeight;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    preencherCanvasBranco(ctx, largura, altura);
    aplicarFerramentaNoContexto(ctx, ferramentaAtiva);
  }

  function concluirAssinatura() {
    if (!assinaturaPreviewRef.current) {
      toast.warning("Peça para o colaborador assinar antes de concluir.");
      return;
    }

    fecharModalAssinatura();
  }

  return {
    modalAssinaturaAberto,
    assinaturaPreview,
    assinaturaEdicao,
    canvasRef,
    canvasWrapperRef,
    assinaturaVazia,
    ferramentaAtiva,
    setFerramentaAtiva,
    painelFerramentasAberto,
    setPainelFerramentasAberto,
    isMobileViewport,
    abrirModalAssinatura,
    fecharModalAssinatura,
    startDrawing,
    draw,
    finishDrawing,
    limparAssinatura,
    concluirAssinatura,
  };
}