import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AbaUnidades from "./AbaUnidades";
import { api } from "../../services/api";

jest.mock("../../services/api", () => ({ api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }));
jest.mock("react-toastify", () => ({ toast: { success: jest.fn(), warning: jest.fn(), error: jest.fn() } }));

const principal = { id: 1, nome: "Principal", funcionarios: 62, saldo: 1844 };
const vazia = { id: 2, nome: "Loja Centro", funcionarios: 0, saldo: 0 };

beforeEach(() => jest.clearAllMocks());

test("com uma unidade só, nada pode ser desativado", async () => {
  api.get.mockResolvedValue([principal]);
  render(<AbaUnidades />);
  const botao = await screen.findByRole("button", { name: "Desativar Principal" });
  expect(botao).toBeDisabled();
  expect(botao).toHaveAttribute("title", "A empresa precisa ter pelo menos uma unidade.");
  expect(screen.getByText("1 unidade")).toBeInTheDocument();
});

test("bloqueia a unidade com estoque e desativa a vazia depois de confirmar na linha", async () => {
  api.get.mockResolvedValueOnce([principal, vazia]).mockResolvedValueOnce([principal]);
  api.delete.mockResolvedValue(null);
  render(<AbaUnidades />);

  expect(await screen.findByRole("button", { name: "Desativar Principal" })).toHaveAttribute(
    "title",
    "Tem estoque e funcionários. Transfira antes de desativar."
  );

  fireEvent.click(screen.getByRole("button", { name: "Desativar Loja Centro" }));
  expect(api.delete).not.toHaveBeenCalled(); // primeiro pede confirmação
  expect(screen.getByText(/Desativar "Loja Centro"\?/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Desativar" }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/gerencial/unidades/2"));
  await waitFor(() => expect(screen.queryByText("Loja Centro")).toBeNull());
});

test("cadastra com o nome sem espaços e recusa nome curto sem chamar a API", async () => {
  api.get.mockResolvedValue([principal]);
  api.post.mockResolvedValue({ id: 3, nome: "Obra Norte" });
  render(<AbaUnidades />);
  await screen.findByText("Principal");

  const campo = screen.getByLabelText("Nova unidade");
  fireEvent.change(campo, { target: { value: "O" } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
  expect(screen.getByText("Digite um nome com pelo menos 2 letras.")).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();

  fireEvent.change(campo, { target: { value: "  Obra Norte " } });
  fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/gerencial/unidades", { nome: "Obra Norte" }));
});

test("renomeia na própria linha", async () => {
  api.get.mockResolvedValue([principal]);
  api.patch.mockResolvedValue(null);
  render(<AbaUnidades />);

  fireEvent.click(await screen.findByRole("button", { name: "Renomear Principal" }));
  fireEvent.change(screen.getByLabelText("Novo nome de Principal"), { target: { value: "Matriz" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar nome" }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/gerencial/unidades/1", { nome: "Matriz" }));
});
