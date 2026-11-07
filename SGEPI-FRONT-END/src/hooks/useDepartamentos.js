import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../services/api";

/**
 * Ajustado para bater com: 
 * type DepartamentoDto { ID: int, Departamento: string }
 */
const normalizarDepartamento = (item) => ({
  id: Number(item?.id ?? 0),
  nome: item?.departamento ?? "", // Mudou de 'nome' para 'departamento'
});

/**
 * Ajustado para bater com: 
 * type FuncaoDto { ID: int, Funcao: string (mapeado como 'cargo'), Departamento: Obj }
 */
const normalizarFuncao = (item) => ({
  id: Number(item?.id ?? 0),
  nome: item?.cargo ?? "", // O JSON do seu Dto diz `json:"cargo"`
  // No seu DTO novo, o ID do departamento vem dentro do objeto 'departamento'
  idDepartamento: Number(item?.departamento?.id ?? 0),
});

export function useDepartamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [erroTela, setErroTela] = useState("");
  const [carregandoTela, setCarregandoTela] = useState(true);
  const [carregandoDepartamento, setCarregandoDepartamento] = useState(false);
  const [carregandoFuncao, setCarregandoFuncao] = useState(false);

const carregarDados = useCallback(async () => {
    setCarregandoTela(true);
    setErroTela("");

    try {
      const [respDep, respFun] = await Promise.all([
        api.get("/departamentos"),
        api.get("/funcoes"),
      ]);

      // Acessando a chave correta baseada no seu JSON
      // Se vier do Axios, os dados estão em respDep.data.departamentos
      const listaDep = respDep.data?.departamentos || respDep.departamentos || [];
      const listaFun = respFun.data?.funcoes || respFun.funcoes || [];

      setDepartamentos(listaDep.map(normalizarDepartamento));
      setFuncoes(listaFun.map(normalizarFuncao));
      
    } catch (erro) {
      console.error("Erro ao carregar dados:", erro);
      setErroTela("Não foi possível carregar os departamentos e as funções.");
    } finally {
      setCarregandoTela(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const departamentosComFuncoes = useMemo(() => {
    return departamentos
      .map((dep) => ({
        ...dep,
        funcoes: funcoes
          .filter((f) => f.idDepartamento === dep.id)
          .sort((a, b) => a.nome.localeCompare(b.nome)),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [departamentos, funcoes]);

  const totalFuncoes = useMemo(() => funcoes.length, [funcoes]);

  // --- AÇÕES DE ESCRITA (POST) ---

  const adicionarDepartamento = async (nome) => {
    setCarregandoDepartamento(true);
    try {
      // O seu struct 'Departamento' espera a chave "departamento"
      await api.post("/gerencial/cadastro-departamento", { 
        departamento: nome 
      });
      await carregarDados();
    } finally {
      setCarregandoDepartamento(false);
    }
  };

  const adicionarFuncao = async ({ nome, departamentoId }) => {
    setCarregandoFuncao(true);
    try {
      // O seu struct 'Funcao' espera "funcao" e "id_departamento"
      await api.post("/gerencial/cadastro-funcao", { 
        funcao: nome, 
        id_departamento: Number(departamentoId) 
      });
      await carregarDados();
    } finally {
      setCarregandoFuncao(false);
    }
  };

  const excluirDepartamento = async (id) => {
    await api.delete(`/gerencial/departamento/${id}`);
    await carregarDados();
  };

  const excluirFuncao = async (id) => {
    await api.delete(`/gerencial/funcao/${id}`);
    await carregarDados();
  };

  return {
    departamentos,
    funcoes,
    departamentosComFuncoes,
    totalFuncoes,
    erroTela,
    carregandoTela,
    carregandoDepartamento,
    carregandoFuncao,
    adicionarDepartamento,
    adicionarFuncao,
    excluirDepartamento,
    excluirFuncao,
  };
}