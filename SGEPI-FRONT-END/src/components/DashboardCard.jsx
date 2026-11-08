import { ChevronRight } from "lucide-react";

// Etiqueta de prateleira: faixa de cabeçalho com o título, número grande no corpo.
// A faixa só ganha cor quando é pendência e o valor passa de zero.
// Sem onClick vira só leitura (sem seta). Usada no dashboard e nos resumos das telas.
const FAIXA = {
  erro: "bg-erro-soft text-erro border-erro-line",
  atencao: "bg-atencao-soft text-atencao border-atencao-line",
};
const VALOR = { erro: "text-erro", atencao: "text-atencao" };

function DashboardCard({ card, onClick }) {
  const ativa = card.grupo === "pendencia" && Number(card.valor) > 0;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      {...(onClick ? { type: "button", onClick } : {})}
      className={`group text-left bg-surface border border-line rounded-md overflow-hidden ${onClick ? "hover:border-line-strong transition-colors" : ""}`}
    >
      <div
        className={`flex items-center justify-between gap-2 px-4 py-2 border-b text-sm font-semibold ${
          ativa ? FAIXA[card.estado] : "bg-sunken text-ink border-line"
        }`}
      >
        <span>{card.titulo}</span>
        {onClick && <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div className="px-4 pt-3 pb-4">
        <p
          className={`text-3xl font-bold leading-none tabular-nums tracking-tight ${
            ativa ? VALOR[card.estado] : card.grupo === "pendencia" ? "text-ink-3" : "text-ink"
          }`}
        >
          {card.valor}
        </p>
        {card.descricao && <p className="mt-2 text-xs text-ink-3 leading-snug">{card.descricao}</p>}
      </div>
    </Tag>
  );
}

export default DashboardCard;
