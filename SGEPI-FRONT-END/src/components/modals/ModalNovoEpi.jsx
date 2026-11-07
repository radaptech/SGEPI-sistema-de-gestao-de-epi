import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import {
  X, ShieldPlus, ShieldAlert, CheckCircle2,
  AlertCircle, Loader2, Plus, PenLine, RefreshCw
} from "lucide-react";

const TAMANHOS_SUGERIDOS = [
  "Único", "PP", "P", "M", "G", "GG", "EXG",
  "34", "35", "36", "37", "38", "39", "40",
  "41", "42", "43", "44", "45", "46",
];

function ModalNovoEpi({ onClose, onSalvar, epiParaEditar }) {
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [tiposProtecao, setTiposProtecao] = useState([]);
  const [tamanhosDisponiveis, setTamanhosDisponiveis] = useState([]);

  const [mostrandoAddTamanho, setMostrandoAddTamanho] = useState(false);
  const [novoTamanhoNome, setNovoTamanhoNome] = useState("");
  const [salvandoNovoTamanho, setSalvandoNovoTamanho] = useState(false);

  const [erros, setErros] = useState({});
  // consulta do CA na base do MTE: null | "carregando" | "nao-encontrado" | { situacao, ... }
  const [infoCa, setInfoCa] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    fabricante: "",
    ca: "",
    descricao: "",
    data_validade_ca: "",
    id_tamanho: [],
    id_protecao: "",
    alerta_minimo: "",
    vida_util_dias: "",
  });

  useEffect(() => {
    async function carregarConfiguracoes() {
      setCarregandoDados(true);

      try {
        const [resProtecoes, resTamanhos] = await Promise.all([
          api.get("/protecoes"),
          api.get("/tamanhos"),
        ]);

        setTiposProtecao(Array.isArray(resProtecoes) ? resProtecoes : []);
        setTamanhosDisponiveis(Array.isArray(resTamanhos) ? resTamanhos : []);

        if (epiParaEditar) {
          const formatarDataParaInput = (dataBR) => {
            if (!dataBR || !dataBR.includes("/")) return "";
            const [d, m, a] = dataBR.split("/");
            return `${a}-${m}-${d}`;
          };

          setForm({
            nome: epiParaEditar.nome || "",
            fabricante: epiParaEditar.fabricante || "",
            ca: epiParaEditar.ca || "",
            descricao: epiParaEditar.descricao || "",
            data_validade_ca: formatarDataParaInput(
              epiParaEditar.data_validadeCa
            ),
            id_protecao: epiParaEditar.protecao?.id || "",
            id_tamanho: epiParaEditar.tamanhos?.map((t) => t.id) || [],
            alerta_minimo: epiParaEditar.alerta_minimo || "",
            vida_util_dias: epiParaEditar.vida_util_dias || "",
          });
        }
      } catch (erro) {
        console.error("Erro ao carregar configurações do EPI:", erro);
        mostrarToast("Erro ao carregar dados do formulário.", "erro");
      } finally {
        setCarregandoDados(false);
      }
    }

    carregarConfiguracoes();
  }, [epiParaEditar]);

  const mostrarToast = (mensagem, tipo = "sucesso") => {
    setToast({ mensagem, tipo });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const campoComErro = (campo) => {
    return erros[campo]
      ? "border-red-400 dark:border-red-500/50 focus:ring-red-500/20 focus:border-red-500"
      : "border-slate-200/60 dark:border-slate-700/60 focus:ring-blue-500/20 focus:border-blue-500";
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
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
    limparErroCampo(campo);
  };

  // Preenche nome, fabricante e validade com o que está na base do MTE (botão "Buscar" ou Enter)
  const consultarCa = async () => {
    if (!form.ca) return setInfoCa(null);
    setInfoCa("carregando");
    try {
      const dados = await api.get(`/gerencial/caepi/${form.ca}`); // 204 (null) = fora da base
      if (!dados) return setInfoCa("nao-encontrado");
      const [d, m, a] = dados.validade.split("/");
      setForm((prev) => ({
        ...prev,
        nome: dados.equipamento,
        fabricante: dados.fabricante.slice(0, 100), // limite do back; há razão social maior na base
        data_validade_ca: `${a}-${m}-${d}`,
        // grupo da NR-6 deduzido do nome do equipamento; sem sugestão, mantém o que já estava
        id_protecao: dados.id_protecao_sugerida ?? prev.id_protecao,
      }));
      ["nome", "fabricante", "data_validade_ca", "id_protecao"].forEach(limparErroCampo);
      setInfoCa(dados);
    } catch {
      setInfoCa(null); // o api já mostrou o erro
    }
  };

  const alternarTamanho = (id) => {
    setForm((prev) => {
      const jaSelecionado = prev.id_tamanho.includes(id);
      return {
        ...prev,
        id_tamanho: jaSelecionado
          ? prev.id_tamanho.filter((i) => i !== id)
          : [...prev.id_tamanho, id],
      };
    });
    limparErroCampo("id_tamanho");
  };

  const validarFormulario = () => {
    const novosErros = {};
    const caApenasNumeros = String(form.ca).replace(/\D/g, "");

    if (!form.nome.trim()) novosErros.nome = "Informe o nome do EPI.";
    if (!form.id_protecao) novosErros.id_protecao = "Selecione o tipo de proteção.";
    if (!form.fabricante.trim()) novosErros.fabricante = "Informe o fabricante.";
    if (!caApenasNumeros) novosErros.ca = "Informe o número do CA.";
    if (!form.data_validade_ca) novosErros.data_validade_ca = "Informe a validade do CA.";
    if (!form.id_tamanho.length) novosErros.id_tamanho = "Selecione pelo menos um tamanho.";
    if (
      form.alerta_minimo !== "" &&
      form.alerta_minimo !== null &&
      Number(form.alerta_minimo) < 0
    ) {
      novosErros.alerta_minimo = "O alerta mínimo não pode ser negativo.";
    }
    if (form.vida_util_dias !== "" && !(Number.isInteger(Number(form.vida_util_dias)) && Number(form.vida_util_dias) >= 0)) {
      novosErros.vida_util_dias = "Informe a vida útil em dias inteiros (vazio = sem troca periódica).";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  async function handleAddNovoTamanho() {
    if (!novoTamanhoNome) {
      mostrarToast("Selecione um tamanho para adicionar.", "erro");
      return;
    }
    try {
      setSalvandoNovoTamanho(true);
      // a resposta é só {"mensagem"}: recarrega a lista e marca o tamanho novo pelo nome
      await api.post("/gerencial/cadastro-tamanho", { tamanho: novoTamanhoNome });
      const lista = (await api.get("/tamanhos")) ?? [];
      const novo = lista.find((t) => t.tamanho === novoTamanhoNome);

      setTamanhosDisponiveis(lista);
      if (novo) {
        setForm((prev) => ({ ...prev, id_tamanho: [...prev.id_tamanho, novo.id] }));
        limparErroCampo("id_tamanho");
      }
      setNovoTamanhoNome("");
      setMostrandoAddTamanho(false);
      mostrarToast("Tamanho adicionado com sucesso!", "sucesso");
    } catch {
      // o api.js já mostrou o erro do servidor
    } finally {
      setSalvandoNovoTamanho(false);
    }
  }

  const nomesTamanhosSelecionados = useMemo(() => {
    if (!form.id_tamanho.length) return "Nenhum selecionado";
    return tamanhosDisponiveis
      .filter((t) => form.id_tamanho.includes(t.id))
      .map((t) => t.tamanho || t.nome)
      .join(", ");
  }, [form.id_tamanho, tamanhosDisponiveis]);

  async function salvarEpi() {
    const formularioValido = validarFormulario();
    if (!formularioValido) return;

    try {
      setSalvando(true);
      const caApenasNumeros = String(form.ca).replace(/\D/g, "");

      const formatarDataParaBR = (dataEstrangeira) => {
        if (!dataEstrangeira) return "";
        const [ano, mes, dia] = dataEstrangeira.split("-");
        return `${dia}/${mes}/${ano}`;
      };

      const payload = {
        nome: form.nome.trim(),
        fabricante: form.fabricante.trim(),
        ca: caApenasNumeros,
        descricao: form.descricao || "",
        data_validade_ca: formatarDataParaBR(form.data_validade_ca),
        id_protecao: Number(form.id_protecao),
        id_tamanho: form.id_tamanho.map((id) => Number(id)),
        alerta_minimo: Number(form.alerta_minimo || 0),
        vida_util_dias: Number(form.vida_util_dias || 0), // 0 = sem troca periódica
      };

      const payloadAtualizarEpi = {
        nome: form.nome.trim(),
        fabricante: form.fabricante.trim(),
        ca: caApenasNumeros,
        descricao: form.descricao || "",
        validade_ca: formatarDataParaBR(form.data_validade_ca),
        id_protecao: Number(form.id_protecao),
        tamanhos: form.id_tamanho.map((id) => Number(id)),
        alerta_minimo: Number(form.alerta_minimo || 0),
        vida_util_dias: Number(form.vida_util_dias || 0), // 0 = sem troca periódica
      };

      if (epiParaEditar) {
        await api.patch(`/gerencial/epi/${epiParaEditar.id}`, payloadAtualizarEpi);
      } else {
        await api.post("/gerencial/cadastro-epi", payload);
      }

      if (onSalvar) onSalvar();
      onClose();
    } catch (erro) {
      console.error("Erro ao salvar EPI:", erro);
      mostrarToast("Não foi possível salvar o EPI. Verifique os dados informados.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  const baseInputClass = "w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 bg-white dark:bg-slate-900 border focus:ring-2 dark:text-white placeholder-slate-400";
  const labelClass = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 text-slate-700 dark:text-slate-300 animate-fade-in">
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

      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800/60 flex items-start justify-between shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${epiParaEditar ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              }`}>
              {epiParaEditar ? <PenLine className="w-6 h-6" strokeWidth={2.5} /> : <ShieldPlus className="w-6 h-6" strokeWidth={2.5} />}
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                {epiParaEditar ? `Editar: ${epiParaEditar.nome}` : "Cadastrar Novo EPI"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                Gestão de Equipamentos de Proteção.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar transition-colors">
          {carregandoDados ? (
            <div className="h-full flex flex-col items-center justify-center py-12 animate-fade-in">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Carregando dados do formulário...</p>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              <section className="bg-white dark:bg-slate-800/80 p-6 sm:p-7 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-colors">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-extrabold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Identificação
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Nome do EPI <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => atualizarCampo("nome", e.target.value)}
                      className={`${baseInputClass} ${campoComErro("nome")}`}
                      placeholder="Ex: Capacete de segurança"
                    />
                    {erros.nome && <p className="text-xs font-medium text-red-500 mt-1.5">{erros.nome}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Tipo de Proteção <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.id_protecao}
                      onChange={(e) => atualizarCampo("id_protecao", e.target.value)}
                      className={`${baseInputClass} ${campoComErro("id_protecao")}`}
                    >
                      <option value="">Selecione...</option>
                      {tiposProtecao.map((t) => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                    {erros.id_protecao && <p className="text-xs font-medium text-red-500 mt-1.5">{erros.id_protecao}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Fabricante <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.fabricante}
                      onChange={(e) => atualizarCampo("fabricante", e.target.value)}
                      className={`${baseInputClass} ${campoComErro("fabricante")}`}
                      placeholder="Ex: 3M"
                    />
                    {erros.fabricante && <p className="text-xs font-medium text-red-500 mt-1.5">{erros.fabricante}</p>}
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-800/80 p-6 sm:p-7 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                  <div>
                    <label className={labelClass}>
                      Número do CA <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.ca}
                        onChange={(e) => {
                          atualizarCampo("ca", e.target.value.replace(/\D/g, ""));
                          setInfoCa(null); // a situação mostrada era do CA anterior
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            consultarCa();
                          }
                        }}
                        className={`${baseInputClass} ${campoComErro("ca")} font-mono`}
                        placeholder="Apenas números"
                      />
                      <button
                        type="button"
                        onClick={consultarCa}
                        disabled={!form.ca || infoCa === "carregando"}
                        title="Buscar dados do CA na base do MTE"
                        className="shrink-0 inline-flex items-center gap-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${infoCa === "carregando" ? "animate-spin" : ""}`} />
                        Buscar
                      </button>
                    </div>
                    {erros.ca && <p className="text-xs font-medium text-red-500 mt-1.5">{erros.ca}</p>}
                    {!erros.ca && infoCa === "carregando" && (
                      <p className="text-xs text-slate-400 mt-1.5">Consultando a base do MTE...</p>
                    )}
                    {!erros.ca && infoCa === "nao-encontrado" && (
                      <p className="text-xs text-slate-400 mt-1.5">CA não encontrado na base do MTE. Preencha à mão.</p>
                    )}
                    {!erros.ca && infoCa?.situacao && (
                      <p className={`text-xs font-semibold mt-1.5 ${infoCa.situacao === "VÁLIDO" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                        MTE: {infoCa.situacao}
                        {infoCa.situacao !== "VÁLIDO" && infoCa.situacao !== "VENCIDO" && " (não pode ser entregue)"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Validade do CA <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.data_validade_ca}
                      onChange={(e) => atualizarCampo("data_validade_ca", e.target.value)}
                      className={`${baseInputClass} ${campoComErro("data_validade_ca")}`}
                    />
                    {erros.data_validade_ca && <p className="text-xs font-medium text-red-500 mt-1.5">{erros.data_validade_ca}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Alerta Estoque Mín.
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.alerta_minimo}
                      onChange={(e) => atualizarCampo("alerta_minimo", e.target.value)}
                      className={`${baseInputClass} ${campoComErro("alerta_minimo")}`}
                      placeholder="Ex: 10"
                    />
                    {erros.alerta_minimo && <p className="text-xs font-medium text-red-500 mt-1.5">{erros.alerta_minimo}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Vida Útil (dias)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.vida_util_dias}
                      onChange={(e) => atualizarCampo("vida_util_dias", e.target.value)}
                      className={`${baseInputClass} ${campoComErro("vida_util_dias")}`}
                      placeholder="Ex: 180 (vazio = sem troca)"
                    />
                    {erros.vida_util_dias && <p className="text-xs font-medium text-red-500 mt-1.5">{erros.vida_util_dias}</p>}
                  </div>

                  <div className="md:col-span-3">
                    <label className={labelClass}>
                      Descrição do Equipamento
                    </label>
                    <textarea
                      value={form.descricao}
                      onChange={(e) => atualizarCampo("descricao", e.target.value)}
                      className={`${baseInputClass} min-h-[100px] resize-none border-slate-200/60 dark:border-slate-700/60 focus:ring-blue-500/20 focus:border-blue-500`}
                      maxLength={250}
                      placeholder="Observações ou detalhes adicionais do equipamento..."
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-800/80 p-6 sm:p-7 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                  <div>
                    <h4 className="text-sm font-extrabold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                      Grade de Tamanhos <span className="text-red-500">*</span>
                    </h4>
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                      Selecionados: <span className="text-slate-700 dark:text-slate-300 font-bold">{nomesTamanhosSelecionados}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrandoAddTamanho(!mostrandoAddTamanho)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 transition-colors w-fit"
                  >
                    {mostrandoAddTamanho ? <><X className="w-3 h-3" /> Cancelar</> : <><Plus className="w-3 h-3" /> Novo Tamanho</>}
                  </button>
                </div>

                {mostrandoAddTamanho && (
                  <div className="mb-6 p-4 sm:p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-2xl flex flex-col sm:flex-row gap-3 animate-fade-in transition-colors">
                    <select
                      value={novoTamanhoNome}
                      onChange={(e) => setNovoTamanhoNome(e.target.value)}
                      className={`${baseInputClass} !border-blue-300 dark:!border-blue-700/50 !bg-white dark:!bg-slate-900 focus:!ring-blue-500/20`}
                    >
                      <option value="">Selecione da lista...</option>
                      {TAMANHOS_SUGERIDOS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddNovoTamanho}
                      disabled={salvandoNovoTamanho}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50"
                    >
                      {salvandoNovoTamanho ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
                    </button>
                  </div>
                )}

                <div className={`rounded-2xl p-5 border ${erros.id_tamanho ? "border-red-300 dark:border-red-500/50 bg-red-50/30 dark:bg-red-900/10" : "border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30"} transition-colors`}>
                  {tamanhosDisponiveis.length === 0 ? (
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500 italic text-center py-2">
                      Nenhum tamanho disponível.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {tamanhosDisponiveis.map((tam) => {
                        const isSelected = form.id_tamanho.includes(tam.id);
                        return (
                          <button
                            key={tam.id}
                            type="button"
                            onClick={() => alternarTamanho(tam.id)}
                            className={`min-w-[56px] h-[42px] px-4 rounded-xl border text-sm font-bold transition-all duration-200 ${isSelected
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                                : "bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700"
                              }`}
                          >
                            {tam.tamanho || tam.nome}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {erros.id_tamanho && <p className="text-xs font-medium text-red-500 mt-2">{erros.id_tamanho}</p>}
              </section>

            </div>
          )}
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:justify-end gap-3 bg-white dark:bg-slate-900 shrink-0 rounded-b-3xl transition-colors duration-300">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvarEpi}
            disabled={salvando || carregandoDados}
            className={`px-8 py-2.5 flex items-center justify-center gap-2 text-white font-bold rounded-xl text-sm transition-all shadow-sm w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${epiParaEditar
                ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 shadow-amber-500/20"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-blue-600/20"
              }`}
          >
            {salvando ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : epiParaEditar ? (
              <><CheckCircle2 className="w-4 h-4" /> Atualizar EPI</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Salvar Equipamento</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ModalNovoEpi;