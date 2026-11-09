// Contas da aba Indicadores do dashboard, feitas no front com as listas que já chegam.
// ponytail: tudo calculado no navegador a partir das listas completas; quando o volume
// crescer, trocar por um endpoint /dashboard/indicadores com as somas em SQL.

import { diasAte, obterHojeISO } from "./dashboardFormatters";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "DD/MM/YYYY" ou ISO -> "YYYY-MM-DD"
export function paraISO(data) {
  const s = String(data || "");
  if (s.includes("/")) {
    const [d, m, a] = s.slice(0, 10).split("/");
    return a ? `${a}-${m}-${d}` : "";
  }
  return s.slice(0, 10);
}

export function rotuloMes(anoMes) {
  const [ano, mes] = anoMes.split("-");
  return `${MESES[Number(mes) - 1]}/${ano.slice(2)}`;
}

// Os últimos `n` meses terminando no mês de `hojeISO`, do mais antigo ao atual: ["2026-06", ...]
export function ultimosMeses(n, hojeISO = obterHojeISO()) {
  const [ano, mes] = hojeISO.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

// Preço médio ponderado de entrada por EPI: Σ(qtd × valor) / Σ qtd
export function precoMedioPorEpi(entradas) {
  const soma = {};
  for (const e of entradas) {
    const qtd = Number(e.quantidade || 0);
    const valor = Number(e.valor_unitario || 0);
    if (!qtd || !valor) continue;
    const id = Number(e.idEpi);
    soma[id] ??= { qtd: 0, total: 0 };
    soma[id].qtd += qtd;
    soma[id].total += qtd * valor;
  }
  return Object.fromEntries(Object.entries(soma).map(([id, s]) => [id, s.total / s.qtd]));
}

// Estoque no alerta mínimo do EPI ou abaixo, por unidade, EPI e tamanho. Soma os lotes: o mínimo
// vale para o que a loja tem daquele tamanho, não para cada lote. Saldo zero também entra (acabou).
export function estoqueBaixo(entradas, epis) {
  const minimo = Object.fromEntries(epis.map((e) => [Number(e.id), Number(e.alerta_minimo || 0)]));
  const saldo = {};
  for (const e of entradas) {
    const idEpi = Number(e.idEpi);
    if (!minimo[idEpi]) continue;
    const k = `${e.idUnidade}-${idEpi}-${e.idTamanho}`;
    saldo[k] ??= { id: k, idUnidade: Number(e.idUnidade), idEpi, idTamanho: Number(e.idTamanho), quantidade: 0, alertaMinimo: minimo[idEpi] };
    saldo[k].quantidade += Number(e.quantidadeAtual || 0);
  }
  return Object.values(saldo)
    .filter((s) => s.quantidade <= s.alertaMinimo)
    .sort((a, b) => a.quantidade - b.quantidade);
}

// Visão da rede (Fase 8 do PLANO-UNIDADES): custo no período, kit completo e estoque baixo de cada
// unidade, da que mais gasta para a que menos gasta. As listas precisam vir de "Todas as unidades".
export function indicadoresPorUnidade({
  unidades = [],
  entregas = [],
  itensEntregues = [],
  entradas = [],
  epis = [],
  funcionarios = [],
  faltasKit = [],
  meses = 12,
  hojeISO = obterHojeISO(),
}) {
  const preco = precoMedioPorEpi(entradas);
  const noPeriodo = new Set(ultimosMeses(meses, hojeISO));
  const entregaPorId = Object.fromEntries(entregas.map((e) => [String(e.id), e]));
  const linhas = Object.fromEntries(
    unidades.map((u) => [Number(u.id), { id: Number(u.id), nome: u.nome, custo: 0, funcionarios: 0, comFalta: 0, estoqueBaixo: 0 }])
  );

  for (const item of itensEntregues) {
    const entrega = entregaPorId[String(item.idEntrega)];
    const linha = linhas[Number(entrega?.idUnidade)];
    const data = paraISO(entrega?.data_entrega);
    if (!linha || !noPeriodo.has(data.slice(0, 7)) || data > hojeISO) continue;
    linha.custo += Number(item.quantidade || 0) * (preco[Number(item.idEpi)] ?? 0);
  }

  const unidadeDoFuncionario = {};
  for (const f of funcionarios) {
    unidadeDoFuncionario[Number(f.id)] = Number(f.idUnidade);
    if (linhas[Number(f.idUnidade)]) linhas[Number(f.idUnidade)].funcionarios += 1;
  }
  for (const id of new Set(faltasKit.map((f) => Number(f.funcionario_id)))) {
    const linha = linhas[unidadeDoFuncionario[id]];
    if (linha) linha.comFalta += 1;
  }
  for (const s of estoqueBaixo(entradas, epis)) {
    if (linhas[s.idUnidade]) linhas[s.idUnidade].estoqueBaixo += 1;
  }

  return Object.values(linhas)
    .map((l) => ({ ...l, conformidade: l.funcionarios ? Math.round(((l.funcionarios - l.comFalta) / l.funcionarios) * 100) : null }))
    .sort((a, b) => b.custo - a.custo || a.nome.localeCompare(b.nome));
}

function topN(mapa, n) {
  const linhas = Object.entries(mapa)
    .map(([nome, valor]) => ({ nome, valor }))
    .filter((l) => l.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  if (linhas.length <= n) return linhas;
  const resto = linhas.slice(n - 1).reduce((s, l) => s + l.valor, 0);
  return [...linhas.slice(0, n - 1), { nome: "Outros", valor: resto, outros: true }];
}

export function calcularIndicadores({
  entregas = [],
  itensEntregues = [],
  entradas = [],
  epis = [],
  funcionarios = [],
  departamentoPorFuncionario = {},
  faltasKit = [],
  meses = 12,
  hojeISO = obterHojeISO(),
}) {
  const preco = precoMedioPorEpi(entradas);
  const nomeEpi = Object.fromEntries(epis.map((e) => [Number(e.id), e.nome]));
  const entregaPorId = Object.fromEntries(entregas.map((e) => [String(e.id), e]));

  const janela = ultimosMeses(meses, hojeISO);
  const noPeriodo = new Set(janela);
  const mesAtual = janela[janela.length - 1];
  const mesAnterior = ultimosMeses(2, hojeISO)[0];

  const porMes = Object.fromEntries(
    [...new Set([...janela, mesAnterior])].map((m) => [m, { custo: 0, entregas: new Set(), itens: 0 }])
  );
  // mês em andamento x os mesmos dias do mês anterior (comparar 7 dias com 30 engana)
  const diaHoje = Number(hojeISO.slice(8, 10));
  const anteriorAteHoje = { custo: 0, entregas: new Set() };
  const custoDepartamento = {};
  const qtdEpi = {};
  let itensSemPreco = 0;

  // consumo dos últimos 90 dias, para a cobertura do estoque
  const inicio90 = new Date(`${hojeISO}T00:00:00Z`);
  inicio90.setUTCDate(inicio90.getUTCDate() - 90);
  const corte90 = inicio90.toISOString().slice(0, 10);
  const consumo90 = {};

  for (const item of itensEntregues) {
    const entrega = entregaPorId[String(item.idEntrega)];
    if (!entrega) continue;
    const data = paraISO(entrega.data_entrega);
    const mes = data.slice(0, 7);
    const idEpi = Number(item.idEpi);
    const qtd = Number(item.quantidade || 0);
    const custo = qtd * (preco[idEpi] ?? 0);
    if (preco[idEpi] === undefined) itensSemPreco += 1;

    if (data >= corte90 && data <= hojeISO) consumo90[idEpi] = (consumo90[idEpi] ?? 0) + qtd;

    if (mes === mesAnterior && Number(data.slice(8, 10)) <= diaHoje) {
      anteriorAteHoje.custo += custo;
      anteriorAteHoje.entregas.add(String(entrega.id));
    }

    if (porMes[mes]) {
      porMes[mes].custo += custo;
      porMes[mes].entregas.add(String(entrega.id));
      porMes[mes].itens += qtd;
    }
    if (!noPeriodo.has(mes)) continue;

    const depto = departamentoPorFuncionario[Number(entrega.idFuncionario)] || "Sem departamento";
    custoDepartamento[depto] = (custoDepartamento[depto] ?? 0) + custo;
    const nome = nomeEpi[idEpi] || `EPI #${idEpi}`;
    qtdEpi[nome] = (qtdEpi[nome] ?? 0) + qtd;
  }

  const serie = janela.map((m) => ({
    mes: m,
    rotulo: rotuloMes(m),
    custo: porMes[m].custo,
    entregas: porMes[m].entregas.size,
    itens: porMes[m].itens,
    parcial: m === mesAtual,
  }));

  // Conformidade do kit: funcionários sem nenhuma falta no /faltas-kit
  const totalFuncionarios = funcionarios.length;
  const comFalta = new Set(faltasKit.map((f) => Number(f.funcionario_id))).size;
  const conformidade = totalFuncionarios ? Math.round(((totalFuncionarios - comFalta) / totalFuncionarios) * 100) : null;

  // O que vem pela frente: CA vencendo em 90 dias (ou já bloqueado) e estoque que acaba em até 30 dias
  const caProximos = epis
    .map((e) => ({
      id: `ca-${e.id}`,
      item: e.nome,
      ca: e.ca,
      dias: diasAte(e.validade_ca),
      bloqueado: ["CANCELADO", "SUSPENSO"].includes(e.situacao_ca) ? e.situacao_ca : null,
    }))
    .filter((c) => c.bloqueado || (c.dias !== null && c.dias <= 90))
    .sort((a, b) => Boolean(b.bloqueado) - Boolean(a.bloqueado) || a.dias - b.dias);

  const saldo = {};
  for (const e of entradas) saldo[Number(e.idEpi)] = (saldo[Number(e.idEpi)] ?? 0) + Number(e.quantidadeAtual || 0);
  const estoqueAcabando = Object.entries(consumo90)
    .map(([id, qtd]) => {
      const porDia = qtd / 90;
      return { id: `est-${id}`, item: nomeEpi[id] || `EPI #${id}`, saldo: saldo[id] ?? 0, dias: Math.floor((saldo[id] ?? 0) / porDia) };
    })
    .filter((l) => l.dias <= 30)
    .sort((a, b) => a.dias - b.dias);

  return {
    serie,
    mesAtual: { mes: mesAtual, rotulo: rotuloMes(mesAtual), custo: porMes[mesAtual].custo, entregas: porMes[mesAtual].entregas.size },
    mesAnterior: { mes: mesAnterior, rotulo: rotuloMes(mesAnterior), custo: porMes[mesAnterior].custo, entregas: porMes[mesAnterior].entregas.size },
    // mesmo intervalo do mês atual (dia 1 até o dia de hoje) no mês anterior
    mesAnteriorAteHoje: {
      rotulo: `1–${diaHoje} ${MESES[Number(mesAnterior.slice(5, 7)) - 1]}`,
      custo: anteriorAteHoje.custo,
      entregas: anteriorAteHoje.entregas.size,
    },
    conformidade,
    totalFuncionarios,
    funcionariosComFalta: comFalta,
    custoPorDepartamento: topN(custoDepartamento, 8),
    episMaisEntregues: topN(qtdEpi, 8),
    caProximos,
    estoqueAcabando,
    itensSemPreco,
  };
}
