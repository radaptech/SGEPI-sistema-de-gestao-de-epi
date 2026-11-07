import { api } from "./api";
import { listar } from "./listas";

export const listarEntregas = () => listar("/entregas");
export const listarFuncionariosEntrega = () => listar("/funcionarios");
export const listarEpisEntrega = () => listar("/epis");

// a resposta é só {"mensagem"}: quem chama recarrega a lista
export const criarEntrega = (payload) => api.post("/cadastro-entregas", payload);
