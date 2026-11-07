import { api } from "./api";

// Contrato das rotas de listagem: as paginadas devolvem um objeto e a lista fica nesta chave.
// As outras (/tamanhos, /motivos, /devolucao, os *-dashbord...) devolvem o array direto.
// ponytail: as chaves seguem o back como ele está hoje (Epis/Fornecedores com maiúscula, funcionario no singular);
// padronizar no back e trocar aqui.
const CHAVE_DA_LISTA = {
  "/departamentos": "departamentos",
  "/entradas": "entradas",
  "/entregas": "entregas",
  "/epis": "Epis",
  "/fornecedores": "Fornecedores",
  "/funcionarios": "funcionario",
  "/funcoes": "funcoes",
};

// Busca uma listagem e devolve sempre um array. Erro vira lista vazia: o api.js já mostrou o toast.
// O "?? []" cobre slice nil do Go, que sai como null no JSON.
export async function listar(rota) {
  try {
    const resp = await api.get(rota);
    const chave = CHAVE_DA_LISTA[rota.split("?")[0]];
    return (chave ? resp?.[chave] : resp) ?? [];
  } catch {
    return [];
  }
}
