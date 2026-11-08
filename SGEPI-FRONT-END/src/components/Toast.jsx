import { useEffect } from "react";

function Toast({ type = "success", message, onClose }) {
  // Configuração visual para cada tipo de alerta
  const styles = {
    success: {
      border: "border border-ok",
      iconColor: "text-ok",
      bgIcon: "bg-ok-soft",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: "Sucesso!",
    },
    error: {
      border: "border border-erro",
      iconColor: "text-erro",
      bgIcon: "bg-erro-soft",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      title: "Erro",
    },
    warning: {
      border: "border border-atencao",
      iconColor: "text-atencao",
      bgIcon: "bg-atencao-soft",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      title: "Atenção",
    },
  };

  const style = styles[type];

  // Fecha automaticamente após 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-5 right-5 z-[9999] ">
      <div className={`bg-surface  rounded-md p-4 flex items-start gap-3 w-80 ${style.border}`}>
        {/* Ícone */}
        <div className={`p-2 rounded-full ${style.bgIcon} ${style.iconColor}`}>
          {style.icon}
        </div>

        {/* Texto */}
        <div className="flex-1">
          <h4 className={`font-bold text-sm ${style.iconColor}`}>{style.title}</h4>
          <p className="text-sm text-ink-2 mt-1 leading-tight">{message}</p>
        </div>

        {/* Botão Fechar */}
        <button onClick={onClose} className="text-ink-3 hover:text-ink-2 transition">
          ✕
        </button>
      </div>
    </div>
  );
}

export default Toast;