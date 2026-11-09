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

import { X, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import Dialogo from "../Dialogo";
import { listar } from "../../services/listas";
import { api } from "../../services/api";
import { unidadeAtual } from "../../services/unidadeAtual";
import Selecao from "../Selecao";

function ModalEntrada({ onClose, onSalvar }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [epis, setEpis] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [entradasAnteriores, setEntradasAnteriores] = useState([]);
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
  const [unidades, setUnidades] = useState([]);
  const [unidadeId, setUnidadeId] = useState(unidadeAtual); // a loja escolhida no topo vem marcada
  // com uma unidade só o campo não aparece e o servidor põe a única
  const variasUnidades = unidades.length >= 2;
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
        const [resFornecedores, resEpis, resTamanhos, resEntradas, resUnidades] = await Promise.all([
          listarFornecedores(),
          listarEpis(),
          listarTamanhos(),
          // ponytail: últimas 1000 linhas de entrada bastam para saber o que já veio de cada fornecedor;
          // se pesar, trocar por uma rota que devolva só os pares (fornecedor, epi) distintos.
          listar("/entradas?quantidade=1000"),
          api.get("/unidades"),
        ]);

        if (!ativo) return;

        setFornecedores(resFornecedores.map(normalizarFornecedorEntrada));
        setEpis(resEpis.map(normalizarEpiEntrada));
        setTamanhos(resTamanhos.map(normalizarTamanhoEntrada));
        setEntradasAnteriores(resEntradas);
        setUnidades(resUnidades ?? []);
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

  // O EPI não tem fornecedor fixo (o mesmo EPI pode vir de vários). Então os que já foram
  // comprados do fornecedor escolhido aparecem primeiro, e os demais continuam disponíveis.
  const [episDoFornecedor, outrosEpis] = useMemo(() => {
    if (!fornecedorId) return [[], epis];
    const comprados = new Set(
      entradasAnteriores
        .filter((e) => Number(e.id_fornecedor) === Number(fornecedorId))
        .map((e) => Number(e.id_epi))
    );
    return [epis.filter((e) => comprados.has(Number(e.id))), epis.filter((e) => !comprados.has(Number(e.id)))];
  }, [epis, entradasAnteriores, fornecedorId]);

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
      ? "border border-erro-line bg-erro-soft focus:ring-1 focus:ring-erro "
      : "border border-line-strong bg-surface focus:ring-1 focus:ring-ink focus:border-ink ";
  };

  const campoItemComErro = (campo) => {
    return errosItem[campo]
      ? "border border-erro-line bg-erro-soft focus:ring-1 focus:ring-erro "
      : "border border-line-strong bg-surface focus:ring-1 focus:ring-ink focus:border-ink ";
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
    if (variasUnidades && !unidadeId) novosErros.unidadeId = "Escolha em qual unidade o material vai entrar.";
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
        ...(variasUnidades && { id_unidade: Number(unidadeId) }),
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
    <Dialogo onClose={onClose} className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4 sm:p-6 ">
      <div className="bg-surface rounded-md shadow-modal w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-line transition-colors duration-300">

        <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink tracking-tight">
                Nova Entrada
              </h2>
              <p className="text-sm text-ink-2 mt-1">
                Registre uma nova nota fiscal e seus itens no estoque.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-sunken space-y-6 custom-scrollbar transition-colors duration-300">
          <div className="bg-surface p-6 rounded-md border border-line ">
            <div className="flex items-center gap-2.5 mb-5">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                Dados da Nota
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {variasUnidades && (
                <div className="md:col-span-6">
                  <label htmlFor="entrada-unidade" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                    Unidade <span className="text-erro">*</span>
                  </label>
                  <Selecao id="entrada-unidade"
                    className={`w-full px-4 py-2.5 rounded-md text-sm font-medium outline-none transition-all ${campoNotaComErro("unidadeId")}`}
                    value={unidadeId}
                    onChange={(e) => {
                      setUnidadeId(e.target.value);
                      limparErroNota("unidadeId");
                    }}
                  >
                    <option value="">Onde o material vai ficar?</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </Selecao>
                  {errosNota.unidadeId && <p className="text-xs text-erro font-bold mt-1">{errosNota.unidadeId}</p>}
                </div>
              )}

              <div className="md:col-span-6">
                <label htmlFor="entrada-1" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  Fornecedor <span className="text-erro">*</span>
                </label>
                <Selecao id="entrada-1"
                  className={`w-full px-4 py-2.5 rounded-md text-sm font-medium outline-none transition-all ${campoNotaComErro("fornecedorId")} disabled:opacity-50`}
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
                </Selecao>
                {errosNota.fornecedorId && <p className="text-xs text-erro font-bold mt-1">{errosNota.fornecedorId}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="entrada-2" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  Data <span className="text-erro">*</span>
                </label>
                <input id="entrada-2"
                  type="date"
                  className={`w-full px-4 py-2.5 rounded-md text-sm font-medium outline-none transition-all ${campoNotaComErro("dataEntrada")}`}
                  value={dataEntrada}
                  onChange={(e) => {
                    setDataEntrada(e.target.value);
                    limparErroNota("dataEntrada");
                  }}
                />
                {errosNota.dataEntrada && <p className="text-xs text-erro font-bold mt-1">{errosNota.dataEntrada}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="entrada-3" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  NF Nº <span className="text-erro">*</span>
                </label>
                <input id="entrada-3"
                  type="text"
                  inputMode="numeric"
                  className={`w-full px-4 py-2.5 rounded-md text-sm font-medium outline-none placeholder-ink-3 transition-all ${campoNotaComErro("notaFiscalNumero")}`}
                  value={notaFiscalNumero}
                  onChange={(e) => {
                    setNotaFiscalNumero(e.target.value);
                    limparErroNota("notaFiscalNumero");
                  }}
                  placeholder="Ex: 12345"
                />
                {errosNota.notaFiscalNumero && <p className="text-xs text-erro font-bold mt-1">{errosNota.notaFiscalNumero}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="entrada-4" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  Série
                </label>
                <input id="entrada-4"
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 rounded-md text-sm font-medium bg-surface border border-line-strong outline-none focus:ring-1 focus:ring-ink focus:border-ink placeholder-ink-3 transition-all"
                  value={notaFiscalSerie}
                  onChange={(e) => setNotaFiscalSerie(e.target.value)}
                  placeholder="Padrão: 1"
                />
              </div>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-md border border-line ">
            <div className="flex items-center gap-2.5 mb-5">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                Itens do Lote
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-sunken p-5 rounded-md border border-line mb-6">
              <div className="md:col-span-4">
                <label htmlFor="entrada-5" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  EPI <span className="text-erro">*</span>
                </label>
                <Selecao id="entrada-5"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-medium outline-none transition-all disabled:opacity-50 ${campoItemComErro("epiId")}`}
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
                  {episDoFornecedor.length > 0 ? (
                    <>
                      <optgroup label="Já comprados deste fornecedor">
                        {episDoFornecedor.map((epi) => (
                          <option key={epi.id} value={epi.id}>{epi.nome}</option>
                        ))}
                      </optgroup>
                      {outrosEpis.length > 0 && (
                        <optgroup label="Outros EPIs">
                          {outrosEpis.map((epi) => (
                            <option key={epi.id} value={epi.id}>{epi.nome}</option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    outrosEpis.map((epi) => (
                      <option key={epi.id} value={epi.id}>{epi.nome}</option>
                    ))
                  )}
                </Selecao>
                {errosItem.epiId && <p className="text-xs text-erro font-bold mt-1">{errosItem.epiId}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="entrada-6" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  Tamanho <span className="text-erro">*</span>
                </label>
                <Selecao id="entrada-6"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-medium outline-none transition-all disabled:opacity-50 ${campoItemComErro("tamanhoTemp")}`}
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
                </Selecao>
                {errosItem.tamanhoTemp && <p className="text-xs text-erro font-bold mt-1">{errosItem.tamanhoTemp}</p>}
              </div>

              <div className="md:col-span-1">
                <label htmlFor="entrada-7" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  Qtd <span className="text-erro">*</span>
                </label>
                <input id="entrada-7"
                  type="number"
                  min="1"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-medium outline-none transition-all ${campoItemComErro("qtdTemp")}`}
                  value={qtdTemp}
                  onChange={(e) => {
                    setQtdTemp(e.target.value);
                    limparErroItem("qtdTemp");
                  }}
                />
                {errosItem.qtdTemp && <p className="text-xs text-erro font-bold mt-1">{errosItem.qtdTemp}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="entrada-8" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  Vlr Unit. <span className="text-erro">*</span>
                </label>
                <input id="entrada-8"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-medium outline-none placeholder-ink-3 transition-all ${campoItemComErro("precoTemp")}`}
                  value={precoTemp}
                  onChange={(e) => {
                    setPrecoTemp(e.target.value);
                    limparErroItem("precoTemp");
                  }}
                  placeholder="0.00"
                />
                {errosItem.precoTemp && <p className="text-xs text-erro font-bold mt-1">{errosItem.precoTemp}</p>}
              </div>

              <div className="md:col-span-3">
                <label htmlFor="entrada-9" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  Lote <span className="text-erro">*</span>
                </label>
                <input id="entrada-9"
                  type="text"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-medium outline-none placeholder-ink-3 transition-all ${campoItemComErro("loteTemp")}`}
                  value={loteTemp}
                  onChange={(e) => {
                    setLoteTemp(e.target.value);
                    limparErroItem("loteTemp");
                  }}
                  placeholder="Ex: L001"
                />
                {errosItem.loteTemp && <p className="text-xs text-erro font-bold mt-1">{errosItem.loteTemp}</p>}
              </div>

              <div className="md:col-span-3">
                <label htmlFor="entrada-10" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  Fabricação <span className="text-erro">*</span>
                </label>
                <input id="entrada-10"
                  type="date"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-medium outline-none transition-all ${campoItemComErro("dataFabricacaoTemp")}`}
                  value={dataFabricacaoTemp}
                  onChange={(e) => {
                    setDataFabricacaoTemp(e.target.value);
                    limparErroItem("dataFabricacaoTemp");
                  }}
                />
                {errosItem.dataFabricacaoTemp && <p className="text-xs text-erro font-bold mt-1">{errosItem.dataFabricacaoTemp}</p>}
              </div>

              <div className="md:col-span-3">
                <label htmlFor="entrada-11" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5">
                  Validade <span className="text-erro">*</span>
                </label>
                <input id="entrada-11"
                  type="date"
                  className={`w-full px-3 py-2.5 rounded-md text-sm font-medium outline-none transition-all ${campoItemComErro("validadeTemp")}`}
                  value={validadeTemp}
                  onChange={(e) => {
                    setValidadeTemp(e.target.value);
                    limparErroItem("validadeTemp");
                  }}
                />
                {errosItem.validadeTemp && <p className="text-xs text-erro font-bold mt-1">{errosItem.validadeTemp}</p>}
              </div>

              <div className="md:col-span-6 flex items-end">
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="w-full h-[42px] flex items-center justify-center gap-2 bg-line hover:bg-line-strong text-ink font-bold rounded-md text-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> Incluir Item
                </button>
              </div>
            </div>

            {errosNota.itensEntrada && (
              <div className="mb-4 rounded-md border border-erro-line bg-erro-soft px-4 py-3 text-sm text-erro font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errosNota.itensEntrada}
              </div>
            )}

            <div className="overflow-x-auto rounded-md border border-line ">
              <table className="w-full text-left border-collapse">
                <thead className="bg-sunken border-b border-line transition-colors">
                  <tr>
                    <th className="p-3.5 text-xs font-bold text-ink-2 uppercase tracking-wide">EPI / CA</th>
                    <th className="p-3.5 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Tamanho</th>
                    <th className="p-3.5 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Qtd</th>
                    <th className="p-3.5 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Lote</th>
                    <th className="p-3.5 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Validade</th>
                    <th className="p-3.5 text-xs font-bold text-ink-2 uppercase tracking-wide text-right">Total</th>
                    <th className="p-3.5 text-xs font-bold text-ink-2 uppercase tracking-wide text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line ">
                  {itensEntrada.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-ink-3 font-medium bg-surface ">
                        Nenhum item adicionado à nota ainda.
                      </td>
                    </tr>
                  ) : (
                    itensEntrada.map((item) => (
                      <tr key={item.id} className="bg-surface hover:bg-sunken transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-sm text-ink ">{item.epiNome}</div>
                          <div className="text-xs text-ink-3 uppercase tracking-wide mt-0.5">CA: {item.ca}</div>
                        </td>
                        <td className="p-3.5 text-center text-sm font-semibold text-ink-2 ">
                          {item.tamanhoNome}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-block px-2 py-1 bg-sunken rounded-md text-xs font-bold text-ink ">
                            {item.quantidade}
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-sm font-medium text-ink-2 ">
                          {item.lote}
                        </td>
                        <td className="p-3.5 text-center text-sm font-medium text-ink-2 ">
                          {formatarDataParaGo(item.data_validade) || "-"}
                        </td>
                        <td className="p-3.5 text-right font-bold text-ok ">
                          {item.totalItem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setItensEntrada((prev) => prev.filter((i) => i.id !== item.id))}
                            className="p-1.5 text-ink-3 hover:text-erro hover:bg-erro-soft rounded-md transition-colors inline-flex items-center justify-center"
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

        <div className="px-6 sm:px-8 py-5 border-t border-line flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-surface shrink-0 rounded-b-md">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-ink-3 uppercase tracking-wide">Valor Total da Nota</span>
            <span className="text-xl font-bold text-ink ">
              {valorTotalEntrada.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-ink-2 hover:bg-sunken rounded-md transition-colors w-full sm:w-auto"
            >
              Cancelar
            </button>

            <button
              onClick={salvarEntradaFinal}
              disabled={carregando}
              className="px-6 py-2.5 flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-on-action font-bold rounded-md text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {carregando ? (
                <><span className="w-4 h-4 border-2 border-on-action/30 border-t-on-action rounded-full animate-spin"></span> Processando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Finalizar Entrada</>
              )}
            </button>
          </div>
        </div>
      </div>
    </Dialogo>
  );
}

export default ModalEntrada;