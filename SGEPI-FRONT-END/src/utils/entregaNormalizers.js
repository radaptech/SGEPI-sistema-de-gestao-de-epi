export function normalizarFuncionarioEntrega(item) {
  return {
    id: Number(item?.id ?? item?.ID ?? 0),
    nome: item?.nome ?? item?.Nome ?? "",
    matricula: String(item?.matricula ?? item?.Matricula ?? ""),
    funcaoId: Number(item?.funcao?.id ?? 0),
  };
}

export function normalizarEpiEntrega(item) {
  return {
    id: Number(item?.id ?? item?.ID ?? 0),
    nome: item?.nome ?? item?.Nome ?? "",
  };
}

export function normalizarTamanhoEntrega(item) {
  const normalizado = {
    id: Number(item?.id ?? 0),
    tamanho: String(item?.tamanho ?? ""),
  };

  // Puxa o saldo do JSON do Go
  const saldo = item?.quantidade_atual ?? item?.quantidadeAtual ?? item?.saldo_atual;
  
  if (saldo !== undefined && saldo !== null) {
    normalizado.saldo_atual = Number(saldo);
  }

  return normalizado;
}

function normalizarItemEntrega(item) {
  return {
    id: Number(item?.id ?? 0),
    idEpi: Number(item?.epi?.id ?? item?.id_epi ?? 0),
    idTamanho: Number(item?.tamanho?.id ?? item?.id_tamanho ?? 0),
    quantidade: Number(item?.quantidade ?? 0),
    epiNome: item?.epi?.nome ?? "EPI não identificado",
    tamanhoNome: item?.tamanho?.tamanho ?? "-",
  };
}

export function normalizarEntrega(item) {
  const itensOriginais = item?.itens ?? [];

  return {
    id: Number(item?.id ?? 0),
    idFuncionario: Number(item?.funcionario?.id ?? 0),
    // Tudo convertido para camelCase daqui para baixo!
    dataEntrega: item?.data_entrega ?? item?.dataEntrega ?? "",
    assinatura: item?.assinatura_digital ?? item?.assinaturaDigital ?? "",
    tokenValidacao: item?.token_validacao ?? item?.tokenValidacao ?? item?.token ?? "---",
    nomeFuncionario: item?.funcionario?.nome ?? item?.nome_funcionario ?? "",
    matriculaFuncionario: String(item?.funcionario?.matricula ?? item?.matricula_funcionario ?? ""),
    
    itens: Array.isArray(itensOriginais) 
      ? itensOriginais.map(normalizarItemEntrega) 
      : [],
  };
}

