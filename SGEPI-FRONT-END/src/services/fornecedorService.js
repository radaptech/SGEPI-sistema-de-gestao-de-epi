import { api } from "./api";
import { listar } from "./listas";

export const listarFornecedores = () => listar("/fornecedores");

export const criarFornecedor = (payload) => api.post("/gerencial/cadastro-fornecedores", payload);
