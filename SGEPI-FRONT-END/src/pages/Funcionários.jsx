import DashboardCard from "../components/DashboardCard";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { temPermissao } from "../utils/permissoes";
import { useFuncionarios } from "../hooks/useFuncionarios";
import ModalDetalhesFuncionario from "../components/modals/ModalDetalhesFuncionario";
import { AlertTriangle, Search, Eye, ChevronLeft, ChevronRight, X } from "lucide-react";

function Funcionarios({ usuarioLogado }) {
  const {
    busca,
    setBusca,
    paginaAtual,
    setPaginaAtual,
    carregando,
    erroTela,
    funcionarioDetalhe,
    setFuncionarioDetalhe,
    funcionariosVisiveis,
    totalPaginas,
    resumo,
  } = useFuncionarios();

  const podeVisualizar = temPermissao(
    usuarioLogado,
    "visualizar_departamentos"
  );

  useEffect(() => {
    if (erroTela) {
      toast.error(erroTela);
    }
  }, [erroTela]);

  if (!podeVisualizar) {
    return (
      <div className="bg-surface p-8 rounded-md border border-line flex items-center justify-center transition-colors duration-300">
        <div className="bg-atencao-soft border border-atencao-line rounded-md p-6 text-atencao flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de funcionários.
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
                Quadro de Funcionários
              </h2>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Consulte colaboradores, setor, função e movimentações.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          <DashboardCard card={{ titulo: "Total de funcionários", valor: carregando ? "--" : resumo.totalFuncionarios }} />

          <DashboardCard card={{ titulo: "Departamentos ativos", valor: carregando ? "--" : resumo.departamentosAtivos }} />

          <DashboardCard card={{ titulo: "Com movimentação", valor: carregando ? "--" : resumo.comMovimentacao }} />
        </div>

        <div className="relative mb-8 flex items-center bg-sunken rounded-md border border-line transition-colors p-1.5">
          <div className="relative flex items-center bg-surface rounded-md border border-line flex-1 transition-colors">
            <div className="pl-4 text-ink-3 ">
              <Search className="w-4 h-4" />
            </div>
            
            <input
              type="text"
              placeholder="Buscar por nome, CPF, matrícula, departamento ou função..."
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
            <span className="text-sm font-bold tracking-wide">Carregando funcionários...</span>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-md border border-line transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sunken border-b border-line transition-colors">
                  <tr>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Matrícula</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Nome / CPF</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Departamento</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Função</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Entregas</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Devoluções</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Detalhes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-line ">
                  {funcionariosVisiveis.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-ink-2 font-medium">
                        Nenhum funcionário encontrado.
                      </td>
                    </tr>
                  ) : (
                    funcionariosVisiveis.map((f) => (
                      <tr key={f.id} className="hover:bg-sunken transition duration-150 group">
                        
                        <td className="p-4">
                          <span className="text-xs font-bold font-mono text-ink bg-sunken px-2 py-1 rounded block w-fit">
                            {f.matricula || "-"}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-sm text-ink transition-colors">
                            {f.nome}
                          </div>
                          <div className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide transition-colors">
                            {f.cpf || "S/ CPF"}
                          </div>
                        </td>

                        <td className="p-4 text-sm font-semibold text-ink-2 transition-colors">
                          {f.departamentoNome}
                        </td>

                        <td className="p-4 text-sm font-semibold text-ink-2 transition-colors">
                          {f.funcaoNome}
                        </td>

                        <td className="p-4 text-center">
                          <Badge className="bg-sunken text-ink border-line ">
                            {f.totalEntregas}
                          </Badge>
                        </td>

                        <td className="p-4 text-center">
                          <Badge className="bg-sunken text-ink border-line ">
                            {f.totalDevolucoes}
                          </Badge>
                        </td>

                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => setFuncionarioDetalhe(f)}
                            title="Ver Detalhes"
                            className="p-2 mx-auto rounded-md bg-sunken text-ink-2 border border-transparent hover:border-line hover:bg-surface transition-all flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-4">
              {funcionariosVisiveis.length > 0 ? (
                funcionariosVisiveis.map((f) => (
                  <div
                    key={f.id}
                    className="bg-surface border border-line rounded-md p-5 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div>
                        <h3 className="font-bold text-ink transition-colors">
                          {f.nome}
                        </h3>
                        <p className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide transition-colors">
                          CPF: {f.cpf || "S/ CPF"}
                        </p>
                        <p className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide transition-colors">
                          MAT: {f.matricula || "-"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFuncionarioDetalhe(f)}
                        className="px-3 py-2 rounded-md bg-sunken text-ink-2 text-xs font-bold hover:bg-line transition-colors shrink-0 flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-sunken p-4 rounded-md border border-line text-sm transition-colors">
                      <CampoMobile
                        label="Departamento"
                        valor={f.departamentoNome}
                      />
                      <CampoMobile label="Função" valor={f.funcaoNome} />
                      <CampoMobile
                        label="Entregas"
                        valor={f.totalEntregas}
                        destaque="blue"
                      />
                      <CampoMobile
                        label="Devoluções"
                        valor={f.totalDevolucoes}
                        destaque="red"
                      />

                      <div className="col-span-2 pt-3 border-t border-line transition-colors">
                        <span className="block text-xs text-ink-3 font-bold uppercase tracking-wide transition-colors mb-0.5">
                          Última movimentação
                        </span>
                        <span className="text-ink text-xs font-semibold transition-colors">
                          {f.ultimaMovimentacao || "Nenhuma movimentação registrada"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-ink-2 bg-sunken rounded-md border border-dashed border-line-strong transition-colors text-sm font-medium">
                  Nenhum funcionário encontrado.
                </div>
              )}
            </div>

            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <button
                  type="button"
                  onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                  disabled={paginaAtual === 1}
                  className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1 ${paginaAtual === 1
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
                  type="button"
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
            )}
          </>
        )}
      </div>

      <ModalDetalhesFuncionario
        aberto={!!funcionarioDetalhe}
        funcionario={funcionarioDetalhe}
        onClose={() => setFuncionarioDetalhe(null)}
      />
    </>
  );
}


function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[36px] px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${className}`}
    >
      {children}
    </span>
  );
}

function CampoMobile({ label, valor, destaque }) {
  const classeLabel =
    destaque === "blue"
      ? "text-ink "
      : destaque === "red"
        ? "text-erro "
        : "text-ink-3 ";

  const classeValor =
    destaque === "blue"
      ? "text-ink font-bold"
      : destaque === "red"
        ? "text-erro font-bold"
        : "text-ink font-semibold";

  return (
    <div className="transition-colors">
      <span className={`block text-xs font-bold uppercase tracking-wide transition-colors mb-0.5 ${classeLabel}`}>
        {label}
      </span>
      <span className={`text-xs transition-colors ${classeValor}`}>{valor}</span>
    </div>
  );
}

export default Funcionarios;