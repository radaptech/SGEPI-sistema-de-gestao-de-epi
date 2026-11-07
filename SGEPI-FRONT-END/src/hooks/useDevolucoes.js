import { useCallback, useEffect, useState } from "react";
import { listar } from "../services/listas";

// /devolucao já vem com os nomes resolvidos (funcionarioNome, epiNome, motivoNome...), sem normalizar.
export function useDevolucoes() {
  const [devolucoes, setDevolucoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setDevolucoes(await listar("/devolucao"));
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { carregando, devolucoes, carregar };
}
