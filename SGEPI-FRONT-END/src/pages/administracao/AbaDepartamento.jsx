import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { api } from "../../services/api";
import ImportarPlanilha from "../../components/ImportarPlanilha";
import {
  Building2,
  PenLine,
  Plus,
  Save,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function AbaDepartamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const [novoDepto, setNovoDepto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 9;

  const [erros, setErros] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    carregarDepartamentos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- carrega uma vez ao abrir a aba

  const mostrarToast = (mensagem, tipo = "sucesso") => {
    setToast({ mensagem, tipo });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const campoComErro = () => {
    return erros.departamento
      ? "border-erro focus:ring-erro focus:border-erro bg-erro-soft "
      : "border-line focus:ring-ink focus:border-ink bg-surface text-ink ";
  };

  const limparErroCampo = () => {
    if (!erros.departamento) return;
    setErros({});
  };

  const carregarDepartamentos = async () => {
    try {
      const resposta = await api.get("/departamentos");
      setDepartamentos(resposta?.departamentos || []);
    } catch {
      // o api.js já mostrou o erro
    }
  };

  const baixarModeloExcel = () => {
    const dadosModelo = [
      { "Instruções": "📌 Orientações de Preenchimento:" },
      { "Instruções": "1. Digite um departamento por linha na coluna 'Nome do Departamento'." },
      { "Instruções": "2. Não altere o nome do cabeçalho na linha 5." },
      { "Instruções": "3. Salve o arquivo e faça o upload no sistema." },
      {},
      { "Nome do Departamento": "TI" },
      { "Nome do Departamento": "Produção" },
      { "Nome do Departamento": "Logística e Almoxarifado" },
      { "Nome do Departamento": "Segurança do Trabalho" },
      { "Nome do Departamento": "Administrativo e RH" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(dadosModelo, {
      header: ["Nome do Departamento"],
      skipHeader: false,
    });

    worksheet["!cols"] = [{ wch: 45 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Departamentos");
    XLSX.writeFile(workbook, "modelo_departamentos.xlsx");
  };

  const totalPaginas = Math.max(1, Math.ceil(departamentos.length / itensPorPagina));

  const departamentosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return departamentos.slice(inicio, fim);
  }, [departamentos, paginaAtual]);

  const validarFormulario = () => {
    const novosErros = {};
    if (!novoDepto.trim()) {
      novosErros.departamento = "Informe o nome do departamento.";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const limparFormulario = () => {
    setNovoDepto("");
    setEditandoId(null);
    setErros({});
  };

  const salvarDepartamento = async () => {
    const formularioValido = validarFormulario();
    if (!formularioValido) return;

    try {
      setCarregando(true);
      const payload = {
        departamento: novoDepto.trim(),
      };
      const estavaEditando = Boolean(editandoId);

      if (editandoId) {
        await api.put(`/gerencial/departamento/${editandoId}`, payload);
      } else {
        await api.post("/gerencial/cadastro-departamento", payload);
      }

      limparFormulario();
      await carregarDepartamentos();

      mostrarToast(
        estavaEditando
          ? "Departamento atualizado com sucesso!"
          : "Departamento cadastrado com sucesso!",
        "sucesso"
      );
    } catch (erro) {
      console.error("Erro ao salvar departamento:", erro);
      mostrarToast(
        "Não foi possível salvar. Verifique os dados informados.",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  };

  const iniciarEdicao = (depto) => {
    setNovoDepto(depto.departamento || "");
    setEditandoId(depto.id);
    setErros({});
  };

  const cancelarEdicao = () => {
    limparFormulario();
  };

  const removerDepartamento = async (id) => {
    if (!window.confirm("Deseja realmente excluir este departamento?")) return;

    try {
      await api.delete(`/gerencial/departamento/${id}`);
      await carregarDepartamentos();
      if (departamentosPaginados.length === 1 && paginaAtual > 1) {
        setPaginaAtual(paginaAtual - 1);
      }

      mostrarToast("Departamento excluído com sucesso!", "sucesso");
    } catch (erro) {
      console.error("Erro ao remover departamento:", erro);
      mostrarToast("Erro ao remover departamento.", "erro");
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

      <ImportarPlanilha
        className="mb-6"
        descricao="Baixe o modelo, preencha os departamentos e envie o arquivo (.xlsx)."
        rota="/gerencial/importar-departamentos"
        onBaixarModelo={baixarModeloExcel}
        onSucesso={carregarDepartamentos}
        mostrarToast={mostrarToast}
      />

      <div className="bg-sunken p-5 sm:p-6 rounded-md border border-line mb-6 transition-colors">
        <div className="flex items-center gap-2.5 mb-5">
          <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${editandoId ? "bg-atencao-soft text-atencao " : "bg-sunken text-ink "
            }`}>
            {editandoId ? <PenLine className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
          </div>
          <h3 className="text-base font-bold text-ink transition-colors">
            {editandoId ? "Editar Departamento" : "Novo Departamento"}
          </h3>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 w-full">
            <label htmlFor="abadepartamento-1" className={labelClass}>
              Nome do Departamento <span className="text-erro">*</span>
            </label>
            <input id="abadepartamento-1"
              className={`${baseInputClass} ${campoComErro()}`}
              value={novoDepto}
              onChange={(e) => {
                setNovoDepto(e.target.value);
                limparErroCampo();
              }}
              placeholder="Ex: Produção, Administrativo..."
            />
            {erros.departamento && (
              <p className="text-xs font-medium text-erro mt-1.5">{erros.departamento}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
            {editandoId && (
              <button
                onClick={cancelarEdicao}
                disabled={carregando}
                className="w-full sm:w-auto h-[46px] px-6 text-ink-2 hover:bg-line font-bold rounded-md transition-colors text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
            )}

            <button
              onClick={salvarDepartamento}
              disabled={carregando}
              className={`w-full sm:w-auto h-[46px] px-6 text-on-action font-bold rounded-md transition-all  flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${editandoId
                  ? "bg-action hover:bg-action-hover "
                  : "bg-action hover:bg-action-hover "
                }`}
            >
              {carregando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : editandoId ? (
                <><Save className="w-4 h-4" /> Salvar Alteração</>
              ) : (
                <><Plus className="w-5 h-5" strokeWidth={2.5} /> Adicionar</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!Array.isArray(departamentos) || departamentos.length === 0 ? (
          <div className="col-span-full p-8 flex flex-col items-center justify-center text-ink-3 bg-surface border-2 border-dashed border-line rounded-md transition-colors">
            <Building2 className="w-10 h-10 mb-3 opacity-50" strokeWidth={1.5} />
            <span className="text-sm font-medium">Nenhum departamento cadastrado.</span>
          </div>
        ) : (
          departamentosPaginados.map((d) => (
            <div
              key={d.id}
              className="flex justify-between items-center p-4 border border-line rounded-md bg-surface transition-all group"
            >
              <span className="font-bold text-ink truncate pr-3">
                {d.departamento}
              </span>

              <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => iniciarEdicao(d)}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-ink-3 hover:text-atencao hover:bg-atencao-soft transition-colors"
                  title="Editar"
                >
                  <PenLine className="w-4 h-4" />
                </button>

                <button
                  onClick={() => removerDepartamento(d.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-ink-3 hover:text-erro hover:bg-erro-soft transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-ink-2 disabled:opacity-50 text-sm font-bold hover:bg-sunken transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-ink-2 disabled:opacity-50 text-sm font-bold hover:bg-sunken transition-colors"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}