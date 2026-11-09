import { useEffect, useState } from "react";
import { api } from "../services/api";
import { escolherUnidade, unidadeAtual } from "../services/unidadeAtual";
import Selecao from "./Selecao";

// valor próprio porque o Selecao trata a opção vazia como placeholder e a esconde da lista
const TODAS = "todas";

// "Em qual loja estou": aparece só para empresa com 2 unidades ou mais.
// Trocar recarrega a página, e assim toda tela busca de novo já com o filtro.
// semUnidades: o que mostrar no lugar quando a empresa tem uma unidade só
export default function SeletorUnidade({ id = "seletor-unidade", className = "", compacto = false, semUnidades = null }) {
  const [unidades, setUnidades] = useState([]);
  const atual = unidadeAtual();

  useEffect(() => {
    let ativo = true;
    api
      .get("/unidades")
      .then((lista) => {
        if (!ativo) return;
        const ativas = lista ?? [];
        // a loja guardada foi desativada (ou a empresa voltou a ter uma só): volta para "todas"
        if (atual && (ativas.length < 2 || !ativas.some((u) => String(u.id) === atual))) {
          escolherUnidade("");
          window.location.reload();
          return;
        }
        setUnidades(ativas);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [atual]);

  if (unidades.length < 2) return semUnidades;

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">Unidade</label>
      <Selecao
        id={id}
        className={
          compacto
            ? "h-6 max-w-[10rem] -ml-1.5 mt-0.5 px-1.5 rounded border border-transparent hover:border-line bg-transparent text-xs font-medium text-ink-2"
            : "h-9 w-full px-3 rounded-md border border-line bg-surface text-sm text-ink"
        }
        value={atual || TODAS}
        onChange={(e) => {
          escolherUnidade(e.target.value === TODAS ? "" : e.target.value);
          window.location.reload();
        }}
      >
        <option value={TODAS}>Todas as unidades</option>
        {unidades.map((u) => (
          <option key={u.id} value={u.id}>{u.nome}</option>
        ))}
      </Selecao>
    </div>
  );
}
