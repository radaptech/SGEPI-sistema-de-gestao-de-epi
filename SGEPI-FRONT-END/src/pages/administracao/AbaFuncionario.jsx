import { useState, useEffect, useMemo } from "react";
import { api } from "../../services/api";
import {
  Users,
  Search,
  Plus,
  PenLine,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserSearch,
  Building2,
  Briefcase
} from "lucide-react";
import Dialogo from "../../components/Dialogo";

export default function AbaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [funcoes, setFuncoes] = useState([]);

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 8; // Aumentei para 8 para preencher melhor a grid desktop

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(false);

  const [erros, setErros] = useState({});
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    id: null,
    nome: "",
    cpf: "",
    matricula: "",
    id_departamento: "",
    id_funcao: "",
  });

  useEffect(() => {
    carregarDados();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- carrega uma vez ao abrir a aba

  const mostrarToast = (mensagem, tipo = "sucesso") => {
    setToast({ mensagem, tipo });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const carregarDados = async () => {
    try {
      setCarregando(true);

      const [respFunc, respDepto, respFuncs] = await Promise.all([
        api.get("/funcionarios"),
        api.get("/departamentos"),
        api.get("/funcoes"),
      ]);

      setFuncionarios(respFunc.funcionarios ?? []);
      setDepartamentos(respDepto?.departamentos || []);
      setFuncoes(respFuncs?.funcoes || []);
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setCarregando(false);
    }
  };

  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    if (!termo) return funcionarios;

    return funcionarios.filter((f) => {
      const nomeDepto = f.funcao?.departamento?.departamento || "";
      const nomeFuncao = f.funcao?.cargo || "";
      const cpfLimpo = (f.cpf || "").replace(/\D/g, "");

      return (
        (f.nome || "").toLowerCase().includes(termo) ||
        String(f.matricula).includes(termo) ||
        (f.cpf || "").toLowerCase().includes(termo) ||
        cpfLimpo.includes(termo) ||
        nomeDepto.toLowerCase().includes(termo) ||
        nomeFuncao.toLowerCase().includes(termo)
      );
    });
  }, [funcionarios, busca]);

  const totalPaginas = Math.max(1, Math.ceil(funcionariosFiltrados.length / itensPorPagina));

  const funcionariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    return funcionariosFiltrados.slice(inicio, fim);
  }, [funcionariosFiltrados, paginaAtual]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca]);

  const funcoesDisponiveisForm = funcoes.filter(
    (f) => String(f.departamento?.id) === String(form.id_departamento)
  );

  const campoComErro = (campo) => {
    return erros[campo]
      ? "border-erro focus:ring-erro focus:border-erro bg-erro-soft "
      : "border-line focus:ring-ink focus:border-ink bg-surface text-ink ";
  };

  const limparErroCampo = (campo) => {
    if (!erros[campo]) return;

    setErros((errosAtuais) => {
      const novosErros = { ...errosAtuais };
      delete novosErros[campo];
      return novosErros;
    });
  };

  const atualizarCampo = (campo, valor) => {
    setForm((formAtual) => ({
      ...formAtual,
      [campo]: valor,
    }));

    limparErroCampo(campo);
  };

  const validarFormulario = () => {
    const novosErros = {};

    if (!form.nome.trim()) {
      novosErros.nome = "Informe o nome completo do funcionário.";
    }

    const cpfLimpo = form.cpf.replace(/\D/g, "");
    if (!cpfLimpo) {
      novosErros.cpf = "Informe o CPF do funcionário.";
    } else if (cpfLimpo.length !== 11) {
      novosErros.cpf = "O CPF deve conter exatamente 11 dígitos.";
    }

    if (!form.id_departamento) {
      novosErros.id_departamento = "Selecione o departamento.";
    }

    if (!form.id_funcao) {
      novosErros.id_funcao = "Selecione a função.";
    }

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  };

  const abrirModalNovo = () => {
    setEditando(false);
    setErros({});

    setForm({
      id: null,
      nome: "",
      cpf: "",
      matricula: "AUTOMÁTICA",
      id_departamento: "",
      id_funcao: "",
    });

    setModalAberto(true);
  };

  const abrirModalEditar = (func) => {
    setEditando(true);
    setErros({});

    setForm({
      id: func.id,
      nome: func.nome || "",
      cpf: func.cpf || "",
      matricula: func.matricula || "",
      id_departamento: func.funcao?.departamento?.id || "",
      id_funcao: func.funcao?.id || "",
    });

    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setErros({});
  };

  const salvarFuncionario = async () => {
    const formularioValido = validarFormulario();

    if (!formularioValido) return;

    try {
      setSalvando(true);

      const payload = {
        nome: form.nome.trim(),
        cpf: form.cpf.replace(/\D/g, ""),
        id_departamento: Number(form.id_departamento),
        id_funcao: Number(form.id_funcao),
      };

      if (editando) {
        await api.patch(`/gerencial/funcionario/${form.id}`, payload);
      } else {
        await api.post("/gerencial/cadastro-funcionario", payload);
      }

      fecharModal();
      await carregarDados();

      mostrarToast(
        editando
          ? "Funcionário atualizado com sucesso!"
          : "Funcionário cadastrado com sucesso!",
        "sucesso"
      );
    } catch (erro) {
      mostrarToast(erro?.message || "Erro ao salvar funcionário.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const excluirFuncionario = async (id) => {
    if (!window.confirm("Deseja realmente excluir este funcionário?")) return;

    try {
      await api.delete(`/gerencial/funcionario/${id}`);
      await carregarDados();

      if (funcionariosPaginados.length === 1 && paginaAtual > 1) {
        setPaginaAtual(paginaAtual - 1);
      }

      mostrarToast("Funcionário excluído com sucesso!", "sucesso");
    } catch (erro) {
      mostrarToast(erro?.message || "Erro ao excluir funcionário.", "erro");
    }
  };

  const baseInputClass = "w-full px-4 h-[46px] rounded-md text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder-ink-3 border";
  const labelClass = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 transition-colors";

  return (
    <div className=" transition-colors duration-300">
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
              <Users className="w-5 h-5 text-ink " />
              Funcionários
            </h2>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
              <input
                className="w-full h-[46px] pl-11 pr-4 border border-line bg-sunken rounded-md focus:ring-1 focus:ring-ink focus:border-ink outline-none text-sm transition-all text-ink placeholder-ink-3"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, CPF, matrícula, departamento ou função..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
            <div className="hidden sm:block text-right pr-4 border-r border-line transition-colors">
              <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-1">
                Total
              </p>
              <p className="text-2xl font-bold text-ink transition-colors">
                {carregando ? "..." : funcionariosFiltrados.length}
              </p>
            </div>

            <button
              onClick={abrirModalNovo}
              className="h-[46px] px-6 bg-action hover:bg-action-hover text-on-action font-bold rounded-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} /> Cadastrar
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block bg-surface rounded-md border border-line overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-sunken border-b border-line transition-colors">
              <tr>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Matrícula</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Nome / CPF</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Departamento</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide">Função</th>
                <th className="p-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line ">
              {carregando ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-ink-3 ">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-ink" />
                      <span className="font-medium">Sincronizando dados...</span>
                    </div>
                  </td>
                </tr>
              ) : funcionariosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-ink-3 transition-colors">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <UserSearch className="w-10 h-10 opacity-50" strokeWidth={1.5} />
                      <span className="font-medium">Nenhum funcionário encontrado.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                funcionariosPaginados.map((f) => (
                  <tr key={f.id} className="hover:bg-sunken transition-colors group">
                    <td className="p-4 text-ink-2 font-mono text-xs transition-colors">
                      {f.matricula}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-ink transition-colors">{f.nome}</div>
                      <div className="text-xs text-ink-3 font-mono mt-0.5 transition-colors">
                        {f.cpf || "CPF não informado"}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sunken text-ink-2 text-xs font-bold uppercase tracking-wide rounded-md border border-line transition-colors">
                        <Building2 className="w-3 h-3" />
                        {f.funcao?.departamento?.departamento || "-"}
                      </span>
                    </td>

                    <td className="p-4 text-ink-2 font-medium capitalize transition-colors">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-ink-3" />
                        {f.funcao?.cargo || "-"}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => abrirModalEditar(f)}
                          className="w-8 h-8 flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-sunken transition-colors"
                          title="Editar"
                        >
                          <PenLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => excluirFuncionario(f.id)}
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
        ) : funcionariosPaginados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-3 bg-surface border border-dashed border-line rounded-md transition-colors">
            <UserSearch className="w-10 h-10 opacity-50" strokeWidth={1.5} />
            <span className="font-medium text-sm">Nenhum funcionário encontrado.</span>
          </div>
        ) : (
          funcionariosPaginados.map((f) => (
            <div key={f.id} className="bg-surface border border-line rounded-md p-5 relative transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="pr-2">
                  <h3 className="text-base font-bold text-ink transition-colors">
                    {f.nome}
                  </h3>
                  <div className="text-xs text-ink-3 font-mono mt-0.5">
                    CPF: {f.cpf || "Não informado"}
                  </div>
                  <div className="text-xs text-ink-2 font-mono mt-0.5 font-bold">
                    Mat: {f.matricula}
                  </div>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => abrirModalEditar(f)}
                    className="w-8 h-8 flex items-center justify-center bg-sunken hover:bg-sunken text-ink-2 rounded-md transition-colors"
                  >
                    <PenLine className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => excluirFuncionario(f.id)}
                    className="w-8 h-8 flex items-center justify-center bg-erro-soft hover:bg-erro-soft text-erro rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-line transition-colors">
                <div>
                  <span className="block text-xs uppercase font-bold text-ink-3 tracking-wide mb-1">
                    Departamento
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sunken text-ink-2 text-xs font-bold uppercase tracking-wide rounded-md border border-line transition-colors">
                    <Building2 className="w-3 h-3" />
                    {f.funcao?.departamento?.departamento || "-"}
                  </span>
                </div>

                <div>
                  <span className="block text-xs uppercase font-bold text-ink-3 tracking-wide mb-1">
                    Função
                  </span>
                  <div className="flex items-center gap-2 text-ink text-sm font-medium capitalize">
                    <Briefcase className="w-4 h-4 text-ink-3" />
                    {f.funcao?.cargo || "-"}
                  </div>
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

      {modalAberto && (
        <Dialogo onClose={fecharModal} className="fixed inset-0 z-[120] bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink ">
          <div className="w-full max-w-2xl bg-surface rounded-md shadow-modal border border-line overflow-hidden flex flex-col transition-colors duration-300 max-h-[95vh]">

            <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0 transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 transition-colors ${editando ? "bg-atencao-soft text-atencao " : "bg-sunken text-ink "
                  }`}>
                  {editando ? <PenLine className="w-6 h-6" strokeWidth={2.5} /> : <Users className="w-6 h-6" strokeWidth={2.5} />}
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight transition-colors">
                    {editando ? "Editar Funcionário" : "Cadastrar Funcionário"}
                  </h3>
                  <p className="text-sm text-ink-2 mt-1 transition-colors">
                    Campos marcados com <span className="text-erro font-bold">*</span> são obrigatórios.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:px-8 overflow-y-auto custom-scrollbar flex-1 bg-sunken transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label htmlFor="abafuncionario-1" className={labelClass}>
                    Nome completo <span className="text-erro">*</span>
                  </label>
                  <input id="abafuncionario-1"
                    className={`${baseInputClass} ${campoComErro("nome")}`}
                    value={form.nome}
                    onChange={(e) => atualizarCampo("nome", e.target.value)}
                    placeholder="Ex: João da Silva"
                  />
                  {erros.nome && (
                    <p className="text-xs font-medium text-erro mt-1.5">{erros.nome}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="abafuncionario-2" className={labelClass}>
                    CPF <span className="text-erro">*</span>
                  </label>
                  <input id="abafuncionario-2"
                    className={`${baseInputClass} font-mono ${campoComErro("cpf")}`}
                    value={form.cpf}
                    onChange={(e) => {
                      const valorLimpo = e.target.value.replace(/\D/g, "").slice(0, 11);
                      atualizarCampo("cpf", valorLimpo);
                    }}
                    placeholder="Apenas números (11 dígitos)"
                  />
                  {erros.cpf && (
                    <p className="text-xs font-medium text-erro mt-1.5">{erros.cpf}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="abafuncionario-3" className={labelClass}>
                    Matrícula
                  </label>
                  <input id="abafuncionario-3"
                    className="w-full px-4 h-[46px] rounded-md text-sm font-bold font-mono outline-none transition-all bg-sunken text-ink-2 border border-line cursor-not-allowed"
                    value={form.matricula}
                    disabled
                    placeholder="Gerada automaticamente"
                  />
                  <p className="text-xs text-ink-3 mt-1.5 transition-colors">
                    Gerada automaticamente pelo sistema.
                  </p>
                </div>

                <div>
                  <label htmlFor="abafuncionario-4" className={labelClass}>
                    Departamento <span className="text-erro">*</span>
                  </label>
                  <select id="abafuncionario-4"
                    className={`${baseInputClass} ${campoComErro("id_departamento")}`}
                    value={form.id_departamento}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        id_departamento: e.target.value,
                        id_funcao: "",
                      });
                      limparErroCampo("id_departamento");
                      limparErroCampo("id_funcao");
                    }}
                  >
                    <option value="">Selecione...</option>
                    {departamentos.map((d) => (
                      <option key={d.id} value={d.id} className="uppercase">
                        {d.departamento}
                      </option>
                    ))}
                  </select>
                  {erros.id_departamento && (
                    <p className="text-xs font-medium text-erro mt-1.5">{erros.id_departamento}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="abafuncionario-5" className={labelClass}>
                    Função <span className="text-erro">*</span>
                  </label>
                  <select id="abafuncionario-5"
                    className={`${baseInputClass} ${campoComErro("id_funcao")}`}
                    value={form.id_funcao}
                    onChange={(e) => atualizarCampo("id_funcao", e.target.value)}
                    disabled={!form.id_departamento}
                  >
                    <option value="">
                      {form.id_departamento
                        ? "Selecione..."
                        : "Selecione um departamento primeiro"}
                    </option>
                    {funcoesDisponiveisForm.map((fn) => (
                      <option key={fn.id} value={fn.id} className="capitalize">
                        {fn.cargo}
                      </option>
                    ))}
                  </select>
                  {erros.id_funcao && (
                    <p className="text-xs font-medium text-erro mt-1.5">{erros.id_funcao}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-5 border-t border-line flex flex-col sm:flex-row sm:justify-end gap-3 bg-surface shrink-0 rounded-b-md transition-colors duration-300">
              <button
                onClick={fecharModal}
                className="w-full sm:w-auto h-[46px] px-6 bg-sunken text-ink text-sm font-bold rounded-md hover:bg-line transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={salvarFuncionario}
                disabled={salvando}
                className={`w-full sm:w-auto h-[46px] px-6 text-on-action font-bold rounded-md transition-all  flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${editando
                    ? "bg-action hover:bg-action-hover "
                    : "bg-action hover:bg-action-hover "
                  }`}
              >
                {salvando ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : editando ? (
                  "Salvar Alterações"
                ) : (
                  "Cadastrar Funcionário"
                )}
              </button>
            </div>

          </div>
        </Dialogo>
      )}
    </div>
  );
}