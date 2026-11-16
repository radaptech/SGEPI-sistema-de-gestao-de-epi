import { render, screen } from "@testing-library/react";
import App from "./App";

// fumaça: o app inteiro monta (rotas, providers, imports pesados como o jspdf) e cai no login sem sessão
test("abre na tela de login sem sessão", async () => {
  render(<App />);
  expect(await screen.findByRole("button", { name: /entrar no sistema/i })).toBeInTheDocument();
});
