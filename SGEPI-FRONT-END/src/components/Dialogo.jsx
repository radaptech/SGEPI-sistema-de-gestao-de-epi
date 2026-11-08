import { useEffect, useRef } from "react";

// Pilha dos diálogos abertos: só o do topo reage ao Esc e prende o Tab.
const pilha = [];

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Overlay de modal acessível: role="dialog", Esc fecha, foco preso dentro
// e devolvido a quem abriu quando fecha.
export default function Dialogo({ onClose, rotulo, className, children, ...resto }) {
  const ref = useRef(null);
  const fecharRef = useRef(onClose);
  fecharRef.current = onClose;

  useEffect(() => {
    const no = ref.current;
    const anterior = document.activeElement;
    pilha.push(no);
    if (!no.contains(document.activeElement)) no.focus({ preventScroll: true });

    function aoTeclar(e) {
      if (pilha[pilha.length - 1] !== no) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        fecharRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;
      const itens = [...no.querySelectorAll(FOCAVEIS)].filter((el) => el.offsetParent !== null);
      if (itens.length === 0) return e.preventDefault();
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === no)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      pilha.splice(pilha.indexOf(no), 1);
      if (anterior && document.contains(anterior)) anterior.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={rotulo}
      tabIndex={-1}
      className={`outline-none ${className ?? ""}`}
      {...resto}
    >
      {children}
    </div>
  );
}
