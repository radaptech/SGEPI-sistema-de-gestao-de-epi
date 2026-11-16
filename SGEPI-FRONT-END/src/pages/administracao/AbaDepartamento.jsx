import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Building2 } from "lucide-react";
import { api } from "../../services/api";
import ImportarPlanilha from "../../components/ImportarPlanilha";
import Campo, { inputClass } from "../../components/Campo";
import { CartaoFormulario, BotoesFormulario, AcoesLinha } from "../../components/Cadastro";
import Paginacao, { usePaginacao, PAGINACAO_SOLTA } from "../../components/Paginacao";
import { baixarModeloDepartamentos } from "../../utils/planilhasModelo";

export default function AbaDepartamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const { itens: pagina, ...paginacao } = usePaginacao(departamentos, 9);

  const carregar = async () => {
    try {
      const resposta = await api.get("/departamentos");
      setDepartamentos(resposta?.departamentos || []);
    } catch {
      // o api.js já mostrou o erro
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const limpar = () => {
    setNome("");
    setEditandoId(null);
    setErro("");
  };

  const salvar = async () => {
    if (!nome.trim()) return setErro("Informe o nome do departamento.");
    try {
      setSalvando(true);
      const payload = { departamento: nome.trim() };
      if (editandoId) await api.put(`/gerencial/departamento/${editandoId}`, payload);
      else await api.post("/gerencial/cadastro-departamento", payload);
      toast.success(editandoId ? "Departamento atualizado com sucesso!" : "Departamento cadastrado com sucesso!");
      limpar();
      await carregar();
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id) => {
    if (!window.confirm("Deseja realmente excluir este departamento?")) return;
    try {
      await api.delete(`/gerencial/departamento/${id}`);
      await carregar();
      toast.success("Departamento excluído com sucesso!");
    } catch {
      // o api.js já mostrou o erro
    }
  };

  const editar = (d) => {
    setNome(d.departamento || "");
    setEditandoId(d.id);
    setErro("");
  };

  return (
    <div className="space-y-6">
      <ImportarPlanilha
        descricao="Baixe o modelo, preencha os departamentos e envie o arquivo (.xlsx)."
        rota="/gerencial/importar-departamentos"
        onBaixarModelo={baixarModeloDepartamentos}
        onSucesso={carregar}
      />

      <CartaoFormulario
        editando={editandoId}
        icone={Building2}
        titulo={editandoId ? "Editar Departamento" : "Novo Departamento"}
        obrigatorios={false}
      >
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <Campo id="departamento-nome" rotulo="Nome do Departamento" obrigatorio erro={erro} className="flex-1 w-full">
            <input
              id="departamento-nome"
              className={inputClass(erro)}
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setErro("");
              }}
              placeholder="Ex: Produção, Administrativo..."
            />
          </Campo>
          <BotoesFormulario
            editando={editandoId}
            salvando={salvando}
            onSalvar={salvar}
            onCancelar={limpar}
            textoNovo="Adicionar"
            textoEditando="Salvar Alteração"
            className="w-full md:w-auto shrink-0"
          />
        </div>
      </CartaoFormulario>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departamentos.length === 0 ? (
          <div className="col-span-full p-8 flex flex-col items-center justify-center text-ink-3 bg-surface border-2 border-dashed border-line rounded-md">
            <Building2 className="w-10 h-10 mb-3 opacity-50" strokeWidth={1.5} />
            <span className="text-sm font-medium">Nenhum departamento cadastrado.</span>
          </div>
        ) : (
          pagina.map((d) => (
            <div key={d.id} className="flex justify-between items-center p-4 border border-line rounded-md bg-surface group">
              <span className="font-bold text-ink truncate pr-3">{d.departamento}</span>
              <AcoesLinha onEditar={() => editar(d)} onExcluir={() => remover(d.id)} className="shrink-0" />
            </div>
          ))
        )}
      </div>

      <Paginacao {...paginacao} className={PAGINACAO_SOLTA} />
    </div>
  );
}
