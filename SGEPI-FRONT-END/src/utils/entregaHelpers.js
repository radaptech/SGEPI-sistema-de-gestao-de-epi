export function validarQuantidade(valor) {
  const numero = Number(valor);
  return !Number.isNaN(numero) && numero > 0;
}

export function montarItemEntrega(
  item,
  epiSelecionadoObj,
  tamanhoSelecionadoObj
) {
  return {
    id: Date.now() + Math.random(),
    idEpi: Number(item.idEpi),
    idTamanho: Number(item.idTamanho),
    quantidade: Number(item.quantidade),
    epiNome: epiSelecionadoObj?.nome || "EPI",
    tamanhoNome: tamanhoSelecionadoObj?.tamanho || "-",
  };
}