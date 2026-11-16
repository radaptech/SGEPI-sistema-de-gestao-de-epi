export function obterHojeISO() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Dias de hoje até uma data DD/MM/YYYY (negativo = já passou); null se a data for inválida
export function diasAte(dataBR) {
  const [dia, mes, ano] = String(dataBR || "").split("/").map(Number);
  if (!ano) return null;
  const [anoH, mesH, diaH] = obterHojeISO().split("-").map(Number);
  return Math.round((Date.UTC(ano, mes - 1, dia) - Date.UTC(anoH, mesH - 1, diaH)) / 86400000);
}

export function formatarData(data) {
  if (!data) return "--";
  const valor = String(data).substring(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const dataObj = new Date(data);
  if (Number.isNaN(dataObj.getTime())) return "--";

  return dataObj.toLocaleDateString("pt-BR");
}

export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}