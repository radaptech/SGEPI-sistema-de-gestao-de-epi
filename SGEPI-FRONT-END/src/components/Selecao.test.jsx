import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import Selecao from "./Selecao";

Element.prototype.scrollIntoView = () => {}; // jsdom não tem

function Campo({ aoMudar, itens = ["Luva Nitrílica", "Luva de Vaqueta", "Bota"] }) {
  const [v, setV] = useState("");
  return (
    <Selecao
      id="campo"
      value={v}
      onChange={(e) => {
        setV(e.target.value);
        aoMudar?.(e);
      }}
    >
      <option value="">Selecione...</option>
      <optgroup label="Já comprados">
        {itens.slice(0, 1).map((n, i) => (
          <option key={n} value={i + 1}>{n}</option>
        ))}
      </optgroup>
      <optgroup label="Outros">
        {itens.slice(1).map((n, i) => (
          <option key={n} value={i + 2}>{n}</option>
        ))}
      </optgroup>
    </Selecao>
  );
}

test("abre, escolhe com o mouse e devolve e.target.value como no select", () => {
  const aoMudar = jest.fn();
  render(<Campo aoMudar={aoMudar} />);
  const gatilho = screen.getByRole("combobox");
  expect(gatilho).toHaveTextContent("Selecione...");

  fireEvent.click(gatilho);
  expect(screen.getByText("Já comprados")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("option", { name: "Bota" }));

  expect(aoMudar.mock.calls[0][0].target).toEqual({ value: "3", id: "campo", name: undefined });
  expect(gatilho).toHaveTextContent("Bota");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(document.activeElement).toBe(gatilho);
});

test("teclado: setas, Enter e letra; Esc fecha só o menu", () => {
  const fechouModal = jest.fn();
  document.addEventListener("keydown", fechouModal);
  render(<Campo />);
  const gatilho = screen.getByRole("combobox");

  fireEvent.keyDown(gatilho, { key: "ArrowDown" });
  const menu = screen.getByRole("listbox").parentElement;
  fireEvent.keyDown(menu, { key: "b" }); // pula para "Bota"
  fireEvent.keyDown(menu, { key: "Enter" });
  expect(gatilho).toHaveTextContent("Bota");

  fireEvent.keyDown(gatilho, { key: "Enter" });
  fireEvent.keyDown(screen.getByRole("listbox").parentElement, { key: "ArrowUp" });
  fireEvent.keyDown(screen.getByRole("listbox").parentElement, { key: "Escape" });
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(gatilho).toHaveTextContent("Bota");
  expect(fechouModal.mock.calls.some(([e]) => e.key === "Escape")).toBe(false);
  document.removeEventListener("keydown", fechouModal);
});

test("lista longa ganha busca sem acento", () => {
  const itens = ["Óculos", "Luva A", "Luva B", "Bota", "Capacete", "Protetor", "Avental", "Máscara", "Cinto"];
  render(<Campo itens={itens} />);
  fireEvent.click(screen.getByRole("combobox"));
  expect(document.activeElement).toBe(screen.getByLabelText("Buscar na lista"));
  fireEvent.change(screen.getByLabelText("Buscar na lista"), { target: { value: "oculos" } });
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Óculos"]);
  fireEvent.keyDown(screen.getByLabelText("Buscar na lista"), { key: "Enter" });
  expect(screen.getByRole("combobox")).toHaveTextContent("Óculos");
});
