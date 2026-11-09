import { useState } from "react";
import { temPermissao } from "../utils/permissoes";
import { useDepartamentos } from "../hooks/useDepartamentos";
import { Briefcase, Plus, Search, Trash2, ChevronLeft, ChevronRight, X, AlertTriangle, Layers } from "lucide-react";
import { toast } from "react-toastify";
import Selecao from "../components/Selecao";

const PaginacaoBotao = ({ atual, total, onChange }) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 w-full">
    <button
      disabled={atual === 1}
      onClick={() => onChange(atual - 1)}
      className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${
        atual === 1
          ? "bg-sunken text-ink-3 cursor-not-allowed"
          : "bg-surface text-ink border border-line hover:bg-sunken hover:border-line "
      }`}
    >
      <ChevronLeft className="w-4 h-4" /> Anterior
    </button>
    <span className="text-xs font-bold text-ink-2 uppercase tracking-wide bg-sunken px-4 py-2 rounded-md border border-line transition-colors">
      Página <span className="text-ink ">{atual}</span> de {total}
    </span>
    <button
      disabled={atual === total}
      onClick={() => onChange(atual + 1)}
      className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${
        atual === total
          ? "bg-sunken text-ink-3 cursor-not-allowed"
          : "bg-surface text-ink border border-line hover:bg-sunken hover:border-line "
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
      <div className="bg-surface p-8 rounded-md border border-line flex items-center justify-center transition-colors duration-300">
        <div className="bg-atencao-soft border border-atencao-line rounded-md p-6 text-atencao flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de departamentos.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      <div className="max-w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-ink tracking-tight transition-colors">
                Departamentos
              </h2>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Gerenciamento de setores e cargos.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-sunken border border-line rounded-md px-5 py-3 transition-colors flex flex-col justify-center min-w-[120px]">
              <span className="text-xs uppercase font-bold tracking-wide text-ink-2 mb-1">Departamentos</span>
              <span className="text-2xl font-bold text-ink tracking-tight">{departamentos.length}</span>
            </div>
            <div className="bg-sunken border border-line rounded-md px-5 py-3 transition-colors flex flex-col justify-center min-w-[120px]">
              <span className="text-xs uppercase font-bold tracking-wide text-ink-2 mb-1">Funções</span>
              <span className="text-2xl font-bold text-ink tracking-tight">{totalFuncoes}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="bg-sunken border border-line rounded-md p-6 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-ink " />
                <h3 className="text-sm font-bold text-ink tracking-wide uppercase transition-colors">Novo Departamento</h3>
              </div>
              <form onSubmit={handleAdicionarDepartamento} className="flex gap-3">
                <input
                  type="text"
                  value={formDepartamento.nome}
                  onChange={(e) => setFormDepartamento({ nome: e.target.value })}
                  placeholder="Ex: Tecnologia da Informação"
                  className="flex-1 rounded-md border border-line-strong bg-surface px-4 py-3 text-sm font-semibold text-ink focus:ring-1 focus:ring-ink outline-none transition-colors placeholder-ink-3"
                />
                <button disabled={carregandoDepartamento} className="bg-action text-on-action px-5 py-3 rounded-md text-sm font-bold hover:bg-action-hover transition-all disabled:opacity-50 flex items-center justify-center gap-2 ">
                  {carregandoDepartamento ? <span className="w-5 h-5 border-2 border-line border-t-transparent rounded-full animate-spin"></span> : <Plus className="w-4 h-4" strokeWidth={3} />}
                </button>
              </form>
            </div>

            <div className="bg-sunken border border-line rounded-md p-6 transition-colors">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-ok " />
                <h3 className="text-sm font-bold text-ink tracking-wide uppercase transition-colors">Nova Função</h3>
              </div>
              <form onSubmit={handleAdicionarFuncao} className="flex flex-col sm:flex-row gap-3">
                <Selecao
                  value={formFuncao.departamentoId}
                  onChange={(e) => setFormFuncao({ ...formFuncao, departamentoId: e.target.value })}
                  className="sm:w-48 rounded-md border border-line-strong bg-surface px-4 py-3 text-sm font-semibold text-ink focus:ring-1 focus:ring-ink outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </Selecao>
                <div className="flex flex-1 gap-3">
                  <input
                    type="text"
                    value={formFuncao.nome}
                    onChange={(e) => setFormFuncao({ ...formFuncao, nome: e.target.value })}
                    placeholder="Ex: Analista de Sistemas"
                    className="flex-1 rounded-md border border-line-strong bg-surface px-4 py-3 text-sm font-semibold text-ink focus:ring-1 focus:ring-ink outline-none transition-colors placeholder-ink-3"
                  />
                  <button disabled={carregandoFuncao} className="bg-action text-on-action px-5 py-3 rounded-md text-sm font-bold hover:bg-action-hover transition-all disabled:opacity-50 flex items-center justify-center ">
                    {carregandoFuncao ? <span className="w-5 h-5 border-2 border-line border-t-transparent rounded-full animate-spin"></span> : <Plus className="w-4 h-4" strokeWidth={3} />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="relative mb-6 flex items-center bg-sunken rounded-md border border-line transition-colors p-1.5">
          <div className="relative flex items-center bg-surface rounded-md border border-line flex-1 transition-colors">
            <div className="pl-4 text-ink-3 ">
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
              className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-ink outline-none placeholder-ink-3"
            />
            {busca && (
              <button
                onClick={() => {
                  setBusca("");
                  setPaginaDep(1);
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
            <span className="text-sm font-bold tracking-wide">Carregando dados...</span>
          </div>
        ) : departamentosPaginados.length === 0 ? (
          <div className="p-12 text-center text-ink-2 border border-dashed border-line-strong rounded-md transition-colors font-medium text-sm">
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
                <div key={dep.id} className="border border-line rounded-md p-5 sm:p-6 bg-surface hover:border-line transition-colors ">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-ink transition-colors">{dep.nome}</h4>
                      <span className="inline-block mt-1 text-xs font-bold text-ink-2 uppercase tracking-wide bg-sunken px-2 py-1 rounded">
                        CÓDIGO: {dep.id}
                      </span>
                    </div>
                    {podeExcluirDepartamento && (
                      <button 
                        onClick={() => handleExcluirDepartamento(dep.id)} 
                        title="Excluir Departamento"
                        className="p-2 rounded-md bg-erro-soft text-erro hover:bg-erro-soft transition-colors border border-transparent hover:border-erro-line "
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-ink-2 uppercase tracking-wide">
                        Cargos Vinculados
                      </span>
                      <span className="bg-line text-ink-2 text-xs font-bold px-1.5 py-0.5 rounded-md">
                        {dep.funcoes.length}
                      </span>
                    </div>

                    {funcoesPaginadas.length === 0 ? (
                      <p className="text-sm font-medium text-ink-3 bg-sunken p-4 rounded-md border border-dashed border-line transition-colors">
                        Nenhum cargo registrado neste setor.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {funcoesPaginadas.map(f => (
                          <div key={f.id} className="flex justify-between items-center bg-sunken p-3 sm:px-4 rounded-md border border-line transition-colors">
                            <span className="text-sm text-ink font-bold transition-colors">{f.nome}</span>
                            {podeGerenciarFuncoes && (
                              <button 
                                onClick={() => excluirFuncao(f.id)} 
                                title="Excluir Função"
                                className="p-1.5 rounded-md text-erro hover:bg-erro-soft hover:text-erro transition-colors"
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