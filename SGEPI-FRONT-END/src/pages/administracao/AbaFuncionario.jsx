import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { Users, PenLine, Trash2, UserSearch, Building2, Briefcase } from "lucide-react";
import { api } from "../../services/api";
import Selecao from "../../components/Selecao";
import Paginacao, { usePaginacao, PAGINACAO_SOLTA } from "../../components/Paginacao";
import ModalFuncionario from "./ModalFuncionario";
import { AcoesLinha, CabecalhoLista, EstadoLista } from "../../components/Cadastro";

const th = "p-4 text-xs font-bold text-ink-2 uppercase tracking-wide";
const rotulo = "block text-xs uppercase font-bold text-ink-3 tracking-wide mb-1";

function filtrar(funcionarios, busca, unidade) {
  const termo = busca.toLowerCase().trim();
  const daUnidade = unidade ? funcionarios.filter((f) => String(f.unidade?.id) === unidade) : funcionarios;
  if (!termo) return daUnidade;

  return daUnidade.filter((f) =>
    [
      f.nome,
      String(f.matricula),
      f.cpf,
      (f.cpf || "").replace(/\D/g, ""),
      f.funcao?.departamento?.departamento,
      f.funcao?.cargo,
    ].some((campo) => (campo || "").toLowerCase().includes(termo))
  );
}

function Departamento({ f }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sunken text-ink-2 text-xs font-bold uppercase tracking-wide rounded-md border border-line">
      <Building2 className="w-3 h-3" />
      {f.funcao?.departamento?.departamento || "-"}
    </span>
  );
}

export default function AbaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [funcoes, setFuncoes] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [filtroUnidade, setFiltroUnidade] = useState("");
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  // undefined = fechado, null = cadastro novo, objeto = editando
  const [editando, setEditando] = useState(undefined);

  // com uma unidade só, nada de unidade aparece na tela
  const variasUnidades = unidades.length >= 2;

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [respFunc, respDepto, respFuncs, respUnidades] = await Promise.all([
        api.get("/funcionarios"),
        api.get("/departamentos"),
        api.get("/funcoes"),
        api.get("/unidades"),
      ]);
      setFuncionarios(respFunc.funcionarios ?? []);
      setUnidades(respUnidades ?? []);
      setDepartamentos(respDepto?.departamentos || []);
      setFuncoes(respFuncs?.funcoes || []);
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const filtrados = useMemo(() => filtrar(funcionarios, busca, filtroUnidade), [funcionarios, busca, filtroUnidade]);
  // 8 por página preenche melhor a grid desktop
  const { itens: pagina, ...paginacao } = usePaginacao(filtrados, 8);
  const { setPagina } = paginacao;

  useEffect(() => {
    setPagina(1);
  }, [busca, filtroUnidade, setPagina]);

  const excluir = async (id) => {
    if (!window.confirm("Deseja realmente excluir este funcionário?")) return;
    try {
      await api.delete(`/gerencial/funcionario/${id}`);
      await carregarDados();
      toast.success("Funcionário excluído com sucesso!");
    } catch {
      // o api.js já mostrou o erro
    }
  };

  const salvo = async () => {
    setEditando(undefined);
    await carregarDados();
  };

  return (
    <div>
      <CabecalhoLista
        icone={Users}
        titulo="Funcionários"
        busca={busca}
        onBusca={setBusca}
        placeholder="Nome, CPF, matrícula, departamento ou função..."
        total={filtrados.length}
        carregando={carregando}
        textoNovo="Cadastrar"
        onNovo={() => setEditando(null)}
      >
        {variasUnidades && (
          <div className="sm:w-56 shrink-0">
            <label htmlFor="abafuncionario-filtro-unidade" className="sr-only">
              Filtrar por unidade
            </label>
            <Selecao
              id="abafuncionario-filtro-unidade"
              className="w-full h-[46px] px-4 border border-line bg-sunken rounded-md text-sm text-ink"
              value={filtroUnidade}
              onChange={(e) => setFiltroUnidade(e.target.value)}
            >
              <option value="">Todas as unidades</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </Selecao>
          </div>
        )}
      </CabecalhoLista>

      <div className="hidden lg:block bg-surface rounded-md border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-sunken border-b border-line">
              <tr>
                <th className={th}>Matrícula</th>
                <th className={th}>Nome / CPF</th>
                <th className={th}>Departamento</th>
                <th className={th}>Função</th>
                {variasUnidades && <th className={th}>Unidade</th>}
                <th className={`${th} text-center`}>Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {carregando || pagina.length === 0 ? (
                <tr>
                  <td colSpan={variasUnidades ? 6 : 5}>
                    <EstadoLista carregando={carregando} icone={UserSearch} mensagem="Nenhum funcionário encontrado." />
                  </td>
                </tr>
              ) : (
                pagina.map((f) => (
                  <tr key={f.id} className="hover:bg-sunken transition-colors group">
                    <td className="p-4 text-ink-2 font-mono text-xs">{f.matricula}</td>
                    <td className="p-4">
                      <div className="font-bold text-ink">{f.nome}</div>
                      <div className="text-xs text-ink-3 font-mono mt-0.5">{f.cpf || "CPF não informado"}</div>
                    </td>
                    <td className="p-4">
                      <Departamento f={f} />
                    </td>
                    <td className="p-4 text-ink-2 font-medium capitalize">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-ink-3" />
                        {f.funcao?.cargo || "-"}
                      </div>
                    </td>
                    {variasUnidades && <td className="p-4 text-ink-2 font-medium">{f.unidade?.nome || "-"}</td>}
                    <td className="p-4">
                      <AcoesLinha onEditar={() => setEditando(f)} onExcluir={() => excluir(f.id)} />
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
          <div className="bg-surface border border-dashed border-line rounded-md">
            <EstadoLista carregando={carregando} icone={UserSearch} mensagem="Nenhum funcionário encontrado." />
          </div>
        ) : (
          pagina.map((f) => (
            <div key={f.id} className="bg-surface border border-line rounded-md p-5 relative">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-2">
                  <h3 className="text-base font-bold text-ink">{f.nome}</h3>
                  <div className="text-xs text-ink-3 font-mono mt-0.5">CPF: {f.cpf || "Não informado"}</div>
                  <div className="text-xs text-ink-2 font-mono mt-0.5 font-bold">Mat: {f.matricula}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditando(f)}
                    aria-label={`Editar ${f.nome}`}
                    className="w-8 h-8 flex items-center justify-center bg-sunken text-ink-2 rounded-md transition-colors"
                  >
                    <PenLine className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => excluir(f.id)}
                    aria-label={`Excluir ${f.nome}`}
                    className="w-8 h-8 flex items-center justify-center bg-erro-soft text-erro rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-line">
                <div>
                  <span className={rotulo}>Departamento</span>
                  <Departamento f={f} />
                </div>
                <div>
                  <span className={rotulo}>Função</span>
                  <div className="flex items-center gap-2 text-ink text-sm font-medium capitalize">
                    <Briefcase className="w-4 h-4 text-ink-3" />
                    {f.funcao?.cargo || "-"}
                  </div>
                </div>
                {variasUnidades && (
                  <div>
                    <span className={rotulo}>Unidade</span>
                    <span className="text-ink text-sm font-medium">{f.unidade?.nome || "-"}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Paginacao {...paginacao} className={PAGINACAO_SOLTA} />

      {editando !== undefined && (
        <ModalFuncionario
          funcionario={editando}
          departamentos={departamentos}
          funcoes={funcoes}
          unidades={unidades}
          unidadePadrao={filtroUnidade || String(unidades[0]?.id ?? "")}
          onClose={() => setEditando(undefined)}
          onSalvo={salvo}
        />
      )}
    </div>
  );
}
