import React, { useState, useMemo, useEffect, Fragment } from "react";
import {
  X, Search, FilterX, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Inbox
} from "lucide-react";

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

  const baseInputClass = "w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white placeholder-slate-400";
  const labelClass = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 transition-colors";

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in text-slate-700 dark:text-slate-300">
      <div className="w-full max-w-6xl max-h-[95vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden flex flex-col transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-start shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 transition-colors">
              {icon || <Inbox className="w-6 h-6" strokeWidth={2.5} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate transition-colors">
                {titulo}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate transition-colors">
                {subtitulo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar transition-colors">
          <div className="mb-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 p-5 shadow-sm transition-colors">
            <div className={`grid grid-cols-1 ${temFiltroDeDatasNoConteudo ? "md:grid-cols-[1.4fr_1fr_1fr_auto]" : "md:grid-cols-[1fr_auto]"} gap-4 items-end`}>
              <div className="relative">
                <label className={labelClass}>Buscar</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
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
                    <label className={labelClass}>Data inicial</label>
                    <input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} className={baseInputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Data final</label>
                    <input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} className={baseInputClass} />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={limparFiltros}
                disabled={!temFiltrosAtivos}
                className="h-[42px] px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <FilterX className="w-4 h-4" />
                Limpar
              </button>
            </div>

            {temFiltrosAtivos && (
              <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Filtros aplicados. Exibindo <b className="text-slate-700 dark:text-slate-200">{dadosFiltrados.length}</b> de <b className="text-slate-700 dark:text-slate-200">{dados.length}</b> registros.
              </p>
            )}
          </div>

          {dadosFiltrados.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 p-12 flex flex-col items-center justify-center text-center transition-colors">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum registro encontrado</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tente ajustar ou limpar os filtros de busca.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 shadow-sm transition-colors">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60 transition-colors">
                    <tr>
                      {colunas.map((coluna) => (
                        <th key={coluna.key} className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
                          {coluna.label}
                        </th>
                      ))}
                      {subColunas && <th className="p-4 w-12"></th>}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {dadosPaginados.map((item, index) => {
                      const idItem = item.id ?? index;
                      const isExpandido = linhaExpandida === idItem;
                      const temSubItens = subColunas && item[chaveSubItens] && item[chaveSubItens].length > 0;

                      return (
                        <Fragment key={idItem}>
                          <tr
                            className={`transition-colors duration-200 ${temSubItens ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"} ${isExpandido ? "bg-slate-50/80 dark:bg-slate-800" : ""}`}
                            onClick={() => temSubItens && toggleExpandir(idItem)}
                          >
                            {colunas.map((coluna) => (
                              <td key={`${coluna.key}-${idItem}`} className="p-4 text-sm font-medium text-slate-700 dark:text-slate-200 align-middle">
                                {typeof coluna.render === "function" ? coluna.render(item) : item[coluna.key]}
                              </td>
                            ))}

                            {subColunas && (
                              <td className="p-4 text-center">
                                {temSubItens && (
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors ml-auto">
                                    {isExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>

                          {isExpandido && temSubItens && (
                            <tr className="bg-slate-50/50 dark:bg-slate-900/40">
                              <td colSpan={colunas.length + 1} className="p-0 border-b border-slate-200/60 dark:border-slate-700/60">
                                <div className="p-4 pl-8 border-l-4 border-blue-500 animate-fade-in">
                                  <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    Itens do registro
                                  </h4>
                                  <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden bg-white dark:bg-slate-800/80">
                                    <table className="w-full text-sm text-left">
                                      <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                        <tr>
                                          {subColunas.map((sc) => (
                                            <th key={sc.key} className="py-2.5 px-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{sc.label}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {item[chaveSubItens].map((subItem, subIdx) => (
                                          <tr key={subIdx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            {subColunas.map((sc) => (
                                              <td key={sc.key} className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
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
                    <div key={idItem} className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 shadow-sm overflow-hidden transition-colors">
                      <div
                        className={`p-5 ${temSubItens ? "cursor-pointer active:bg-slate-50 dark:active:bg-slate-700/50" : ""}`}
                        onClick={() => temSubItens && toggleExpandir(idItem)}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-3 flex-1">
                            {colunas.map((coluna) => (
                              <div key={`${coluna.key}-${idItem}`} className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-700/50 pb-3 last:border-b-0 last:pb-0">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
                                  {coluna.label}
                                </span>
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {typeof coluna.render === "function" ? coluna.render(item) : item[coluna.key]}
                                </div>
                              </div>
                            ))}
                          </div>
                          {subColunas && temSubItens && (
                            <div className="p-2 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                              {isExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          )}
                        </div>
                      </div>

                      {isExpandido && temSubItens && (
                        <div className="bg-slate-50/80 dark:bg-slate-900/40 p-4 border-t border-slate-200/60 dark:border-slate-700/60 border-l-4 border-l-blue-500 animate-fade-in">
                          <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Itens desta entrega</span>
                          <div className="space-y-3">
                            {item[chaveSubItens].map((subItem, subIdx) => (
                              <div key={subIdx} className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm space-y-2.5">
                                {subColunas.map((sc) => (
                                  <div key={sc.key} className="flex justify-between text-sm items-center gap-3">
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold">{sc.label}:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-right">
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
          <div className="shrink-0 px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 rounded-b-3xl">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Mostrando <b className="text-slate-700 dark:text-slate-200">{dadosPaginados.length}</b> de <b className="text-slate-700 dark:text-slate-200">{dadosFiltrados.length}</b> registros
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual((p) => p - 1)}
                  className="p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 px-3">
                  {paginaAtual} <span className="text-slate-400 dark:text-slate-500 font-medium">/ {totalPaginas}</span>
                </span>
                <button
                  type="button"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual((p) => p + 1)}
                  className="p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalDetalhesDashboard;