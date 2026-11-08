function converterParaData(dataString) {
  if (!dataString) return null;
  if (dataString.includes("/")) {
    const [dia, mes, ano] = dataString.split("/");
    return new Date(`${ano}-${mes}-${dia}T00:00:00`);
  }
  return new Date(dataString);
}


export function formatarValidade(dataString) {
  if (!dataString) return "--";

  const data = converterParaData(dataString);
  if (Number.isNaN(data.getTime())) return "--";

  return data.toLocaleDateString("pt-BR");
}

export function formatarPreco(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

export function calcularStatusValidade(dataString) {
  if (!dataString) return "normal";

  const hoje = new Date();
  const validade = converterParaData(dataString);

  hoje.setHours(0, 0, 0, 0);
  validade.setHours(0, 0, 0, 0);

  if (Number.isNaN(validade.getTime())) return "normal";

  const diffMs = validade.getTime() - hoje.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "vencido";
  if (diffDias <= 30) return "proximo";
  return "normal";
}

export function getStatusColor(quantidadeAtual, alertaMinimo) {
  if (quantidadeAtual <= 0) {
    return "bg-erro-soft text-erro border-erro-line";
  }

  if (quantidadeAtual <= Number(alertaMinimo || 0)) {
    return "bg-atencao-soft text-atencao border-atencao-line";
  }

  return "bg-ok-soft text-ok border-ok-line";
}

export function getStatusTexto(quantidadeAtual, alertaMinimo) {
  if (quantidadeAtual <= 0) return "Sem estoque";
  if (quantidadeAtual <= Number(alertaMinimo || 0)) return "Estoque baixo";
  return "Normal";
}

export function getValidadeBadge(status) {
  if (status === "vencido") {
    return "bg-erro-soft text-erro border-erro-line";
  }

  if (status === "proximo") {
    return "bg-atencao-soft text-atencao border-atencao-line";
  }

  return "bg-sunken text-ink border-line";
}

export function getValidadeTexto(status) {
  if (status === "vencido") return "Vencido";
  if (status === "proximo") return "Próx. venc.";
  return "Regular";
}