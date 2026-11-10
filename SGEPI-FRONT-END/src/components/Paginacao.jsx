import React, { useState } from "react";

// Paginação no front: recebe a lista inteira (já filtrada) e devolve só a página atual.
// Se a lista encolher (filtro, exclusão), a página fica dentro do total sozinha.
export function usePaginacao(lista, porPagina) {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const atual = Math.min(pagina, totalPaginas);
  const itens = lista.slice((atual - 1) * porPagina, atual * porPagina);
  return { itens, pagina: atual, totalPaginas, setPagina };
}

function Paginacao({ pagina, totalPaginas, setPagina }) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="px-6 py-4 border-t border-line flex items-center justify-between">
      <button
        type="button"
        onClick={() => setPagina(pagina - 1)}
        disabled={pagina === 1}
        className="text-sm font-medium text-ink-2 hover:text-ink disabled:opacity-30"
      >
        Anterior
      </button>
      <span className="text-xs text-ink-3 font-medium">
        {pagina} de {totalPaginas}
      </span>
      <button
        type="button"
        onClick={() => setPagina(pagina + 1)}
        disabled={pagina === totalPaginas}
        className="text-sm font-medium text-ink-2 hover:text-ink disabled:opacity-30"
      >
        Próxima
      </button>
    </div>
  );
}

export default Paginacao;
