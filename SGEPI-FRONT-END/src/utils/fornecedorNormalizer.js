export function normalizarFornecedor(item) {
  return {
    id: item.id,
    razao_social: item.razao_social,
    nome_fantasia: item.nome_fantasia,
    cnpj: item.cnpj,
    inscricao_estadual: item.inscricao_estadual,
  };
}
