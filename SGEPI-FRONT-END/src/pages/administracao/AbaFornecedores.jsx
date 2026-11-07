import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { api } from "../../services/api";
import ImportarPlanilha from "../../components/ImportarPlanilha";
import {
  Truck,
  PenLine,
  Plus,
  Save,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PackageSearch
} from "lucide-react";

export default function AbaFornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);


  const [erros, setErros] = useState({});
  const [toast, setToast] = useState(null);

  const [novoForn, setNovoForn] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    inscricao_estadual: "",
  });

  useEffect(() => {
    carregarFornecedores();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- carrega uma vez ao abrir a aba

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
    setNovoForn((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    limparErroCampo(campo);
  };

  // --- GERADOR E ENVIADOR DE PLANILHA EXCEL (.XLSX) ---

  const baixarModeloExcel = () => {
    // Organiza com as orientações nas primeiras linhas e o cabeçalho oficial abaixo delas
    const dadosModelo = [
      {
        "Razão Social": "📌 ORIENTAÇÕES DE PREENCHIMENTO:",
        "Nome Fantasia": "",
        "CNPJ": "",
        "Inscrição Estadual": "",
      },
      {
        "Razão Social": "1. Preencha a Razão Social e o Nome Fantasia.",
        "Nome Fantasia": "",
        "CNPJ": "",
        "Inscrição Estadual": "",
      },
      {
        "Razão Social": "2. O CNPJ pode conter apenas números (14 dígitos) ou estar formatado.",
        "Nome Fantasia": "",
        "CNPJ": "",
        "Inscrição Estadual": "",
      },
      {}, // Linha em branco para separação visual
      // Linha de cabeçalho oficial que o leitor Go vai buscar
      {
        "Razão Social": "Razão Social",
        "Nome Fantasia": "Nome Fantasia",
        "CNPJ": "CNPJ",
        "Inscrição Estadual": "Inscrição Estadual",
      },
    ];

    // skipHeader: true impede que a biblioteca crie uma linha duplicada no topo
    const worksheet = XLSX.utils.json_to_sheet(dadosModelo, { skipHeader: true });

    // Ajusta a largura das colunas
    worksheet["!cols"] = [
      { wch: 45 }, // Coluna A: Razão Social
      { wch: 30 }, // Coluna B: Nome Fantasia
      { wch: 22 }, // Coluna C: CNPJ
      { wch: 22 }, // Coluna D: Inscrição Estadual
    ];

    // Força colunas de CNPJ e Inscrição como texto puro ('s') para preservar formatação/zeros
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellC = worksheet[XLSX.utils.encode_cell({ r: R, c: 2 })];
      if (cellC && typeof cellC.v === "string") cellC.t = "s";

      const cellD = worksheet[XLSX.utils.encode_cell({ r: R, c: 3 })];
      if (cellD && typeof cellD.v === "string") cellD.t = "s";
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fornecedores");

    XLSX.writeFile(workbook, "modelo_importacao_fornecedores.xlsx");
  };


  // ----------------------------------------------------

  const validarCNPJ = (cnpj) => {
    const cnpjLimpo = String(cnpj).replace(/\D/g, "");

    if (cnpjLimpo.length !== 14) return false;

    if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;

    let tamanho = cnpjLimpo.length - 2;
    let numeros = cnpjLimpo.substring(0, tamanho);
    const digitos = cnpjLimpo.substring(tamanho);

    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += Number(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    if (resultado !== Number(digitos.charAt(0))) return false;

    tamanho += 1;
    numeros = cnpjLimpo.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += Number(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    return resultado === Number(digitos.charAt(1));
  };

  const validarFornecedor = () => {
    const novosErros = {};

    const cnpjLimpo = novoForn.cnpj.replace(/\D/g, "");
    const inscricaoLimpa = novoForn.inscricao_estadual.replace(/\D/g, "");

    if (!novoForn.razao_social.trim()) {
      novosErros.razao_social = "Informe a razão social.";
    }

    if (!novoForn.nome_fantasia.trim()) {
      novosErros.nome_fantasia = "Informe o nome fantasia.";
    }

    if (!cnpjLimpo) {
      novosErros.cnpj = "Informe o CNPJ.";
    } else if (cnpjLimpo.length !== 14) {
      novosErros.cnpj = "O CNPJ deve ter 14 números.";
    } else if (!validarCNPJ(cnpjLimpo)) {
      novosErros.cnpj = "Informe um CNPJ válido.";
    }

    if (!inscricaoLimpa) {
      novosErros.inscricao_estadual = "Informe a inscrição estadual.";
    }

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  };

  const limparFormulario = () => {
    setNovoForn({
      razao_social: "",
      nome_fantasia: "",
      cnpj: "",
      inscricao_estadual: "",
    });

    setEditandoId(null);
    setErros({});
  };

  const carregarFornecedores = async () => {
    try {
      const resposta = await api.get("/fornecedores");

      setFornecedores(resposta.Fornecedores ?? []);
    } catch {
      // o api.js já mostrou o erro
    }
  };

  const adicionarFornecedor = async () => {
    const formularioValido = validarFornecedor();

    if (!formularioValido) return;

    try {
      setCarregando(true);

      const payload = {
        razao_social: novoForn.razao_social.trim(),
        nome_fantasia: novoForn.nome_fantasia.trim(),
        cnpj: novoForn.cnpj.replace(/\D/g, ""),
        inscricao_estadual: novoForn.inscricao_estadual.replace(/\D/g, ""),
      };

      const estavaEditando = Boolean(editandoId);

      if (editandoId) {
        await api.patch(`/gerencial/fornecedor/${editandoId}`, payload);
      } else {
        await api.post("/gerencial/cadastro-fornecedores", payload);
      }

      limparFormulario();

      await carregarFornecedores();

      mostrarToast(
        estavaEditando
          ? "Fornecedor atualizado com sucesso!"
          : "Fornecedor cadastrado com sucesso!",
        "sucesso"
      );
    } catch (erro) {
      console.error("Erro ao salvar fornecedor:", erro);

      mostrarToast(
        "Não foi possível salvar o fornecedor. Verifique os dados informados.",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  };

  const removerFornecedor = async (id) => {
    if (!window.confirm("Deseja realmente excluir este fornecedor?")) return;

    try {
      await api.delete(`/gerencial/fornecedor/${id}`);

      await carregarFornecedores();

      mostrarToast("Fornecedor excluído com sucesso!", "sucesso");
    } catch (erro) {
      console.error("Erro ao remover fornecedor:", erro);

      mostrarToast("Erro ao remover fornecedor.", "erro");
    }
  };

  const iniciarEdicao = (f) => {
    setNovoForn({
      razao_social: f.razao_social || "",
      nome_fantasia: f.nome_fantasia || "",
      cnpj: f.cnpj || "",
      inscricao_estadual: f.inscricao_estadual || "",
    });

    setEditandoId(f.id);
    setErros({});
  };

  const cancelarEdicao = () => {
    limparFormulario();
  };

  const baseInputClass = "w-full px-4 h-[46px] rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-400 border";
  const labelClass = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 transition-colors";

  return (
    <div className="animate-fade-in space-y-6 transition-colors duration-300">
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
        descricao="Baixe o modelo, preencha os fornecedores e envie o arquivo (.xlsx)."
        rota="/gerencial/importar-fornecedores"
        onBaixarModelo={baixarModeloExcel}
        onSucesso={carregarFornecedores}
        mostrarToast={mostrarToast}
      />
      <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 transition-colors">
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${editandoId ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            }`}>
            {editandoId ? <PenLine className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 transition-colors">
            {editandoId ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 ml-[42px] transition-colors">
          Campos marcados com <span className="text-red-500 dark:text-red-400 font-bold">*</span> são obrigatórios.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <div>
            <label className={labelClass}>
              Razão Social <span className="text-red-500">*</span>
            </label>
            <input
              className={`${baseInputClass} ${campoComErro("razao_social")}`}
              value={novoForn.razao_social}
              onChange={(e) => atualizarCampo("razao_social", e.target.value)}
              placeholder="Ex: Empresa X Ltda"
            />
            {erros.razao_social && (
              <p className="text-xs font-medium text-red-500 mt-1.5">{erros.razao_social}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Nome Fantasia <span className="text-red-500">*</span>
            </label>
            <input
              className={`${baseInputClass} ${campoComErro("nome_fantasia")}`}
              value={novoForn.nome_fantasia}
              onChange={(e) => atualizarCampo("nome_fantasia", e.target.value)}
              placeholder="Ex: Empresa X"
            />
            {erros.nome_fantasia && (
              <p className="text-xs font-medium text-red-500 mt-1.5">{erros.nome_fantasia}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              CNPJ <span className="text-red-500">*</span>
            </label>
            <input
              className={`${baseInputClass} font-mono ${campoComErro("cnpj")}`}
              value={novoForn.cnpj}
              onChange={(e) => atualizarCampo("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />
            {erros.cnpj && (
              <p className="text-xs font-medium text-red-500 mt-1.5">{erros.cnpj}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Inscrição Estadual <span className="text-red-500">*</span>
            </label>
            <input
              className={`${baseInputClass} ${campoComErro("inscricao_estadual")}`}
              value={novoForn.inscricao_estadual}
              onChange={(e) => atualizarCampo("inscricao_estadual", e.target.value)}
              placeholder="Ex: 123.456.789/000"
            />
            {erros.inscricao_estadual && (
              <p className="text-xs font-medium text-red-500 mt-1.5">{erros.inscricao_estadual}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
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
            onClick={adicionarFornecedor}
            disabled={carregando}
            className={`w-full sm:w-auto h-[46px] px-6 text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${editandoId
                ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-amber-500/20"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-blue-600/20"
              }`}
          >
            {carregando ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : editandoId ? (
              <><Save className="w-4 h-4" /> Salvar Alterações</>
            ) : (
              <><Plus className="w-5 h-5" strokeWidth={2.5} /> Cadastrar Fornecedor</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm transition-colors overflow-hidden">
        <div className="flex items-center justify-between p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800/60 transition-colors">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white transition-colors">
            Fornecedores Cadastrados
          </h3>

          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
            {fornecedores.length} registro(s)
          </span>
        </div>

        {fornecedores.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-slate-400 dark:text-slate-500 transition-colors">
            <PackageSearch className="w-10 h-10 opacity-50" strokeWidth={1.5} />
            <span className="font-medium text-sm">Nenhum fornecedor registrado.</span>
          </div>
        ) : (
          <>
            <div className="md:hidden p-4 space-y-4">
              {fornecedores.map((f) => (
                <div
                  key={f.id}
                  className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm transition-colors"
                >
                  <div className="space-y-3">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-0.5">
                        Razão Social
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">
                        {f.razao_social || "-"}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-0.5">
                        Nome Fantasia
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {f.nome_fantasia || "-"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-0.5">
                          CNPJ
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {f.cnpj || "-"}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-0.5">
                          Insc. Estadual
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {f.inscricao_estadual || "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/50 flex gap-2">
                    <button
                      onClick={() => iniciarEdicao(f)}
                      className="flex-1 py-2.5 flex justify-center items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 font-bold text-sm transition-colors"
                    >
                      <PenLine className="w-4 h-4" /> Editar
                    </button>

                    <button
                      onClick={() => removerFornecedor(f.id)}
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
                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Razão Social</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nome Fantasia</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">CNPJ</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Insc. Estadual</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {fornecedores.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200 transition-colors">
                        {f.razao_social || "-"}
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300 font-medium transition-colors">
                        {f.nome_fantasia || "-"}
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs transition-colors">
                        {f.cnpj || "-"}
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs transition-colors">
                        {f.inscricao_estadual || "-"}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => iniciarEdicao(f)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20 transition-colors"
                            title="Editar"
                          >
                            <PenLine className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => removerFornecedor(f.id)}
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
    </div>
  );
}