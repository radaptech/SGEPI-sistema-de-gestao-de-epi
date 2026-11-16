// Ranking em barras horizontais: nome à esquerda, barra fina, valor na ponta.
// Poucas linhas (até 8, com "Outros"), então todo valor fica visível sem tooltip.
// A barra mede contra uma trilha de largura fixa, para o comprimento ser proporcional ao valor.

export default function BarrasRanking({ linhas, formatar, vazio }) {
  if (linhas.length === 0) {
    return <p className="py-8 text-sm text-ink-3 text-center">{vazio}</p>;
  }
  const max = Math.max(...linhas.map((l) => l.valor));

  return (
    <ol className="space-y-3">
      {linhas.map((l) => (
        <li key={l.nome} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto] items-center gap-3">
          <span className={`text-sm truncate ${l.outros ? "text-ink-3" : "text-ink-2"}`} title={l.nome}>
            {l.nome}
          </span>
          <span className="block min-w-0" aria-hidden="true">
            <span
              className={`block h-3 rounded-r ${l.outros ? "bg-line-strong" : "bg-ink"}`}
              style={{ width: `${Math.max((l.valor / max) * 100, 1)}%` }}
            />
          </span>
          <span className="text-sm font-semibold text-ink tabular-nums whitespace-nowrap text-right">{formatar(l.valor)}</span>
        </li>
      ))}
    </ol>
  );
}
