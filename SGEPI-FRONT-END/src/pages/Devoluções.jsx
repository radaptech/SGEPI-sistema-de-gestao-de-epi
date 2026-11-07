import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";

import ModalBaixa from "../components/modals/ModalBaixa";
import ModalDetalhesTroca from "../components/modals/ModalDetalhesTroca";
import { useDevolucoes } from "../hooks/useDevolucoes";
import { temPermissao } from "../utils/permissoes";
import { formatarData } from "../utils/devolucoes";

import { 
  RotateCcw, AlertTriangle, Plus, Search, 
  X, ChevronLeft, ChevronRight, FileDown, 
  RefreshCw, XCircle
} from "lucide-react";

function Devolucoes({ usuarioLogado }) {
  const {
    carregando,
    devolucoes,
    carregar,
  } = useDevolucoes();

  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtroTroca, setFiltroTroca] = useState("todos");


  const [baixandoPdfId, setBaixandoPdfId] = useState(null);

  const [modalTrocaAberto, setModalTrocaAberto] = useState(false);
  const [devolucaoParaTroca, setDevolucaoParaTroca] = useState(null);

  const itensPorPagina = 5;

  const podeVisualizar = !usuarioLogado ? true : temPermissao(usuarioLogado, "visualizar_estoque");
  const perfilUsuario = usuarioLogado?.role;
  const podeCadastrar = !usuarioLogado || perfilUsuario === "admin" || perfilUsuario === "gerente";

  const aoMudarFiltro = (setter, valor) => {
    setter(valor);
    setPaginaAtual(1);
  };

  const handleBaixarPdf = async (id) => {
    try {
      setBaixandoPdfId(id);
      const response = await api.get(`/gerencial/devolucoes/${id}/pdf`, { responseType: 'blob' });
      const arquivoByte = response.data ? response.data : response;

      const url = window.URL.createObjectURL(new Blob([arquivoByte], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ficha_TROCA_EPI_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar o PDF:", error);
      toast.error("Não foi possível baixar o PDF desta entrega.");
    } finally {
      setBaixandoPdfId(null);
    }
  };

  const abrirModalTroca = (devolucao) => {
    setDevolucaoParaTroca(devolucao);
    setModalTrocaAberto(true);
  };

  const devolucoesPreFiltroTroca = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return devolucoes.filter((d) => {
      const matchTexto =
        !termo ||
        (d.funcionarioNome || "").toLowerCase().includes(termo) ||
        String(d.funcionarioMatricula || "").includes(termo) ||
        (d.motivoNome || "").toLowerCase().includes(termo) ||
        (d.epiNome || "").toLowerCase().includes(termo) ||
        String(d.tamanhoNome || "").toLowerCase().includes(termo);

      let matchData = true;
      const data = String(d.data_devolucao || "").substring(0, 10);

      if (dataInicio) matchData = matchData && data >= dataInicio;
      if (dataFim) matchData = matchData && data <= dataFim;

      return matchTexto && matchData;
    });
  }, [devolucoes, busca, dataInicio, dataFim]);

  const resumoTela = useMemo(() => {
    const totalDevolucoes = devolucoesPreFiltroTroca.length;
    const totalTrocas = devolucoesPreFiltroTroca.filter((item) => item.houveTroca).length;

    return {
      totalDevolucoes,
      totalTrocas,
      totalSemTroca: totalDevolucoes - totalTrocas,
    };
  }, [devolucoesPreFiltroTroca]);

  const devolucoesFiltradas = useMemo(() => {
    return devolucoesPreFiltroTroca.filter((d) => {
      if (filtroTroca === "com_troca") return d.houveTroca === true;
      if (filtroTroca === "sem_troca") return d.houveTroca === false;
      return true;
    });
  }, [devolucoesPreFiltroTroca, filtroTroca]);

  const devolucoesOrdenadas = useMemo(() => {
    return [...devolucoesFiltradas].sort((a, b) => {
      if (a.data_devolucao < b.data_devolucao) return 1;
      if (a.data_devolucao > b.data_devolucao) return -1;
      return 0;
    });
  }, [devolucoesFiltradas]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(devolucoesOrdenadas.length / itensPorPagina));
    if (paginaAtual > total) {
      setPaginaAtual(total);
    }
  }, [paginaAtual, devolucoesOrdenadas.length]);

  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const devolucoesVisiveis = devolucoesOrdenadas.slice(indexPrimeiroItem, indexUltimoItem);
  const totalPaginas = Math.max(1, Math.ceil(devolucoesOrdenadas.length / itensPorPagina));

  // a devolução já foi gravada pelo modal; aqui só recarrega a lista
  const aoSalvarDevolucao = async () => {
    await carregar();
    setPaginaAtual(1);
    setModalAberto(false);
  };

  if (!podeVisualizar) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 text-amber-700 dark:text-amber-400 flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de devoluções.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 animate-fade-in max-w-full transition-colors duration-300">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 transition-colors duration-300">
              <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Devoluções e Trocas
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                Registre, filtre e gerencie as devoluções de EPIs.
              </p>
            </div>
          </div>

          {podeCadastrar && (
            <button
              onClick={() => setModalAberto(true)}
              className="w-full lg:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-sm shadow-red-600/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Registrar Devolução
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          <button
            onClick={() => { setFiltroTroca("todos"); setPaginaAtual(1); }}
            className={`rounded-2xl border p-5 text-left transition-all duration-300 outline-none flex flex-col gap-2 ${
              filtroTroca === "todos"
                ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm"
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span className={`text-[11px] uppercase font-bold tracking-widest ${filtroTroca === "todos" ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
              Todas as Devoluções
            </span>
            <strong className={`text-2xl sm:text-3xl font-black tracking-tight mt-auto ${filtroTroca === "todos" ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>
              {carregando ? "--" : resumoTela.totalDevolucoes}
            </strong>
          </button>

          <button
            onClick={() => { setFiltroTroca("com_troca"); setPaginaAtual(1); }}
            className={`rounded-2xl border p-5 text-left transition-all duration-300 outline-none flex flex-col gap-2 ${
              filtroTroca === "com_troca"
                ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 shadow-sm"
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
            }`}
          >
             <span className={`text-[11px] uppercase font-bold tracking-widest ${filtroTroca === "com_troca" ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
              Com Troca
            </span>
            <strong className={`text-2xl sm:text-3xl font-black tracking-tight mt-auto ${filtroTroca === "com_troca" ? "text-emerald-900 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200"}`}>
              {carregando ? "--" : resumoTela.totalTrocas}
            </strong>
          </button>

          <button
            onClick={() => { setFiltroTroca("sem_troca"); setPaginaAtual(1); }}
            className={`rounded-2xl border p-5 text-left transition-all duration-300 outline-none flex flex-col gap-2 ${
              filtroTroca === "sem_troca"
                ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800/50 shadow-sm"
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 hover:bg-red-50/50 dark:hover:bg-red-900/10"
            }`}
          >
             <span className={`text-[11px] uppercase font-bold tracking-widest ${filtroTroca === "sem_troca" ? "text-red-700 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
              Sem Troca
            </span>
            <strong className={`text-2xl sm:text-3xl font-black tracking-tight mt-auto ${filtroTroca === "sem_troca" ? "text-red-900 dark:text-red-300" : "text-slate-800 dark:text-slate-200"}`}>
              {carregando ? "--" : resumoTela.totalSemTroca}
            </strong>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 mb-8">
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-1.5 flex-1">
            <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 flex-1 h-[46px]">
              <div className="pl-4 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Buscar por colaborador, matrícula, motivo ou EPI..."
                value={busca}
                onChange={(e) => aoMudarFiltro(setBusca, e.target.value)}
                className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none placeholder-slate-400 h-full"
              />
              {busca && (
                <button
                  onClick={() => aoMudarFiltro(setBusca, "")}
                  className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-1.5 flex items-center">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => aoMudarFiltro(setDataInicio, e.target.value)}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 px-3 h-[46px] text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-red-500/20"
                />
             </div>
             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-1.5 flex items-center">
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => aoMudarFiltro(setDataFim, e.target.value)}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 px-3 h-[46px] text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-red-500/20"
                />
             </div>
          </div>
        </div>

        {carregando ? (
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando devoluções...</span>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60 transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60 transition-colors">
                  <tr>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Funcionário</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Item Devolvido</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Motivo</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Status</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {devolucoesVisiveis.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                        Nenhuma devolução encontrada.
                      </td>
                    </tr>
                  ) : (
                    devolucoesVisiveis.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150 group">
                        <td className="p-4">
                          <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded block w-fit">
                            {formatarData(d.data_devolucao)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 transition-colors">
                            {d.funcionarioNome}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase tracking-widest">
                            MAT: {d.funcionarioMatricula}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-sm text-slate-700 dark:text-slate-300 transition-colors">
                            {d.epiNome}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Tam: {d.tamanhoNome} | Qtd: <span className="font-bold">{d.quantidadeADevolver}</span>
                          </div>
                        </td>
                        <td className="p-4">
                           <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-600/50 text-xs font-bold whitespace-nowrap">
                            {d.motivoNome}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {d.houveTroca ? (
                            <button
                              onClick={() => abrirModalTroca(d)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Ver Troca
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold border border-slate-200/50 dark:border-slate-700 shadow-sm">
                              <XCircle className="w-3.5 h-3.5" /> Sem Troca
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleBaixarPdf(d.id)}
                            disabled={baixandoPdfId === d.id}
                            title="Baixar Ficha PDF"
                            className={`p-2 mx-auto rounded-xl transition-all flex items-center justify-center border ${
                              baixandoPdfId === d.id
                                ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-wait"
                                : "bg-slate-100 text-slate-600 border-transparent hover:border-slate-200 hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                            }`}
                          >
                            {baixandoPdfId === d.id ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span> : <FileDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-4">
              {devolucoesVisiveis.map((d) => (
                <div
                  key={d.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-2xl p-5 shadow-sm transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded inline-block mb-2">
                        {formatarData(d.data_devolucao)}
                      </span>
                      <h3 className="font-extrabold text-slate-900 dark:text-white transition-colors">
                        {d.funcionarioNome}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase tracking-widest">
                        MAT: {d.funcionarioMatricula}
                      </p>
                    </div>
                    {d.houveTroca ? (
                      <button
                        onClick={() => abrirModalTroca(d)}
                        className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1 shadow-sm"
                      >
                        <RefreshCw className="w-3 h-3" /> TROCA
                      </button>
                    ) : (
                      <span className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-black px-2 py-1 rounded-md shadow-sm">
                        SEM TROCA
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-sm transition-colors mb-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Item</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-right max-w-[180px]">
                        {d.epiNome} <span className="text-slate-400">({d.tamanhoNome})</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Motivo</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {d.motivoNome}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700/80 pt-2 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quantidade</span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        {d.quantidadeADevolver} un
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBaixarPdf(d.id)}
                    disabled={baixandoPdfId === d.id}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors border ${
                      baixandoPdfId === d.id
                        ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-wait"
                        : "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-transparent"
                    }`}
                  >
                    {baixandoPdfId === d.id ? (
                      <><span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span> Gerando...</>
                    ) : (
                      <><FileDown className="w-4 h-4" /> Baixar Ficha PDF</>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                  disabled={paginaAtual === 1}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${
                    paginaAtual === 1
                      ? "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      : "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-slate-700 shadow-sm hover:border-red-200 dark:hover:border-slate-600"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>

                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                  Página <span className="text-slate-800 dark:text-white">{paginaAtual}</span> de {totalPaginas}
                </span>

                <button
                  onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${
                    paginaAtual === totalPaginas
                      ? "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      : "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-slate-700 shadow-sm hover:border-red-200 dark:hover:border-slate-600"
                  }`}
                >
                  Próxima <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ModalDetalhesTroca
        aberto={modalTrocaAberto}
        devolucao={devolucaoParaTroca}
        onClose={() => setModalTrocaAberto(false)}
      />

      {modalAberto && (
        <ModalBaixa
          onClose={() => setModalAberto(false)}
          onSalvar={aoSalvarDevolucao}
        />
      )}
    </>
  );
}

export default Devolucoes;