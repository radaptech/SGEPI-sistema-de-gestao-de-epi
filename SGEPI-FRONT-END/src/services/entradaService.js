import { api } from "./api";
import { listar } from "./listas";

export const listarFornecedores = () => listar("/fornecedores");
export const listarEpis = () => listar("/epis");
export const listarTamanhos = () => listar("/tamanhos");
export const listarEntradas = () => listar("/entradas");

export const criarEntrada = (payload) => api.post("/gerencial/cadastrar-entrada", payload);
