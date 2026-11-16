import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Briefcase, Building2, SearchX, ShieldCheck } from "lucide-react";
import { api } from "../../services/api";
import ImportarPlanilha from "../../components/ImportarPlanilha";
import ModalKitFuncao from "../../components/modals/ModalKitFuncao";
import Selecao from "../../components/Selecao";
import Campo, { inputClass } from "../../components/Campo";
import { CartaoFormulario, BotoesFormulario, CartaoLista, AcoesLinha, AcoesCartao, Rotulo } from "../../components/Cadastro";
import Paginacao, { usePaginacao, PAGINACAO_SOLTA } from "../../components/Paginacao";
import { baixarModeloFuncoes } from "../../utils/planilhasModelo";

const FORM_VAZIO = { funcao: "", id_departamento: "" };
const th = "p-4 text-xs font-bold text-ink-2 uppercase tracking-wide";

export default function AbaFuncoes() {
  const [funcoes, setFuncoes] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [funcaoKit, setFuncaoKit] = useState(null);
  const { itens: pagina, ...paginacao } = usePaginacao(funcoes, 10);

  const carregar = async () => {
    try {
      const [respFuncoes, respDepartamentos] = await Promise.all([api.get("/funcoes"), api.get("/departamentos")]);
      setFuncoes(respFuncoes?.funcoes || []);
      setDepartamentos(respDepartamentos?.departamentos || []);
    } catch {
      // o api.js já mostrou o erro
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const atualizar = (campo, valor) => {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros(({ [campo]: _, ...resto }) => resto);
  };

  const limpar = () => {
    setForm(FORM_VAZIO);
    setEditandoId(null);
    setErros({});
  };

  const baixarModelo = () => {
    if (departamentos.length === 0) {
      toast.error("Cadastre ao menos um departamento antes de baixar a planilha.");
      return;
    }
    baixarModeloFuncoes(departamentos);
  };

  const salvar = async () => {
    const novosErros = {};
    if (!form.id_departamento) novosErros.id_departamento = "Selecione o departamento vinculado.";
    if (!form.funcao.trim()) novosErros.funcao = "Informe o nome da função.";
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    try {
      setSalvando(true);
      const payload = { funcao: form.funcao.trim(), id_departamento: Number(form.id_departamento) };
      if (editandoId) await api.put(`/gerencial/funcao/${editandoId}`, payload);
      else await api.post("/gerencial/cadastro-funcao", payload);
      toast.success(editandoId ? "Função atualizada com sucesso!" : "Função cadastrada com sucesso!");
      limpar();
      paginacao.setPagina(1);
      await carregar();
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  const editar = (f) => {
    setForm({ funcao: f.cargo, id_departamento: f.departamento.id });
    setEditandoId(f.id);
    setErros({});
  };

  const remover = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta função?")) return;
    try {
      await api.delete(`/gerencial/funcao/${id}`);
      await carregar();
      toast.success("Função excluída com sucesso!");
    } catch {
      // o api.js já mostrou o erro
    }
  };

  const nomeDepartamento = (f) => f.departamento?.departamento || "Sem departamento";

  return (
    <div className="space-y-6">
      <ImportarPlanilha
        descricao="Baixe o modelo com os departamentos, preencha as funções e envie o arquivo (.xlsx)."
        rota="/gerencial/importar-funcoes"
        onBaixarModelo={baixarModelo}
        onSucesso={async () => {
          paginacao.setPagina(1);
          await carregar();
        }}
      />

      <CartaoFormulario editando={editandoId} icone={Briefcase} titulo={editandoId ? "Editar Função" : "Nova Função"}>
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_auto] gap-4 md:gap-5 items-start">
          <Campo id="funcao-departamento" rotulo="Departamento Vinculado" obrigatorio erro={erros.id_departamento}>
            <Selecao
              id="funcao-departamento"
              className={inputClass(erros.id_departamento)}
              value={form.id_departamento}
              onChange={(e) => atualizar("id_departamento", e.target.value)}
            >
              <option value="">Selecione...</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id} className="uppercase">
                  {d.departamento}
                </option>
              ))}
            </Selecao>
          </Campo>

          <Campo id="funcao-nome" rotulo="Nome da Função" obrigatorio erro={erros.funcao}>
            <input
              id="funcao-nome"
              className={inputClass(erros.funcao)}
              value={form.funcao}
              onChange={(e) => atualizar("funcao", e.target.value)}
              placeholder="Ex: Operador"
            />
          </Campo>

          <BotoesFormulario
            editando={editandoId}
            salvando={salvando}
            onSalvar={salvar}
            onCancelar={limpar}
            textoNovo="Salvar"
            textoEditando="Salvar"
            className="md:pt-[26px]"
          />
        </div>
      </CartaoFormulario>

      <CartaoLista titulo="Funções Cadastradas" total={funcoes.length} iconeVazio={SearchX} mensagemVazio="Nenhuma função cadastrada.">
        <div className="md:hidden p-4 space-y-4">
          {pagina.map((f) => (
            <div key={f.id} className="bg-sunken border border-line rounded-md p-4">
              <div className="space-y-3">
                <div>
                  <Rotulo>Função</Rotulo>
                  <span className="text-ink font-bold capitalize text-base">{f.cargo}</span>
                </div>
                <div>
                  <Rotulo>Departamento</Rotulo>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold bg-line text-ink uppercase">
                    <Building2 className="w-3 h-3" />
                    {nomeDepartamento(f)}
                  </span>
                </div>
              </div>
              <AcoesCartao onEditar={() => editar(f)} onExcluir={() => remover(f.id)}>
                <button
                  onClick={() => setFuncaoKit(f)}
                  className="flex-1 py-2.5 flex justify-center items-center gap-2 rounded-md bg-sunken text-ink-2 hover:text-ink font-bold text-sm transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" /> Kit
                </button>
              </AcoesCartao>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-sunken border-b border-line">
              <tr>
                <th className={`${th} pl-6`}>Função</th>
                <th className={th}>Departamento</th>
                <th className={`${th} pr-6 text-right`}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pagina.map((f) => (
                <tr key={f.id} className="hover:bg-sunken transition-colors group">
                  <td className="p-4 pl-6 font-bold text-ink capitalize">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-ink-3" />
                      {f.cargo}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sunken text-ink-2 text-xs font-bold uppercase tracking-wide rounded-md border border-line">
                      <Building2 className="w-3.5 h-3.5" />
                      {nomeDepartamento(f)}
                    </span>
                  </td>
                  <td className="p-4 pr-6">
                    <AcoesLinha onEditar={() => editar(f)} onExcluir={() => remover(f.id)} className="justify-end">
                      <button
                        onClick={() => setFuncaoKit(f)}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-sunken transition-colors"
                        title="Kit de EPI"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    </AcoesLinha>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CartaoLista>

      <Paginacao {...paginacao} className={PAGINACAO_SOLTA} />

      {funcaoKit && <ModalKitFuncao funcao={funcaoKit} onClose={() => setFuncaoKit(null)} />}
    </div>
  );
}
