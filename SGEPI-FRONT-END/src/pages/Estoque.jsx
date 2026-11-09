import DashboardCard from "../components/DashboardCard";
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

import { AlertTriangle, CheckCircle2, Clock, Trash2, Search, ListFilter, Eye, ChevronLeft, ChevronRight, X, ShieldAlert } from "lucide-react";
import Selecao from "../components/Selecao";

function getAlertaValidade(status) {
  if (status === "vencido") {
    return {
      texto: "Validade vencida",
      classe: "bg-erro-soft text-erro border-erro-line ",
      icone: <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />,
    };
  }
  if (status === "proximo" || status === "proximo_vencimento") {
    return {
      texto: "Próximo do vencimento",
      classe: "bg-atencao-soft text-atencao border-atencao-line ",
      icone: <Clock className="w-3 h-3" strokeWidth={2.5} />,
    };
  }
  return {
    texto: "Dentro da validade",
    classe: "bg-ok-soft text-ok border-ok-line ",
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
      <div className="bg-surface p-8 rounded-md border border-line flex items-center justify-center transition-colors duration-300">
        <div className="bg-atencao-soft border border-atencao-line rounded-md p-6 text-atencao flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de estoque.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-full">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-ink tracking-tight transition-colors">
                Controle de Estoque
              </h2>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Visualize lotes, tamanhos e validade dos EPIs.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-8">
          <DashboardCard card={{ titulo: "Todos os lotes", valor: carregando ? "--" : resumo.totalLotes }} onClick={() => aplicarFiltroRapido("nome", "")} />
          <DashboardCard card={{ titulo: "Em estoque", valor: carregando ? "--" : resumo.totalItens }} onClick={() => aplicarFiltroRapido("logica_estoque", "disponivel")} />
          <DashboardCard card={{ titulo: "Estoque baixo", grupo: "pendencia", estado: "atencao", valor: carregando ? "--" : resumo.estoqueBaixo }} onClick={() => aplicarFiltroRapido("logica_estoque", "baixo")} />
          <DashboardCard card={{ titulo: "Sem estoque", grupo: "pendencia", estado: "erro", valor: carregando ? "--" : resumo.semEstoque }} onClick={() => aplicarFiltroRapido("logica_estoque", "vazio")} />
          <DashboardCard card={{ titulo: "Valor estimado", valor: carregando ? "--" : formatarPreco(resumo.valorTotal) }} />
        </div>

        <div className="flex flex-col md:flex-row mb-6 bg-sunken rounded-md border border-line transition-colors p-1.5 gap-1.5">
          
          <div className="relative flex items-center bg-surface rounded-md border border-line flex-1 transition-colors">
            <div className="pl-4 text-ink-3 ">
              {filtroAtivo === "status_validade" ? <ShieldAlert className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </div>

            {filtroAtivo === "status_validade" ? (
              <Selecao
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-ink outline-none appearance-none cursor-pointer"
              >
                <option value="">Todos os status...</option>
                <option value="vencido">Vencidos</option>
                <option value="proximo">Próximos de Vencer</option>
                <option value="normal">Dentro da Validade</option>
              </Selecao>
            ) : (
              <input
                type={filtroAtivo === "data_entrada" ? "date" : "text"}
                placeholder="Pesquisar lotes, nomes ou fabricantes..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-ink outline-none placeholder-ink-3"
              />
            )}

            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 p-1 rounded-md text-ink-3 hover:text-ink-2 hover:bg-sunken transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative flex items-center bg-surface rounded-md border border-line md:w-56 transition-colors">
            <div className="pl-4 text-ink-3 pointer-events-none">
               <ListFilter className="w-4 h-4" />
            </div>
            <Selecao
              value={filtroAtivo}
              onChange={(e) => {
                setFiltroAtivo(e.target.value);
                setBusca("");
                setPaginaAtual(1);
              }}
              className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-xs font-bold uppercase tracking-wide text-ink-2 outline-none appearance-none cursor-pointer"
            >
              <option value="nome">Nome do EPI</option>
              <option value="status_validade">Validade</option>
              <option value="data_entrada">Entrada</option>
              <option value="fabricante">Fabricante</option>
              <option value="ca">CA</option>
              <option value="lote">Lote</option>
              <option value="tipoProtecao">Proteção</option>
              <option value="tamanho">Tamanho</option>
            </Selecao>
          </div>

        </div>
        {carregando ? (
          <div className="border border-dashed border-line-strong rounded-md p-12 flex flex-col items-center justify-center text-ink-2 gap-3">
            <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando estoque...</span>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-md border border-line transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sunken border-b border-line transition-colors">
                  <tr>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">EPI</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Entrada</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Lote / CA</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Tam.</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Preço Unit.</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Qtd. Inicial</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Qtd. Atual</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Validade</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line ">
                  {itensVisiveis.length > 0 ? (
                    itensVisiveis.map((item) => {
                      const validadeStatus = calcularStatusValidade(item.validade);
                      const alertaValidade = getAlertaValidade(validadeStatus);

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-sunken transition duration-150 group"
                        >
                          <td className="p-4">
                            <div className="font-bold text-sm text-ink ">
                              {item.nome}
                            </div>
                            <div className="text-xs text-ink-2 mt-0.5 font-medium">
                              {item.fabricante || "-"}
                            </div>
                          </td>

                          <td className="p-4 text-sm font-semibold text-ink-2 ">
                            {formatarValidade(item.data_entrada)}
                          </td>

                          <td className="p-4 text-center">
                            <span className="text-xs font-bold font-mono text-ink block">
                              {item.lote}
                            </span>
                            <span className="text-xs text-ink-3 font-mono mt-0.5 block">
                              CA {item.ca}
                            </span>
                          </td>

                          <td className="p-4 text-center text-ink-2 text-sm font-semibold">
                            {item.tamanho}
                          </td>

                          <td className="p-4 text-center text-ink-2 text-sm font-semibold">
                            {formatarPreco(item.preco)}
                          </td>

                          <td className="p-4 text-center">
                            <span className="text-sm font-bold text-ink-3 ">
                              {item.quantidadeInicial}
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-bold border ${Number(item.quantidadeAtual) <= Number(item.alertaMinimo)
                                    ? "bg-erro-soft text-erro border-erro-line "
                                    : "bg-ok-soft text-ok border-ok-line "
                                  }`}
                              >
                                {item.quantidadeAtual}
                              </span>
                              <span className="text-xs text-ink-3 font-bold uppercase tracking-wide">
                                {getStatusTexto(item.quantidadeAtual, item.alertaMinimo)}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-ink text-sm font-bold">
                                {formatarValidade(item.validade)}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs font-bold uppercase tracking-wide border ${alertaValidade.classe}`}
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
                                className="p-2 rounded-md bg-sunken text-ink-2 border border-transparent hover:border-line hover:bg-surface transition-all"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelarEntrada(item)}
                                title="Cancelar Entrada"
                                className="p-2 rounded-md bg-erro-soft text-erro border border-transparent hover:border-erro-line hover:bg-surface transition-all"
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
                      <td colSpan="9" className="p-8 text-center text-ink-2 font-medium">
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
                  className="bg-surface border border-line rounded-md p-5 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-ink ">{item.nome}</h3>
                    <span className="text-xs bg-sunken px-2 py-1 rounded-md font-bold uppercase tracking-wide text-ink-2 ">
                      {formatarValidade(item.data_entrada)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 text-xs font-semibold mb-4">
                    <p className="">
                      <span className="text-ink-3 block text-xs uppercase tracking-wide mb-0.5">Lote</span> 
                      {item.lote}
                    </p>
                    <p className="">
                      <span className="text-ink-3 block text-xs uppercase tracking-wide mb-0.5">Tamanho</span> 
                      {item.tamanho}
                    </p>
                    <p className="">
                      <span className="text-ink-3 block text-xs uppercase tracking-wide mb-0.5">Qtd. Inicial</span>
                      {item.quantidadeInicial}
                    </p>
                    <p>
                      <span className="text-ink-3 block text-xs uppercase tracking-wide mb-0.5">Qtd. Atual</span>
                      <span
                        className={`font-bold ${Number(item.quantidadeAtual) <= Number(item.alertaMinimo)
                            ? "text-erro "
                            : "text-ok "
                          }`}
                      >
                        {item.quantidadeAtual}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2 border-t border-line pt-4">
                    <button
                      onClick={() => setItemDetalhe(item)}
                      className="flex-1 py-2.5 bg-sunken text-ink font-bold rounded-md text-xs flex items-center justify-center gap-2 hover:bg-sunken transition"
                    >
                      <Eye className="w-4 h-4" /> Detalhes
                    </button>
                    <button
                      onClick={() => handleCancelarEntrada(item)}
                      title="Cancelar"
                      className="px-4 py-2.5 bg-erro-soft text-erro font-bold rounded-md text-sm border border-transparent hover:border-erro-line transition"
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
                className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${paginaAtual === 1
                    ? "bg-sunken text-ink-3 cursor-not-allowed"
                    : "bg-surface text-ink border border-line hover:bg-sunken hover:border-line "
                  }`}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>

              <span className="text-xs font-bold text-ink-2 uppercase tracking-wide bg-sunken px-4 py-2 rounded-md border border-line ">
                Página <span className="text-ink ">{paginaAtual}</span> de {totalPaginas}
              </span>

              <button
                onClick={() =>
                  setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
                }
                disabled={paginaAtual === totalPaginas}
                className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${paginaAtual === totalPaginas
                    ? "bg-sunken text-ink-3 cursor-not-allowed"
                    : "bg-surface text-ink border border-line hover:bg-sunken hover:border-line "
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