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
      ? "border-red-400 dark:border-red-500/50 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30 dark:bg-red-900/10"
      : "border-slate-200/60 dark:border-slate-700/60 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200";
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

  const baseInputClass = "w-full px-4 h-[46px] rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-400 border";
  const labelClass = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 transition-colors";

  return (
    <div className="animate-fade-in transition-colors duration-300">
      {toast && (
        <div className={`fixed top-5 left-1/2 z-[9999] w-[90%] max-w-sm -translate-x-1/2 rounded-2xl border px-5 py-4 shadow-xl flex items-start gap-3 transition-colors sm:left-auto sm:right-5 sm:translate-x-0 animate-fade-in ${toast.tipo === "sucesso"
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300"
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

      <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 mb-6 transition-colors">
        <div className="flex items-center gap-2.5 mb-5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${editandoId ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            }`}>
            {editandoId ? <PenLine className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 transition-colors">
            {editandoId ? "Editar Departamento" : "Novo Departamento"}
          </h3>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1 w-full">
            <label className={labelClass}>
              Nome do Departamento <span className="text-red-500">*</span>
            </label>
            <input
              className={`${baseInputClass} ${campoComErro()}`}
              value={novoDepto}
              onChange={(e) => {
                setNovoDepto(e.target.value);
                limparErroCampo();
              }}
              placeholder="Ex: Produção, Administrativo..."
            />
            {erros.departamento && (
              <p className="text-xs font-medium text-red-500 mt-1.5">{erros.departamento}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
            {editandoId && (
              <button
                onClick={cancelarEdicao}
                disabled={carregando}
                className="w-full sm:w-auto h-[46px] px-6 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
            )}

            <button
              onClick={salvarDepartamento}
              disabled={carregando}
              className={`w-full sm:w-auto h-[46px] px-6 text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${editandoId
                  ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-amber-500/20"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-blue-600/20"
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
          <div className="col-span-full p-8 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800/50 border-2 border-dashed border-slate-200/60 dark:border-slate-700/60 rounded-2xl transition-colors">
            <Building2 className="w-10 h-10 mb-3 opacity-50" strokeWidth={1.5} />
            <span className="text-sm font-medium">Nenhum departamento cadastrado.</span>
          </div>
        ) : (
          departamentosPaginados.map((d) => (
            <div
              key={d.id}
              className="flex justify-between items-center p-4 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl bg-white dark:bg-slate-800/80 shadow-sm hover:shadow-md dark:shadow-none transition-all group"
            >
              <span className="font-extrabold text-slate-700 dark:text-slate-200 truncate pr-3">
                {d.departamento}
              </span>

              <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => iniciarEdicao(d)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 transition-colors"
                  title="Editar"
                >
                  <PenLine className="w-4 h-4" />
                </button>

                <button
                  onClick={() => removerDepartamento(d.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
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
        <div className="flex items-center justify-between mt-6 bg-white dark:bg-slate-800/80 p-3 sm:px-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-colors">
          <button
            onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaAtual === 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 disabled:opacity-50 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg transition-colors">
            {paginaAtual} de {totalPaginas}
          </span>

          <button
            onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={paginaAtual === totalPaginas}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 disabled:opacity-50 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}