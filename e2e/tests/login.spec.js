const { test, expect } = require("@playwright/test");
const { SUPER_EMAIL, SUPER_SENHA, entrar } = require("./apoio");

test("senha errada mostra erro e não entra", async ({ page }) => {
  await page.goto("/");
  await entrar(page, SUPER_EMAIL, "senha-errada");
  await expect(page.getByText("email ou senha incorretos").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar no Sistema" })).toBeVisible();
});

test("super admin entra, mantém a sessão no reload e sai", async ({ page }) => {
  await page.goto("/");
  await entrar(page, SUPER_EMAIL, SUPER_SENHA);
  const painel = page.getByRole("heading", { name: "Gestão da Plataforma" });
  await expect(painel).toBeVisible();

  // sessão vem do cookie HttpOnly via GET /api/me
  await page.reload();
  await expect(painel).toBeVisible();

  await page.getByRole("button", { name: /^Sair/ }).first().click();
  await expect(page.getByRole("button", { name: "Entrar no Sistema" })).toBeVisible();

  // logout apagou a sessão no servidor: reload continua no login
  await page.reload();
  await expect(page.getByRole("button", { name: "Entrar no Sistema" })).toBeVisible();
});
