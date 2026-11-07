import { useEffect, useMemo, useState } from "react";
import { temPermissao } from "../utils/permissoes";

import { listarEntregas } from "../services/entregaService";
import { normalizarEntrega } from "../utils/entregaNormalizers";

function totalItensDaLista(lista) {
  return lista.reduce((acc, ent) => acc + (ent.itens?.reduce((s, i) => s + Number(i.quantidade || 0), 0) || 0), 0);
}

function totalTiposDaLista(lista) {
  const tipos = new Set();
  lista.forEach(ent => ent.itens?.forEach(i => tipos.add(`${i.epiNome}::${i.tamanhoNome}`)));
  return tipos.size;
}

// --- HOOK PRINCIPAL ---
export function useEntregas({ usuarioLogado }) {
  const [entregas, setEntregas] = useState([]);

  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erroTela, setErroTela] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const itensPorPagina = 6;

  const podeVisualizar = !usuarioLogado 
    ? true 
    : temPermissao(usuarioLogado, "visualizar_entregas") || temPermissao(usuarioLogado, "visualizar_estoque");
  
  const perfilUsuario = usuarioLogado?.role;
  const podeCadastrar = !usuarioLogado ? true : perfilUsuario === "admin" || perfilUsuario === "gerente";

  const carregarDados = async () => {
    setCarregando(true);
    setErroTela("");
    try {
      setEntregas((await listarEntregas()).map(normalizarEntrega));
    } catch (erro) {
      console.error("Erro ao carregar dados:", erro);
      setErroTela("Não foi possível carregar os dados. Verifique a conexão.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const entregasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const filtradas = entregas.filter((ent) => {
      const matchTexto = !termo || 
        (ent.funcionario?.nome || "").toLowerCase().includes(termo) ||
        (ent.funcionario?.matricula || "").includes(termo) ||
        (ent.tokenValidacao || "").toLowerCase().includes(termo) ||
        ent.itens.some(i => i.epiNome.toLowerCase().includes(termo));

      // Conversão a data "DD/MM/YYYY" do JSON para "YYYY-MM-DD" para o filtro funcionar
      let dataComparacao = ent.dataEntrega;
      if (dataComparacao && dataComparacao.includes("/")) {
          const partes = dataComparacao.split("/");
          if (partes.length === 3) dataComparacao = `${partes[2]}-${partes[1]}-${partes[0]}`;
      }

      const matchData = (!dataInicio || dataComparacao >= dataInicio) && (!dataFim || dataComparacao <= dataFim);

      return matchTexto && matchData;
    }).sort((a, b) => {
      // Ordenação corrigida e blindada contra dados nulos
      const dataA = String(a.dataEntrega || "").split("/").reverse().join("");
      const dataB = String(b.dataEntrega || "").split("/").reverse().join("");
      
      if (dataA !== dataB) return dataB.localeCompare(dataA);
      return Number(b.id || 0) - Number(a.id || 0);
    });

    return filtradas;
  }, [entregas, busca, dataInicio, dataFim]);

  const estatisticasTela = useMemo(() => {
    return {
      totalEntregas: entregasFiltradas.length,
      totalItens: totalItensDaLista(entregasFiltradas),
      totalTipos: totalTiposDaLista(entregasFiltradas),
    };
  }, [entregasFiltradas]);

  const totalPaginas = Math.max(1, Math.ceil(entregasFiltradas.length / itensPorPagina));
  const entregasVisiveis = entregasFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  useEffect(() => {
    if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
  }, [totalPaginas, paginaAtual]);

  const finalizarSalvamento = async () => {
    await carregarDados(); 
    setPaginaAtual(1);     
    setModalAberto(false); 
  };

  return {
    busca, setBusca, dataInicio, setDataInicio, dataFim, setDataFim,
    paginaAtual, setPaginaAtual, carregando, erroTela, 
    entregasVisiveis, totalPaginas, 
    podeVisualizar, podeCadastrar,
    estatisticasTela,
    modalAberto, setModalAberto,
    aoSalvarEntrega: finalizarSalvamento,
  };
}