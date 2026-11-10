import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import CampoLimite, { CAMPOS_LIMITE, erroLimites, limiteParaApi } from "./CampoLimite";

function Campo({ inicial }) {
  const [v, setV] = useState(inicial);
  return <CampoLimite label="Limite de Unidades" value={v} onChange={setV} />;
}

test("marcar Ilimitado desabilita e limpa o número; desmarcar volta a pedir o número", () => {
  render(<Campo inicial="10" />);
  const numero = screen.getByLabelText("Limite de Unidades");
  expect(numero).toHaveValue(10);

  fireEvent.click(screen.getByLabelText("Ilimitado"));
  expect(numero).toBeDisabled();
  expect(numero).toHaveValue(null);

  fireEvent.click(screen.getByLabelText("Ilimitado"));
  expect(numero).toBeEnabled();
  fireEvent.change(numero, { target: { value: "7" } });
  expect(numero).toHaveValue(7);
});

test("cada limite precisa de um número >= 1 ou Ilimitado", () => {
  const ok = { limite_funcionarios: null, limite_usuarios: "5", limite_unidades: "1" };
  expect(erroLimites(ok, CAMPOS_LIMITE)).toBe("");
  expect(erroLimites({ ...ok, limite_usuarios: "" }, CAMPOS_LIMITE)).toMatch(/usuários/);
  expect(erroLimites({ ...ok, limite_unidades: "0" }, CAMPOS_LIMITE)).toMatch(/unidades/);
  expect(limiteParaApi(null)).toBeNull();
  expect(limiteParaApi("12")).toBe(12);
});
