import { api } from "./api";
import { escolherUnidade } from "./unidadeAtual";

jest.mock("react-toastify", () => ({ toast: { error: jest.fn() } }));

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, headers: { get: () => "application/json" }, json: async () => [], text: async () => "[]" });
});

test("manda a loja escolhida no header X-Unidade-ID, e nada em 'todas'", async () => {
  await api.get("/entradas");
  expect(fetch.mock.calls[0][1].headers["X-Unidade-ID"]).toBeUndefined();

  escolherUnidade(2);
  await api.get("/entradas");
  expect(fetch.mock.calls[1][0]).toMatch(/\/entradas$/);
  expect(fetch.mock.calls[1][1].headers["X-Unidade-ID"]).toBe("2");
});
