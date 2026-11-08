import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { temPermissao } from "../utils/permissoes";
import { listarFornecedores } from "../services/fornecedorService";
import { normalizarFornecedor } from "../utils/fornecedorNormalizer";
import ModalCriarFornecedor from "../components/modals/ModalCriarFornecedor";
import ModalDetalhesFornecedor from "../components/modals/ModalDetalhesFornecedor";

import { AlertTriangle, Plus, Search, X, Eye, ChevronLeft, ChevronRight, Building2, Hash, Receipt } from "lucide-react";

function Fornecedores({ usuarioLogado }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [erroTela, setErroTela] = useState("");
  const [fornecedorDetalhe, setFornecedorDetalhe] = useState(null);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);

  const itensPorPagina = 6;

  const podeVisualizar = temPermissao(
    usuarioLogado,
    "visualizar_fornecedores"
  );

  const carregarFornecedores = async () => {
    setCarregando(true);
    setErroTela("");

    try {
      const lista = await listarFornecedores();
      setFornecedores(lista.map(normalizarFornecedor));
    } catch (erro) {
      setErroTela(
        erro?.message || "Não foi possível carregar a lista de fornecedores."
      );
      setFornecedores([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarFornecedores();
  }, []);

  useEffect(() => {
    if (erroTela) {
      toast.error(erroTela);
    }
  }, [erroTela]);

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    const listaOrdenada = [...fornecedores].sort((a, b) =>
      (a.razao_social || "").localeCompare(b.razao_social || "")
    );

    if (!termo) return listaOrdenada;

    return listaOrdenada.filter((f) => {
      return (
        (f.razao_social || "").toLowerCase().includes(termo) ||
        (f.nome_fantasia || "").toLowerCase().includes(termo) ||
        String(f.cnpj || "").includes(termo) ||
        String(f.inscricao_estadual || "").toLowerCase().includes(termo)
      );
    });
  }, [fornecedores, busca]);

  useEffect(() => {
    const total = Math.max(
      1,
      Math.ceil(fornecedoresFiltrados.length / itensPorPagina)
    );

    if (paginaAtual > total) {
      setPaginaAtual(total);
    }
  }, [paginaAtual, fornecedoresFiltrados.length]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(fornecedoresFiltrados.length / itensPorPagina)
  );

  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;

  const fornecedoresVisiveis = fornecedoresFiltrados.slice(
    indexPrimeiroItem,
    indexUltimoItem
  );

  const resumo = useMemo(() => {
    const total = fornecedores.length;

    const comFantasia = fornecedores.filter(
      (item) => String(item.nome_fantasia || "").trim() !== ""
    ).length;

    const comIE = fornecedores.filter(
      (item) => String(item.inscricao_estadual || "").trim() !== ""
    ).length;

    return {
      total,
      comFantasia,
      comIE,
    };
  }, [fornecedores]);

  if (!podeVisualizar) {
    return (
      <div className="bg-surface p-8 rounded-md border border-line flex items-center justify-center transition-colors duration-300">
        <div className="bg-atencao-soft border border-atencao-line rounded-md p-6 text-atencao flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de fornecedores.
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
                Fornecedores
              </h2>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Gerencie os fornecedores cadastrados no sistema.
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalCriarAberto(true)}
            className="w-full lg:w-auto bg-action hover:bg-action-hover text-on-action px-5 py-3 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            Novo Fornecedor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          <div className="bg-sunken border border-line rounded-md p-5 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-ink-2 ">
              <Building2 className="w-4 h-4" />
              <p className="text-xs uppercase font-bold tracking-wide">
                Total de Fornecedores
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink mt-auto tracking-tight transition-colors">
              {carregando ? "--" : resumo.total}
            </p>
          </div>

          <div className="bg-sunken border border-line rounded-md p-5 transition-colors flex flex-col gap-2">
             <div className="flex items-center gap-2 text-ink ">
              <Hash className="w-4 h-4" />
              <p className="text-xs uppercase font-bold tracking-wide">
                Com Nome Fantasia
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ink mt-auto tracking-tight transition-colors">
              {carregando ? "--" : resumo.comFantasia}
            </p>
          </div>

          <div className="bg-ok-soft border border-ok-line rounded-md p-5 transition-colors flex flex-col gap-2">
             <div className="flex items-center gap-2 text-ok ">
              <Receipt className="w-4 h-4" />
              <p className="text-xs uppercase font-bold tracking-wide">
                Com Inscrição Estadual
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-ok mt-auto tracking-tight transition-colors">
              {carregando ? "--" : resumo.comIE}
            </p>
          </div>
        </div>

        <div className="relative mb-8 flex items-center bg-sunken rounded-md border border-line transition-colors p-1.5">
          <div className="relative flex items-center bg-surface rounded-md border border-line flex-1 transition-colors">
            <div className="pl-4 text-ink-3 ">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por razão social, fantasia, CNPJ..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-ink outline-none placeholder-ink-3"
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

        {carregando ? (
          <div className="border border-dashed border-line-strong rounded-md p-12 flex flex-col items-center justify-center text-ink-2 gap-3">
            <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando fornecedores...</span>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto rounded-md border border-line transition-colors">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sunken border-b border-line transition-colors">
                  <tr>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Razão Social</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Nome Fantasia</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">CNPJ</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Inscrição Estadual</th>
                    <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Detalhes</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-line ">
                  {fornecedoresVisiveis.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-ink-2 font-medium">
                        Nenhum fornecedor encontrado.
                      </td>
                    </tr>
                  ) : (
                    fornecedoresVisiveis.map((f) => (
                      <tr key={f.id} className="hover:bg-sunken transition duration-150 group">
                        <td className="p-4 font-bold text-sm text-ink transition-colors">
                          {f.razao_social || "-"}
                        </td>
                        <td className="p-4 text-ink-2 font-semibold text-sm transition-colors">
                          {f.nome_fantasia || "-"}
                        </td>
                        <td className="p-4 text-ink-2 font-bold font-mono text-xs transition-colors">
                          {f.cnpj || "-"}
                        </td>
                        <td className="p-4 text-ink-2 font-bold font-mono text-xs transition-colors">
                          {f.inscricao_estadual || "-"}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => setFornecedorDetalhe(f)}
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
              {fornecedoresVisiveis.length === 0 ? (
                <div className="text-center py-8 text-ink-2 bg-sunken rounded-md border border-dashed border-line-strong transition-colors font-medium">
                  Nenhum fornecedor encontrado.
                </div>
              ) : (
                fornecedoresVisiveis.map((f) => (
                  <div
                    key={f.id}
                    className="bg-surface border border-line rounded-md p-5 transition-colors"
                  >
                    <div className="mb-4">
                      <h3 className="font-bold text-ink text-lg leading-tight transition-colors">
                        {f.razao_social || "-"}
                      </h3>
                      <span className="text-xs font-bold uppercase tracking-wide text-ink-2 bg-sunken px-2 py-1 rounded-md mt-2 inline-block transition-colors">
                        FANTASIA: {f.nome_fantasia || "-"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 bg-sunken p-4 rounded-md border border-line text-sm transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wide text-ink-3 mb-0.5">CNPJ</span>
                        <span className="text-xs font-semibold font-mono text-ink ">{f.cnpj || "-"}</span>
                      </div>
                      <div className="flex flex-col mt-2 pt-2 border-t border-line ">
                         <span className="text-xs font-bold uppercase tracking-wide text-ink-3 mb-0.5">Inscrição Estadual</span>
                         <span className="text-xs font-semibold font-mono text-ink ">{f.inscricao_estadual || "-"}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setFornecedorDetalhe(f)}
                        className="w-full py-2.5 rounded-md bg-sunken text-ink font-bold text-xs flex items-center justify-center gap-2 hover:bg-line transition-colors"
                      >
                         <Eye className="w-4 h-4" /> Ver Detalhes
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <button
                  onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
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
                  onClick={() =>
                    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
                  }
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

      <ModalDetalhesFornecedor
        aberto={!!fornecedorDetalhe}
        fornecedor={fornecedorDetalhe}
        onClose={() => setFornecedorDetalhe(null)}
      />

      <ModalCriarFornecedor
        aberto={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        onSucesso={async () => {
          setModalCriarAberto(false);
          await carregarFornecedores();
          setPaginaAtual(1);
          toast.success("Fornecedor cadastrado com sucesso!");
        }}
      />
    </>
  );
}

export default Fornecedores;