// Formatos de /funcionarios, /epis, /tamanhos-id-epi/:id e /entregas.

export function normalizarFuncionarioEntrega(item) {
  return { id: item.id, nome: item.nome, matricula: item.matricula, funcaoId: item.funcao?.id };
}

export function normalizarEpiEntrega(item) {
  return { id: item.id, nome: item.nome };
}

// /tamanhos-id-epi/:id traz o saldo do tamanho em estoque
export function normalizarTamanhoEntrega(item) {
  return { id: item.id, tamanho: item.tamanho, saldo_atual: item.quantidade_atual };
}

function normalizarItemEntrega(item) {
  return {
    id: item.id,
    idEpi: item.epi.id,
    idTamanho: item.tamanho.id,
    quantidade: item.quantidade,
    epiNome: item.epi.nome,
    tamanhoNome: item.tamanho.tamanho,
  };
}

export function normalizarEntrega(item) {
  return {
    id: item.id,
    dataEntrega: item.data_entrega, // DD/MM/YYYY
    assinatura: item.assinatura_digital,
    tokenValidacao: item.token_validacao,
    funcionario: { id: item.funcionario.id, nome: item.funcionario.nome, matricula: item.funcionario.matricula },
    itens: (item.itens ?? []).map(normalizarItemEntrega),
  };
}
