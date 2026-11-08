import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";

import ModalBaixa from "../components/modals/ModalBaixa";
import ModalDetalhesTroca from "../components/modals/ModalDetalhesTroca";
import { useDevolucoes } from "../hooks/useDevolucoes";
import { temPermissao } from "../utils/permissoes";
import { formatarData } from "../utils/devolucoes";

import { AlertTriangle, Plus, Search, X, ChevronLeft, ChevronRight, FileDown, RefreshCw, XCircle } from "lucide-react";

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
        (d.funcionario_nome || "").toLowerCase().includes(termo) ||
        String(d.funcionario_matricula || "").includes(termo) ||
        (d.motivo_nome || "").toLowerCase().includes(termo) ||
        (d.epi_nome || "").toLowerCase().includes(termo) ||
        String(d.tamanho_nome || "").toLowerCase().includes(termo);

      let matchData = true;
      const data = String(d.data_devolucao || "").substring(0, 10);

      if (dataInicio) matchData = matchData && data >= dataInicio;
      if (dataFim) matchData = matchData && data <= dataFim;

      return matchTexto && matchData;
    });
  }, [devolucoes, busca, dataInicio, dataFim]);

  const resumoTela = useMemo(() => {
    const totalDevolucoes = devolucoesPreFiltroTroca.length;
    const totalTrocas = devolucoesPreFiltroTroca.filter((item) => item.houve_troca).length;

    return {
      totalDevolucoes,
      totalTrocas,
      totalSemTroca: totalDevolucoes - totalTrocas,
    };
  }, [devolucoesPreFiltroTroca]);

  const devolucoesFiltradas = useMemo(() => {
    return devolucoesPreFiltroTroca.filter((d) => {
      if (filtroTroca === "com_troca") return d.houve_troca === true;
      if (filtroTroca === "sem_troca") return d.houve_troca === false;
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
      <div className="bg-surface p-8 rounded-md border border-line flex items-center justify-center transition-colors duration-300">
        <div className="bg-atencao-soft border border-atencao-line rounded-md p-6 text-atencao flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de devoluções.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-full">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-ink tracking-tight transition-colors">
                Devoluções e Trocas
              </h2>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Registre, filtre e gerencie as devoluções de EPIs.
              </p>
            </div>
          </div>

          {podeCadastrar && (
            <button
              onClick={() => setModalAberto(true)}
              className="w-full lg:w-auto bg-action hover:bg-action-hover text-on-action px-5 py-3 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Nova devolução
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          <button
            onClick={() => { setFiltroTroca("todos"); setPaginaAtual(1); }}
            aria-pressed={filtroTroca === "todos"}
            className={`rounded-md border p-5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ink flex flex-col gap-2 ${
              filtroTroca === "todos"
                ? "bg-surface border-ink "
                : "bg-sunken border-line hover:border-line-strong "
            }`}
          >
            <span className={`text-xs uppercase font-bold tracking-wide text-ink-2`}>
              Todas as Devoluções
            </span>
            <strong className={`text-2xl sm:text-3xl font-bold tracking-tight mt-auto text-ink`}>
              {carregando ? "--" : resumoTela.totalDevolucoes}
            </strong>
          </button>

          <button
            onClick={() => { setFiltroTroca("com_troca"); setPaginaAtual(1); }}
            aria-pressed={filtroTroca === "com_troca"}
            className={`rounded-md border p-5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ink flex flex-col gap-2 ${
              filtroTroca === "com_troca"
                ? "bg-surface border-ink "
                : "bg-sunken border-line hover:border-line-strong "
            }`}
          >
             <span className={`text-xs uppercase font-bold tracking-wide text-ink-2`}>
              Com Troca
            </span>
            <strong className={`text-2xl sm:text-3xl font-bold tracking-tight mt-auto text-ink`}>
              {carregando ? "--" : resumoTela.totalTrocas}
            </strong>
          </button>

          <button
            onClick={() => { setFiltroTroca("sem_troca"); setPaginaAtual(1); }}
            aria-pressed={filtroTroca === "sem_troca"}
            className={`rounded-md border p-5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ink flex flex-col gap-2 ${
              filtroTroca === "sem_troca"
                ? "bg-surface border-ink "
                : "bg-sunken border-line hover:border-line-strong "
            }`}
          >
             <span className={`text-xs uppercase font-bold tracking-wide text-ink-2`}>
              Sem Troca
            </span>
            <strong className={`text-2xl sm:text-3xl font-bold tracking-tight mt-auto text-ink`}>
              {carregando ? "--" : resumoTela.totalSemTroca}
            </strong>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 mb-8">
          <div className="relative flex items-center bg-sunken rounded-md border border-line p-1.5 flex-1">
            <div className="relative flex items-center bg-surface rounded-md border border-line flex-1 h-[46px]">
              <div className="pl-4 text-ink-3">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Buscar por colaborador, matrícula, motivo ou EPI..."
                value={busca}
                onChange={(e) => aoMudarFiltro(setBusca, e.target.value)}
                className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-ink outline-none placeholder-ink-3 h-full"
              />
              {busca && (
                <button
                  onClick={() => aoMudarFiltro(setBusca, "")}
                  className="absolute right-3 p-1 rounded-md text-ink-3 hover:text-ink-2 hover:bg-sunken transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
             <div className="bg-sunken rounded-md border border-line p-1.5 flex items-center">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => aoMudarFiltro(setDataInicio, e.target.value)}
                  className="bg-surface rounded-md border border-line px-3 h-[46px] text-sm font-semibold text-ink outline-none focus:ring-1 focus:ring-ink"
                />
             </div>
             <div className="bg-sunken rounded-md border border-line p-1.5 flex items-center">
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => aoMudarFiltro(setDataFim, e.target.value)}
                  className="bg-surface rounded-md border border-line px-3 h-[46px] text-sm font-semibold text-ink outline-none focus:ring-1 focus:ring-ink"
                />
             </div>
          </div>
        </div>

        {carregando ? (
          <div className="border border-dashed border-line-strong rounded-md p-12 flex flex-col items-center justify-center text-ink-2 gap-3">
            <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando devoluções...</span>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-md border border-line transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sunken border-b border-line transition-colors">
                  <tr>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Data</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Funcionário</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Item Devolvido</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Motivo</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Status</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-line ">
                  {devolucoesVisiveis.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-ink-2 font-medium">
                        Nenhuma devolução encontrada.
                      </td>
                    </tr>
                  ) : (
                    devolucoesVisiveis.map((d) => (
                      <tr key={d.id} className="hover:bg-sunken transition duration-150 group">
                        <td className="p-4">
                          <span className="text-xs font-bold font-mono text-ink bg-sunken px-2 py-1 rounded block w-fit">
                            {formatarData(d.data_devolucao)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-sm text-ink transition-colors">
                            {d.funcionario_nome}
                          </div>
                          <div className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide">
                            MAT: {d.funcionario_matricula}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-sm text-ink transition-colors">
                            {d.epi_nome}
                          </div>
                          <div className="text-xs text-ink-2 mt-0.5">
                            Tam: {d.tamanho_nome} | Qtd: <span className="font-bold">{d.quantidade_a_devolver}</span>
                          </div>
                        </td>
                        <td className="p-4">
                           <span className="px-2.5 py-1 bg-sunken text-ink-2 rounded-md border border-line text-xs font-bold whitespace-nowrap">
                            {d.motivo_nome}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {d.houve_troca ? (
                            <button
                              onClick={() => abrirModalTroca(d)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ok-soft text-ok rounded-md text-xs font-bold border border-ok-line hover:bg-ok-soft transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Ver Troca
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sunken text-ink-2 rounded-md text-xs font-bold border border-line ">
                              <XCircle className="w-3.5 h-3.5" /> Sem Troca
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleBaixarPdf(d.id)}
                            disabled={baixandoPdfId === d.id}
                            title="Baixar Ficha PDF"
                            className={`p-2 mx-auto rounded-md transition-all flex items-center justify-center border ${
                              baixandoPdfId === d.id
                                ? "bg-sunken border-line text-ink-3 cursor-wait"
                                : "bg-sunken text-ink-2 border-transparent hover:border-line hover:bg-surface "
                            }`}
                          >
                            {baixandoPdfId === d.id ? <span className="w-4 h-4 border-2 border-line-strong border-t-transparent rounded-full animate-spin"></span> : <FileDown className="w-4 h-4" />}
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
                  className="bg-surface border border-line rounded-md p-5 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold font-mono text-ink bg-sunken px-2 py-1 rounded inline-block mb-2">
                        {formatarData(d.data_devolucao)}
                      </span>
                      <h3 className="font-bold text-ink transition-colors">
                        {d.funcionario_nome}
                      </h3>
                      <p className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide">
                        MAT: {d.funcionario_matricula}
                      </p>
                    </div>
                    {d.houve_troca ? (
                      <button
                        onClick={() => abrirModalTroca(d)}
                        className="bg-ok-soft text-ok border border-ok-line text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 "
                      >
                        <RefreshCw className="w-3 h-3" /> TROCA
                      </button>
                    ) : (
                      <span className="bg-sunken text-ink-2 border border-line text-xs font-bold px-2 py-1 rounded-md ">
                        SEM TROCA
                      </span>
                    )}
                  </div>

                  <div className="bg-sunken p-4 rounded-md border border-line text-sm transition-colors mb-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold uppercase tracking-wide text-ink-3 mt-0.5">Item</span>
                      <span className="text-xs font-semibold text-ink text-right max-w-[180px]">
                        {d.epi_nome} <span className="text-ink-3">({d.tamanho_nome})</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wide text-ink-3">Motivo</span>
                      <span className="text-xs font-bold text-ink-2 bg-surface px-2 py-0.5 rounded border border-line ">
                        {d.motivo_nome}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-line pt-2 mt-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-ink-3">Quantidade</span>
                      <span className="text-xs font-bold text-ink ">
                        {d.quantidade_a_devolver} un
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBaixarPdf(d.id)}
                    disabled={baixandoPdfId === d.id}
                    className={`w-full py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-colors border ${
                      baixandoPdfId === d.id
                        ? "bg-sunken border-line text-ink-3 cursor-wait"
                        : "bg-sunken text-ink hover:bg-line border-transparent"
                    }`}
                  >
                    {baixandoPdfId === d.id ? (
                      <><span className="w-3.5 h-3.5 border-2 border-line-strong border-t-transparent rounded-full animate-spin"></span> Gerando...</>
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
                  className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${
                    paginaAtual === 1
                      ? "bg-sunken text-ink-3 cursor-not-allowed"
                      : "bg-surface text-ink border border-line hover:bg-sunken "
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>

                <span className="text-xs font-bold text-ink-2 uppercase tracking-wide bg-sunken px-4 py-2 rounded-md border border-line transition-colors">
                  Página <span className="text-ink ">{paginaAtual}</span> de {totalPaginas}
                </span>

                <button
                  onClick={() => setPaginaAtual((p) => Math.min(p + 1, totalPaginas))}
                  disabled={paginaAtual === totalPaginas}
                  className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${
                    paginaAtual === totalPaginas
                      ? "bg-sunken text-ink-3 cursor-not-allowed"
                      : "bg-surface text-ink border border-line hover:bg-sunken "
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