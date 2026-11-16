import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Paginação no front: recebe a lista inteira (já filtrada) e devolve só a página atual.
// Se a lista encolher (filtro, exclusão), a página fica dentro do total sozinha.
export function usePaginacao(lista, porPagina) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const atual = Math.min(pagina, totalPaginas);
  const itens = lista.slice((atual - 1) * porPagina, atual * porPagina);
  return { itens, pagina: atual, totalPaginas, setPagina };
}

// className troca a moldura: o padrão é o rodapé de um card; solta na página, passe PAGINACAO_SOLTA.
export const PAGINACAO_SOLTA = "mt-6 bg-surface p-3 sm:px-4 rounded-md border border-line flex items-center justify-between";

function Paginacao({ pagina, totalPaginas, setPagina, className = "px-6 py-4 border-t border-line flex items-center justify-between" }) {
  if (totalPaginas <= 1) return null;
  const botao = "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-bold text-ink-2 hover:text-ink hover:bg-sunken disabled:opacity-30 disabled:hover:bg-transparent transition-colors";
  return (
    <div className={className}>
      <button type="button" onClick={() => setPagina(pagina - 1)} disabled={pagina === 1} className={botao}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Anterior
      </button>
      <span className="text-xs font-bold text-ink-2 bg-sunken px-3 py-1.5 rounded-md">
        {pagina} de {totalPaginas}
      </span>
      <button type="button" onClick={() => setPagina(pagina + 1)} disabled={pagina === totalPaginas} className={botao}>
        Próxima
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default Paginacao;
