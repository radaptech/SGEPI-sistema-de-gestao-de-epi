import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ModalTransferencia from "./ModalTransferencia";
import ListaTransferencias from "../ListaTransferencias";
import { api } from "../../services/api";

jest.mock("../../services/api", () => ({ api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
jest.mock("react-toastify", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  Element.prototype.scrollIntoView = () => {};
});

const unidades = [{ id: 1, nome: "Loja 1" }, { id: 2, nome: "Loja 2" }];
const lote = (id, quantidadeAtual, validade) => ({
  id, idEpi: 7, idTamanho: 3, nome: "Bota", tamanho: "42", quantidadeAtual, validade,
});

function escolher(rotulo, opcao) {
  fireEvent.click(screen.getByLabelText(rotulo));
  fireEvent.click(screen.getByRole("option", { name: opcao }));
}

test("soma os lotes dentro da validade, barra quantidade acima do saldo e envia da loja atual", async () => {
  api.post.mockResolvedValue({ id: 9 });
  const onSalvo = jest.fn();
  render(
    <ModalTransferencia
      origem={unidades[0]}
      unidades={unidades}
      lotes={[lote(1, 5, "01/01/2099"), lote(2, 4, "01/01/2098"), lote(3, 50, "01/01/2000")]}
      onClose={() => {}}
      onSalvo={onSalvo}
    />
  );

  expect(screen.getByText("Loja 1")).toBeInTheDocument(); // origem fixa
  escolher("Para", "Loja 2");
  escolher("EPI e tamanho", "Bota · 42 (9 em estoque)"); // o lote vencido não conta

  fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: "10" } });
  expect(screen.getByText("Escolha de 1 a 9.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Transferir" })).toBeDisabled();

  fireEvent.change(screen.getByLabelText("Quantidade"), { target: { value: "6" } });
  fireEvent.click(screen.getByRole("button", { name: "Transferir" }));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/transferencias", {
      id_unidade_origem: 1, id_unidade_destino: 2, observacao: "",
      itens: [{ id_epi: 7, id_tamanho: 3, quantidade: 6 }],
    })
  );
  await waitFor(() => expect(onSalvo).toHaveBeenCalled());
});

test("admin desfaz a transferência depois de confirmar na linha", async () => {
  api.get.mockResolvedValue([
    {
      id: 4, data: "09/11/2026", cancelada: false, observacao: "", usuario: "Ana",
      unidade_origem: unidades[0], unidade_destino: unidades[1],
      itens: [{ quantidade: 6, epi_nome: "Bota", tamanho_nome: "42", lote: "L-1" }],
    },
  ]);
  api.delete.mockResolvedValue(null);
  const onCancelada = jest.fn();
  render(<ListaTransferencias podeCancelar recarregar={0} onCancelada={onCancelada} />);

  fireEvent.click(await screen.findByRole("button", { name: /Desfazer/ }));
  expect(api.delete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar transferência" }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/gerencial/transferencias/4"));
  expect(await screen.findByText("(cancelada)")).toBeInTheDocument();
  expect(onCancelada).toHaveBeenCalled();
});
