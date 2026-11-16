import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Paginacao, { usePaginacao } from "./Paginacao";

function Lista({ total }) {
  const [n, setN] = useState(total);
  const lista = Array.from({ length: n }, (_, i) => i + 1);
  const { itens, ...pag } = usePaginacao(lista, 15);
  return (
    <>
      <p>itens: {itens.join(",")}</p>
      <button onClick={() => setN(3)}>filtrar</button>
      <Paginacao {...pag} />
    </>
  );
}

test("mostra 15 por página, navega e volta para dentro do total quando a lista encolhe", () => {
  render(<Lista total={20} />);
  expect(screen.getByText(/^itens:/)).toHaveTextContent("itens: 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15");
  expect(screen.getByText("1 de 2")).toBeInTheDocument();
  expect(screen.getByText("Anterior")).toBeDisabled();

  fireEvent.click(screen.getByText("Próxima"));
  expect(screen.getByText(/^itens:/)).toHaveTextContent("itens: 16,17,18,19,20");
  expect(screen.getByText("Próxima")).toBeDisabled();

  fireEvent.click(screen.getByText("filtrar"));
  expect(screen.getByText(/^itens:/)).toHaveTextContent("itens: 1,2,3");
  expect(screen.queryByText("Próxima")).not.toBeInTheDocument();
});
