// Formatos de /fornecedores, /epis, /tamanhos e /entradas.

export function normalizarFornecedorEntrada(item) {
  return { id: item.id, razao_social: item.razao_social, nome_fantasia: item.nome_fantasia };
}

export function normalizarEpiEntrada(item) {
  return { id: item.id, nome: item.nome, ca: item.ca, fabricante: item.fabricante, tamanhos: item.tamanhos ?? [] };
}

export function normalizarTamanhoEntrada(item) {
  return { id: item.id, tamanho: item.tamanho };
}

export function normalizarEntrada(item) {
  return {
    id: item.id,
    Idfornecedor: item.id_fornecedor,
    IdEpi: item.id_epi,
    IdTamanho: item.id_tamanho,
    epi_nome_back: item.epi.nome,
    epi_ca_back: item.epi.ca,
    epi_fabricante_back: item.epi.fabricante,
    tamanho_nome_back: item.tamanho.tamanho,
    fornecedor_nome_back: item.fornecedor.nome_fantasia || item.fornecedor.razao_social,
    data_entrada: item.data_entrada,
    quantidade: item.quantidade,
    quantidade_atual: item.quantidade_atual,
    lote: item.lote,
    valor_unitario: Number(item.valor_unitario), // decimal vem como string
    nota_fiscal_numero: item.nota_fiscal_numero,
    nota_fiscal_serie: item.nota_fiscal_serie,
    usuario_entrada: item.usuario,
  };
}
