import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // mantém o nome da variável da época do CRA: .env, CI e deploy continuam iguais
  envPrefix: "REACT_APP_",
  // mesma pasta do CRA: o Dockerfile serve "build"
  build: { outDir: "build" },
  server: {
    host: true,
    port: 3000,
    // no docker o front é acessado por <empresa>.localhost via traefik
    allowedHosts: [".localhost"],
    // atrás do traefik (porta 80) o websocket do hot reload precisa saber a porta do navegador
    hmr: process.env.HMR_CLIENT_PORT ? { clientPort: Number(process.env.HMR_CLIENT_PORT) } : undefined,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    testTimeout: 15000,
  },
});
