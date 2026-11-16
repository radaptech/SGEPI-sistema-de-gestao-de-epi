import { useState } from "react";
import { toast } from "react-toastify";
import { Users, PenLine, X, Loader2 } from "lucide-react";
import { api } from "../../services/api";
import Dialogo from "../../components/Dialogo";
import Selecao from "../../components/Selecao";
import Campo, { inputClass } from "../../components/Campo";

function validar(form) {
  const erros = {};
  if (!form.nome.trim()) erros.nome = "Informe o nome completo do funcionário.";
  const cpf = form.cpf.replace(/\D/g, "");
  if (!cpf) erros.cpf = "Informe o CPF do funcionário.";
  else if (cpf.length !== 11) erros.cpf = "O CPF deve conter exatamente 11 dígitos.";
  if (!form.id_departamento) erros.id_departamento = "Selecione o departamento.";
  if (!form.id_funcao) erros.id_funcao = "Selecione a função.";
  return erros;
}

// funcionario null = cadastro novo
export default function ModalFuncionario({ funcionario, departamentos, funcoes, unidades, unidadePadrao, onClose, onSalvo }) {
  const editando = Boolean(funcionario);
  // com uma unidade só, nada de unidade aparece na tela
  const variasUnidades = unidades.length >= 2;

  const [form, setForm] = useState(() =>
    editando
      ? {
          nome: funcionario.nome || "",
          cpf: funcionario.cpf || "",
          matricula: funcionario.matricula || "",
          id_departamento: funcionario.funcao?.departamento?.id || "",
          id_funcao: funcionario.funcao?.id || "",
          id_unidade: String(funcionario.unidade?.id ?? ""),
        }
      : { nome: "", cpf: "", matricula: "AUTOMÁTICA", id_departamento: "", id_funcao: "", id_unidade: unidadePadrao }
  );
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const funcoesDoDepartamento = funcoes.filter((f) => String(f.departamento?.id) === String(form.id_departamento));

  const atualizar = (campos) => {
    setForm((atual) => ({ ...atual, ...campos }));
    setErros((atuais) => {
      const novos = { ...atuais };
      Object.keys(campos).forEach((c) => delete novos[c]);
      return novos;
    });
  };

  const salvar = async () => {
    const novosErros = validar(form);
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf.replace(/\D/g, ""),
      id_departamento: Number(form.id_departamento),
      id_funcao: Number(form.id_funcao),
      ...(variasUnidades && form.id_unidade && { id_unidade: Number(form.id_unidade) }),
    };

    try {
      setSalvando(true);
      if (editando) await api.patch(`/gerencial/funcionario/${funcionario.id}`, payload);
      else await api.post("/gerencial/cadastro-funcionario", payload);
      toast.success(editando ? "Funcionário atualizado com sucesso!" : "Funcionário cadastrado com sucesso!");
      onSalvo();
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialogo onClose={onClose} className="fixed inset-0 z-[120] bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink ">
      <div className="w-full max-w-2xl bg-surface rounded-md shadow-modal border border-line overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${editando ? "bg-atencao-soft text-atencao" : "bg-sunken text-ink"}`}>
              {editando ? <PenLine className="w-6 h-6" strokeWidth={2.5} /> : <Users className="w-6 h-6" strokeWidth={2.5} />}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                {editando ? "Editar Funcionário" : "Cadastrar Funcionário"}
              </h3>
              <p className="text-sm text-ink-2 mt-1">
                Campos marcados com <span className="text-erro font-bold">*</span> são obrigatórios.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:px-8 overflow-y-auto custom-scrollbar flex-1 bg-sunken">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Campo id="funcionario-nome" rotulo="Nome completo" obrigatorio erro={erros.nome} className="md:col-span-2">
              <input
                id="funcionario-nome"
                className={inputClass(erros.nome)}
                value={form.nome}
                onChange={(e) => atualizar({ nome: e.target.value })}
                placeholder="Ex: João da Silva"
              />
            </Campo>

            <Campo id="funcionario-cpf" rotulo="CPF" obrigatorio erro={erros.cpf}>
              <input
                id="funcionario-cpf"
                className={`${inputClass(erros.cpf)} font-mono`}
                value={form.cpf}
                onChange={(e) => atualizar({ cpf: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                placeholder="Apenas números (11 dígitos)"
              />
            </Campo>

            <Campo id="funcionario-matricula" rotulo="Matrícula" ajuda="Gerada automaticamente pelo sistema.">
              <input
                id="funcionario-matricula"
                className="w-full px-4 h-[46px] rounded-md text-sm font-bold font-mono outline-none bg-sunken text-ink-2 border border-line cursor-not-allowed"
                value={form.matricula}
                disabled
                placeholder="Gerada automaticamente"
              />
            </Campo>

            <Campo id="funcionario-departamento" rotulo="Departamento" obrigatorio erro={erros.id_departamento}>
              <Selecao
                id="funcionario-departamento"
                className={inputClass(erros.id_departamento)}
                value={form.id_departamento}
                onChange={(e) => atualizar({ id_departamento: e.target.value, id_funcao: "" })}
              >
                <option value="">Selecione...</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id} className="uppercase">
                    {d.departamento}
                  </option>
                ))}
              </Selecao>
            </Campo>

            <Campo id="funcionario-funcao" rotulo="Função" obrigatorio erro={erros.id_funcao}>
              <Selecao
                id="funcionario-funcao"
                className={inputClass(erros.id_funcao)}
                value={form.id_funcao}
                onChange={(e) => atualizar({ id_funcao: e.target.value })}
                disabled={!form.id_departamento}
              >
                <option value="">{form.id_departamento ? "Selecione..." : "Selecione um departamento primeiro"}</option>
                {funcoesDoDepartamento.map((fn) => (
                  <option key={fn.id} value={fn.id} className="capitalize">
                    {fn.cargo}
                  </option>
                ))}
              </Selecao>
            </Campo>

            {variasUnidades && (
              <Campo id="funcionario-unidade" rotulo="Unidade" ajuda="Onde ele trabalha. Mudar a unidade não altera as entregas já feitas.">
                <Selecao
                  id="funcionario-unidade"
                  className={inputClass()}
                  value={form.id_unidade}
                  onChange={(e) => atualizar({ id_unidade: e.target.value })}
                >
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </Selecao>
              </Campo>
            )}
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-line flex flex-col sm:flex-row sm:justify-end gap-3 bg-surface shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto h-[46px] px-6 bg-sunken text-ink text-sm font-bold rounded-md hover:bg-line transition-colors">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="w-full sm:w-auto h-[46px] px-6 bg-action hover:bg-action-hover text-on-action font-bold rounded-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : editando ? "Salvar Alterações" : "Cadastrar Funcionário"}
          </button>
        </div>
      </div>
    </Dialogo>
  );
}
