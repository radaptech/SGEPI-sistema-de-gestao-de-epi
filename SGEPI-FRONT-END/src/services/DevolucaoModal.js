// Normalizadores do modal de devolução (ModalBaixa), no formato que a API devolve.

export function normalizarFuncionario(item) {
  return { id: item.id, nome: item.nome, matricula: item.matricula };
}

// /epis e /funcionarios/:id/epis; só a segunda traz saldo_atual (quanto o funcionário tem em posse)
export function normalizarEpi(item) {
  return { id: item.id, nome: item.nome, tamanhos: item.tamanhos ?? [], saldo_atual: item.saldo_atual ?? 0 };
}

export function normalizarTamanho(item) {
  return { id: item.id, tamanho: item.tamanho };
}

export function normalizarMotivo(item) {
  return { id: item.id, nome: item.motivo };
}
