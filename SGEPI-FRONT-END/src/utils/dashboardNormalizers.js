// TRADUTOR DE DATA GO -> REACT
export function converterDataParaISO(dataBruta) {
  if (!dataBruta) return null;
  
  const dataStr = String(dataBruta).substring(0, 10);

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
    const [dia, mes, ano] = dataStr.split("/");
    return `${ano}-${mes}-${dia}`;
  }
  return dataStr;
}

export function normalizarEpi(item) {
  return {
    id: Number(item?.id ?? item?.Id ?? 0),
    nome: String(item?.nome ?? item?.Nome ?? ""),
    // 🌟 A CORREÇÃO DEFINITIVA: Tenta ler com underline primeiro, depois camelCase
    alerta_minimo: Number(item?.alerta_minimo ?? item?.alertaMinimo ?? 0),
    ca: String(item?.ca ?? ""),
    validade_ca: String(item?.validade_ca ?? ""), // DD/MM/YYYY
    situacao_ca: String(item?.situacao_ca ?? ""), // situação na base do MTE (vazio se não está nela)
  };
}


export function normalizarTamanho(item) {
  return {
    id: Number(item?.id ?? item?.Id ?? item?.ID ?? 0),
    tamanho: String(item?.tamanho ?? item?.Tamanho ?? ""),
  };
}

export function normalizarFuncionario(item) {
  return {
    id: Number(item?.id ?? item?.Id ?? item?.ID ?? 0),
    nome: String(item?.nome ?? item?.Nome ?? ""),
    matricula: String(item?.matricula ?? item?.Matricula ?? ""),
  };
}

export function normalizarEntrada(item) {
  return {
    // 🌟 Blindagem para ler os IDs de entrada independentemente do case
    id: Number(item?.id ?? item?.Id ?? item?.ID ?? 0),
    idEpi: Number(item?.idEpi ?? item?.IdEpi ?? item?.id_epi ?? 0),
    idTamanho: Number(item?.idTamanho ?? item?.IdTamanho ?? item?.id_tamanho ?? 0),
    quantidadeAtual: Number(item?.quantidadeAtual ?? item?.QuantidadeAtual ?? item?.quantidade_atual ?? 0),
    quantidade: Number(item?.quantidade ?? item?.Quantidade ?? 0),
    valor_unitario: Number(item?.valorUnitario ?? item?.ValorUnitario ?? item?.valor_unitario ?? 0),   
    data_entrada: converterDataParaISO(
      item?.dataEntrada ?? item?.DataEntrada ?? item?.data_entrada
    ),
    lote: String(item?.lote ?? item?.Lote ?? ""),
  };
}

export function normalizarItemEntregue(item) {
  return {
    id: Number(item?.id ?? item?.Id ?? 0),
    idEntrega: Number(item?.idEntregaCabecalho ?? item?.id_entrega_cabecalho ?? item?.idEntrega ?? item?.IdEntrega ?? 0),
    idEpi: Number(item?.idEpi ?? item?.id_epi ?? item?.IdEpi ?? item?.epi?.id ?? 0),
    idTamanho: Number(item?.idTamanho ?? item?.id_tamanho ?? item?.IdTamanho ?? item?.tamanho?.id ?? 0),
    quantidade: Number(item?.quantidade ?? item?.Quantidade ?? 0),
    epiNome: item?.epiNome ?? item?.EpiNome ?? item?.epi?.nome ?? "EPI não identificado",
    tamanhoTexto: item?.tamanhoTexto ?? item?.TamanhoTexto ?? item?.tamanho?.tamanho ?? "-",
  };
}

export function normalizarEntrega(item) {
  const itensOriginais = item?.itens ?? item?.Itens ?? [];
  
  const idFunc = Number(
    item?.idFuncionario ?? 
    item?.id_funcionario ?? 
    item?.Idfuncionario ?? 
    item?.IdFuncionario ?? 
    item?.funcionario?.id ?? 
    0
  );

  return {
    id: Number(item?.id ?? item?.Id ?? 0),
    idFuncionario: idFunc, 
    
    data_entrega: item?.data_entrega ?? item?.dataEntrega ?? item?.DataEntrega ?? "",
    
    funcionario: {
      id: idFunc,
      nome: item?.nomeFuncionario ?? item?.NomeFuncionario ?? item?.funcionario?.nome ?? "Não identificado",
      matricula: String(item?.matricula ?? item?.Matricula ?? item?.funcionario?.matricula ?? "-")
    },
    
    itens: Array.isArray(itensOriginais) 
      ? itensOriginais.map(normalizarItemEntregue) 
      : [],
  };
}

export function normalizarDevolucao(item) {
  return {
    id: Number(item?.id ?? item?.Id ?? 0),
    data_devolucao: converterDataParaISO(
      item?.data_devolucao ?? item?.dataDevolucao ?? item?.DataDevolucao ?? item?.data ?? item?.Data
    ),
  };
}