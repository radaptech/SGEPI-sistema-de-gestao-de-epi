import { RefreshCw } from "lucide-react";
import { labelClass, inputClass } from "../../Campo";

// Número do CA + botão "Buscar" (ou Enter) na base do MTE.
// info: null | "carregando" | "nao-encontrado" | { situacao, ... }
export default function CampoCa({ valor, onChange, onBuscar, info, erro }) {
  const buscando = info === "carregando";
  return (
    <div>
      <label htmlFor="novoepi-ca" className={labelClass}>
        Número do CA <span className="text-erro">*</span>
      </label>
      <div className="flex gap-2">
        <input
          id="novoepi-ca"
          type="text"
          value={valor}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onBuscar();
            }
          }}
          className={`${inputClass(erro)} font-mono`}
          placeholder="Apenas números"
        />
        <button
          type="button"
          onClick={onBuscar}
          disabled={!valor || buscando}
          title="Buscar dados do CA na base do MTE"
          className="shrink-0 inline-flex items-center gap-1.5 px-4 rounded-md bg-action hover:bg-action-hover text-on-action text-sm font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${buscando ? "animate-spin" : ""}`} />
          Buscar
        </button>
      </div>
      {erro ? (
        <p className="text-xs font-medium text-erro mt-1.5">{erro}</p>
      ) : buscando ? (
        <p className="text-xs text-ink-3 mt-1.5">Consultando a base do MTE...</p>
      ) : info === "nao-encontrado" ? (
        <p className="text-xs text-ink-3 mt-1.5">CA não encontrado na base do MTE. Preencha à mão.</p>
      ) : (
        info?.situacao && (
          <p className={`text-xs font-semibold mt-1.5 ${info.situacao === "VÁLIDO" ? "text-ok" : "text-erro"}`}>
            MTE: {info.situacao}
            {info.situacao !== "VÁLIDO" && info.situacao !== "VENCIDO" && " (não pode ser entregue)"}
          </p>
        )
      )}
    </div>
  );
}
