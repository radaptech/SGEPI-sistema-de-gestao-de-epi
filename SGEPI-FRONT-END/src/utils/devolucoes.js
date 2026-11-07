// A API manda datas em DD/MM/YYYY; aceita também YYYY-MM-DD (valor de <input type="date">).
export function formatarData(data) {
  if (!data) return "--";
  if (data.includes("/")) return data.substring(0, 10);

  const [ano, mes, dia] = data.substring(0, 10).split("-");
  return dia ? `${dia}/${mes}/${ano}` : data;
}
