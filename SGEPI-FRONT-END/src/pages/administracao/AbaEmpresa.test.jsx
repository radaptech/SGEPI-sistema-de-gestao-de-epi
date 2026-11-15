import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AbaEmpresa from "./AbaEmpresa";
import { api } from "../../services/api";
import { toast } from "react-toastify";

vi.mock("../../services/api", () => ({ api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => "blob:logo");
  URL.revokeObjectURL = vi.fn();
});

const escolher = (arquivo) => fireEvent.change(screen.getByLabelText(/enviar logo|trocar logo/i), { target: { files: [arquivo] } });

test("sem logo, envia o PNG escolhido e passa a mostrar a logo", async () => {
  api.get.mockResolvedValueOnce(null).mockResolvedValueOnce(new Blob(["png"], { type: "image/png" }));
  api.put.mockResolvedValue(null);
  render(<AbaEmpresa />);
  expect(await screen.findByText("Sem logo")).toBeInTheDocument();

  escolher(new File(["png"], "logo.png", { type: "image/png" }));

  expect(await screen.findByAltText("Logo da empresa")).toHaveAttribute("src", "blob:logo");
  const [rota, corpo] = api.put.mock.calls[0];
  expect(rota).toBe("/gerencial/empresa/logo");
  expect(corpo.get("file").name).toBe("logo.png");
  expect(screen.getByRole("button", { name: /remover/i })).toBeInTheDocument();
});

test("recusa formato errado sem chamar a API", async () => {
  api.get.mockResolvedValue(null);
  render(<AbaEmpresa />);
  await screen.findByText("Sem logo");

  escolher(new File(["gif"], "logo.gif", { type: "image/gif" }));

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Envie a logo em PNG ou JPG."));
  expect(api.put).not.toHaveBeenCalled();
});
