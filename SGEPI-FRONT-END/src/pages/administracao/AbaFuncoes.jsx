import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { api } from "../../services/api";
import ImportarPlanilha from "../../components/ImportarPlanilha";
import ModalKitFuncao from "../../components/modals/ModalKitFuncao";
import { 
  Briefcase, 
  PenLine, 
  Plus, 
  Save, 
  Trash2, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  SearchX,
  ShieldCheck
} from "lucide-react";

export default function AbaFuncoes() {
  const [funcoes, setFuncoes] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [funcaoKit, setFuncaoKit] = useState(null);

  // --- ESTADOS DE PAGINAÇÃO ---
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;
  const totalPaginas = Math.ceil(funcoes.length / itensPorPagina);
  const funcoesPagina = funcoes.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );


  const [erros, setErros] = useState({});
  const [toast, setToast] = useState(null);

  const [novaFuncao, setNovaFuncao] = useState({
    funcao: "",
    id_departamento: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const mostrarToast = (mensagem, tipo = "sucesso") => {
    setToast({ mensagem, tipo });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const campoComErro = (campo) => {
    return erros[campo]
      ? "border-red-400 dark:border-red-500/50 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30 dark:bg-red-900/10"
      : "border-slate-200/60 dark:border-slate-700/60 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200";
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
    setNovaFuncao((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    limparErroCampo(campo);
  };

  const carregarDados = async () => {
    try {
      const [respFuncoes, respDepartamentos] = await Promise.all([
        api.get("/funcoes"),
        api.get("/departamentos"),
      ]);

      const listaFuncoes = respFuncoes?.funcoes || [];

      setFuncoes(listaFuncoes);
      setDepartamentos(respDepartamentos?.departamentos || []);
    } catch (erro) {
      console.error("Erro ao carregar dados de funções:", erro);
      mostrarToast("Erro ao carregar dados de funções.", "erro");
    }
  };

  // --- GERADOR E ENVIADOR DE PLANILHA EXCEL (.XLSX) ---

  const baixarModeloExcel = () => {
    if (!Array.isArray(departamentos) || departamentos.length === 0) {
      mostrarToast("Cadastre ao menos um departamento antes de baixar a planilha.", "erro");
      return;
    }

    const dadosModelo = [
      { "Nome da Função": "📌 Orientações de Preenchimento:" },
      { "Nome da Função": "1. Escreva a função desejada na Coluna A." },
      { "Nome da Função": "2. Na Coluna B, mantivemos os departamentos da empresa pré-preenchidos." },
      { "Nome da Função": "3. Você pode duplicar ou adicionar linhas mantendo o nome do departamento." },
      {}, // Linha em branco para separação visual
    ];

    departamentos.forEach((d) => {
      const nomeDepto = d.departamento || d.nome || d;

      dadosModelo.push({
        "Nome da Função": "",
        "Departamento Vinculado": nomeDepto,
      });

      dadosModelo.push({
        "Nome da Função": "",
        "Departamento Vinculado": nomeDepto,
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dadosModelo, {
      header: ["Nome da Função", "Departamento Vinculado"],
      skipHeader: false,
    });

    worksheet["!cols"] = [
      { wch: 40 },
      { wch: 35 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Funções");

    XLSX.writeFile(workbook, "modelo_funcoes.xlsx");
  };


  // ----------------------------------------------------

  const validarFormulario = () => {
    const novosErros = {};

    if (!novaFuncao.id_departamento) {
      novosErros.id_departamento = "Selecione o departamento vinculado.";
    }

    if (!novaFuncao.funcao.trim()) {
      novosErros.funcao = "Informe o nome da função.";
    }

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  };

  const limparFormulario = () => {
    setNovaFuncao({
      funcao: "",
      id_departamento: "",
    });

    setEditandoId(null);
    setErros({});
  };

  const salvarFuncao = async () => {
    const formularioValido = validarFormulario();

    if (!formularioValido) return;

    try {
      setCarregando(true);

      const payload = {
        funcao: novaFuncao.funcao.trim(),
        id_departamento: Number(novaFuncao.id_departamento),
      };

      const estavaEditando = Boolean(editandoId);

      if (editandoId) {
        await api.put(`/gerencial/funcao/${editandoId}`, payload);
      } else {
        await api.post("/gerencial/cadastro-funcao", payload);
      }

      limparFormulario();
      setPaginaAtual(1);

      await carregarDados();

      mostrarToast(
        estavaEditando
          ? "Função atualizada com sucesso!"
          : "Função cadastrada com sucesso!",
        "sucesso"
      );
    } catch (erro) {
      console.error("Erro ao salvar função:", erro);

      mostrarToast(
        "Não foi possível salvar a função. Verifique os dados informados.",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  };

  const iniciarEdicao = (f) => {
    setNovaFuncao({
      funcao: f.cargo || f.funcao || "",
      id_departamento: f.departamento?.id || f.id_departamento || "",
    });

    setEditandoId(f.id);
    setErros({});
  };

  const cancelarEdicao = () => {
    limparFormulario();
  };

  const removerFuncao = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta função?")) return;

    try {
      await api.delete(`/gerencial/funcao/${id}`);

      await carregarDados();

      // O useEffect lá embaixo cuida de voltar a página caso fique vazia
      mostrarToast("Função excluída com sucesso!", "sucesso");
    } catch (erro) {
      console.error("Erro ao remover função:", erro);

      mostrarToast("Erro ao remover função.", "erro");
    }
  };

  const baseInputClass = "w-full px-4 h-[46px] rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-400 border";
  const labelClass = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 transition-colors";

  return (
    <div className="animate-fade-in space-y-6 transition-colors duration-300">
      {toast && (
        <div className={`fixed top-5 left-1/2 z-[9999] w-[90%] max-w-sm -translate-x-1/2 rounded-2xl border px-5 py-4 shadow-xl flex items-start gap-3 transition-colors sm:left-auto sm:right-5 sm:translate-x-0 animate-fade-in ${
          toast.tipo === "sucesso"
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
        descricao="Baixe o modelo com os departamentos, preencha as funções e envie o arquivo (.xlsx)."
        rota="/gerencial/importar-funcoes"
        onBaixarModelo={baixarModeloExcel}
        onSucesso={async () => {
          setPaginaAtual(1);
          await carregarDados();
        }}
        mostrarToast={mostrarToast}
      />
      <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 transition-colors">
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            editandoId ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          }`}>
            {editandoId ? <PenLine className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 transition-colors">
            {editandoId ? "Editar Função" : "Nova Função"}
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 ml-[42px] transition-colors">
          Campos marcados com <span className="text-red-500 dark:text-red-400 font-bold">*</span> são obrigatórios.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_auto] gap-4 md:gap-5 items-start">
          
          <div>
            <label className={labelClass}>
              Departamento Vinculado <span className="text-red-500">*</span>
            </label>
            <select
              className={`${baseInputClass} ${campoComErro("id_departamento")}`}
              value={novaFuncao.id_departamento}
              onChange={(e) => atualizarCampo("id_departamento", e.target.value)}
            >
              <option value="">Selecione...</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id} className="uppercase">
                  {d.departamento}
                </option>
              ))}
            </select>
            {erros.id_departamento && (
              <p className="text-xs font-medium text-red-500 mt-1.5">{erros.id_departamento}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Nome da Função <span className="text-red-500">*</span>
            </label>
            <input
              className={`${baseInputClass} ${campoComErro("funcao")}`}
              value={novaFuncao.funcao}
              onChange={(e) => atualizarCampo("funcao", e.target.value)}
              placeholder="Ex: Operador"
            />
            {erros.funcao && (
              <p className="text-xs font-medium text-red-500 mt-1.5">{erros.funcao}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 md:pt-[26px]">
            {editandoId && (
              <button
                onClick={cancelarEdicao}
                disabled={carregando}
                className="w-full sm:w-auto h-[46px] px-5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
            )}

            <button
              onClick={salvarFuncao}
              disabled={carregando}
              className={`w-full sm:w-auto h-[46px] px-6 text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                editandoId
                  ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-amber-500/20"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-blue-600/20"
              }`}
            >
              {carregando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : editandoId ? (
                <><Save className="w-4 h-4" /> Salvar</>
              ) : (
                <><Plus className="w-5 h-5" strokeWidth={2.5} /> Salvar</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm transition-colors overflow-hidden">
        <div className="flex items-center justify-between p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800/60 transition-colors">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white transition-colors">
            Funções Cadastradas
          </h3>

          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
            {funcoes.length} registro(s)
          </span>
        </div>

        {funcoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-slate-400 dark:text-slate-500 transition-colors">
            <SearchX className="w-10 h-10 opacity-50" strokeWidth={1.5} />
            <span className="font-medium text-sm">Nenhuma função cadastrada.</span>
          </div>
        ) : (
          <>
            <div className="md:hidden p-4 space-y-4">
              {funcoesPagina.map((f) => (
                <div
                  key={f.id}
                  className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm transition-colors flex flex-col"
                >
                  <div className="flex-1 space-y-3">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-0.5">
                        Função
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold capitalize text-base">
                        {f.cargo || f.funcao || "-"}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-1">
                        Departamento
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/60 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 uppercase transition-colors">
                        <Building2 className="w-3 h-3" />
                        {f.departamento?.departamento || "Sem departamento"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => setFuncaoKit(f)}
                      className="flex-1 py-2.5 flex justify-center items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" /> Kit
                    </button>

                    <button
                      onClick={() => iniciarEdicao(f)}
                      className="flex-1 py-2.5 flex justify-center items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-bold text-sm transition-colors"
                    >
                      <PenLine className="w-4 h-4" /> Editar
                    </button>

                    <button
                      onClick={() => removerFuncao(f.id)}
                      className="flex-1 py-2.5 flex justify-center items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60 transition-colors">
                  <tr>
                    <th className="p-4 pl-6 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Função</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Departamento</th>
                    <th className="p-4 pr-6 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {funcoesPagina.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="p-4 pl-6 font-bold text-slate-800 dark:text-slate-200 capitalize transition-colors">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          {f.cargo || f.funcao || "-"}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wide rounded-lg border border-slate-200/60 dark:border-slate-700/60 transition-colors">
                          <Building2 className="w-3.5 h-3.5" />
                          {f.departamento?.departamento || "Sem departamento"}
                        </span>
                      </td>

                      <td className="p-4 pr-6">
                        <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setFuncaoKit(f)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                            title="Kit de EPI"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => iniciarEdicao(f)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 transition-colors"
                            title="Editar"
                          >
                            <PenLine className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => removerFuncao(f.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {funcaoKit && (
        <ModalKitFuncao funcao={funcaoKit} onClose={() => setFuncaoKit(null)} mostrarToast={mostrarToast} />
      )}

      {/* --- CONTROLES DA PAGINAÇÃO --- */}
      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
            disabled={paginaAtual === 1}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Anterior
          </button>
          
          <span className="text-sm font-medium text-slate-500">
            Página <strong className="text-slate-700">{paginaAtual}</strong> de <strong className="text-slate-700">{totalPaginas}</strong>
          </span>

          <button
            onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))}
            disabled={paginaAtual === totalPaginas}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}