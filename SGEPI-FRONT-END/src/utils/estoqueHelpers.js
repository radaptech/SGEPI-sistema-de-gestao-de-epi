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

// vencido | proximo (vence em até diasAlerta dias) | normal
export function calcularStatusValidade(dataString, diasAlerta = 30) {
  if (!dataString) return "normal";

  const hoje = new Date();
  const validade = converterParaData(dataString);

  hoje.setHours(0, 0, 0, 0);
  validade.setHours(0, 0, 0, 0);

  if (Number.isNaN(validade.getTime())) return "normal";

  const diffMs = validade.getTime() - hoje.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return "vencido";
  if (diffDias <= diasAlerta) return "proximo";
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

const qtd = (item) => Number(item.quantidadeAtual || 0);
const baixo = (item) => qtd(item) > 0 && qtd(item) <= Number(item.alertaMinimo || 0);

// dd/mm/aaaa ou ISO -> timestamp; sem data vai para o fim
function timestamp(data) {
  if (!data || data === "-") return 0;
  if (data.includes("/")) {
    const [dia, mes, ano] = data.split("/");
    return new Date(ano, mes - 1, dia).getTime();
  }
  return new Date(data).getTime();
}

// Filtro da tela de estoque. filtro é o campo escolhido; alguns têm regra própria:
// logica_estoque (baixo | vazio | disponivel), status_validade (vencido | proximo | normal),
// data_entrada (aaaa-mm-dd do input date). Os demais procuram o texto no campo do lote.
export function filtrarEstoque(lotes, filtro, busca) {
  const termo = busca.toLowerCase().trim();
  if (!termo) return lotes;

  return lotes.filter((item) => {
    if (filtro === "logica_estoque") {
      if (termo === "baixo") return baixo(item);
      if (termo === "vazio") return qtd(item) <= 0;
      if (termo === "disponivel") return qtd(item) > 0;
      return true;
    }
    if (filtro === "status_validade") {
      const status = calcularStatusValidade(item.validade);
      return termo === "em_dia" ? status === "normal" : status === termo;
    }
    if (filtro === "data_entrada") {
      const partes = (item.data_entrada || "").split("/");
      return partes.length === 3 && `${partes[2]}-${partes[1]}-${partes[0]}` === termo;
    }
    return String(item[filtro] ?? "").toLowerCase().includes(termo);
  });
}

// mais recentes primeiro; na mesma data, por nome
export function ordenarPorEntrada(lotes) {
  return [...lotes].sort((a, b) => timestamp(b.data_entrada) - timestamp(a.data_entrada) || (a.nome || "").localeCompare(b.nome || ""));
}

export function resumirEstoque(lotes) {
  return {
    totalLotes: lotes.length,
    totalItens: lotes.reduce((acc, item) => acc + qtd(item), 0),
    estoqueBaixo: lotes.filter(baixo).length,
    semEstoque: lotes.filter((item) => qtd(item) <= 0).length,
    valorTotal: lotes.reduce((acc, item) => acc + Number(item.valorTotal || 0), 0),
  };
}
