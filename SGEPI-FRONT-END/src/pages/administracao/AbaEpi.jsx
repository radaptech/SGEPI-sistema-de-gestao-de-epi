import { useState, useEffect, useMemo } from "react";
import { api } from "../../services/api";
import ModalNovoEpi from "../../components/modals/ModalNovoEpi";
import {
  Search,
  Plus,
  PenLine,
  Trash2,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  Shield
} from "lucide-react";

export default function AbaEpis() {
  const [epis, setEpis] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [buscaEpi, setBuscaEpi] = useState("");
  const [modalEpiAberto, setModalEpiAberto] = useState(false);
  const [epiParaEditar, setEpiParaEditar] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 8;

  const [toast, setToast] = useState(null);

  const mostrarToast = (mensagem, tipo = "sucesso") => {
    setToast({ mensagem, tipo });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const carregarEpis = async () => {
    try {
      setCarregando(true);

      const resposta = await api.get("/epis");

      setEpis((resposta.epis ?? []).map((epi) => ({
        ...epi,
        data_validadeCa: epi.validade_ca, // nome que o ModalNovoEpi lê na edição
        tamanhos: epi.tamanhos ?? [],
      })));
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setCarregando(false);
    }
  };

  const handleEditar = (epi) => {
    setEpiParaEditar(epi);
    setModalEpiAberto(true);
  };

  const handleRemover = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este EPI?")) return;

    try {
      await api.delete(`/gerencial/epi/${id}`);
      await carregarEpis();

      if (episPaginados.length === 1 && paginaAtual > 1) {
        setPaginaAtual(paginaAtual - 1);
      }

      mostrarToast("EPI excluído com sucesso!", "sucesso");
    } catch (erro) {
      console.error("Erro ao remover EPI:", erro);
      mostrarToast("Erro ao excluir o equipamento.", "erro");
    }
  };

  const aoSalvarEpi = async () => {
    const estavaEditando = Boolean(epiParaEditar);

    setModalEpiAberto(false);
    setEpiParaEditar(null);

    await carregarEpis();

    mostrarToast(
      estavaEditando
        ? "EPI atualizado com sucesso!"
        : "EPI cadastrado com sucesso!",
      "sucesso"
    );
  };

  useEffect(() => {
    carregarEpis();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- carrega uma vez ao abrir a aba

  const episFiltrados = useMemo(() => {
    const termo = buscaEpi.toLowerCase().trim();

    if (!termo) return epis;

    return epis.filter((epi) => {
      return (
        (epi?.nome || "").toLowerCase().includes(termo) ||
        (epi?.fabricante || "").toLowerCase().includes(termo) ||
        String(epi?.ca || "").toLowerCase().includes(termo) ||
        (epi?.protecao?.nome || "").toLowerCase().includes(termo)
      );
    });
  }, [epis, buscaEpi]);

  const totalPaginas = Math.max(1, Math.ceil(episFiltrados.length / itensPorPagina));

  const episPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    return episFiltrados.slice(inicio, fim);
  }, [episFiltrados, paginaAtual]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [buscaEpi]);

  const verificarStatusCA = (dataString) => {
    if (!dataString || dataString === "---" || dataString === "N/A") return "normal";

    let dataFormatada;
    if (dataString.includes("/")) {
      const [dia, mes, ano] = dataString.split("/");
      dataFormatada = new Date(`${ano}-${mes}-${dia}T00:00:00`);
    } else if (dataString.includes("-")) {
      dataFormatada = new Date(`${dataString}T00:00:00`);
    } else {
      return "normal";
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataAlerta = new Date(hoje);
    dataAlerta.setDate(hoje.getDate() + 15);

    if (dataFormatada < hoje) {
      return "vencido";
    } else if (dataFormatada <= dataAlerta) {
      return "alerta";
    }

    return "normal";
  };

  const BadgeValidade = ({ data, mobile }) => {
    const status = verificarStatusCA(data);

    if (status === "vencido") {
      return (
        <span className="text-erro font-bold flex items-center gap-1.5" title="CA Vencido!">
          <AlertCircle className="w-4 h-4 shrink-0" /> {data}
        </span>
      );
    }

    if (status === "alerta") {
      return (
        <span className="text-atencao font-bold flex items-center gap-1.5" title="Vence em 15 dias ou menos!">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {data}
        </span>
      );
    }

    return (
      <span className={mobile ? "font-bold text-ink " : "text-ink-2 font-medium"}>
        {data}
      </span>
    );
  };

  return (
    <div className=" p-2 md:p-0 transition-colors duration-300">
      {toast && (
        <div className={`fixed top-5 left-1/2 z-[9999] w-[90%] max-w-sm -translate-x-1/2 rounded-md border px-5 py-4 shadow-modal flex items-start gap-3 transition-colors sm:left-auto sm:right-5 sm:translate-x-0  ${toast.tipo === "sucesso"
            ? "bg-ok-soft border-ok-line text-ok "
            : "bg-erro-soft border-erro-line text-erro "
          }`}>
          {toast.tipo === "sucesso" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <div className="flex-1">
            <p className="text-sm font-bold">{toast.tipo === "sucesso" ? "Sucesso!" : "Atenção!"}</p>
            <p className="text-sm mt-0.5 leading-relaxed">{toast.mensagem}</p>
          </div>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-full">
        <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
          <div className="flex-1 max-w-2xl">
            <h2 className="text-xl font-bold text-ink mb-3 flex items-center gap-2 transition-colors">
              <Shield className="w-5 h-5 text-ink " />
              Inventário de EPIs
            </h2>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
              <input
                className="w-full h-[46px] pl-11 pr-4 border border-line bg-sunken rounded-md focus:ring-1 focus:ring-ink focus:border-ink outline-none text-sm transition-all text-ink placeholder-ink-3"
                value={buscaEpi}
                onChange={(e) => setBuscaEpi(e.target.value)}
                placeholder="Pesquisar por nome, CA, fabricante ou proteção..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
            <div className="hidden sm:block text-right pr-4 border-r border-line transition-colors">
              <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-1">
                Total
              </p>
              <p className="text-2xl font-bold text-ink transition-colors">
                {carregando ? "..." : episFiltrados.length}
              </p>
            </div>

            <button
              onClick={() => {
                setEpiParaEditar(null);
                setModalEpiAberto(true);
              }}
              className="h-[46px] px-6 bg-action hover:bg-action-hover text-on-action font-bold rounded-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} /> Cadastrar Novo EPI
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block bg-surface rounded-md border border-line overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-sunken border-b border-line transition-colors">
              <tr>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Equipamento</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Proteção</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Tamanhos</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Fabricante</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">CA</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Alerta Mín.</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Validade CA</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line ">
              {carregando ? (
                <tr>
                  <td colSpan="8" className="p-16 text-center text-ink-3 ">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-ink" />
                      <span className="font-medium">Sincronizando dados...</span>
                    </div>
                  </td>
                </tr>
              ) : episPaginados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-16 text-center text-ink-3 transition-colors">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <PackageSearch className="w-10 h-10 opacity-50" strokeWidth={1.5} />
                      <span className="font-medium">Nenhum equipamento encontrado.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                episPaginados.map((epi) => (
                  <tr key={epi.id} className="hover:bg-sunken transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-ink transition-colors">{epi.nome}</div>
                      <div className="text-xs text-ink-3 truncate max-w-[200px] mt-0.5">
                        {epi.descricao || "Sem observações"}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-sunken text-ink-2 text-xs font-bold uppercase tracking-wide rounded-md border border-line transition-colors">
                        {epi.protecao?.nome || "-"}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {epi.tamanhos?.map((tam, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-sunken text-ink text-xs font-bold border border-line transition-colors"
                          >
                            {tam.tamanho}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 text-ink-2 font-medium transition-colors">
                      {epi.fabricante}
                    </td>

                    <td className="p-4 text-center">
                      {epi.ca !== "N/A" ? (
                        <a
                          href={`https://consultaca.com/${epi.ca}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Consultar CA"
                          className="font-mono text-xs font-bold bg-atencao-soft text-atencao hover:bg-atencao-soft transition-colors px-2 py-1.5 rounded-md border border-atencao-line inline-flex items-center gap-1.5"
                        >
                          {epi.ca} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="font-mono text-xs font-bold bg-sunken text-ink-3 px-2 py-1.5 rounded-md border border-line transition-colors">
                          N/A
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center text-ink font-bold transition-colors">
                      {epi.alerta_minimo ?? 0}
                    </td>

                    <td className="p-4">
                      <BadgeValidade data={epi.data_validadeCa} mobile={false} />
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditar(epi)}
                          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-sunken transition-colors"
                          title="Editar"
                        >
                          <PenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemover(epi.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-3 hover:text-erro hover:bg-erro-soft transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:hidden flex flex-col gap-4">
        {carregando ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-3 ">
            <Loader2 className="w-8 h-8 animate-spin text-ink" />
            <span className="font-medium text-sm">Carregando dados...</span>
          </div>
        ) : episPaginados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-3 bg-surface border border-dashed border-line rounded-md transition-colors">
            <PackageSearch className="w-10 h-10 opacity-50" strokeWidth={1.5} />
            <span className="font-medium text-sm">Nenhum equipamento encontrado.</span>
          </div>
        ) : (
          episPaginados.map((epi) => (
            <div key={epi.id} className="bg-surface border border-line rounded-md p-5 relative transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-2">
                  <h3 className="text-base font-bold text-ink transition-colors">
                    {epi.nome}
                  </h3>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-sunken text-ink text-xs font-bold uppercase tracking-wide rounded-md border border-line transition-colors">
                    {epi.protecao?.nome || "Geral"}
                  </span>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleEditar(epi)}
                    className="w-8 h-8 flex items-center justify-center bg-sunken hover:bg-sunken text-ink-2 rounded-md transition-colors"
                  >
                    <PenLine className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemover(epi.id)}
                    className="w-8 h-8 flex items-center justify-center bg-erro-soft hover:bg-erro-soft text-erro rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-sm border-t border-line pt-4 transition-colors">
                <div>
                  <span className="text-xs font-bold text-ink-3 uppercase tracking-wide block mb-1">Fabricante</span>
                  <span className="font-bold text-ink ">
                    {epi.fabricante}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-ink-3 uppercase tracking-wide block mb-1">CA</span>
                  {epi.ca !== "N/A" ? (
                    <a
                      href={`https://consultaca.com/${epi.ca}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-ink hover:text-ink transition-colors font-mono flex items-center gap-1.5"
                    >
                      {epi.ca} <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-bold text-ink-2 font-mono">
                      N/A
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-ink-3 uppercase tracking-wide block mb-1">Validade CA</span>
                  <BadgeValidade data={epi.data_validadeCa} mobile={true} />
                </div>

                <div>
                  <span className="text-xs font-bold text-ink-3 uppercase tracking-wide block mb-1">Alerta Min.</span>
                  <span className="font-bold text-erro ">
                    {epi.alerta_minimo ?? 0} un.
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-6 bg-surface p-3 sm:px-4 rounded-md border border-line transition-colors">
          <button
            onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaAtual === 1}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-md text-ink-2 disabled:opacity-50 text-sm font-bold hover:bg-sunken transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <span className="text-xs font-bold text-ink-2 bg-sunken px-3 py-1.5 rounded-md transition-colors">
            {paginaAtual} de {totalPaginas}
          </span>

          <button
            onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={paginaAtual === totalPaginas}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-md text-ink-2 disabled:opacity-50 text-sm font-bold hover:bg-sunken transition-colors"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {modalEpiAberto && (
        <ModalNovoEpi
          onClose={() => {
            setModalEpiAberto(false);
            setEpiParaEditar(null);
          }}
          onSalvar={aoSalvarEpi}
          epiParaEditar={epiParaEditar}
        />
      )}
    </div>
  );
}