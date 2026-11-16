import { filtrarEstoque, ordenarPorEntrada, resumirEstoque } from "./estoqueHelpers";

const lote = (nome, quantidadeAtual, data_entrada, extra = {}) => ({ nome, quantidadeAtual, alertaMinimo: 5, data_entrada, valorTotal: 10, ...extra });
const lotes = [lote("Luva", 0, "01/02/2026"), lote("Bota", 3, "10/03/2026"), lote("Capacete", 20, "10/03/2026", { lote: "L-9" })];

test("filtra por estoque, data de entrada e texto do campo", () => {
  const nomes = (l) => l.map((i) => i.nome);
  expect(nomes(filtrarEstoque(lotes, "logica_estoque", "vazio"))).toEqual(["Luva"]);
  expect(nomes(filtrarEstoque(lotes, "logica_estoque", "baixo"))).toEqual(["Bota"]);
  expect(nomes(filtrarEstoque(lotes, "logica_estoque", "disponivel"))).toEqual(["Bota", "Capacete"]);
  expect(nomes(filtrarEstoque(lotes, "data_entrada", "2026-02-01"))).toEqual(["Luva"]);
  expect(nomes(filtrarEstoque(lotes, "lote", "l-9"))).toEqual(["Capacete"]);
  expect(filtrarEstoque(lotes, "nome", "  ")).toBe(lotes);
});

test("ordena da entrada mais recente para a mais antiga, depois por nome", () => {
  expect(ordenarPorEntrada(lotes).map((i) => i.nome)).toEqual(["Bota", "Capacete", "Luva"]);
});

test("resume o estoque", () => {
  expect(resumirEstoque(lotes)).toEqual({ totalLotes: 3, totalItens: 23, estoqueBaixo: 1, semEstoque: 1, valorTotal: 30 });
});
