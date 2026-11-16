import { useEffect, useMemo, useState } from "react";
import formatarData from "../utils/DatasFormater";
import { api } from "../services/api"; 
import {
  criarEntrega,
  listarEpisEntrega,
  listarFuncionariosEntrega,
} from "../services/entregaService";
import {
  normalizarEpiEntrega,
  normalizarFuncionarioEntrega,
  normalizarTamanhoEntrega,
} from "../utils/entregaNormalizers";
import {
  montarItemEntrega,
  validarQuantidade,
} from "../utils/entregaHelpers";
import { toast } from "react-toastify";
import { unidadeAtual } from "../services/unidadeAtual";

export function useModalEntrega({ assinaturaPreview, onClose, onSalvar }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [epis, setEpis] = useState([]);
  const [tamanhosFiltrados, setTamanhosFiltrados] = useState([]);
  const [carregandoTamanhos, setCarregandoTamanhos] = useState(false);

  const [funcionario, setFuncionario] = useState("");
  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  const [dataEntrega, setDataEntrega] = useState(() => {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  // Adiciona o zero à esquerda se for menor que 10
  const mes = String(hoje.getMonth() + 1).padStart(2, '0'); 
  const dia = String(hoje.getDate()).padStart(2, '0');
  
  return `${ano}-${mes}-${dia}`;
});

  const [itensParaEntregar, setItensParaEntregar] = useState([]);
  const [idEpiTemp, setIdEpiTemp] = useState("");
  const [idTamanhoTemp, setIdTamanhoTemp] = useState("");
  const [qtdTemp, setQtdTemp] = useState(1);

  const [kitFuncao, setKitFuncao] = useState([]);

  const [carregando, setCarregando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);

  // 1. Carga Inicial de Funcionários e EPIs
  useEffect(() => {
    let ativo = true;
    async function carregarDadosIniciais() {
      setCarregandoDados(true);
      try {
        const [listaFuncionarios, listaEpis] = await Promise.all([
          listarFuncionariosEntrega(),
          listarEpisEntrega(),
        ]);
        if (!ativo) return;
        setFuncionarios(listaFuncionarios.map(normalizarFuncionarioEntrega));
        setEpis(listaEpis.map(normalizarEpiEntrega));
      } catch (erro) {
        console.error("Erro ao carregar dados iniciais:", erro);
        toast.error("Não foi possível carregar funcionários e EPIs. Feche e abra a entrega de novo.");
      } finally {
        if (ativo) setCarregandoDados(false);
      }
    }
    carregarDadosIniciais();
    return () => { ativo = false; };
  }, []);

  // 2. Tamanhos do EPI escolhido, com o saldo de cada um na unidade do funcionário
  // (é dela que a entrega sai; sem funcionário escolhido, soma todas)
  // com uma loja escolhida no topo, a entrega sai dela; em "todas", da unidade do funcionário (D2)
  const unidadeEscolhida = unidadeAtual();
  const unidadeFuncionario =
    unidadeEscolhida || funcionarios.find((item) => Number(item.id) === Number(funcionario))?.unidadeId;
  useEffect(() => {
    let ativo = true;
    async function buscarTamanhos() {
      if (!idEpiTemp) {
        setTamanhosFiltrados([]);
        return;
      }

      try {
        setCarregandoTamanhos(true);
        const filtro = unidadeFuncionario ? `?id_unidade=${unidadeFuncionario}` : "";
        const response = await api.get(`/tamanhos-id-epi/${idEpiTemp}${filtro}`);
        
        if (!ativo) return;
        
        setTamanhosFiltrados((response ?? []).map(normalizarTamanhoEntrega));
      } catch (erro) {
        console.error("Erro ao buscar tamanhos por EPI:", erro);
        toast.error("Não foi possível carregar os tamanhos deste EPI.");
        setTamanhosFiltrados([]);
      } finally {
        if (ativo) setCarregandoTamanhos(false);
      }
    }

    buscarTamanhos();
    return () => { ativo = false; };
  }, [idEpiTemp, unidadeFuncionario]);

  // 3. Memos para performance e busca de objetos
  const funcionarioSelecionado = useMemo(() => {
    return funcionarios.find((item) => Number(item.id) === Number(funcionario)) || null;
  }, [funcionarios, funcionario]);

  const funcionariosFiltrados = useMemo(() => {
    const termo = buscaFuncionario.toLowerCase().trim();
    if (!termo) return funcionarios;
    return funcionarios.filter((item) => 
      (item.nome || "").toLowerCase().includes(termo) ||
      String(item.matricula || "").includes(termo)
    );
  }, [funcionarios, buscaFuncionario]);

  const epiSelecionadoObj = useMemo(() => {
    return epis.find((item) => Number(item.id) === Number(idEpiTemp)) || null;
  }, [epis, idEpiTemp]);

  const tamanhoSelecionadoObj = useMemo(() => {
    return tamanhosFiltrados.find((item) => Number(item.id) === Number(idTamanhoTemp)) || null;
  }, [tamanhosFiltrados, idTamanhoTemp]);

  // Kit de EPI da função do funcionário selecionado
  const funcaoId = funcionarioSelecionado?.funcaoId;
  useEffect(() => {
    let ativo = true;
    setKitFuncao([]);
    if (!funcaoId) return;
    api.get(`/funcao/${funcaoId}/kit`)
      .then((kit) => ativo && setKitFuncao(kit ?? []))
      .catch((erro) => {
        console.error("Erro ao buscar kit da função:", erro);
        toast.error("Não foi possível carregar o kit da função.");
      });
    return () => { ativo = false; };
  }, [funcaoId]);

  // Itens do kit que ainda não foram adicionados à entrega
  const kitPendente = useMemo(() => {
    const adicionados = new Set(itensParaEntregar.map((item) => Number(item.idEpi)));
    return kitFuncao.filter((item) => !adicionados.has(Number(item.id_epi)));
  }, [kitFuncao, itensParaEntregar]);

  // Um clique no item do kit preenche EPI e quantidade; falta só o tamanho
  function usarItemKit(item) {
    setIdEpiTemp(String(item.id_epi));
    setIdTamanhoTemp("");
    setQtdTemp(Number(item.quantidade) || 1);
  }

  // 4. Ações do Formulário
  function adicionarItem() {
    if (!idEpiTemp || !idTamanhoTemp || !qtdTemp) {
      toast.warning("Selecione o EPI, o tamanho e a quantidade.");
      return;
    }

    if (!validarQuantidade(qtdTemp)) {
      toast.warning("Informe uma quantidade válida.");
      return;
    }

    const itemDuplicado = itensParaEntregar.some(
      (item) =>
        Number(item.idEpi) === Number(idEpiTemp) &&
        Number(item.idTamanho) === Number(idTamanhoTemp)
    );

    if (itemDuplicado) {
      toast.warning("Esse item com esse tamanho já foi adicionado à entrega.");
      return;
    }

    // Trava de segurança extra no botão "Adicionar"
    if (tamanhoSelecionadoObj?.saldo_atual !== undefined && qtdTemp > tamanhoSelecionadoObj.saldo_atual) {
      toast.warning(`Você só tem ${tamanhoSelecionadoObj.saldo_atual} unidades deste tamanho no estoque.`);
      return;
    }

    const novoItem = montarItemEntrega(
      { idEpi: idEpiTemp, idTamanho: idTamanhoTemp, quantidade: qtdTemp },
      epiSelecionadoObj,
      tamanhoSelecionadoObj
    );

    setItensParaEntregar((prev) => [...prev, novoItem]);
    setIdEpiTemp("");
    setIdTamanhoTemp("");
    setQtdTemp(1);
  }

  function removerItem(id) {
    setItensParaEntregar((prev) => prev.filter((item) => item.id !== id));
  }

  async function salvarEntrega() {
    if (!funcionario) return toast.warning("Selecione o funcionário.");
    if (itensParaEntregar.length === 0) return toast.warning("Adicione pelo menos um item.");
    if (!assinaturaPreview) return toast.warning("Peça a assinatura do funcionário.");

    setCarregando(true);

    const payloadEntregaBase = {
      id_funcionario: Number(funcionario),
      data_entrega: formatarData(dataEntrega),
      assinatura_digital: assinaturaPreview,
      ...(unidadeEscolhida && { id_unidade: Number(unidadeEscolhida) }),
      itens: itensParaEntregar.map((item) => ({
        id_epi: Number(item.idEpi),
        id_tamanho: Number(item.idTamanho),
        quantidade: Number(item.quantidade),
      })),
    };

    try {
      await criarEntrega(payloadEntregaBase);
      toast.success("Entrega registrada.");
      if (onSalvar) await onSalvar();
      onClose();
    } catch {
      // o api.js já mostrou o erro do servidor
    } finally {
      setCarregando(false);
    }
  }

  return {
    funcionarios,
    epis,
    tamanhosFiltrados,
    carregandoTamanhos,
    funcionario,
    setFuncionario,
    buscaFuncionario,
    setBuscaFuncionario,
    dataEntrega,
    setDataEntrega,
    itensParaEntregar,
    idEpiTemp,
    setIdEpiTemp,
    idTamanhoTemp,
    setIdTamanhoTemp,
    qtdTemp,
    setQtdTemp,
    carregando,
    carregandoDados,
    funcionarioSelecionado,
    funcionariosFiltrados,
    tamanhoSelecionadoObj,
    kitPendente,
    usarItemKit,
    adicionarItem,
    removerItem,
    salvarEntrega,
  };
}