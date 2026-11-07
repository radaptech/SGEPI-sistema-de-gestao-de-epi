import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ModalDetalhesEstoque from "../components/modals/ModalDetalhesEstoque";
import { CancelarEntrada, ValidarRegrasCancelamento } from "../services/estoqueService";
import { api } from "../services/api";
import { temPermissao } from "../utils/permissoes";
import {
  calcularStatusValidade,
  formatarPreco,
  formatarValidade,
  getStatusTexto,
} from "../utils/estoqueHelpers";
import { normalizarEntradaCompleta } from "../utils/estoqueNormalizers";

import { 
  PackageSearch, AlertTriangle, CheckCircle2, Clock, Trash2, 
  Search, ListFilter, Eye, ChevronLeft, ChevronRight, X, 
  LayoutGrid, Package, AlertCircle, PackageX, DollarSign, ShieldAlert
} from "lucide-react";

function getAlertaValidade(status) {
  if (status === "vencido") {
    return {
      texto: "Validade vencida",
      classe: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50",
      icone: <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />,
    };
  }
  if (status === "proximo" || status === "proximo_vencimento") {
    return {
      texto: "Próximo do vencimento",
      classe: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50",
      icone: <Clock className="w-3 h-3" strokeWidth={2.5} />,
    };
  }
  return {
    texto: "Dentro da validade",
    classe: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50",
    icone: <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />,
  };
}

function Estoque({ usuarioLogado }) {
  const [entradas, setEntradas] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("nome");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erroTela, setErroTela] = useState("");
  const [itemDetalhe, setItemDetalhe] = useState(null);

  const itensPorPagina = 5;
  const podeVisualizar = temPermissao(usuarioLogado, "visualizar_estoque");

  const carregarProdutos = async () => {
    setCarregando(true);
    setErroTela("");

    try {
      const lotes = await api.get("/entradas-estoque");
      setEntradas((lotes ?? []).map(normalizarEntradaCompleta));
    } catch (erro) {
      console.error("Erro ao buscar estoque:", erro);
      setErroTela("Não foi possível carregar o estoque.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    if (erroTela) {
      toast.error(erroTela);
    }
  }, [erroTela]);

  const handleCancelarEntrada = async (item) => {
    const idParaApagar = item.id;

    try {
      ValidarRegrasCancelamento(item);

      if (
        !window.confirm(
          `ATENÇÃO: Deseja realmente cancelar a entrada do lote ${item.lote} de ${item.nome}? Esta ação subtrairá as quantidades do estoque atual.`
        )
      ) {
        return;
      }

      setCarregando(true);
      await CancelarEntrada(idParaApagar);
      toast.success("Entrada cancelada e estoque revertido com sucesso!");
      await carregarProdutos();

    } catch (erro) {
      console.error("Erro na exclusão:", erro);
      toast.error(erro.message || "Não foi possível cancelar a entrada.");
    } finally {
      setCarregando(false);
    }
  };

  const aplicarFiltroRapido = (tipo, valor) => {
    setFiltroAtivo(tipo);
    setBusca(valor);
    setPaginaAtual(1);
  };

  const listaFiltrada = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return entradas;

    return entradas.filter((item) => {
      if (filtroAtivo === "logica_estoque") {
        const qtd = Number(item.quantidadeAtual || 0);
        const alerta = Number(item.alertaMinimo || 0);
        if (termo === "baixo") return qtd > 0 && qtd <= alerta;
        if (termo === "vazio") return qtd <= 0;
        if (termo === "disponivel") return qtd > 0;
        return true;
      }

      if (filtroAtivo === "status_validade") {
        const statusReal = calcularStatusValidade(item.validade);
        if (termo === "vencido") return statusReal === "vencido";
        if (termo === "proximo")
          return statusReal === "proximo" || statusReal === "proximo_vencimento";
        if (termo === "normal" || termo === "em_dia") return statusReal === "normal";
        return false;
      }

      if (filtroAtivo === "data_entrada") {
        if (!item.data_entrada || item.data_entrada === "-") return false;
        const partes = item.data_entrada.split("/");
        if (partes.length === 3) {
          const dataInvertida = `${partes[2]}-${partes[1]}-${partes[0]}`;
          return dataInvertida === termo;
        }
        return false;
      }

      const valorCampo = String(item[filtroAtivo] ?? "").toLowerCase();
      return valorCampo.includes(termo);
    });
  }, [entradas, busca, filtroAtivo]);

  const listaOrdenada = useMemo(() => {
    return [...listaFiltrada].sort((a, b) => {
      const parseData = (dataStr) => {
        if (!dataStr || dataStr === "-") return 0;
        if (dataStr.includes('/')) {
          const [dia, mes, ano] = dataStr.split('/');
          return new Date(ano, mes - 1, dia).getTime();
        }
        return new Date(dataStr).getTime();
      };

      const dataA = parseData(a.data_entrada);
      const dataB = parseData(b.data_entrada);

      if (dataA !== dataB) {
        return dataB - dataA;
      }

      return (a.nome || "").localeCompare(b.nome || "");
    });
  }, [listaFiltrada]);

  const resumo = useMemo(() => {
    const totalLotes = entradas.length;
    const totalItens = entradas.reduce(
      (acc, item) => acc + Number(item.quantidadeAtual || 0),
      0
    );
    const estoqueBaixo = entradas.filter(
      (item) =>
        Number(item.quantidadeAtual || 0) > 0 &&
        Number(item.quantidadeAtual || 0) <= Number(item.alertaMinimo || 0)
    ).length;
    const semEstoque = entradas.filter(
      (item) => Number(item.quantidadeAtual || 0) <= 0
    ).length;
    const valorTotal = entradas.reduce(
      (acc, item) => acc + Number(item.valorTotal || 0),
      0
    );

    return { totalLotes, totalItens, estoqueBaixo, semEstoque, valorTotal };
  }, [entradas]);

  const totalPaginas = Math.max(1, Math.ceil(listaOrdenada.length / itensPorPagina));

  useEffect(() => {
    if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
  }, [paginaAtual, totalPaginas]);

  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const itensVisiveis = listaOrdenada.slice(indexPrimeiroItem, indexUltimoItem);

  if (!podeVisualizar) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 text-amber-700 dark:text-amber-400 flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de estoque.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 max-w-full relative transition-colors duration-300">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 transition-colors duration-300">
              <PackageSearch className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Controle de Estoque
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                Visualize lotes, tamanhos e validade dos EPIs.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 mb-8">
          <div
            onClick={() => aplicarFiltroRapido("nome", "")}
            className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-[0.98] group flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              <LayoutGrid className="w-4 h-4" />
              <span className="text-[11px] uppercase font-bold tracking-widest">Todos Lotes</span>
            </div>
            <strong className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {carregando ? "--" : resumo.totalLotes}
            </strong>
          </div>

          <div
            onClick={() => aplicarFiltroRapido("logica_estoque", "disponivel")}
            className="rounded-2xl border border-blue-100 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all active:scale-[0.98] group flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Package className="w-4 h-4" />
              <span className="text-[11px] uppercase font-bold tracking-widest">Em Estoque</span>
            </div>
            <strong className="text-2xl sm:text-3xl font-black text-blue-800 dark:text-blue-300 tracking-tight">
              {carregando ? "--" : resumo.totalItens}
            </strong>
          </div>

          <div
            onClick={() => aplicarFiltroRapido("logica_estoque", "baixo")}
            className="rounded-2xl border border-amber-100 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-amber-200 dark:hover:border-amber-700 transition-all active:scale-[0.98] group flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[11px] uppercase font-bold tracking-widest">Estoque Baixo</span>
            </div>
            <strong className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-400 tracking-tight">
              {carregando ? "--" : resumo.estoqueBaixo}
            </strong>
          </div>

          <div
            onClick={() => aplicarFiltroRapido("logica_estoque", "vazio")}
            className="rounded-2xl border border-red-100 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 sm:p-5 cursor-pointer hover:shadow-md hover:border-red-200 dark:hover:border-red-700 transition-all active:scale-[0.98] group flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <PackageX className="w-4 h-4" />
              <span className="text-[11px] uppercase font-bold tracking-widest">Sem Estoque</span>
            </div>
            <strong className="text-2xl sm:text-3xl font-black text-red-800 dark:text-red-400 tracking-tight">
              {carregando ? "--" : resumo.semEstoque}
            </strong>
          </div>

          <div className="rounded-2xl border border-emerald-100 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 p-4 sm:p-5 flex flex-col gap-2 transition-colors">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
              <DollarSign className="w-4 h-4" />
              <span className="text-[11px] uppercase font-bold tracking-widest">Valor Estimado</span>
            </div>
            <strong className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-400 tracking-tight mt-auto">
              {carregando ? "--" : formatarPreco(resumo.valorTotal)}
            </strong>
          </div>
        </div>

        <div className="flex flex-col md:flex-row mb-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 transition-colors p-1.5 gap-1.5">
          
          <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 flex-1 transition-colors">
            <div className="pl-4 text-slate-400 dark:text-slate-500">
              {filtroAtivo === "status_validade" ? <ShieldAlert className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </div>

            {filtroAtivo === "status_validade" ? (
              <select
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none appearance-none cursor-pointer"
              >
                <option value="">Todos os status...</option>
                <option value="vencido">Vencidos</option>
                <option value="proximo">Próximos de Vencer</option>
                <option value="normal">Dentro da Validade</option>
              </select>
            ) : (
              <input
                type={filtroAtivo === "data_entrada" ? "date" : "text"}
                placeholder="Pesquisar lotes, nomes ou fabricantes..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none placeholder-slate-400"
              />
            )}

            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 md:w-56 transition-colors">
            <div className="pl-4 text-slate-400 dark:text-slate-500 pointer-events-none">
               <ListFilter className="w-4 h-4" />
            </div>
            <select
              value={filtroAtivo}
              onChange={(e) => {
                setFiltroAtivo(e.target.value);
                setBusca("");
                setPaginaAtual(1);
              }}
              className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 outline-none appearance-none cursor-pointer"
            >
              <option value="nome">Nome do EPI</option>
              <option value="status_validade">Validade</option>
              <option value="data_entrada">Entrada</option>
              <option value="fabricante">Fabricante</option>
              <option value="ca">CA</option>
              <option value="lote">Lote</option>
              <option value="tipoProtecao">Proteção</option>
              <option value="tamanho">Tamanho</option>
            </select>
          </div>

        </div>
        {carregando ? (
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando estoque...</span>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60 transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60 transition-colors">
                  <tr>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">EPI</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Entrada</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Lote / CA</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Tam.</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Preço Unit.</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Qtd. Inicial</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Qtd. Atual</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Validade</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {itensVisiveis.length > 0 ? (
                    itensVisiveis.map((item) => {
                      const validadeStatus = calcularStatusValidade(item.validade);
                      const alertaValidade = getAlertaValidade(validadeStatus);

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150 group"
                        >
                          <td className="p-4">
                            <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                              {item.nome}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                              {item.fabricante || "-"}
                            </div>
                          </td>

                          <td className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {formatarValidade(item.data_entrada)}
                          </td>

                          <td className="p-4 text-center">
                            <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 block">
                              {item.lote}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5 block">
                              CA: {item.ca}
                            </span>
                          </td>

                          <td className="p-4 text-center text-slate-600 dark:text-slate-300 text-sm font-semibold">
                            {item.tamanho}
                          </td>

                          <td className="p-4 text-center text-slate-600 dark:text-slate-300 text-sm font-semibold">
                            {formatarPreco(item.preco)}
                          </td>

                          <td className="p-4 text-center">
                            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                              {item.quantidadeInicial}
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-bold border ${Number(item.quantidadeAtual) <= Number(item.alertaMinimo)
                                    ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50"
                                  }`}
                              >
                                {item.quantidadeAtual}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                                {getStatusTexto(item.quantidadeAtual, item.alertaMinimo)}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-slate-700 dark:text-slate-300 text-sm font-bold">
                                {formatarValidade(item.validade)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border ${alertaValidade.classe}`}
                              >
                                {alertaValidade.icone}
                                {alertaValidade.texto}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setItemDetalhe(item)}
                                title="Ver Detalhes"
                                className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-transparent hover:border-slate-200 hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelarEntrada(item)}
                                title="Cancelar Entrada"
                                className="p-2 rounded-xl bg-red-50 text-red-600 border border-transparent hover:border-red-200 hover:bg-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                        Nenhum item encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-4">
              {itensVisiveis.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-2xl p-5 shadow-sm transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-extrabold text-slate-900 dark:text-white">{item.nome}</h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                      {formatarValidade(item.data_entrada)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 text-xs font-semibold mb-4">
                    <p className="dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase tracking-widest mb-0.5">Lote</span> 
                      {item.lote}
                    </p>
                    <p className="dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase tracking-widest mb-0.5">Tamanho</span> 
                      {item.tamanho}
                    </p>
                    <p className="dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase tracking-widest mb-0.5">Qtd. Inicial</span>
                      {item.quantidadeInicial}
                    </p>
                    <p>
                      <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase tracking-widest mb-0.5">Qtd. Atual</span>
                      <span
                        className={`font-extrabold ${Number(item.quantidadeAtual) <= Number(item.alertaMinimo)
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400"
                          }`}
                      >
                        {item.quantidadeAtual}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                    <button
                      onClick={() => setItemDetalhe(item)}
                      className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      <Eye className="w-4 h-4" /> Detalhes
                    </button>
                    <button
                      onClick={() => handleCancelarEntrada(item)}
                      title="Cancelar"
                      className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl text-sm border border-transparent hover:border-red-200 dark:hover:border-red-800/50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <button
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${paginaAtual === 1
                    ? "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-slate-600"
                  }`}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>

              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                Página <span className="text-slate-800 dark:text-white">{paginaAtual}</span> de {totalPaginas}
              </span>

              <button
                onClick={() =>
                  setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
                }
                disabled={paginaAtual === totalPaginas}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${paginaAtual === totalPaginas
                    ? "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-slate-600"
                  }`}
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      <ModalDetalhesEstoque
        aberto={!!itemDetalhe}
        item={itemDetalhe}
        onClose={() => setItemDetalhe(null)}
      />
    </>
  );
}

export default Estoque;