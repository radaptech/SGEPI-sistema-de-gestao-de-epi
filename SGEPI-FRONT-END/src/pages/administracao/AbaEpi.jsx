import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { PenLine, Trash2, ExternalLink, AlertTriangle, AlertCircle, PackageSearch, Shield } from "lucide-react";
import { api } from "../../services/api";
import ModalNovoEpi from "../../components/modals/ModalNovoEpi";
import { AcoesLinha, CabecalhoLista, EstadoLista } from "../../components/Cadastro";
import Paginacao, { usePaginacao, PAGINACAO_SOLTA } from "../../components/Paginacao";
import { calcularStatusValidade } from "../../utils/estoqueHelpers";

const th = "p-4 text-xs font-bold text-ink-2 uppercase tracking-wide";
const rotulo = "text-xs font-bold text-ink-3 uppercase tracking-wide block mb-1";

// Validade do CA: vermelho vencido, âmbar vencendo em 15 dias
function BadgeValidade({ data, mobile }) {
  const status = calcularStatusValidade(data, 15);
  if (status === "vencido") {
    return (
      <span className="text-erro font-bold flex items-center gap-1.5" title="CA Vencido!">
        <AlertCircle className="w-4 h-4 shrink-0" /> {data}
      </span>
    );
  }
  if (status === "proximo") {
    return (
      <span className="text-atencao font-bold flex items-center gap-1.5" title="Vence em 15 dias ou menos!">
        <AlertTriangle className="w-4 h-4 shrink-0" /> {data}
      </span>
    );
  }
  return <span className={mobile ? "font-bold text-ink" : "text-ink-2 font-medium"}>{data}</span>;
}

function LinkCA({ ca, className, iconeClassName }) {
  if (ca === "N/A") return null;
  return (
    <a href={`https://consultaca.com/${ca}`} target="_blank" rel="noopener noreferrer" title="Consultar CA" className={className}>
      {ca} <ExternalLink className={iconeClassName} />
    </a>
  );
}

function filtrar(epis, busca) {
  const termo = busca.toLowerCase().trim();
  if (!termo) return epis;
  return epis.filter((epi) =>
    [epi.nome, epi.fabricante, String(epi.ca || ""), epi.protecao?.nome].some((c) => (c || "").toLowerCase().includes(termo))
  );
}

export default function AbaEpis() {
  const [epis, setEpis] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  // undefined = fechado, null = cadastro novo, objeto = editando
  const [editando, setEditando] = useState(undefined);

  const carregar = async () => {
    try {
      setCarregando(true);
      const resposta = await api.get("/epis");
      setEpis(
        (resposta.epis ?? []).map((epi) => ({
          ...epi,
          data_validadeCa: epi.validade_ca, // nome que o ModalNovoEpi lê na edição
          tamanhos: epi.tamanhos ?? [],
        }))
      );
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => filtrar(epis, busca), [epis, busca]);
  const { itens: pagina, ...paginacao } = usePaginacao(filtrados, 8);
  const { setPagina } = paginacao;

  useEffect(() => {
    setPagina(1);
  }, [busca, setPagina]);

  const remover = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este EPI?")) return;
    try {
      await api.delete(`/gerencial/epi/${id}`);
      await carregar();
      toast.success("EPI excluído com sucesso!");
    } catch {
      // o api.js já mostrou o erro
    }
  };

  const salvo = async () => {
    toast.success(editando ? "EPI atualizado com sucesso!" : "EPI cadastrado com sucesso!");
    setEditando(undefined);
    await carregar();
  };

  const vazio = (
    <EstadoLista carregando={carregando} icone={PackageSearch} mensagem="Nenhum equipamento encontrado." />
  );

  return (
    <div className="p-2 md:p-0">
      <CabecalhoLista
        icone={Shield}
        titulo="Inventário de EPIs"
        busca={busca}
        onBusca={setBusca}
        placeholder="Pesquisar por nome, CA, fabricante ou proteção..."
        total={filtrados.length}
        carregando={carregando}
        textoNovo="Cadastrar Novo EPI"
        onNovo={() => setEditando(null)}
      />

      <div className="hidden lg:block bg-surface rounded-md border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-sunken border-b border-line">
              <tr>
                <th className={th}>Equipamento</th>
                <th className={th}>Proteção</th>
                <th className={`${th} text-center`}>Tamanhos</th>
                <th className={th}>Fabricante</th>
                <th className={`${th} text-center`}>CA</th>
                <th className={`${th} text-center`}>Alerta Mín.</th>
                <th className={th}>Validade CA</th>
                <th className={`${th} text-center`}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {carregando || pagina.length === 0 ? (
                <tr>
                  <td colSpan="8">{vazio}</td>
                </tr>
              ) : (
                pagina.map((epi) => (
                  <tr key={epi.id} className="hover:bg-sunken transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-ink">{epi.nome}</div>
                      <div className="text-xs text-ink-3 truncate max-w-[200px] mt-0.5">{epi.descricao || "Sem observações"}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 bg-sunken text-ink-2 text-xs font-bold uppercase tracking-wide rounded-md border border-line">
                        {epi.protecao?.nome || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {epi.tamanhos.map((tam, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-sunken text-ink text-xs font-bold border border-line">
                            {tam.tamanho}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-ink-2 font-medium">{epi.fabricante}</td>
                    <td className="p-4 text-center">
                      <LinkCA
                        ca={epi.ca}
                        className="font-mono text-xs font-bold bg-atencao-soft text-atencao px-2 py-1.5 rounded-md border border-atencao-line inline-flex items-center gap-1.5"
                        iconeClassName="w-3.5 h-3.5"
                      />
                      {epi.ca === "N/A" && (
                        <span className="font-mono text-xs font-bold bg-sunken text-ink-3 px-2 py-1.5 rounded-md border border-line">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-center text-ink font-bold">{epi.alerta_minimo ?? 0}</td>
                    <td className="p-4">
                      <BadgeValidade data={epi.data_validadeCa} />
                    </td>
                    <td className="p-4">
                      <AcoesLinha onEditar={() => setEditando(epi)} onExcluir={() => remover(epi.id)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lg:hidden flex flex-col gap-4">
        {carregando || pagina.length === 0 ? (
          <div className="bg-surface border border-dashed border-line rounded-md">{vazio}</div>
        ) : (
          pagina.map((epi) => (
            <div key={epi.id} className="bg-surface border border-line rounded-md p-5 relative">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-2">
                  <h3 className="text-base font-bold text-ink">{epi.nome}</h3>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-sunken text-ink text-xs font-bold uppercase tracking-wide rounded-md border border-line">
                    {epi.protecao?.nome || "Geral"}
                  </span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditando(epi)}
                    aria-label={`Editar ${epi.nome}`}
                    className="w-8 h-8 flex items-center justify-center bg-sunken text-ink-2 rounded-md transition-colors"
                  >
                    <PenLine className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remover(epi.id)}
                    aria-label={`Excluir ${epi.nome}`}
                    className="w-8 h-8 flex items-center justify-center bg-erro-soft text-erro rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-sm border-t border-line pt-4">
                <div>
                  <span className={rotulo}>Fabricante</span>
                  <span className="font-bold text-ink">{epi.fabricante}</span>
                </div>
                <div>
                  <span className={rotulo}>CA</span>
                  <LinkCA ca={epi.ca} className="font-bold text-ink font-mono flex items-center gap-1.5" iconeClassName="w-3 h-3" />
                  {epi.ca === "N/A" && <span className="font-bold text-ink-2 font-mono">N/A</span>}
                </div>
                <div>
                  <span className={rotulo}>Validade CA</span>
                  <BadgeValidade data={epi.data_validadeCa} mobile />
                </div>
                <div>
                  <span className={rotulo}>Alerta Min.</span>
                  <span className="font-bold text-erro">{epi.alerta_minimo ?? 0} un.</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Paginacao {...paginacao} className={PAGINACAO_SOLTA} />

      {editando !== undefined && <ModalNovoEpi onClose={() => setEditando(undefined)} onSalvar={salvo} epiParaEditar={editando} />}
    </div>
  );
}
