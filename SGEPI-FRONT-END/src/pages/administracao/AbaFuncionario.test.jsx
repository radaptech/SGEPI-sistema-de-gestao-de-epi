import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import AbaFuncionarios from "./AbaFuncionario";
import { api } from "../../services/api";

jest.mock("../../services/api", () => ({ api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }));

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
});

const funcao = { id: 7, cargo: "Soldador", departamento: { id: 3, departamento: "Produção" } };
const ana = { id: 1, nome: "Ana", matricula: 1, cpf: "11111111111", funcao, unidade: { id: 10, nome: "Principal" } };
const bruno = { id: 2, nome: "Bruno", matricula: 2, cpf: "22222222222", funcao, unidade: { id: 20, nome: "Loja Centro" } };

function respostas(unidades) {
  api.get.mockImplementation((rota) =>
    Promise.resolve(
      {
        "/funcionarios": { funcionarios: [ana, bruno] },
        "/departamentos": { departamentos: [funcao.departamento] },
        "/funcoes": { funcoes: [funcao] },
        "/unidades": unidades,
      }[rota]
    )
  );
}

const tabela = () => screen.getAllByRole("table")[0];

beforeEach(() => jest.clearAllMocks());

test("com uma unidade só, a unidade não aparece em lugar nenhum", async () => {
  respostas([{ id: 10, nome: "Principal" }]);
  render(<AbaFuncionarios />);
  await within(tabela()).findByText("Bruno");
  expect(within(tabela()).queryByText("Unidade")).toBeNull();
  expect(screen.queryByLabelText("Filtrar por unidade")).toBeNull();
});

test("com duas unidades, mostra a coluna, filtra e muda o funcionário de unidade", async () => {
  respostas([{ id: 10, nome: "Principal" }, { id: 20, nome: "Loja Centro" }]);
  api.patch.mockResolvedValue({});
  render(<AbaFuncionarios />);
  await within(tabela()).findByText("Bruno");
  expect(within(tabela()).getByText("Unidade")).toBeInTheDocument();

  // filtro
  fireEvent.click(screen.getByLabelText("Filtrar por unidade"));
  fireEvent.click(screen.getByRole("option", { name: "Loja Centro" }));
  expect(within(tabela()).queryByText("Ana")).toBeNull();
  expect(within(tabela()).getByText("Bruno")).toBeInTheDocument();

  // edita o Bruno e manda para a Principal
  fireEvent.click(within(tabela()).getByTitle("Editar"));
  fireEvent.click(screen.getByLabelText("Unidade"));
  fireEvent.click(screen.getByRole("option", { name: "Principal" }));
  fireEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

  await waitFor(() =>
    expect(api.patch).toHaveBeenCalledWith("/gerencial/funcionario/2", {
      nome: "Bruno",
      cpf: "22222222222",
      id_departamento: 3,
      id_funcao: 7,
      id_unidade: 10,
    })
  );
});
