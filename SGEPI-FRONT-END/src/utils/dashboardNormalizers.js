// Normalizadores das rotas do dashboard (/epis-dashbord, /entradas-dashbord, /entregas-dashbord...).

// DD/MM/YYYY (formato de data da API) → YYYY-MM-DD, para comparar datas como texto
export function converterDataParaISO(dataBr) {
  if (!dataBr) return null;
  const [dia, mes, ano] = dataBr.split("/");
  return `${ano}-${mes}-${dia}`;
}

export function normalizarEpi(item) {
  return {
    id: item.id,
    nome: item.nome,
    alerta_minimo: item.alerta_minimo,
    ca: item.ca,
    validade_ca: item.validade_ca, // DD/MM/YYYY
    situacao_ca: item.situacao_ca, // situação na base do MTE (vazio se o CA não está nela)
  };
}

export function normalizarTamanho(item) {
  return { id: item.id, tamanho: item.tamanho };
}

export function normalizarFuncionario(item) {
  return { id: item.id, nome: item.nome, matricula: item.matricula };
}

export function normalizarEntrada(item) {
  return {
    id: item.id,
    idEpi: item.id_epi,
    idTamanho: item.id_tamanho,
    quantidadeAtual: item.quantidade_atual,
    quantidade: item.quantidade,
    valor_unitario: Number(item.valor_unitario), // decimal vem como string
    data_entrada: converterDataParaISO(item.data_entrada),
    lote: item.lote,
  };
}

export function normalizarItemEntregue(item) {
  return {
    id: item.id,
    idEntrega: item.id_entrega_cabecalho,
    idEpi: item.id_epi,
    idTamanho: item.id_tamanho,
    quantidade: item.quantidade,
  };
}

export function normalizarEntrega(item) {
  return { id: item.id, idFuncionario: item.id_funcionario, data_entrega: item.data_entrega };
}

export function normalizarDevolucao(item) {
  return { id: item.id, data_devolucao: converterDataParaISO(item.data_devolucao) };
}
