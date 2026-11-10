import { useId } from "react";

// Limite do plano (funcionários, usuários, unidades). value: null = ilimitado; "" ou número = limite.
// Usado pelos modais de novo plano e de edição.
export default function CampoLimite({ label, value, onChange, placeholder }) {
  const id = useId();
  const ilimitado = value === null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <label htmlFor={id} className="text-xs font-bold text-ink-2 uppercase tracking-wide">
          {label}
        </label>
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-ink-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={ilimitado}
            onChange={(e) => onChange(e.target.checked ? null : "")}
            className="w-4 h-4 accent-current text-ink cursor-pointer"
          />
          Ilimitado
        </label>
      </div>
      <input
        id={id}
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        value={ilimitado ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        disabled={ilimitado}
        placeholder={ilimitado ? "Sem limite" : placeholder}
        className="w-full px-4 py-3 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink placeholder:text-ink-3 disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}

// Valida os limites do formulário: cada um precisa ser um inteiro >= 1 ou "Ilimitado".
// Devolve a mensagem de erro, ou "" quando está tudo certo.
export function erroLimites(form, campos) {
  for (const [campo, rotulo] of campos) {
    const v = form[campo];
    if (v === null) continue;
    if (!/^\d+$/.test(String(v).trim()) || Number(v) < 1) {
      return `Informe o limite de ${rotulo} (1 ou mais) ou marque "Ilimitado".`;
    }
  }
  return "";
}

export const CAMPOS_LIMITE = [
  ["limite_funcionarios", "funcionários"],
  ["limite_usuarios", "usuários"],
  ["limite_unidades", "unidades"],
];

// form → payload: null continua null (ilimitado), o resto vira número
export const limiteParaApi = (v) => (v === null ? null : Number(v));
