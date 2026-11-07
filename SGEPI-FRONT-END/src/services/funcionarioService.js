import { listar } from "./listas";
import {
  normalizarDepartamento,
  normalizarFuncionario,
  normalizarFuncao,
} from "../utils/funcionarios";

export async function carregarDadosFuncionarios() {
  try {
    // 1. Fazemos apenas UMA única chamada para o back-end!
    const listaFuncionarios = await listar("/funcionario-estoque");

    // 2. Normalizamos os funcionários normalmente
    const funcionariosNormalizados = listaFuncionarios.map(normalizarFuncionario);

    // 3. EXTRAÇÃO INTELIGENTE:
    // Varremos a lista de funcionários e guardamos os departamentos e funções 
    // usando um Map (o Map garante que não teremos IDs repetidos na lista final)
    const mapDepartamentos = new Map();
    const mapFuncoes = new Map();

    listaFuncionarios.forEach((item) => {
      // Verifica se o funcionário tem função e departamento embutidos
      if (item?.funcao?.departamento?.id) {
        mapDepartamentos.set(item.funcao.departamento.id, item.funcao.departamento);
      }
      if (item?.funcao?.id) {
        mapFuncoes.set(item.funcao.id, item.funcao);
      }
    });

    return {
      funcionarios: funcionariosNormalizados,
      
      // Transformamos os Maps de volta em listas (Arrays) e passamos pelo normalizador
      departamentos: Array.from(mapDepartamentos.values()).map(normalizarDepartamento),
      funcoes: Array.from(mapFuncoes.values()).map(normalizarFuncao),
      
      // Mantemos vazias para não quebrar a tela
      entregas: [],
      devolucoes: [],
    };

  } catch (erro) {
    console.error("Erro na rota /funcionarios:", erro);
    throw new Error("Falha ao carregar os dados da tela de funcionários.");
  }
}