import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useEntregas } from "../hooks/useEntregas";
import ModalEntrega from "../components/modals/entregas/ModalEntrega";
import { baixarFichaPDF } from "../utils/pdfUtils";

import { 
  Send, AlertTriangle, Plus, Search, 
  X, ChevronLeft, ChevronRight, FileDown,
  Layers, PackageCheck, ShieldCheck
} from "lucide-react";

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
    toast.success("Entrega cadastrada com sucesso!");
  };

  if (!podeVisualizar) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 text-amber-700 dark:text-amber-400 flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de entregas.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 animate-fade-in max-w-full transition-colors duration-300">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 transition-colors duration-300">
              <Send className="w-5 h-5 ml-0.5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Registro de Entregas
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                Controle das entregas de EPIs realizadas para os colaboradores.
              </p>
            </div>
          </div>

          {podeCadastrar && (
            <button
              onClick={() => setModalAberto(true)}
              className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Nova Entrega
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          <StatCard
            icone={<Layers className="w-4 h-4" />}
            label="Entregas encontradas"
            value={estatisticasTela.totalEntregas}
            bgClass="bg-slate-50 dark:bg-slate-800/50"
            borderClass="border-slate-200/60 dark:border-slate-700/60"
            labelClass="text-slate-500 dark:text-slate-400"
            valueClass="text-slate-800 dark:text-white"
            loading={carregando}
          />
          <StatCard
            icone={<PackageCheck className="w-4 h-4" />}
            label="Itens distribuídos"
            value={estatisticasTela.totalItens}
            bgClass="bg-blue-50 dark:bg-blue-900/20"
            borderClass="border-blue-100 dark:border-blue-800/50"
            labelClass="text-blue-600 dark:text-blue-400"
            valueClass="text-blue-800 dark:text-blue-300"
            loading={carregando}
          />
          <StatCard
            icone={<ShieldCheck className="w-4 h-4" />}
            label="Tipos de EPI"
            value={estatisticasTela.totalTipos}
            bgClass="bg-emerald-50 dark:bg-emerald-900/20"
            borderClass="border-emerald-100 dark:border-emerald-800/50"
            labelClass="text-emerald-700 dark:text-emerald-500"
            valueClass="text-emerald-800 dark:text-emerald-400"
            loading={carregando}
          />
        </div>

        <div className="relative mb-8 flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 transition-colors p-1.5">
          <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 flex-1 transition-colors">
            <div className="pl-4 text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            
            <input
              type="text"
              placeholder="Buscar por funcionário, matrícula, token ou itens..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none placeholder-slate-400"
            />

            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {carregando ? (
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando entregas...</span>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-700/60 transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60 transition-colors">
                  <tr>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Colaborador</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Itens</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Qtd.</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {entregasVisiveis.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                        Nenhuma entrega encontrada.
                      </td>
                    </tr>
                  ) : (
                    entregasVisiveis.map((entrega) => {
                      const nomeFunc = entrega.funcionario.nome;
                      const matriculaFunc = entrega.funcionario.matricula;
                      const isBaixando = baixandoPdfId === entrega.id;

                      return (
                        <tr key={entrega.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition duration-150 group">
                          <td className="p-4">
                            <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded block w-fit">
                              {entrega.dataEntrega}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 transition-colors">
                              {nomeFunc}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase tracking-widest transition-colors">
                              MAT: {matriculaFunc}
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 text-sm max-w-[300px]">
                            <span className="line-clamp-2 transition-colors font-medium text-xs leading-relaxed">
                              {resumirItens(entrega)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 shadow-sm text-xs font-black px-2.5 py-1 rounded-md transition-colors">
                              {totalItensEntrega(entrega)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleCliqueDownload(matriculaFunc, entrega.id)}
                              disabled={isBaixando}
                              title="Baixar Recibo PDF"
                              className={`p-2 mx-auto rounded-xl transition-all flex items-center justify-center border ${
                                isBaixando
                                  ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-wait"
                                  : "bg-slate-100 text-slate-600 border-transparent hover:border-slate-200 hover:bg-white dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                              }`}
                            >
                              {isBaixando ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span> : <FileDown className="w-4 h-4" />}
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
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 transition-colors text-sm font-medium">
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
                      className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-2xl p-5 shadow-sm transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                           <span className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded inline-block mb-2">
                            {entrega.dataEntrega}
                          </span>
                          <h3 className="font-extrabold text-slate-900 dark:text-white transition-colors">
                            {nomeFunc}
                          </h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase tracking-widest transition-colors">
                            MAT: {matriculaFunc}
                          </p>
                        </div>
                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 text-[10px] font-black px-2 py-1 rounded-md transition-colors shadow-sm">
                          {totalItensEntrega(entrega)} ITENS
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-sm transition-colors mb-4">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Itens da Entrega</span>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed block">
                          {resumirItens(entrega)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCliqueDownload(matriculaFunc, entrega.id)}
                        disabled={isBaixando}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors border ${
                          isBaixando
                            ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-wait"
                            : "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-transparent"
                        }`}
                      >
                        {isBaixando ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${
                    paginaAtual === 1
                      ? "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-slate-600"
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
                      : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-slate-600"
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

const StatCard = ({ icone, label, value, bgClass, borderClass, labelClass, valueClass, loading }) => {
  return (
    <div className={`${bgClass} border ${borderClass} rounded-2xl p-4 sm:p-5 transition-colors duration-300 flex flex-col gap-2 hover:shadow-sm`}>
      <div className={`flex items-center gap-2 ${labelClass}`}>
        {icone}
        <p className="text-[11px] uppercase font-bold tracking-widest">
          {label}
        </p>
      </div>
      <p className={`text-2xl sm:text-3xl font-black mt-auto tracking-tight transition-colors ${valueClass}`}>
        {loading ? "--" : value}
      </p>
    </div>
  );
};

export default Entregas;