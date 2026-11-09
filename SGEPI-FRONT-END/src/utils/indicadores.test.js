import { calcularIndicadores, estoqueBaixo, indicadoresPorUnidade, paraISO, precoMedioPorEpi, ultimosMeses } from "./indicadores";

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

test("estoque baixo soma os lotes por unidade, EPI e tamanho", () => {
  const epis = [{ id: 1, alerta_minimo: 5 }, { id: 2, alerta_minimo: 0 }];
  const r = estoqueBaixo(
    [
      { idUnidade: 1, idEpi: 1, idTamanho: 9, quantidadeAtual: 3 },
      { idUnidade: 1, idEpi: 1, idTamanho: 9, quantidadeAtual: 3 }, // 6 na Loja 1: acima do mínimo
      { idUnidade: 2, idEpi: 1, idTamanho: 9, quantidadeAtual: 4 }, // 4 na Loja 2: baixo
      { idUnidade: 2, idEpi: 1, idTamanho: 8, quantidadeAtual: 0 }, // acabou: entra
      { idUnidade: 2, idEpi: 2, idTamanho: 9, quantidadeAtual: 0 }, // sem mínimo configurado
    ],
    epis
  );
  expect(r.map((s) => s.id)).toEqual(["2-1-8", "2-1-9"]);
});

test("visão da rede: custo, kit e estoque baixo por unidade", () => {
  const r = indicadoresPorUnidade({
    hojeISO: "2026-11-07",
    meses: 3,
    unidades: [{ id: 1, nome: "Loja 1" }, { id: 2, nome: "Loja 2" }, { id: 3, nome: "Loja 3" }],
    epis: [{ id: 1, alerta_minimo: 5 }],
    entradas: [
      { idUnidade: 1, idEpi: 1, idTamanho: 9, quantidade: 10, valor_unitario: 10, quantidadeAtual: 8 },
      { idUnidade: 2, idEpi: 1, idTamanho: 9, quantidade: 10, valor_unitario: 10, quantidadeAtual: 2 },
    ],
    entregas: [
      { id: 1, idUnidade: 1, data_entrega: "05/11/2026" },
      { id: 2, idUnidade: 2, data_entrega: "01/10/2026" },
      { id: 3, idUnidade: 2, data_entrega: "01/01/2025" }, // fora do período
    ],
    itensEntregues: [
      { idEntrega: 1, idEpi: 1, quantidade: 1 },
      { idEntrega: 2, idEpi: 1, quantidade: 4 },
      { idEntrega: 3, idEpi: 1, quantidade: 50 },
    ],
    funcionarios: [{ id: 10, idUnidade: 1 }, { id: 11, idUnidade: 1 }, { id: 12, idUnidade: 2 }],
    faltasKit: [{ funcionario_id: 11 }, { funcionario_id: 11 }],
  });

  expect(r).toEqual([
    { id: 2, nome: "Loja 2", custo: 40, funcionarios: 1, comFalta: 0, estoqueBaixo: 1, conformidade: 100 },
    { id: 1, nome: "Loja 1", custo: 10, funcionarios: 2, comFalta: 1, estoqueBaixo: 0, conformidade: 50 },
    { id: 3, nome: "Loja 3", custo: 0, funcionarios: 0, comFalta: 0, estoqueBaixo: 0, conformidade: null },
  ]);
});
