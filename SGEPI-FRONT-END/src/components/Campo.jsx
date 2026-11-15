// Peças de formulário que todas as telas de cadastro repetiam: rótulo, classe do campo (com estado
// de erro) e a mensagem embaixo.

export const labelClass = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5";

const inputBase =
  "w-full px-4 h-[46px] rounded-md text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder-ink-3 border";

export function inputClass(erro) {
  return `${inputBase} ${
    erro ? "border-erro focus:ring-erro focus:border-erro bg-erro-soft" : "border-line focus:ring-ink focus:border-ink bg-surface text-ink"
  }`;
}

// erro tem prioridade sobre ajuda: os dois ocupam a mesma linha embaixo do campo
export default function Campo({ id, rotulo, obrigatorio, erro, ajuda, className, children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {rotulo} {obrigatorio && <span className="text-erro">*</span>}
      </label>
      {children}
      {erro ? (
        <p className="text-xs font-medium text-erro mt-1.5">{erro}</p>
      ) : (
        ajuda && <p className="text-xs text-ink-3 mt-1.5">{ajuda}</p>
      )}
    </div>
  );
}
