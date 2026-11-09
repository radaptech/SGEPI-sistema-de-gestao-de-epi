import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SeletorUnidade from "./SeletorUnidade";
import { api } from "../services/api";
import { escolherUnidade, unidadeAtual } from "../services/unidadeAtual";

jest.mock("../services/api", () => ({ api: { get: jest.fn() } }));

const recarregar = jest.fn();
beforeAll(() => {
  Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, reload: recarregar } });
});
beforeEach(() => {
  Element.prototype.scrollIntoView = () => {};
  localStorage.clear();
  recarregar.mockClear();
});

const duas = [{ id: 1, nome: "Loja 1" }, { id: 2, nome: "Loja 2" }];

test("com uma unidade só, não aparece", async () => {
  api.get.mockResolvedValue([{ id: 1, nome: "Principal" }]);
  const { container } = render(<SeletorUnidade />);
  await waitFor(() => expect(api.get).toHaveBeenCalled());
  expect(container).toBeEmptyDOMElement();
});

test("escolher uma loja guarda no navegador e recarrega", async () => {
  api.get.mockResolvedValue(duas);
  render(<SeletorUnidade />);
  fireEvent.click(await screen.findByLabelText("Unidade"));
  fireEvent.click(screen.getByRole("option", { name: "Loja 2" }));
  expect(unidadeAtual()).toBe("2");
  expect(recarregar).toHaveBeenCalledTimes(1);
});

test("dá para voltar para todas as unidades", async () => {
  escolherUnidade(2);
  api.get.mockResolvedValue(duas);
  render(<SeletorUnidade />);
  fireEvent.click(await screen.findByLabelText("Unidade"));
  fireEvent.click(screen.getByRole("option", { name: "Todas as unidades" }));
  expect(unidadeAtual()).toBe("");
  expect(recarregar).toHaveBeenCalledTimes(1);
});

test("loja guardada que foi desativada volta para todas", async () => {
  escolherUnidade(9);
  api.get.mockResolvedValue(duas);
  render(<SeletorUnidade />);
  await waitFor(() => expect(recarregar).toHaveBeenCalledTimes(1));
  expect(unidadeAtual()).toBe("");
});
