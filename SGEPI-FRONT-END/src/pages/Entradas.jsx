import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ModalEntrada from "../components/modals/ModalEntrada";
import formatarData from "../utils/DatasFormater.js";
import {
  listarEntradas,
  listarEpis,
  listarFornecedores,
  listarTamanhos,
} from "../services/entradaService";
import { temPermissao } from "../utils/permissoes";
import { formatarMoedaEntrada } from "../utils/entradaHelpers";
import {
  normalizarEntrada,
  normalizarEpiEntrada,
  normalizarFornecedorEntrada,
  normalizarTamanhoEntrada,
} from "../utils/entradaNormalizers";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { AlertTriangle, Plus, Search, X, ChevronLeft, ChevronRight, FileDown, Layers, Hash, DollarSign, ChevronDown } from "lucide-react";

function Entradas({ usuarioLogado }) {
  const [entradas, setEntradas] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [epis, setEpis] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);

  const [carregandoTela, setCarregandoTela] = useState(true);
  const [erroTela, setErroTela] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("epiNome");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensPorPagina = 5;

  const podeVisualizar = !usuarioLogado
    ? true
    : temPermissao(usuarioLogado, "visualizar_estoque");

  const perfilUsuario = usuarioLogado?.role;
  const podeCadastrar = !usuarioLogado
    ? true
    : perfilUsuario === "admin" || perfilUsuario === "gerente";

  const gerarPDFEntrada = (entrada) => {
    const doc = new jsPDF();
    const total =
      Number(entrada.quantidade || 0) * Number(entrada.valor_unitario || 0);

    doc.setFontSize(18);
    doc.setTextColor(22, 101, 52);
    doc.text("Comprovante de Entrada de EPI", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data do Registro: ${formatarData(entrada.data_entrada)}`, 14, 28);
    doc.text(`ID do Registro: #00${entrada.id}`, 14, 33);

    doc.setLineWidth(0.2);
    doc.line(14, 38, 196, 38);

    autoTable(doc, {
      startY: 45,
      head: [["Descrição do Campo", "Informação"]],
      body: [
        ["EPI", entrada.epiNome],
        ["Fabricante", entrada.epiFabricante || "-"],
        ["CA", entrada.epiCA || "-"],
        ["Tamanho", entrada.tamanhoNome || "-"],
        ["Lote", entrada.lote || "-"],
        ["Fornecedor", entrada.fornecedorNome],
        [
          "Nota Fiscal",
          `Nº ${entrada.nota_fiscal_numero || "-"} / Série ${
            entrada.nota_fiscal_serie || "-"
          }`,
        ],
        ["Quantidade Adicionada", `${entrada.quantidade} unidades`],
        ["Valor Unitário", formatarMoedaEntrada(entrada.valor_unitario)],
        ["Valor Total da Operação", formatarMoedaEntrada(total)],
      ],
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105] },
      styles: { cellPadding: 4, fontSize: 10 },
    });

    const finalY = doc.lastAutoTable.finalY + 25;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Responsável pelo Lançamento: ${entrada.usuario}`, 14, finalY);

    doc.save(`Entrada_EPI_${entrada.id}_${entrada.lote}.pdf`);
  };

  const carregarEntradas = async () => {
    setCarregandoTela(true);
    setErroTela("");

    try {
      const [resFornecedores, resEpis, resTamanhos, resEntradas] =
        await Promise.all([
          listarFornecedores(),
          listarEpis(),
          listarTamanhos(),
          listarEntradas(),
        ]);

      setFornecedores(resFornecedores.map(normalizarFornecedorEntrada));
      setEpis(resEpis.map(normalizarEpiEntrada));
      setTamanhos(resTamanhos.map(normalizarTamanhoEntrada));
      setEntradas(resEntradas.map(normalizarEntrada));
    } catch (erro) {
      setErroTela("Falha ao carregar dados do servidor.");
      console.error(erro);
    } finally {
      setCarregandoTela(false);
    }
  };

  useEffect(() => {
    carregarEntradas();
  }, []);

  useEffect(() => {
    if (erroTela) {
      toast.error(erroTela);
    }
  }, [erroTela]);

  const entradasResolvidas = useMemo(() => {
    return entradas.map((entrada) => {
      const epi = epis.find((item) => item.id === entrada.IdEpi) || {
        nome: entrada.epi_nome_back,
      };
      const tamanhoObj = tamanhos.find((t) => t.id === entrada.IdTamanho) || {
        tamanho: entrada.tamanho_nome_back,
      };
      const fornecedor = fornecedores.find(
        (f) =>
          (entrada.Idfornecedor > 0 && f.id === entrada.Idfornecedor) ||
          f.razao_social.toLowerCase() ===
            (entrada.fornecedor_nome_back || "").toLowerCase() ||
          f.nome_fantasia.toLowerCase() ===
            (entrada.fornecedor_nome_back || "").toLowerCase()
      );

      return {
        ...entrada,
        epiNome: epi?.nome || entrada.epi_nome_back || "EPI não identificado",
        epiFabricante: epi?.fabricante || entrada.epi_fabricante_back || "-",
        epiCA: entrada.epi_ca_back || epi?.ca || "-",
        tamanhoNome: tamanhoObj?.tamanho || entrada.tamanho_nome_back || "S/T",
        fornecedorNome:
          fornecedor?.nome_fantasia ||
          fornecedor?.razao_social ||
          entrada.fornecedor_nome_back ||
          "Fornecedor não identificado",
        usuario: entrada.usuario_entrada || "Usuário não identificado",
      };
    });
  }, [entradas, epis, tamanhos, fornecedores]);

  const entradasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return entradasResolvidas;

    return entradasResolvidas.filter((entrada) => {
      if (filtroAtivo === "data_entrada") {
        if (!entrada.data_entrada) return false;
        const partes = entrada.data_entrada.split("/");
        if (partes.length === 3) {
          const dataInvertida = `${partes[2]}-${partes[1]}-${partes[0]}`;
          return dataInvertida === termo;
        }
        return false;
      }

      const valorCampo = String(entrada[filtroAtivo] ?? "").toLowerCase();
      return valorCampo.includes(termo);
    });
  }, [entradasResolvidas, busca, filtroAtivo]);

  const entradasOrdenadas = useMemo(() => {
    return [...entradasFiltradas].sort((a, b) => {
      const toDate = (s) => {
        const [d, m, y] = s.split("/");
        return new Date(y, m - 1, d);
      };
      return toDate(b.data_entrada) - toDate(a.data_entrada);
    });
  }, [entradasFiltradas]);

  const resumoTela = useMemo(() => {
    return {
      totalRegistros: entradasOrdenadas.length,
      totalItens: entradasOrdenadas.reduce(
        (acc, item) => acc + Number(item.quantidade || 0),
        0
      ),
      valorTotal: entradasOrdenadas.reduce(
        (acc, item) =>
          acc +
          Number(item.quantidade || 0) * Number(item.valor_unitario || 0),
        0
      ),
    };
  }, [entradasOrdenadas]);

  const totalPaginas = Math.ceil(entradasOrdenadas.length / itensPorPagina) || 1;
  const entradasVisiveis = entradasOrdenadas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  if (!podeVisualizar) {
    return (
      <div className="bg-surface p-8 rounded-md border border-line flex items-center justify-center transition-colors duration-300">
        <div className="bg-atencao-soft border border-atencao-line rounded-md p-6 text-atencao flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de entradas.
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
                Registro de Entradas
              </h2>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Histórico de abastecimento e entradas de estoque.
              </p>
            </div>
          </div>

          {podeCadastrar && (
            <button
              onClick={() => setModalAberto(true)}
              className="w-full lg:w-auto bg-action hover:bg-action-hover text-on-action px-5 py-3 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Nova Entrada
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          <div className="bg-sunken border border-line rounded-md p-5 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-ink-2 ">
              <Layers className="w-4 h-4" />
              <p className="text-xs uppercase font-bold tracking-wide">
                Registros
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink mt-auto tracking-tight transition-colors">
              {carregandoTela ? "--" : resumoTela.totalRegistros}
            </p>
          </div>

          <div className="bg-sunken border border-line rounded-md p-5 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-ink ">
              <Hash className="w-4 h-4" />
              <p className="text-xs uppercase font-bold tracking-wide">
                Quantidade Total
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink mt-auto tracking-tight transition-colors">
              {carregandoTela ? "--" : resumoTela.totalItens}
            </p>
          </div>

          <div className="bg-ok-soft border border-ok-line rounded-md p-5 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-ok ">
              <DollarSign className="w-4 h-4" />
              <p className="text-xs uppercase font-bold tracking-wide">
                Valor Total
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ok mt-auto tracking-tight transition-colors">
              {carregandoTela ? "--" : formatarMoedaEntrada(resumoTela.valorTotal)}
            </p>
          </div>
        </div>

        <div className="relative mb-8 flex flex-col md:flex-row items-stretch md:items-center bg-sunken rounded-md border border-line transition-colors p-1.5 gap-1.5 md:gap-0">
          <div className="relative w-full md:w-auto bg-surface rounded-md md:rounded-l-md md:rounded-r-none border border-line md:border-r-0 flex items-center px-4 py-1 h-[46px]">
            <select
              value={filtroAtivo}
              onChange={(e) => {
                setFiltroAtivo(e.target.value);
                setBusca("");
                setPaginaAtual(1);
              }}
              className="bg-transparent text-ink-2 font-bold text-xs uppercase tracking-wide outline-none pr-6 appearance-none w-full md:w-40 cursor-pointer h-full"
            >
              <option value="epiNome">EPI / Item</option>
              <option value="data_entrada">Data</option>
              <option value="fornecedorNome">Fornecedor</option>
              <option value="lote">Lote</option>
              <option value="nota_fiscal_numero">Nota Fiscal</option>
            </select>
            <ChevronDown className="absolute right-3 w-4 h-4 text-ink-3 pointer-events-none" />
          </div>

          <div className="relative flex items-center bg-surface rounded-md md:rounded-r-md md:rounded-l-none border border-line flex-1 w-full transition-colors h-[46px]">
            <div className="pl-4 text-ink-3 ">
              <Search className="w-4 h-4" />
            </div>
            <input
              type={filtroAtivo === "data_entrada" ? "date" : "text"}
              placeholder="Pesquisar..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-ink outline-none placeholder-ink-3 h-full"
            />
            {busca && (
              <button
                onClick={() => {
                  setBusca("");
                  setPaginaAtual(1);
                }}
                className="absolute right-3 p-1 rounded-md text-ink-3 hover:text-ink-2 hover:bg-sunken transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {carregandoTela ? (
          <div className="border border-dashed border-line-strong rounded-md p-12 flex flex-col items-center justify-center text-ink-2 gap-3">
            <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando entradas...</span>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-md border border-line transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sunken border-b border-line transition-colors">
                  <tr>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Data</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">EPI / Item</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Tam.</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Qtd.</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Fornecedor / Lote</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-right">Total</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line transition-colors">
                  {entradasVisiveis.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-ink-2 font-medium">
                        Nenhuma entrada encontrada.
                      </td>
                    </tr>
                  ) : (
                    entradasVisiveis.map((entrada) => {
                      const total =
                        Number(entrada.quantidade || 0) *
                        Number(entrada.valor_unitario || 0);

                      return (
                        <tr key={entrada.id} className="hover:bg-sunken transition duration-150 group">
                          <td className="p-4">
                            <span className="text-xs font-bold font-mono text-ink bg-sunken px-2 py-1 rounded block w-fit">
                              {entrada.data_entrada}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-sm text-ink transition-colors">
                              {entrada.epiNome}
                            </div>
                            <div className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide transition-colors">
                              CA: {entrada.epiCA}
                            </div>
                          </td>
                          <td className="p-4 text-center font-semibold text-sm text-ink-2 transition-colors">
                            {entrada.tamanhoNome}
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-ok-soft text-ok border border-ok-line text-xs font-bold px-2.5 py-1 rounded-md transition-colors ">
                              +{entrada.quantidade}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-sm text-ink truncate max-w-[150px] transition-colors">
                              {entrada.fornecedorNome}
                            </div>
                            <div className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide transition-colors">
                              LOTE: {entrada.lote}
                            </div>
                          </td>
                          <td className="p-4 text-right text-ok font-bold font-mono text-sm transition-colors">
                            {formatarMoedaEntrada(total)}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => gerarPDFEntrada(entrada)}
                              className="p-2 mx-auto rounded-md bg-sunken text-ink-2 border border-transparent hover:border-ok-line hover:text-ok hover:bg-ok-soft transition-all flex items-center justify-center"
                              title="Baixar Comprovante PDF"
                            >
                              <FileDown className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-4">
              {entradasVisiveis.length === 0 ? (
                 <div className="text-center py-8 text-ink-2 bg-sunken rounded-md border border-dashed border-line-strong transition-colors text-sm font-medium">
                  Nenhuma entrada encontrada.
                </div>
              ) : (
                entradasVisiveis.map((entrada) => (
                  <div
                    key={entrada.id}
                    className="bg-surface border border-line rounded-md p-5 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold font-mono text-ink bg-sunken px-2 py-1 rounded">
                        {entrada.data_entrada}
                      </span>
                      <button
                        onClick={() => gerarPDFEntrada(entrada)}
                        className="text-ok bg-ok-soft p-1.5 rounded-md border border-ok-line transition-colors"
                        title="Baixar PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <h3 className="font-bold text-ink transition-colors text-lg leading-tight">
                      {entrada.epiNome}
                    </h3>
                    <p className="text-xs text-ink-3 font-mono mt-1 uppercase tracking-wide transition-colors mb-4">
                      CA: {entrada.epiCA} • LOTE: {entrada.lote}
                    </p>

                    <div className="grid grid-cols-2 gap-3 bg-sunken p-4 rounded-md border border-line text-sm transition-colors">
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wide text-ink-3 mb-0.5">Fornecedor</span>
                        <span className="text-xs font-semibold text-ink truncate block">{entrada.fornecedorNome}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wide text-ink-3 mb-0.5">Total</span>
                        <span className="text-xs font-bold font-mono text-ok block">
                          {formatarMoedaEntrada(Number(entrada.quantidade || 0) * Number(entrada.valor_unitario || 0))}
                        </span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-line mt-1 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wide text-ink-3 ">Quantidade</span>
                        <span className="bg-ok-soft text-ok border border-ok-line text-xs font-bold px-2 py-0.5 rounded-md ">
                          +{entrada.quantidade} un
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(p - 1, 1))}
                  disabled={paginaAtual === 1}
                  className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${
                    paginaAtual === 1
                      ? "bg-sunken text-ink-3 cursor-not-allowed"
                      : "bg-surface text-ok border border-line hover:bg-ok-soft hover:border-ok-line "
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
                      : "bg-surface text-ok border border-line hover:bg-ok-soft hover:border-ok-line "
                  }`}
                >
                  Próxima <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modalAberto && (
        <ModalEntrada
          aberto={modalAberto}
          fornecedores={fornecedores}
          epis={epis}
          tamanhos={tamanhos}
          onClose={() => setModalAberto(false)}
          onSalvar={async () => {
            setModalAberto(false);
            await carregarEntradas();
            setPaginaAtual(1);
            toast.success("Entrada cadastrada com sucesso!");
          }}
        />
      )}
    </>
  );
}

export default Entradas;