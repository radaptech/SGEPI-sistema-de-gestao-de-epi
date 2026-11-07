export function normalizarFuncionario(item) {
  const entregas = Array.isArray(item?.entregas) ? item.entregas : [];
  const devolucoes = Array.isArray(item?.devolucoes) ? item.devolucoes : [];

  return {
    id: Number(item?.id ?? 0),
    nome: item?.nome ?? "",
    cpf: formatarCPF(item?.cpf), 
    matricula: String(item?.matricula ?? "-"),
    idFuncao: Number(item?.funcao?.id ?? 0),
    funcaoNome: item?.funcao?.cargo ?? "Sem função",
    idDepartamento: Number(item?.funcao?.departamento?.id ?? 0),
    departamentoNome: item?.funcao?.departamento?.departamento ?? "Sem departamento",
    entregas: entregas,
    devolucoes: devolucoes,
    totalEntregas: entregas.length,
    totalDevolucoes: devolucoes.length,
    ultimaMovimentacao: entregas.length > 0 
      ? formatarData(entregas[entregas.length - 1].data_entrega) 
      : "-"
  };
}

export function normalizarDepartamento(item) {
  return {
    id: Number(item?.id ?? 0),
    nome: item.departamento,
  };
}

export function normalizarFuncao(item) {
  return {
    id: Number(item?.id ?? 0),
    nome: item.cargo,
    idDepartamento: item.departamento.id,
  };
}

export function normalizarEntrega(item) {
  return {
    id: Number(item?.id ?? 0),
    data_entrega: formatarData(item?.data_entrega ?? item?.created_at),
    assinatura: item?.assinatura_digital ?? "",
    itens: Array.isArray(item?.itens) ? item.itens : []
  };
}

export function normalizarDevolucao(item) {
  return {
    id: Number(item?.id ?? 0),
    data_devolucao: formatarData(item?.data_devolucao ?? item?.created_at),
    assinatura: item?.assinatura_digital ?? "",
    itens: Array.isArray(item?.itens) ? item.itens : []
  };
}

// 👉 NOVA FUNÇÃO: Aplica a máscara 000.000.000-00 visualmente
export function formatarCPF(cpf) {
  if (!cpf) return "";

  // Remove qualquer coisa que não seja número
  const limpo = String(cpf).replace(/\D/g, "");

  // Se não tiver os 11 dígitos originais, devolve como veio sem tentar aplicar regex inválido
  if (limpo.length !== 11) {
    return String(cpf);
  }

  // Aplica a máscara padrão brasileira
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatarData(data) {
  if (!data) return "-";

  const valor = String(data).substring(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  
  if (data.includes("/")) {
    return data;
  }

  const dataObj = new Date(data);

  if (Number.isNaN(dataObj.getTime())) {
    return "-";
  }

  return dataObj.toLocaleDateString("pt-BR");
}