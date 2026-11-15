import { fireEvent, render, screen } from "@testing-library/react";
import ModalEntrada from "./ModalEntrada";
import { api } from "../../services/api";
import { listar } from "../../services/listas";
import * as entradaService from "../../services/entradaService";

vi.mock("../../services/api", () => ({ api: { get: vi.fn() } }));
vi.mock("../../services/listas", () => ({ listar: vi.fn() }));
vi.mock("../../services/entradaService", () => ({
  listarEpis: vi.fn(),
  listarFornecedores: vi.fn(),
  listarTamanhos: vi.fn(),
  criarEntrada: vi.fn(),
}));

// o CRA zera os mocks entre os testes (resetMocks), então os retornos vão aqui
beforeEach(() => {
  Element.prototype.scrollIntoView = () => {};
  listar.mockResolvedValue([]);
  entradaService.listarEpis.mockResolvedValue([]);
  entradaService.listarFornecedores.mockResolvedValue([]);
  entradaService.listarTamanhos.mockResolvedValue([]);
});

test("com uma unidade, não pede a unidade", async () => {
  api.get.mockResolvedValue([{ id: 1, nome: "Principal" }]);
  render(<ModalEntrada onClose={() => {}} />);
  await screen.findByText("Selecione o fornecedor...");
  expect(screen.queryByLabelText(/Unidade/)).toBeNull();
});

test("com duas unidades, a unidade é obrigatória", async () => {
  api.get.mockResolvedValue([{ id: 1, nome: "Loja 1" }, { id: 2, nome: "Loja 2" }]);
  render(<ModalEntrada onClose={() => {}} />);
  expect(await screen.findByLabelText(/Unidade/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /finalizar/i }));
  expect(screen.getByText("Escolha em qual unidade o material vai entrar.")).toBeInTheDocument();
});
