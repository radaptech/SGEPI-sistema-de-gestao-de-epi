import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  listarEpis,
  listarFornecedores,
  listarTamanhos,
  criarEntrada,
} from "../../services/entradaService";

import {
  normalizarEpiEntrada,
  normalizarFornecedorEntrada,
  normalizarTamanhoEntrada,
} from "../../utils/entradaNormalizers";

import { formatarDataParaGo } from "../../utils/entradaHelpers";

import {
  X, PackagePlus, FileText, Layers,
  Plus, Trash2, AlertCircle, CheckCircle2
} from "lucide-react";

function ModalEntrada({ onClose, onSalvar }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [epis, setEpis] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const [dataEntrada, setDataEntrada] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  });

  const [fornecedorId, setFornecedorId] = useState("");
  const [notaFiscalNumero, setNotaFiscalNumero] = useState("");
  const [notaFiscalSerie, setNotaFiscalSerie] = useState("");

  const [itensEntrada, setItensEntrada] = useState([]);
  const [epiId, setEpiId] = useState("");
  const [tamanhoTemp, setTamanhoTemp] = useState("");
  const [qtdTemp, setQtdTemp] = useState(1);
  const [precoTemp, setPrecoTemp] = useState("");
  const [loteTemp, setLoteTemp] = useState("");
  const [dataFabricacaoTemp, setDataFabricacaoTemp] = useState("");
  const [validadeTemp, setValidadeTemp] = useState("");

  const [carregando, setCarregando] = useState(false);

  const [errosNota, setErrosNota] = useState({});
  const [errosItem, setErrosItem] = useState({});

  useEffect(() => {
    let ativo = true;

    async function carregarDadosIniciais() {
      setCarregandoDados(true);

      try {
        const [resFornecedores, resEpis, resTamanhos] = await Promise.all([
          listarFornecedores(),
          listarEpis(),
          listarTamanhos(),
        ]);

        if (!ativo) return;

        setFornecedores(resFornecedores.map(normalizarFornecedorEntrada));
        setEpis(resEpis.map(normalizarEpiEntrada));
        setTamanhos(resTamanhos.map(normalizarTamanhoEntrada));
      } catch (erro) {
        console.error("❌ Erro ao carregar dados do Modal:", erro);
        toast.error("Erro ao carregar dados necessários do servidor.");
      } finally {
        if (ativo) setCarregandoDados(false);
      }
    }

    carregarDadosIniciais();

    return () => {
      ativo = false;
    };
  }, []);

  const epiSelecionadoObj = useMemo(
    () => epis.find((e) => Number(e.id) === Number(epiId)) || null,
    [epis, epiId]
  );

  const tamanhoSelecionadoObj = useMemo(
    () => tamanhos.find((t) => Number(t.id) === Number(tamanhoTemp)) || null,
    [tamanhos, tamanhoTemp]
  );

  const valorTotalEntrada = useMemo(
    () => itensEntrada.reduce((acc, item) => acc + Number(item.totalItem || 0), 0),
    [itensEntrada]
  );

  const campoNotaComErro = (campo) => {
    return errosNota[campo]
      ? "border-red-300 bg-red-50/50 focus:ring-red-500/20 dark:border-red-500/50 dark:bg-red-900/10 dark:focus:ring-red-500/20"
      : "border-slate-200/60 bg-white focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-slate-700/60 dark:bg-slate-900 dark:focus:border-emerald-500";
  };

  const campoItemComErro = (campo) => {
    return errosItem[campo]
      ? "border-red-300 bg-red-50/50 focus:ring-red-500/20 dark:border-red-500/50 dark:bg-red-900/10 dark:focus:ring-red-500/20"
      : "border-slate-200/60 bg-white focus:ring-emerald-500/20 focus:border-emerald-500 dark:border-slate-700/60 dark:bg-slate-900 dark:focus:border-emerald-500";
  };

  const limparErroNota = (campo) => {
    if (!errosNota[campo]) return;
    setErrosNota((errosAtuais) => {
      const novosErros = { ...errosAtuais };
      delete novosErros[campo];
      return novosErros;
    });
  };

  const limparErroItem = (campo) => {
    if (!errosItem[campo]) return;
    setErrosItem((errosAtuais) => {
      const novosErros = { ...errosAtuais };
      delete novosErros[campo];
      return novosErros;
    });
  };

  const validarItem = () => {
    const novosErros = {};

    if (!epiId) novosErros.epiId = "Selecione o EPI.";
    if (!tamanhoTemp) novosErros.tamanhoTemp = "Selecione o tamanho.";
    if (!qtdTemp || Number(qtdTemp) <= 0) novosErros.qtdTemp = "Qtd inválida.";
    if (!precoTemp || Number(precoTemp) <= 0) novosErros.precoTemp = "Valor inválido.";
    if (!loteTemp.trim()) novosErros.loteTemp = "Informe o lote.";
    if (!dataFabricacaoTemp) novosErros.dataFabricacaoTemp = "Obrigatório.";
    if (!validadeTemp) novosErros.validadeTemp = "Obrigatório.";

    if (
      dataFabricacaoTemp &&
      validadeTemp &&
      new Date(dataFabricacaoTemp) > new Date(validadeTemp)
    ) {
      novosErros.validadeTemp = "Validade menor que fabricação.";
    }

    setErrosItem(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const validarNota = () => {
    const novosErros = {};
    if (!fornecedorId) novosErros.fornecedorId = "Selecione o fornecedor.";
    if (!dataEntrada) novosErros.dataEntrada = "Informe a data.";
    if (!notaFiscalNumero.trim()) novosErros.notaFiscalNumero = "Informe o número.";
    if (itensEntrada.length === 0) novosErros.itensEntrada = "Adicione pelo menos um item antes de finalizar.";

    setErrosNota(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  function adicionarItem() {
    const itemValido = validarItem();
    if (!itemValido) return;

    const novoItem = {
      id: Date.now() + Math.random(),
      idEpi: Number(epiId),
      epiNome: epiSelecionadoObj?.nome || "EPI",
      ca: epiSelecionadoObj?.ca || "-",
      idTamanho: Number(tamanhoTemp),
      tamanhoNome: tamanhoSelecionadoObj?.tamanho || "-",
      quantidade: Number(qtdTemp),
      valor_unitario: Number(precoTemp),
      lote: loteTemp.trim(),
      data_fabricacao: dataFabricacaoTemp,
      data_validade: validadeTemp,
      totalItem: Number(qtdTemp) * Number(precoTemp),
    };

    setItensEntrada((prev) => [...prev, novoItem]);

    setEpiId("");
    setTamanhoTemp("");
    setQtdTemp(1);
    setPrecoTemp("");
    setLoteTemp("");
    setDataFabricacaoTemp("");
    setValidadeTemp("");
    setErrosItem({});
    limparErroNota("itensEntrada");
  }

  async function salvarEntradaFinal() {
    const notaValida = validarNota();
    if (!notaValida) return;

    setCarregando(true);

    try {
      const payload = {
        idfornecedor: Number(fornecedorId),
        nota_fiscal_numero: String(notaFiscalNumero).trim(),
        nota_fiscal_serie: String(notaFiscalSerie || "1").trim(),
        data_emissao: formatarDataParaGo(dataEntrada),
        itens: itensEntrada.map((item) => ({
          id_epi: Number(item.idEpi),
          id_tamanho: Number(item.idTamanho),
          quantidade: Number(item.quantidade),
          data_fabricacao: formatarDataParaGo(item.data_fabricacao),
          data_validade: formatarDataParaGo(item.data_validade),
          lote: String(item.lote),
          valor_unitario: String(item.valor_unitario),
        })),
      };

      await criarEntrada(payload);

      if (onSalvar) {
        onSalvar({
          tipo: "sucesso",
          mensagem: "Entrada de estoque cadastrada com sucesso!",
        });
      }
      onClose();
    } catch {
      // o api.js já mostrou o erro do servidor
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">

        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <PackagePlus className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Nova Entrada
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Registre uma nova nota fiscal e seus itens no estoque.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-slate-50/50 dark:bg-slate-900/50 space-y-6 custom-scrollbar transition-colors duration-300">
          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Dados da Nota
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-6">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Fornecedor <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all ${campoNotaComErro("fornecedorId")} disabled:opacity-50`}
                  value={fornecedorId}
                  onChange={(e) => {
                    setFornecedorId(e.target.value);
                    limparErroNota("fornecedorId");
                  }}
                  disabled={carregandoDados}
                >
                  <option value="">{carregandoDados ? "Carregando..." : "Selecione o fornecedor..."}</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome_fantasia || f.razao_social}
                    </option>
                  ))}
                </select>
                {errosNota.fornecedorId && <p className="text-[11px] text-red-500 font-bold mt-1">{errosNota.fornecedorId}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all ${campoNotaComErro("dataEntrada")}`}
                  value={dataEntrada}
                  onChange={(e) => {
                    setDataEntrada(e.target.value);
                    limparErroNota("dataEntrada");
                  }}
                />
                {errosNota.dataEntrada && <p className="text-[11px] text-red-500 font-bold mt-1">{errosNota.dataEntrada}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  NF Nº <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none placeholder-slate-400 transition-all ${campoNotaComErro("notaFiscalNumero")}`}
                  value={notaFiscalNumero}
                  onChange={(e) => {
                    setNotaFiscalNumero(e.target.value);
                    limparErroNota("notaFiscalNumero");
                  }}
                  placeholder="Ex: 12345"
                />
                {errosNota.notaFiscalNumero && <p className="text-[11px] text-red-500 font-bold mt-1">{errosNota.notaFiscalNumero}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Série
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-slate-400 dark:text-white transition-all"
                  value={notaFiscalSerie}
                  onChange={(e) => setNotaFiscalSerie(e.target.value)}
                  placeholder="Padrão: 1"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Itens do Lote
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 mb-6">
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  EPI <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 ${campoItemComErro("epiId")}`}
                  value={epiId}
                  onChange={(e) => {
                    setEpiId(e.target.value);
                    setTamanhoTemp("");
                    limparErroItem("epiId");
                    limparErroItem("tamanhoTemp");
                  }}
                  disabled={carregandoDados}
                >
                  <option value="">{carregandoDados ? "Carregando..." : "Selecione o EPI..."}</option>
                  {epis.map((epi) => (
                    <option key={epi.id} value={epi.id}>{epi.nome}</option>
                  ))}
                </select>
                {errosItem.epiId && <p className="text-[11px] text-red-500 font-bold mt-1">{errosItem.epiId}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Tamanho <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 ${campoItemComErro("tamanhoTemp")}`}
                  value={tamanhoTemp}
                  onChange={(e) => {
                    setTamanhoTemp(e.target.value);
                    limparErroItem("tamanhoTemp");
                  }}
                  disabled={!epiId}
                >
                  <option value="">{epiId ? "Selecione..." : "Aguardando EPI"}</option>
                  {epiSelecionadoObj?.tamanhos?.map((t) => (
                    <option key={t.id} value={t.id}>{t.tamanho}</option>
                  ))}
                </select>
                {errosItem.tamanhoTemp && <p className="text-[11px] text-red-500 font-bold mt-1">{errosItem.tamanhoTemp}</p>}
              </div>

              <div className="md:col-span-1">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Qtd <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all ${campoItemComErro("qtdTemp")}`}
                  value={qtdTemp}
                  onChange={(e) => {
                    setQtdTemp(e.target.value);
                    limparErroItem("qtdTemp");
                  }}
                />
                {errosItem.qtdTemp && <p className="text-[11px] text-red-500 font-bold mt-1">{errosItem.qtdTemp}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Vlr Unit. <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none placeholder-slate-400 transition-all ${campoItemComErro("precoTemp")}`}
                  value={precoTemp}
                  onChange={(e) => {
                    setPrecoTemp(e.target.value);
                    limparErroItem("precoTemp");
                  }}
                  placeholder="0.00"
                />
                {errosItem.precoTemp && <p className="text-[11px] text-red-500 font-bold mt-1">{errosItem.precoTemp}</p>}
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Lote <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none placeholder-slate-400 transition-all ${campoItemComErro("loteTemp")}`}
                  value={loteTemp}
                  onChange={(e) => {
                    setLoteTemp(e.target.value);
                    limparErroItem("loteTemp");
                  }}
                  placeholder="Ex: L001"
                />
                {errosItem.loteTemp && <p className="text-[11px] text-red-500 font-bold mt-1">{errosItem.loteTemp}</p>}
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Fabricação <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all ${campoItemComErro("dataFabricacaoTemp")}`}
                  value={dataFabricacaoTemp}
                  onChange={(e) => {
                    setDataFabricacaoTemp(e.target.value);
                    limparErroItem("dataFabricacaoTemp");
                  }}
                />
                {errosItem.dataFabricacaoTemp && <p className="text-[11px] text-red-500 font-bold mt-1">{errosItem.dataFabricacaoTemp}</p>}
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                  Validade <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium outline-none transition-all ${campoItemComErro("validadeTemp")}`}
                  value={validadeTemp}
                  onChange={(e) => {
                    setValidadeTemp(e.target.value);
                    limparErroItem("validadeTemp");
                  }}
                />
                {errosItem.validadeTemp && <p className="text-[11px] text-red-500 font-bold mt-1">{errosItem.validadeTemp}</p>}
              </div>

              <div className="md:col-span-6 flex items-end">
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="w-full h-[42px] flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" /> Incluir Item
                </button>
              </div>
            </div>

            {errosNota.itensEntrada && (
              <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errosNota.itensEntrada}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60 transition-colors">
                  <tr>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">EPI / CA</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Tamanho</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Qtd</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Lote</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Validade</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Total</th>
                    <th className="p-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {itensEntrada.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium bg-white dark:bg-slate-800/50">
                        Nenhum item adicionado à nota ainda.
                      </td>
                    </tr>
                  ) : (
                    itensEntrada.map((item) => (
                      <tr key={item.id} className="bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.epiNome}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">CA: {item.ca}</div>
                        </td>
                        <td className="p-3.5 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {item.tamanhoNome}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-md text-xs font-bold text-slate-700 dark:text-slate-300">
                            {item.quantidade}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                          {item.lote}
                        </td>
                        <td className="p-3.5 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                          {formatarDataParaGo(item.data_validade) || "-"}
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {item.totalItem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setItensEntrada((prev) => prev.filter((i) => i.id !== item.id))}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Remover Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-white dark:bg-slate-900 shrink-0 rounded-b-3xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Total da Nota</span>
            <span className="text-xl font-black text-slate-800 dark:text-white">
              {valorTotalEntrada.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors w-full sm:w-auto"
            >
              Cancelar
            </button>

            <button
              onClick={salvarEntradaFinal}
              disabled={carregando}
              className="px-6 py-2.5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-600/20 w-full sm:w-auto"
            >
              {carregando ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Finalizar Entrada</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalEntrada;