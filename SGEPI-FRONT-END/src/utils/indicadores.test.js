import { calcularIndicadores, paraISO, precoMedioPorEpi, ultimosMeses } from "./indicadores";

test("datas e janela de meses", () => {
  expect(paraISO("07/11/2026")).toBe("2026-11-07");
  expect(paraISO("2026-11-07T00:00:00Z")).toBe("2026-11-07");
  expect(ultimosMeses(3, "2026-01-15")).toEqual(["2025-11", "2025-12", "2026-01"]);
});

test("preço médio ponderado", () => {
  const p = precoMedioPorEpi([
    { idEpi: 1, quantidade: 10, valor_unitario: 2 },
    { idEpi: 1, quantidade: 30, valor_unitario: 4 },
  ]);
  expect(p[1]).toBeCloseTo(3.5);
});

test("custo por mês, departamento, conformidade e cobertura", () => {
  const r = calcularIndicadores({
    hojeISO: "2026-11-07",
    meses: 3,
    epis: [{ id: 1, nome: "Luva", validade_ca: "20/12/2026" }, { id: 2, nome: "Bota", validade_ca: "01/01/2030" }],
    entradas: [
      { idEpi: 1, quantidade: 10, valor_unitario: 5, quantidadeAtual: 2 },
      { idEpi: 2, quantidade: 4, valor_unitario: 100, quantidadeAtual: 4 },
    ],
    entregas: [
      { id: 1, idFuncionario: 10, data_entrega: "05/11/2026" },
      { id: 2, idFuncionario: 11, data_entrega: "2026-10-20" },
      { id: 3, idFuncionario: 10, data_entrega: "01/01/2025" }, // fora da janela
    ],
    itensEntregues: [
      { idEntrega: 1, idEpi: 1, quantidade: 3 },
      { idEntrega: 2, idEpi: 2, quantidade: 1 },
      { idEntrega: 3, idEpi: 2, quantidade: 9 },
    ],
    funcionarios: [{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }],
    departamentoPorFuncionario: { 10: "Obra", 11: "Pátio" },
    faltasKit: [{ funcionario_id: 12 }, { funcionario_id: 12 }],
  });

  expect(r.serie.map((m) => m.mes)).toEqual(["2026-09", "2026-10", "2026-11"]);
  expect(r.mesAtual.custo).toBe(15);
  expect(r.mesAtual.entregas).toBe(1);
  expect(r.mesAnterior.custo).toBe(100);
  // entrega de 20/10 fica fora do intervalo 1–7 out
  expect(r.mesAnteriorAteHoje).toEqual({ rotulo: "1–7 out", custo: 0, entregas: 0 });
  expect(r.custoPorDepartamento).toEqual([{ nome: "Pátio", valor: 100 }, { nome: "Obra", valor: 15 }]);
  expect(r.episMaisEntregues[0]).toEqual({ nome: "Luva", valor: 3 });
  expect(r.conformidade).toBe(75); // 1 de 4 com falta
  expect(r.caProximos.map((c) => c.item)).toEqual(["Luva"]);
  // luva: 3 em 90 dias, saldo 2 -> 60 dias, não entra; bota: 1 em 90 dias, saldo 4 -> 360 dias
  expect(r.estoqueAcabando).toEqual([]);
});
