export function formatarDataEntrada(data) {
  if (!data) return "--";

  const texto = String(data).substring(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const dataObj = new Date(data);
  if (Number.isNaN(dataObj.getTime())) return "--";

  return dataObj.toLocaleDateString("pt-BR");
}

export function formatarMoedaEntrada(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarDataParaGo(dataISO) {
  if (!dataISO || dataISO === "" || typeof dataISO !== "string") {
    return null; 
  }

  if (!dataISO.includes("-")) return dataISO;

  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}
export const totalEntrada = (e) => Number(e.quantidade || 0) * Number(e.valor_unitario || 0);

// Completa cada entrada com nomes de EPI, tamanho e fornecedor das listas; o que faltar cai no que veio do back.
export function resolverEntradas(entradas, epis, tamanhos, fornecedores) {
  return entradas.map((entrada) => {
    const epi = epis.find((item) => item.id === entrada.IdEpi);
    const tamanho = tamanhos.find((t) => t.id === entrada.IdTamanho);
    const nomeBack = (entrada.fornecedor_nome_back || "").toLowerCase();
    const fornecedor = fornecedores.find(
      (f) =>
        (entrada.Idfornecedor > 0 && f.id === entrada.Idfornecedor) ||
        f.razao_social.toLowerCase() === nomeBack ||
        f.nome_fantasia.toLowerCase() === nomeBack
    );

    return {
      ...entrada,
      epiNome: epi?.nome || entrada.epi_nome_back || "EPI não identificado",
      epiFabricante: epi?.fabricante || entrada.epi_fabricante_back || "-",
      epiCA: entrada.epi_ca_back || epi?.ca || "-",
      tamanhoNome: tamanho?.tamanho || entrada.tamanho_nome_back || "S/T",
      fornecedorNome: fornecedor?.nome_fantasia || fornecedor?.razao_social || entrada.fornecedor_nome_back || "Fornecedor não identificado",
      usuario: entrada.usuario_entrada || "Usuário não identificado",
    };
  });
}
