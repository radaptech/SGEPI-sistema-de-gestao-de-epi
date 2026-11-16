// Roda contra o ambiente do docker-compose.dev.yml (Traefik na porta 80).
// O tenant sai do subdomínio: o super admin do seed pertence a "painel-homologacao".
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  // o login tem rate limit (5 tentativas, +1 a cada 12s): nada de paralelismo
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://painel-homologacao.localhost",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
