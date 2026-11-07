import { useState } from "react";
import { temPermissao } from "../utils/permissoes";
import { useDepartamentos } from "../hooks/useDepartamentos";
import { 
  Building2, Briefcase, Plus, Search, Trash2, 
  ChevronLeft, ChevronRight, X, AlertTriangle, Layers
} from "lucide-react";
import { toast } from "react-toastify";

const PaginacaoBotao = ({ atual, total, onChange }) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 w-full">
    <button
      disabled={atual === 1}
      onClick={() => onChange(atual - 1)}
      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${
        atual === 1
          ? "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-slate-600"
      }`}
    >
      <ChevronLeft className="w-4 h-4" /> Anterior
    </button>
    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
      Página <span className="text-slate-800 dark:text-white">{atual}</span> de {total}
    </span>
    <button
      disabled={atual === total}
      onClick={() => onChange(atual + 1)}
      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1 ${
        atual === total
          ? "bg-slate-50 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 cursor-not-allowed"
          : "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-slate-600"
      }`}
    >
      Próxima <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

function Departamentos({ usuarioLogado }) {
  const {
    departamentos,
    departamentosComFuncoes,
    totalFuncoes,
    carregandoTela,
    carregandoDepartamento,
    carregandoFuncao,
    adicionarDepartamento,
    adicionarFuncao,
    excluirDepartamento,
    excluirFuncao,
  } = useDepartamentos();

  const [busca, setBusca] = useState("");
  const [paginaDep, setPaginaDep] = useState(1);
  const [paginasFuncoes, setPaginasFuncoes] = useState({});
  
  const itensPorPaginaDep = 3;
  const itensPorPaginaFun = 2;
  const departamentosFiltrados = departamentosComFuncoes.filter((dep) =>
    dep.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPaginasDep = Math.ceil(departamentosFiltrados.length / itensPorPaginaDep);
  const departamentosPaginados = departamentosFiltrados.slice(
    (paginaDep - 1) * itensPorPaginaDep,
    paginaDep * itensPorPaginaDep
  );

  const [formDepartamento, setFormDepartamento] = useState({ nome: "" });
  const [formFuncao, setFormFuncao] = useState({ departamentoId: "", nome: "" });
  const podeVisualizar = !usuarioLogado ? true : temPermissao(usuarioLogado, "visualizar_departamentos");
  const podeCadastrarDepartamento = !usuarioLogado ? true : temPermissao(usuarioLogado, "cadastrar_departamento");
  const podeExcluirDepartamento = !usuarioLogado ? true : temPermissao(usuarioLogado, "excluir_departamento");
  const podeGerenciarFuncoes = !usuarioLogado ? true : temPermissao(usuarioLogado, "cadastrar_departamento");
  const isAdmin = podeCadastrarDepartamento || podeExcluirDepartamento;

  async function handleAdicionarDepartamento(e) {
    e.preventDefault();
    if (!podeCadastrarDepartamento) return toast.warning("Sem permissão");
    const nome = formDepartamento.nome.trim();
    if (!nome) return toast.warning("Informe o nome");
    try {
      await adicionarDepartamento(nome);
      setFormDepartamento({ nome: "" });
    } catch { /* o api.js já mostrou o erro */ }
  }

  async function handleAdicionarFuncao(e) {
    e.preventDefault();
    if (!podeGerenciarFuncoes) return toast.warning("Sem permissão");
    const { departamentoId, nome } = formFuncao;
    if (!departamentoId || !nome.trim()) return toast.warning("Preencha todos os campos");
    try {
      await adicionarFuncao({ nome: nome.trim(), departamentoId: Number(departamentoId) });
      setFormFuncao((prev) => ({ ...prev, nome: "" }));
    } catch { /* o api.js já mostrou o erro */ }
  }

  async function handleExcluirDepartamento(id) {
    if (!window.confirm("Excluir departamento e funções vinculadas?")) return;
    try { await excluirDepartamento(id); } catch { /* o api.js já mostrou o erro */ }
  }

  if (!podeVisualizar) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 flex items-center justify-center transition-colors duration-300">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 text-amber-700 dark:text-amber-400 flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de departamentos.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/60 dark:border-slate-800 animate-fade-in transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 transition-colors duration-300">
              <Building2 className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Departamentos
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                Gerenciamento de setores e cargos.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3 transition-colors flex flex-col justify-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1">Departamentos</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{departamentos.length}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl px-5 py-3 transition-colors flex flex-col justify-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 mb-1">Funções</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{totalFuncoes}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-wide uppercase transition-colors">Novo Departamento</h3>
              </div>
              <form onSubmit={handleAdicionarDepartamento} className="flex gap-3">
                <input
                  type="text"
                  value={formDepartamento.nome}
                  onChange={(e) => setFormDepartamento({ nome: e.target.value })}
                  placeholder="Ex: Tecnologia da Informação"
                  className="flex-1 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/50 outline-none transition-colors placeholder-slate-400"
                />
                <button disabled={carregandoDepartamento} className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20">
                  {carregandoDepartamento ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Plus className="w-4 h-4" strokeWidth={3} />}
                </button>
              </form>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-6 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-wide uppercase transition-colors">Nova Função</h3>
              </div>
              <form onSubmit={handleAdicionarFuncao} className="flex flex-col sm:flex-row gap-3">
                <select
                  value={formFuncao.departamentoId}
                  onChange={(e) => setFormFuncao({ ...formFuncao, departamentoId: e.target.value })}
                  className="sm:w-48 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
                <div className="flex flex-1 gap-3">
                  <input
                    type="text"
                    value={formFuncao.nome}
                    onChange={(e) => setFormFuncao({ ...formFuncao, nome: e.target.value })}
                    placeholder="Ex: Analista de Sistemas"
                    className="flex-1 rounded-xl border border-slate-300/60 dark:border-slate-600/60 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors placeholder-slate-400"
                  />
                  <button disabled={carregandoFuncao} className="bg-slate-800 dark:bg-slate-700 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center shadow-sm">
                    {carregandoFuncao ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <Plus className="w-4 h-4" strokeWidth={3} />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="relative mb-6 flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 transition-colors p-1.5">
          <div className="relative flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 flex-1 transition-colors">
            <div className="pl-4 text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar departamento..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPaginaDep(1); 
              }}
              className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none placeholder-slate-400"
            />
            {busca && (
              <button
                onClick={() => {
                  setBusca("");
                  setPaginaDep(1);
                }}
                className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {carregandoTela ? (
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando dados...</span>
          </div>
        ) : departamentosPaginados.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl transition-colors font-medium text-sm">
            {busca ? `Nenhum resultado encontrado para "${busca}".` : "Nenhum departamento registrado."}
          </div>
        ) : (
          <div className="space-y-4">
            {departamentosPaginados.map((dep) => {
              const pagAtualFun = paginasFuncoes[dep.id] || 1;
              const totalPaginasFun = Math.max(1, Math.ceil(dep.funcoes.length / itensPorPaginaFun));
              const funcoesPaginadas = dep.funcoes.slice(
                (pagAtualFun - 1) * itensPorPaginaFun,
                pagAtualFun * itensPorPaginaFun
              );

              return (
                <div key={dep.id} className="border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 sm:p-6 bg-white dark:bg-slate-800/20 hover:border-blue-200 dark:hover:border-slate-600 transition-colors shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-900 dark:text-white transition-colors">{dep.nome}</h4>
                      <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        CÓDIGO: {dep.id}
                      </span>
                    </div>
                    {podeExcluirDepartamento && (
                      <button 
                        onClick={() => handleExcluirDepartamento(dep.id)} 
                        title="Excluir Departamento"
                        className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Cargos Vinculados
                      </span>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {dep.funcoes.length}
                      </span>
                    </div>

                    {funcoesPaginadas.length === 0 ? (
                      <p className="text-sm font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                        Nenhum cargo registrado neste setor.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {funcoesPaginadas.map(f => (
                          <div key={f.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 sm:px-4 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-colors">
                            <span className="text-sm text-slate-700 dark:text-slate-200 font-bold transition-colors">{f.nome}</span>
                            {podeGerenciarFuncoes && (
                              <button 
                                onClick={() => excluirFuncao(f.id)} 
                                title="Excluir Função"
                                className="p-1.5 rounded-lg text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {totalPaginasFun > 1 && (
                    <div className="mt-2">
                       <PaginacaoBotao 
                        atual={pagAtualFun} 
                        total={totalPaginasFun} 
                        onChange={(novaPag) => setPaginasFuncoes({ ...paginasFuncoes, [dep.id]: novaPag })}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {totalPaginasDep > 1 && (
              <div className="pt-2 transition-colors">
                <PaginacaoBotao atual={paginaDep} total={totalPaginasDep} onChange={setPaginaDep} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Departamentos;