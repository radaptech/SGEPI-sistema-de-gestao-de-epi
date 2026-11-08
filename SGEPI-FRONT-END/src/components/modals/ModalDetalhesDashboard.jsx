import React, { useState, useMemo, useEffect, Fragment } from "react";
import {
  X, Search, FilterX, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Inbox
} from "lucide-react";
import Dialogo from "../Dialogo";

function ModalDetalhesDashboard({
  aberto,
  titulo,
  subtitulo,
  icon,
  colunas = [],
  subColunas = null,
  chaveSubItens = "itens",
  dados = [],
  tipo = "tabela",
  onClose,
}) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [busca, setBusca] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const [linhaExpandida, setLinhaExpandida] = useState(null);

  const itensPorPagina = 10;

  const temFiltroDeDatasNoConteudo =
    titulo === "Histórico de Entregas" || titulo === "Entregas do mês" || titulo === "Entregas no mês";

  const obterDataDoItem = (item) => {
    return (
      item?.data ||
      item?.dataEntrada ||
      item?.dataEntrega ||
      item?.dataMovimento ||
      item?.createdAt ||
      item?.updatedAt ||
      null
    );
  };

  const normalizarData = (valor) => {
    if (!valor) return null;
    if (valor instanceof Date) return valor;
    if (typeof valor === "string") {
      const valorLimpo = valor.trim();
      if (valorLimpo.includes("/")) {
        const [dia, mes, ano] = valorLimpo.split("/");
        if (dia && mes && ano) {
          return new Date(`${ano}-${mes}-${dia}T00:00:00`);
        }
      }
      return new Date(valorLimpo);
    }
    return new Date(valor);
  };

  const dadosFiltrados = useMemo(() => {
    return (dados || []).filter((item) => {
      const textoBusca = busca.trim().toLowerCase();
      const textoBuscaNormalizado = textoBusca.replace(",", ".");

      const passaBusca =
        !textoBusca ||
        Object.values(item || {}).some((valor) => {
          const valorTexto = String(valor ?? "").toLowerCase();
          const valorNormalizado = valorTexto.replace(",", ".");
          return (
            valorTexto.includes(textoBusca) ||
            valorNormalizado.includes(textoBuscaNormalizado)
          );
        });

      const dataItemBruta = obterDataDoItem(item);
      const dataItem = normalizarData(dataItemBruta);

      const inicio = dataInicial ? new Date(`${dataInicial}T00:00:00`) : null;
      const fim = dataFinal ? new Date(`${dataFinal}T23:59:59`) : null;
      const temFiltroDeData = inicio || fim;

      const passaData =
        !temFiltroDeDatasNoConteudo ||
        !temFiltroDeData ||
        (dataItem &&
          !Number.isNaN(dataItem.getTime()) &&
          (!inicio || dataItem >= inicio) &&
          (!fim || dataItem <= fim));

      return passaBusca && passaData;
    });
  }, [dados, busca, dataInicial, dataFinal, temFiltroDeDatasNoConteudo]);

  useEffect(() => {
    setPaginaAtual(1);
    setLinhaExpandida(null);
  }, [dados, aberto, busca, dataInicial, dataFinal]);

  useEffect(() => {
    if (!aberto) limparFiltros();
  }, [aberto]);

  const totalPaginas = Math.ceil((dadosFiltrados?.length || 0) / itensPorPagina);

  const dadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return dadosFiltrados?.slice(inicio, fim) || [];
  }, [dadosFiltrados, paginaAtual]);

  const limparFiltros = () => {
    setBusca("");
    setDataInicial("");
    setDataFinal("");
    setPaginaAtual(1);
    setLinhaExpandida(null);
  };

  const toggleExpandir = (idItem) => {
    setLinhaExpandida(linhaExpandida === idItem ? null : idItem);
  };

  const temFiltrosAtivos = busca || dataInicial || dataFinal;

  if (!aberto) return null;

  const baseInputClass = "w-full px-4 py-2.5 rounded-md text-sm font-medium outline-none transition-all disabled:opacity-50 bg-surface border border-line focus:ring-1 focus:ring-ink focus:border-ink placeholder-ink-3";
  const labelClass = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 transition-colors";

  return (
    <Dialogo onClose={onClose} className="fixed inset-0 z-[120] bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink ">
      <div className="w-full max-w-6xl max-h-[95vh] bg-surface rounded-md shadow-modal border border-line overflow-hidden flex flex-col transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-sunken flex items-center justify-center text-ink shrink-0 transition-colors">
              {icon || <Inbox className="w-6 h-6" strokeWidth={2.5} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-ink tracking-tight truncate transition-colors">
                {titulo}
              </h2>
              <p className="text-sm text-ink-2 mt-1 truncate transition-colors">
                {subtitulo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-sunken custom-scrollbar transition-colors">
          <div className="mb-6 rounded-md border border-line bg-surface p-5 transition-colors">
            <div className={`grid grid-cols-1 ${temFiltroDeDatasNoConteudo ? "md:grid-cols-[1.4fr_1fr_1fr_auto]" : "md:grid-cols-[1fr_auto]"} gap-4 items-end`}>
              <div className="relative">
                <label htmlFor="detalhesdashboard-1" className={labelClass}>Buscar</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
                  <input id="detalhesdashboard-1"
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por item, tamanho, valor..."
                    className={`${baseInputClass} pl-10`}
                  />
                </div>
              </div>

              {temFiltroDeDatasNoConteudo && (
                <>
                  <div>
                    <label htmlFor="detalhesdashboard-2" className={labelClass}>Data inicial</label>
                    <input id="detalhesdashboard-2" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} className={baseInputClass} />
                  </div>
                  <div>
                    <label htmlFor="detalhesdashboard-3" className={labelClass}>Data final</label>
                    <input id="detalhesdashboard-3" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} className={baseInputClass} />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={limparFiltros}
                disabled={!temFiltrosAtivos}
                className="h-[42px] px-6 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition-all w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed bg-sunken text-ink-2 hover:bg-line "
              >
                <FilterX className="w-4 h-4" />
                Limpar
              </button>
            </div>

            {temFiltrosAtivos && (
              <p className="mt-4 text-xs font-medium text-ink-2 flex items-center gap-1.5 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-action"></span>
                Filtros aplicados. Exibindo <b className="text-ink ">{dadosFiltrados.length}</b> de <b className="text-ink ">{dados.length}</b> registros.
              </p>
            )}
          </div>

          {dadosFiltrados.length === 0 ? (
            <div className="rounded-md border-2 border-dashed border-line bg-surface p-12 flex flex-col items-center justify-center text-center transition-colors">
              <Search className="w-10 h-10 text-ink-3 mb-4" />
              <h3 className="text-lg font-bold text-ink ">Nenhum registro encontrado</h3>
              <p className="text-sm text-ink-2 mt-1">Tente ajustar ou limpar os filtros de busca.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto rounded-md border border-line bg-surface transition-colors">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-sunken border-b border-line transition-colors">
                    <tr>
                      {colunas.map((coluna) => (
                        <th key={coluna.key} className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide whitespace-nowrap">
                          {coluna.label}
                        </th>
                      ))}
                      {subColunas && <th className="p-4 w-12"></th>}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-line ">
                    {dadosPaginados.map((item, index) => {
                      const idItem = item.id ?? index;
                      const isExpandido = linhaExpandida === idItem;
                      const temSubItens = subColunas && item[chaveSubItens] && item[chaveSubItens].length > 0;

                      return (
                        <Fragment key={idItem}>
                          <tr
                            className={`transition-colors duration-200 ${temSubItens ? "cursor-pointer hover:bg-sunken " : "hover:bg-sunken "} ${isExpandido ? "bg-sunken " : ""}`}
                            onClick={() => temSubItens && toggleExpandir(idItem)}
                          >
                            {colunas.map((coluna) => (
                              <td key={`${coluna.key}-${idItem}`} className="p-4 text-sm font-medium text-ink align-middle">
                                {typeof coluna.render === "function" ? coluna.render(item) : item[coluna.key]}
                              </td>
                            ))}

                            {subColunas && (
                              <td className="p-4 text-center">
                                {temSubItens && (
                                  <div className="w-8 h-8 rounded-md flex items-center justify-center text-ink-3 hover:text-ink-2 hover:bg-line transition-colors ml-auto">
                                    {isExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>

                          {isExpandido && temSubItens && (
                            <tr className="bg-sunken ">
                              <td colSpan={colunas.length + 1} className="p-0 border-b border-line ">
                                <div className="p-4 pl-8">
                                  <h4 className="text-xs font-bold text-ink-2 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    Itens do registro
                                  </h4>
                                  <div className="rounded-md border border-line overflow-hidden bg-surface ">
                                    <table className="w-full text-sm text-left">
                                      <thead className="bg-sunken border-b border-line ">
                                        <tr>
                                          {subColunas.map((sc) => (
                                            <th key={sc.key} className="py-2.5 px-4 text-xs font-bold text-ink-2 uppercase tracking-wide">{sc.label}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-line ">
                                        {item[chaveSubItens].map((subItem, subIdx) => (
                                          <tr key={subIdx} className="hover:bg-sunken transition-colors">
                                            {subColunas.map((sc) => (
                                              <td key={sc.key} className="py-3 px-4 font-medium text-ink ">
                                                {typeof sc.render === "function" ? sc.render(subItem) : subItem[sc.key]}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {dadosPaginados.map((item, index) => {
                  const idItem = item.id ?? index;
                  const isExpandido = linhaExpandida === idItem;
                  const temSubItens = subColunas && item[chaveSubItens] && item[chaveSubItens].length > 0;

                  return (
                    <div key={idItem} className="rounded-md border border-line bg-surface overflow-hidden transition-colors">
                      <div
                        className={`p-5 ${temSubItens ? "cursor-pointer active:bg-sunken " : ""}`}
                        onClick={() => temSubItens && toggleExpandir(idItem)}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-3 flex-1">
                            {colunas.map((coluna) => (
                              <div key={`${coluna.key}-${idItem}`} className="flex flex-col gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0">
                                <span className="text-xs uppercase font-bold tracking-wide text-ink-3 ">
                                  {coluna.label}
                                </span>
                                <div className="text-sm font-medium text-ink ">
                                  {typeof coluna.render === "function" ? coluna.render(item) : item[coluna.key]}
                                </div>
                              </div>
                            ))}
                          </div>
                          {subColunas && temSubItens && (
                            <div className="p-2 text-ink-3 bg-sunken rounded-md border border-line ">
                              {isExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          )}
                        </div>
                      </div>

                      {isExpandido && temSubItens && (
                        <div className="bg-sunken p-4 border-t border-line ">
                          <span className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-3">Itens desta entrega</span>
                          <div className="space-y-3">
                            {item[chaveSubItens].map((subItem, subIdx) => (
                              <div key={subIdx} className="bg-surface p-4 rounded-md border border-line space-y-2.5">
                                {subColunas.map((sc) => (
                                  <div key={sc.key} className="flex justify-between text-sm items-center gap-3">
                                    <span className="text-ink-2 text-xs uppercase tracking-wide font-bold">{sc.label}:</span>
                                    <span className="font-bold text-ink text-right">
                                      {typeof sc.render === "function" ? sc.render(subItem) : subItem[sc.key]}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {dadosFiltrados.length > 0 && (
          <div className="shrink-0 px-6 py-4 bg-surface border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 rounded-b-md">
            <div className="text-xs font-medium text-ink-2 ">
              Mostrando <b className="text-ink ">{dadosPaginados.length}</b> de <b className="text-ink ">{dadosFiltrados.length}</b> registros
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual((p) => p - 1)}
                  className="p-2 text-ink-2 bg-surface border border-line rounded-md hover:bg-sunken disabled:opacity-50 disabled:cursor-not-allowed transition-colors "
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-ink-2 px-3">
                  {paginaAtual} <span className="text-ink-3 font-medium">/ {totalPaginas}</span>
                </span>
                <button
                  type="button"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual((p) => p + 1)}
                  className="p-2 text-ink-2 bg-surface border border-line rounded-md hover:bg-sunken disabled:opacity-50 disabled:cursor-not-allowed transition-colors "
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialogo>
  );
}

export default ModalDetalhesDashboard;