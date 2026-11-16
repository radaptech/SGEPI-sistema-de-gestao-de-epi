import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Truck, PackageSearch } from "lucide-react";
import { api } from "../../services/api";
import ImportarPlanilha from "../../components/ImportarPlanilha";
import Campo, { inputClass } from "../../components/Campo";
import { CartaoFormulario, BotoesFormulario, CartaoLista, AcoesLinha, AcoesCartao, Rotulo } from "../../components/Cadastro";
import { baixarModeloFornecedores } from "../../utils/planilhasModelo";
import { cnpjValido } from "../../utils/cnpj";

const FORM_VAZIO = { razao_social: "", nome_fantasia: "", cnpj: "", inscricao_estadual: "" };
const th = "p-4 text-xs font-bold text-ink-2 uppercase tracking-wide";

function validar(form) {
  const erros = {};
  const cnpj = form.cnpj.replace(/\D/g, "");
  if (!form.razao_social.trim()) erros.razao_social = "Informe a razão social.";
  if (!form.nome_fantasia.trim()) erros.nome_fantasia = "Informe o nome fantasia.";
  if (!cnpj) erros.cnpj = "Informe o CNPJ.";
  else if (cnpj.length !== 14) erros.cnpj = "O CNPJ deve ter 14 números.";
  else if (!cnpjValido(cnpj)) erros.cnpj = "Informe um CNPJ válido.";
  if (!form.inscricao_estadual.replace(/\D/g, "")) erros.inscricao_estadual = "Informe a inscrição estadual.";
  return erros;
}

// [campo, rótulo, placeholder, mono]
const CAMPOS = [
  ["razao_social", "Razão Social", "Ex: Empresa X Ltda"],
  ["nome_fantasia", "Nome Fantasia", "Ex: Empresa X"],
  ["cnpj", "CNPJ", "00.000.000/0000-00", true],
  ["inscricao_estadual", "Inscrição Estadual", "Ex: 123.456.789/000"],
];

export default function AbaFornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const carregar = async () => {
    try {
      const resposta = await api.get("/fornecedores");
      setFornecedores(resposta.fornecedores ?? []);
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

  const salvar = async () => {
    const novosErros = validar(form);
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    const payload = {
      razao_social: form.razao_social.trim(),
      nome_fantasia: form.nome_fantasia.trim(),
      cnpj: form.cnpj.replace(/\D/g, ""),
      inscricao_estadual: form.inscricao_estadual.replace(/\D/g, ""),
    };

    try {
      setSalvando(true);
      if (editandoId) await api.patch(`/gerencial/fornecedor/${editandoId}`, payload);
      else await api.post("/gerencial/cadastro-fornecedores", payload);
      toast.success(editandoId ? "Fornecedor atualizado com sucesso!" : "Fornecedor cadastrado com sucesso!");
      limpar();
      await carregar();
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (id) => {
    if (!window.confirm("Deseja realmente excluir este fornecedor?")) return;
    try {
      await api.delete(`/gerencial/fornecedor/${id}`);
      await carregar();
      toast.success("Fornecedor excluído com sucesso!");
    } catch {
      // o api.js já mostrou o erro
    }
  };

  const editar = (f) => {
    setForm(Object.fromEntries(Object.keys(FORM_VAZIO).map((c) => [c, f[c] || ""])));
    setEditandoId(f.id);
    setErros({});
  };

  return (
    <div className="space-y-6">
      <ImportarPlanilha
        descricao="Baixe o modelo, preencha os fornecedores e envie o arquivo (.xlsx)."
        rota="/gerencial/importar-fornecedores"
        onBaixarModelo={baixarModeloFornecedores}
        onSucesso={carregar}
      />

      <CartaoFormulario editando={editandoId} icone={Truck} titulo={editandoId ? "Editar Fornecedor" : "Novo Fornecedor"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {CAMPOS.map(([campo, rotulo, placeholder, mono]) => (
            <Campo key={campo} id={`fornecedor-${campo}`} rotulo={rotulo} obrigatorio erro={erros[campo]}>
              <input
                id={`fornecedor-${campo}`}
                className={`${inputClass(erros[campo])} ${mono ? "font-mono" : ""}`}
                value={form[campo]}
                onChange={(e) => atualizar(campo, e.target.value)}
                placeholder={placeholder}
              />
            </Campo>
          ))}
        </div>
        <BotoesFormulario
          editando={editandoId}
          salvando={salvando}
          onSalvar={salvar}
          onCancelar={limpar}
          textoNovo="Cadastrar Fornecedor"
          textoEditando="Salvar Alterações"
          className="mt-6"
        />
      </CartaoFormulario>

      <CartaoLista
        titulo="Fornecedores Cadastrados"
        total={fornecedores.length}
        iconeVazio={PackageSearch}
        mensagemVazio="Nenhum fornecedor registrado."
      >
        <div className="md:hidden p-4 space-y-4">
          {fornecedores.map((f) => (
            <div key={f.id} className="bg-sunken border border-line rounded-md p-4">
              <div className="space-y-3">
                <div>
                  <Rotulo>Razão Social</Rotulo>
                  <span className="text-ink font-bold">{f.razao_social || "-"}</span>
                </div>
                <div>
                  <Rotulo>Nome Fantasia</Rotulo>
                  <span className="text-ink-2 font-medium">{f.nome_fantasia || "-"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Rotulo>CNPJ</Rotulo>
                    <span className="text-ink-2 font-mono text-xs">{f.cnpj || "-"}</span>
                  </div>
                  <div>
                    <Rotulo>Insc. Estadual</Rotulo>
                    <span className="text-ink-2 font-mono text-xs">{f.inscricao_estadual || "-"}</span>
                  </div>
                </div>
              </div>
              <AcoesCartao onEditar={() => editar(f)} onExcluir={() => remover(f.id)} />
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-sunken border-b border-line">
              <tr>
                <th className={th}>Razão Social</th>
                <th className={th}>Nome Fantasia</th>
                <th className={th}>CNPJ</th>
                <th className={th}>Insc. Estadual</th>
                <th className={`${th} text-center`}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {fornecedores.map((f) => (
                <tr key={f.id} className="hover:bg-sunken transition-colors group">
                  <td className="p-4 font-bold text-ink">{f.razao_social || "-"}</td>
                  <td className="p-4 text-ink-2 font-medium">{f.nome_fantasia || "-"}</td>
                  <td className="p-4 text-ink-2 font-mono text-xs">{f.cnpj || "-"}</td>
                  <td className="p-4 text-ink-2 font-mono text-xs">{f.inscricao_estadual || "-"}</td>
                  <td className="p-4">
                    <AcoesLinha onEditar={() => editar(f)} onExcluir={() => remover(f.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CartaoLista>
    </div>
  );
}
