// Lote de /entradas-estoque.
export function normalizarEntradaCompleta(item) {
  const preco = Number(item.valor_unitario); // decimal vem como string
  return {
    id: item.id,
    lote: item.lote,
    quantidadeInicial: item.quantidade_inicial,
    quantidadeAtual: item.quantidade_atual,
    preco,
    validade: item.data_validade,
    idTamanho: item.tamanho.id,
    tamanho: item.tamanho.tamanho,
    idEpi: item.epi.id,
    nome: item.epi.nome,
    fabricante: item.epi.fabricante,
    ca: item.epi.ca,
    descricao: item.epi.descricao,
    alertaMinimo: item.epi.alerta_minimo,
    tipoProtecao: item.epi.protecao.nome,
    data_entrada: item.data_entrada,
    valorTotal: item.quantidade_atual * preco,
  };
}
