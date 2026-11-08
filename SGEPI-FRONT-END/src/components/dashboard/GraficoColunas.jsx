import { useState } from "react";

// Colunas mensais de uma série só (tinta). Mês em andamento fica mais claro e marcado como parcial.
// Rótulo só no maior valor e no último mês; o resto vai no tooltip (hover/foco) e na tabela.

function escalaLimpa(max) {
  if (max <= 0) return 1;
  const passo = 10 ** Math.floor(Math.log10(max));
  const fator = [1, 2, 2.5, 5, 10].find((f) => f * passo * 3 >= max) ?? 10;
  return fator * passo * 3;
}

export default function GraficoColunas({ dados, formatar, rotuloSerie, detalhe }) {
  const [ativo, setAtivo] = useState(null);
  const topo = escalaLimpa(Math.max(...dados.map((d) => d.valor), 0));
  const ticks = [0, 1, 2, 3].map((i) => (topo / 3) * i);
  const iMax = dados.reduce((m, d, i) => (d.valor > dados[m].valor ? i : m), 0);

  return (
    <div>
      <div className="relative h-56 pl-14">
        {ticks.map((t) => (
          <div key={t} className="absolute left-14 right-0 border-t border-line" style={{ bottom: `${(t / topo) * 100}%` }}>
            <span className="absolute right-full mr-2 -translate-y-1/2 text-xs text-ink-3 tabular-nums whitespace-nowrap">
              {formatar(t, true)}
            </span>
          </div>
        ))}

        <div className="relative h-full flex items-end gap-0.5" onPointerLeave={() => setAtivo(null)}>
          {dados.map((d, i) => {
            const altura = (d.valor / topo) * 100;
            const rotular = d.valor > 0 && ativo !== i && (i === iMax || i === dados.length - 1);
            return (
              <button
                key={d.chave}
                type="button"
                className="group relative flex-1 basis-0 min-w-0 h-full flex flex-col items-center justify-end outline-none"
                onPointerEnter={() => setAtivo(i)}
                onFocus={() => setAtivo(i)}
                onBlur={() => setAtivo(null)}
                aria-label={`${d.rotulo}: ${formatar(d.valor)}${d.parcial ? " (mês em andamento)" : ""}`}
              >
                <span
                  className={`relative w-full max-w-6 rounded-t transition-opacity ${d.parcial ? "bg-line-strong" : "bg-ink"} ${
                    ativo !== null && ativo !== i ? "opacity-40" : ""
                  } group-focus-visible:ring-2 group-focus-visible:ring-ink group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-surface`}
                  style={{ height: `${altura}%`, minHeight: d.valor > 0 ? 2 : 0 }}
                >
                  {rotular && (
                    <span
                      className={`absolute bottom-full mb-1 text-xs font-semibold text-ink tabular-nums whitespace-nowrap ${
                        i === dados.length - 1 ? "right-0" : i === 0 ? "left-0" : "left-1/2 -translate-x-1/2"
                      } ${i !== iMax ? "hidden sm:inline" : ""}`}
                    >
                      {formatar(d.valor, true)}
                    </span>
                  )}
                </span>
                {ativo === i && (
                  <span
                    role="tooltip"
                    className={`absolute top-0 z-10 w-max max-w-[14rem] px-3 py-2 rounded-md border border-line bg-surface shadow-modal text-left pointer-events-none ${
                      i >= dados.length / 2 ? "right-1/2 mr-4" : "left-1/2 ml-4"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink tabular-nums">{formatar(d.valor)}</span>
                    <span className="block text-xs text-ink-2">
                      {rotuloSerie} · {d.rotulo}
                      {d.parcial ? " (parcial)" : ""}
                    </span>
                    {detalhe && <span className="block text-xs text-ink-3 mt-0.5">{detalhe(d)}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-0.5 pl-14 mt-2">
        {dados.map((d, i) => (
          <span
            key={d.chave}
            className={`flex-1 basis-0 min-w-0 text-center text-xs tabular-nums ${d.parcial ? "text-ink-3" : "text-ink-2"} ${
              dados.length > 6 && (dados.length - 1 - i) % 2 === 1 ? "invisible sm:visible" : ""
            }`}
          >
            {d.rotulo.split("/")[0]}
          </span>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-ink-2 hover:text-ink w-fit">Ver em tabela</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="border-b border-line text-xs text-ink-3">
              <th className="py-1.5 font-semibold">Mês</th>
              <th className="py-1.5 font-semibold text-right">{rotuloSerie}</th>
              {detalhe && <th className="py-1.5 font-semibold text-right">Detalhe</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {dados.map((d) => (
              <tr key={d.chave}>
                <td className="py-1.5 text-ink-2">{d.rotulo}{d.parcial ? " (parcial)" : ""}</td>
                <td className="py-1.5 text-right font-mono tabular-nums text-ink">{formatar(d.valor)}</td>
                {detalhe && <td className="py-1.5 text-right text-ink-2">{detalhe(d)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
