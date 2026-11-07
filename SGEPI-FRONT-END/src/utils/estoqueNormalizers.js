// Lote de /entradas-estoque. O EPI aninhado vem em camelCase (validadeCa, alertaMinimo).
export function normalizarEntradaCompleta(item) {
  const preco = Number(item.valor_unitario); // decimal vem como string
  return {
    id: item.id,
    lote: item.lote,
    quantidadeInicial: item.quantidade_inicial,
    quantidadeAtual: item.quantidade_atual,
    preco,
    validade: item.data_validade,
    tamanho: item.tamanho.tamanho,
    nome: item.epi.nome,
    fabricante: item.epi.fabricante,
    ca: item.epi.ca,
    descricao: item.epi.descricao,
    alertaMinimo: item.epi.alertaMinimo,
    tipoProtecao: item.epi.protecao.nome,
    data_entrada: item.data_entrada,
    valorTotal: item.quantidade_atual * preco,
  };
}
