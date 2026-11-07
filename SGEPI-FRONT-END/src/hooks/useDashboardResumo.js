import { useEffect, useMemo, useState } from "react";
import { listar } from "../services/listas";

import { obterHojeISO, diasAte } from "../utils/dashboardFormatters";

import {
  normalizarEpi,
  normalizarTamanho,
  normalizarFuncionario,
  normalizarEntrada,
  normalizarEntrega,
  normalizarItemEntregue,
  normalizarDevolucao,
} from "../utils/dashboardNormalizers";

export const DIAS_ALERTA_CA = 30;
export const DIAS_ALERTA_TROCA = 7;

export function useDashboardResumo() {
  const [epis, setEpis] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [entregas, setEntregas] = useState([]);
  const [itensEntregues, setItensEntregues] = useState([]);
  const [devolucoes, setDevolucoes] = useState([]);
  const [trocas, setTrocas] = useState([]);
  const [faltasKit, setFaltasKit] = useState([]);
  const [carregandoResumo, setCarregandoResumo] = useState(true);

  const carregarResumo = async () => {
    setCarregandoResumo(true);

    try {
      const [
        listaEpis,
        listaTamanhos,
        listaFuncionarios,
        listaEntradas,
        listaEntregas,
        listaItensEntregues,
        listaDevolucoes,
        listaTrocas,
        listaFaltasKit,
      ] = await Promise.all([
        listar("/epis-dashbord"),
        listar("/tamanhos"),
        listar("/funcionarios-dashbord"),
        listar("/entradas-dashbord"),
        listar("/entregas-dashbord"),
        listar("/entrega-itens-dashbord"),
        listar("/devolucao"),
        listar(`/trocas-pendentes?dias=${DIAS_ALERTA_TROCA}`),
        listar("/faltas-kit"),
      ]);
      
      setEpis(listaEpis.map(normalizarEpi));
      setTamanhos(listaTamanhos.map(normalizarTamanho));
      setFuncionarios(listaFuncionarios.map(normalizarFuncionario));
      setEntradas(listaEntradas.map(normalizarEntrada));
      setEntregas(listaEntregas.map(normalizarEntrega));
      setItensEntregues(listaItensEntregues.map(normalizarItemEntregue));
      setDevolucoes(listaDevolucoes.map(normalizarDevolucao));
      setTrocas(listaTrocas);
      setFaltasKit(listaFaltasKit);
    } finally {
      setCarregandoResumo(false);
    }
  };

  useEffect(() => {
    carregarResumo();
  }, []);

  const episMap = useMemo(() => {
    return Object.fromEntries(
      epis.map((item) => [Number(item.id), item])
    );
  }, [epis]);

  const tamanhosMap = useMemo(() => {
    return Object.fromEntries(
      tamanhos.map((item) => [Number(item.id), item])
    );
  }, [tamanhos]);

  const funcionariosMap = useMemo(() => {
    return Object.fromEntries(
      funcionarios.map((item) => [Number(item.id), item])
    );
  }, [funcionarios]);

  const itensEntreguesPorEntrega = useMemo(() => {
    return itensEntregues.reduce((acc, item) => {
      const idKey = String(item.idEntrega);
      
      if (idKey !== "0") {
        if (!acc[idKey]) acc[idKey] = [];
        acc[idKey].push(item);
      }
      return acc;
    }, {});
  }, [itensEntregues]);

  const estoqueDetalhado = useMemo(() => {
    const mapa = {};
    entradas.forEach((entrada) => {
      const idEpiReal = entrada.idEpi; 
      const idTamanhoReal = entrada.idTamanho;
      const qtdAtualReal = Number(entrada.quantidadeAtual || 0);

      const epi = episMap[Number(idEpiReal)];
      const tamanho = tamanhosMap[Number(idTamanhoReal)];

      const nomeItem = epi?.nome || `EPI #${idEpiReal || "--"}`;
      const tamanhoLabel = tamanho?.tamanho || "Sem tamanho";

      const chave = `${idEpiReal}-${idTamanhoReal}`;

      if (!mapa[chave]) {
        mapa[chave] = {
          id: chave,
          idEpi: Number(idEpiReal),
          idTamanho: Number(idTamanhoReal),
          item: nomeItem,
          tamanho: tamanhoLabel,
          quantidade: 0,
        };
      }

      mapa[chave].quantidade += qtdAtualReal;
    });

    return Object.values(mapa)
      .filter((item) => item.quantidade >= 0)
      .sort((a, b) => a.item.localeCompare(b.item));
  }, [entradas, episMap, tamanhosMap]);

  // ======= BLOCO: entregasMesDetalhadas (Para o Card) =======
  const entregasMesDetalhadas = useMemo(() => {
    const hojeISO = obterHojeISO();
    const anoMesISO = hojeISO.substring(0, 7); 
    const [ano, mes] = anoMesISO.split("-");
    const mesAnoBR = `${mes}/${ano}`; 
    
    const lines = [];

    const entregasDoMes = entregas.filter((entrega) => {
      const dataRaw = String(entrega.data_entrega || "");
      if (dataRaw.includes("/")) {
        return dataRaw.endsWith(mesAnoBR);
      }
      return dataRaw.startsWith(anoMesISO);
    });

    entregasDoMes.forEach((entrega) => {
      const idEnt = String(entrega.id);
      const idFunc = String(entrega.idFuncionario);
      const funcionario = funcionariosMap[idFunc];
      const itensDaEntrega = itensEntreguesPorEntrega[idEnt] || [];

      if (itensDaEntrega.length === 0) {
        lines.push({
          id: `vazio-${idEnt}`,
          data: entrega.data_entrega,
          funcionario: funcionario?.nome || "Funcionário ID: " + idFunc,
          matricula: funcionario?.matricula || "--",
          item: "⚠️ Nenhum item no banco",
          tamanho: "-",
          quantidade: 0,
        });
        return;
      }

      itensDaEntrega.forEach((item, index) => {
        const idEpi = String(item.idEpi);
        const idTam = String(item.idTamanho);
        const epi = episMap[idEpi];
        const tam = tamanhosMap[idTam];

        lines.push({
          id: `${idEnt}-item-${index}`,
          data: entrega.data_entrega,
          funcionario: funcionario?.nome || "Desconhecido",
          matricula: funcionario?.matricula || "--",
          item: epi?.nome || `EPI #${idEpi}`,
          tamanho: tam?.tamanho || "?",
          quantidade: Number(item.quantidade || 0),
        });
      });
    });

    return lines.sort((a, b) => a.funcionario.localeCompare(b.funcionario));
  }, [entregas, funcionariosMap, itensEntreguesPorEntrega, episMap, tamanhosMap]);

  // ======= BLOCO: entregasTodasDetalhadas (Para o Filtro do Modal) =======
  const entregasTodasDetalhadas = useMemo(() => {
    const lines = [];

    entregas.forEach((entrega) => {
      const idEnt = String(entrega.id);
      const idFunc = String(entrega.idFuncionario);
      const funcionario = funcionariosMap[idFunc];
      const itensDaEntrega = itensEntreguesPorEntrega[idEnt] || [];

      if (itensDaEntrega.length === 0) {
        lines.push({
          id: `vazio-${idEnt}`,
          data: entrega.data_entrega,
          funcionario: funcionario?.nome || "Funcionário ID: " + idFunc,
          matricula: funcionario?.matricula || "--",
          item: "⚠️ Nenhum item no banco",
          tamanho: "-",
          quantidade: 0,
        });
        return;
      }

      itensDaEntrega.forEach((item, index) => {
        const idEpi = String(item.idEpi);
        const idTam = String(item.idTamanho);
        const epi = episMap[idEpi];
        const tam = tamanhosMap[idTam];

        lines.push({
          id: `${idEnt}-item-${index}`,
          data: entrega.data_entrega,
          funcionario: funcionario?.nome || "Desconhecido",
          matricula: funcionario?.matricula || "--",
          item: epi?.nome || `EPI #${idEpi}`,
          tamanho: tam?.tamanho || "?",
          quantidade: Number(item.quantidade || 0),
        });
      });
    });

    return lines.sort((a, b) => a.funcionario.localeCompare(b.funcionario));
  }, [entregas, funcionariosMap, itensEntreguesPorEntrega, episMap, tamanhosMap]);

 
  const alertasDetalhados = useMemo(() => {
    return entradas
      .map((entrada) => {
        const epi = episMap[Number(entrada.idEpi)];
        const tamanho = tamanhosMap[Number(entrada.idTamanho)];
        
        const alertaMinimo = Number(
          epi?.alerta_minimo || 
          epi?.alertaMinimo || 
          0
        );

        const quantidadeAtual = Number(entrada.quantidadeAtual || 0);

        return {
          id: `entrada-${entrada.id}`,
          item: epi?.nome || `EPI #${entrada.idEpi}`,
          tamanho: tamanho?.tamanho || "Sem tamanho",
          quantidade: quantidadeAtual,
          alertaMinimo,
          lote: entrada.lote || "Sem lote", // 🌟 Captura o lote da entrada
        };
      })
      .filter(
        (item) =>
          Number(item.alertaMinimo) > 0 && 
          Number(item.quantidade) > 0 && // 🌟 Remove os lotes que já estão ZERADOS
          Number(item.quantidade) <= Number(item.alertaMinimo) // Mantém apenas os que estão abaixo/no limite
      )
      .sort((a, b) => a.quantidade - b.quantidade);
  }, [entradas, episMap, tamanhosMap]);

  // CA vencido, vencendo nos próximos DIAS_ALERTA_CA dias, ou cancelado/suspenso no MTE
  const caVencendoDetalhado = useMemo(() => {
    return epis
      .map((epi) => ({
        id: epi.id, item: epi.nome, ca: epi.ca, validade: epi.validade_ca, dias: diasAte(epi.validade_ca),
        bloqueadoMte: ["CANCELADO", "SUSPENSO"].includes(epi.situacao_ca) ? epi.situacao_ca : null,
      }))
      .filter((item) => item.bloqueadoMte || (item.dias !== null && item.dias <= DIAS_ALERTA_CA))
      .sort((a, b) => Boolean(b.bloqueadoMte) - Boolean(a.bloqueadoMte) || a.dias - b.dias);
  }, [epis]);

  // já vem filtrado e ordenado pelo back-end (/trocas-pendentes)
  const trocasDetalhadas = useMemo(() => {
    return trocas.map((t) => ({
      id: `${t.funcionario_id}-${t.epi_id}`,
      funcionario: t.funcionario_nome,
      matricula: t.matricula,
      item: t.epi_nome,
      emPosse: t.em_posse,
      ultimaEntrega: t.ultima_entrega,
      venceEm: t.vence_em,
      dias: diasAte(t.vence_em),
    }));
  }, [trocas]);

  // funcionários com menos EPI em posse do que o kit da função pede (/faltas-kit)
  const faltasKitDetalhadas = useMemo(() => {
    return faltasKit.map((f) => ({
      id: `${f.funcionario_id}-${f.epi_id}`,
      funcionario: f.funcionario_nome,
      matricula: f.matricula,
      funcao: f.funcao_nome,
      item: f.epi_nome,
      exigido: f.exigido,
      emPosse: f.em_posse,
    }));
  }, [faltasKit]);

  const valorEstoqueDetalhado = useMemo(() => {
    const mapa = {};

    entradas.forEach((entrada) => {
      const epi = episMap[Number(entrada.idEpi)];
      const tamanho = tamanhosMap[Number(entrada.idTamanho)];

      const nomeItem =
        entrada.epiNome || epi?.nome || `EPI #${entrada.idEpi || "--"}`;
      const tamanhoLabel =
        entrada.tamanhoTexto || tamanho?.tamanho || "Sem tamanho";

      const chave = `${entrada.idEpi}-${entrada.idTamanho}`;

      if (!mapa[chave]) {
        mapa[chave] = {
          id: chave,
          item: nomeItem,
          tamanho: tamanhoLabel,
          quantidade: 0,
          valorTotal: 0,
        };
      }

      const qtd = Number(entrada.quantidadeAtual || 0);
      const valorUnit = Number(entrada.valor_unitario || 0);

      mapa[chave].quantidade += qtd;
      mapa[chave].valorTotal += qtd * valorUnit;
    });

    return Object.values(mapa)
      .filter((item) => Number(item.quantidade) > 0)
      .sort((a, b) => b.valorTotal - a.valorTotal);
  }, [entradas, episMap, tamanhosMap]);

  // ======= BLOCO: resumo =======
  const resumo = useMemo(() => {
    const hojeISO = obterHojeISO();
    const anoMesISO = hojeISO.substring(0, 7); 
    const [ano, mes] = anoMesISO.split("-");
    const mesAnoBR = `${mes}/${ano}`; 

    const totalItens = entradas.reduce(
      (acc, entrada) => acc + Number(entrada.quantidadeAtual || 0),
      0
    );

    const entregasMes = entregas.filter((entrega) => {
      const dataRaw = String(entrega.data_entrega || "");
      return dataRaw.startsWith(anoMesISO) || dataRaw.includes(mesAnoBR);
    }).length;

    const devolucoesHoje = devolucoes.filter((devolucao) => {
      const data = String(devolucao.data_devolucao || "").substring(0, 10);
      const [anoD, mesD, diaD] = hojeISO.split("-");
      const hojeBR = `${diaD}/${mesD}/${anoD}`; 
      return data === hojeISO || data === hojeBR;
    }).length;

    const valorTotal = entradas.reduce(
      (acc, entrada) =>
        acc +
        Number(entrada.quantidadeAtual || 0) *
          Number(entrada.valor_unitario || 0),
      0
    );

    const alertas = alertasDetalhados.length;

    return {
      totalItens,
      entregasMes, 
      devolucoesHoje,
      alertas,
      caVencendo: caVencendoDetalhado.length,
      trocas: trocasDetalhadas.length,
      faltasKit: new Set(faltasKitDetalhadas.map((f) => f.funcionario)).size,
      valorTotal,
    };
  }, [entradas, entregas, devolucoes, alertasDetalhados, caVencendoDetalhado, trocasDetalhadas, faltasKitDetalhadas]);

  return {
    epis,
    entradas,
    funcionarios,
    carregandoResumo,
    resumo,
    estoqueDetalhado,
    entregasMesDetalhadas, 
    entregasTodasDetalhadas, 
    alertasDetalhados,
    caVencendoDetalhado,
    trocasDetalhadas,
    faltasKitDetalhadas,
    valorEstoqueDetalhado,
    carregarResumo,
  };
}