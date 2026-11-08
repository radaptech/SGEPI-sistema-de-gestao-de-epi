import DashboardCard from "../components/DashboardCard";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEntregas } from "../hooks/useEntregas";
import ModalEntrega from "../components/modals/entregas/ModalEntrega";
import { baixarFichaPDF } from "../utils/pdfUtils";

import { AlertTriangle, Plus, Search, X, ChevronLeft, ChevronRight, FileDown } from "lucide-react";

function resumirItens(entrega) {
  const itens = Array.isArray(entrega?.itens) ? entrega.itens : [];
  if (itens.length === 0) return "Sem itens";

  return itens
    .map((item) => {
      return `${item.epiNome} (${item.tamanhoNome}) x${item.quantidade}`;
    })
    .join(", ");
}

function totalItensEntrega(entrega) {
  return (entrega?.itens || []).reduce(
    (acc, item) => acc + Number(item.quantidade || 0),
    0
  );
}

function Entregas({ usuarioLogado }) {
  const {
    busca,
    setBusca,
    carregando,
    erroTela,
    entregasVisiveis,
    totalPaginas,
    paginaAtual,
    setPaginaAtual,
    modalAberto,
    setModalAberto,
    podeVisualizar,
    podeCadastrar,
    aoSalvarEntrega,
    estatisticasTela = { totalEntregas: 0, totalItens: 0, totalTipos: 0 },
  } = useEntregas({ usuarioLogado });

  const [baixandoPdfId, setBaixandoPdfId] = useState(null);

  useEffect(() => {
    if (erroTela) {
      toast.error(erroTela);
    }
  }, [erroTela]);

  const handleCliqueDownload = async (matricula, idEntrega) => {
    try {
      setBaixandoPdfId(idEntrega);
      await baixarFichaPDF(matricula, idEntrega);
    } catch {
      // o api.js já mostrou o erro do servidor
    } finally {
      setBaixandoPdfId(null);
    }
  };

  // a entrega já foi gravada pelo modal; aqui só recarrega a lista
  const handleSalvarEntrega = async () => {
    await aoSalvarEntrega();
  };

  if (!podeVisualizar) {
    return (
      <div className="bg-surface p-8 rounded-md border border-line flex items-center justify-center transition-colors duration-300">
        <div className="bg-atencao-soft border border-atencao-line rounded-md p-6 text-atencao flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de entregas.
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
                Registro de Entregas
              </h2>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Controle das entregas de EPIs realizadas para os colaboradores.
              </p>
            </div>
          </div>

          {podeCadastrar && (
            <button
              onClick={() => setModalAberto(true)}
              className="w-full lg:w-auto bg-action hover:bg-action-hover text-on-action px-5 py-3 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Nova Entrega
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <DashboardCard card={{ titulo: "Entregas encontradas", valor: carregando ? "--" : estatisticasTela.totalEntregas }} />
          <DashboardCard card={{ titulo: "Itens distribuídos", valor: carregando ? "--" : estatisticasTela.totalItens }} />
          <DashboardCard card={{ titulo: "Tipos de EPI", valor: carregando ? "--" : estatisticasTela.totalTipos }} />
        </div>

        <div className="relative mb-8 flex items-center bg-sunken rounded-md border border-line transition-colors p-1.5">
          <div className="relative flex items-center bg-surface rounded-md border border-line flex-1 transition-colors">
            <div className="pl-4 text-ink-3 ">
              <Search className="w-4 h-4" />
            </div>
            
            <input
              type="text"
              placeholder="Buscar por funcionário, matrícula, token ou itens..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-ink outline-none placeholder-ink-3"
            />

            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 p-1 rounded-md text-ink-3 hover:text-ink-2 hover:bg-sunken transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {carregando ? (
          <div className="border border-dashed border-line-strong rounded-md p-12 flex flex-col items-center justify-center text-ink-2 gap-3">
            <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando entregas...</span>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-md border border-line transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sunken border-b border-line transition-colors">
                  <tr>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Data</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Colaborador</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Itens</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Qtd.</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line ">
                  {entregasVisiveis.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-ink-2 font-medium">
                        Nenhuma entrega encontrada.
                      </td>
                    </tr>
                  ) : (
                    entregasVisiveis.map((entrega) => {
                      const nomeFunc = entrega.funcionario.nome;
                      const matriculaFunc = entrega.funcionario.matricula;
                      const isBaixando = baixandoPdfId === entrega.id;

                      return (
                        <tr key={entrega.id} className="hover:bg-sunken transition duration-150 group">
                          <td className="p-4">
                            <span className="text-xs font-bold font-mono text-ink bg-sunken px-2 py-1 rounded block w-fit">
                              {entrega.dataEntrega}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-sm text-ink transition-colors">
                              {nomeFunc}
                            </div>
                            <div className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide transition-colors">
                              MAT: {matriculaFunc}
                            </div>
                          </td>
                          <td className="p-4 text-ink-2 text-sm max-w-[300px]">
                            <span className="line-clamp-2 transition-colors font-medium text-xs leading-relaxed">
                              {resumirItens(entrega)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-sunken text-ink border border-line text-xs font-bold px-2.5 py-1 rounded-md transition-colors">
                              {totalItensEntrega(entrega)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleCliqueDownload(matriculaFunc, entrega.id)}
                              disabled={isBaixando}
                              title="Baixar Recibo PDF"
                              className={`p-2 mx-auto rounded-md transition-all flex items-center justify-center border ${
                                isBaixando
                                  ? "bg-sunken border-line text-ink-3 cursor-wait"
                                  : "bg-sunken text-ink-2 border-transparent hover:border-line hover:bg-surface "
                              }`}
                            >
                              {isBaixando ? <span className="w-4 h-4 border-2 border-line-strong border-t-transparent rounded-full animate-spin"></span> : <FileDown className="w-4 h-4" />}
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
              {entregasVisiveis.length === 0 ? (
                <div className="text-center py-8 text-ink-2 bg-sunken rounded-md border border-dashed border-line-strong transition-colors text-sm font-medium">
                  Nenhuma entrega encontrada.
                </div>
              ) : (
                entregasVisiveis.map((entrega) => {
                  const nomeFunc = entrega.funcionario.nome;
                  const matriculaFunc = entrega.funcionario.matricula;
                  const isBaixando = baixandoPdfId === entrega.id;

                  return (
                    <div
                      key={entrega.id}
                      className="bg-surface border border-line rounded-md p-5 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                           <span className="text-xs font-bold font-mono text-ink bg-sunken px-2 py-1 rounded inline-block mb-2">
                            {entrega.dataEntrega}
                          </span>
                          <h3 className="font-bold text-ink transition-colors">
                            {nomeFunc}
                          </h3>
                          <p className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide transition-colors">
                            MAT: {matriculaFunc}
                          </p>
                        </div>
                        <span className="bg-sunken text-ink border border-line text-xs font-bold px-2 py-1 rounded-md transition-colors ">
                          {totalItensEntrega(entrega)} ITENS
                        </span>
                      </div>

                      <div className="bg-sunken p-4 rounded-md border border-line text-sm transition-colors mb-4">
                        <span className="block text-xs font-bold uppercase tracking-wide text-ink-3 mb-1">Itens da Entrega</span>
                        <span className="text-xs font-medium text-ink-2 leading-relaxed block">
                          {resumirItens(entrega)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCliqueDownload(matriculaFunc, entrega.id)}
                        disabled={isBaixando}
                        className={`w-full py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-colors border ${
                          isBaixando
                            ? "bg-sunken border-line text-ink-3 cursor-wait"
                            : "bg-sunken text-ink hover:bg-line border-transparent"
                        }`}
                      >
                        {isBaixando ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-line-strong border-t-transparent rounded-full animate-spin"></span>
                            Gerando...
                          </>
                        ) : (
                          <>
                            <FileDown className="w-4 h-4" /> Baixar Recibo PDF
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
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
                      : "bg-surface text-ink border border-line hover:bg-sunken hover:border-line "
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
                      : "bg-surface text-ink border border-line hover:bg-sunken hover:border-line "
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
        <ModalEntrega
          onClose={() => setModalAberto(false)}
          onSalvar={handleSalvarEntrega}
        />
      )}
    </>
  );
}


export default Entregas;