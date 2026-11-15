import { useEffect, useMemo, useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { listarEpis, listarFornecedores, criarEntrada } from "../../services/entradaService";
import { normalizarEpiEntrada, normalizarFornecedorEntrada } from "../../utils/entradaNormalizers";
import { formatarDataParaGo } from "../../utils/entradaHelpers";
import { formatarPreco } from "../../utils/estoqueHelpers";
import Dialogo from "../Dialogo";
import Selecao from "../Selecao";
import Campo from "../Campo";
import { listar } from "../../services/listas";
import { api } from "../../services/api";
import { unidadeAtual } from "../../services/unidadeAtual";
import FormItemEntrada, { classeCampoEntrada } from "./entrada/FormItemEntrada";
import TabelaItensEntrada from "./entrada/TabelaItensEntrada";

function hojeISO() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
}

function ModalEntrada({ onClose, onSalvar }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [epis, setEpis] = useState([]);
  const [entradasAnteriores, setEntradasAnteriores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [nota, setNota] = useState({
    unidadeId: unidadeAtual(), // a loja escolhida no topo vem marcada
    fornecedorId: "",
    dataEntrada: hojeISO(),
    numero: "",
    serie: "",
  });
  const [itens, setItens] = useState([]);
  const [erros, setErros] = useState({});

  // com uma unidade só o campo não aparece e o servidor põe a única
  const variasUnidades = unidades.length >= 2;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [resFornecedores, resEpis, resEntradas, resUnidades] = await Promise.all([
          listarFornecedores(),
          listarEpis(),
          // ponytail: últimas 1000 linhas de entrada bastam para saber o que já veio de cada fornecedor;
          // se pesar, trocar por uma rota que devolva só os pares (fornecedor, epi) distintos.
          listar("/entradas?quantidade=1000"),
          api.get("/unidades"),
        ]);
        if (!ativo) return;
        setFornecedores(resFornecedores.map(normalizarFornecedorEntrada));
        setEpis(resEpis.map(normalizarEpiEntrada));
        setEntradasAnteriores(resEntradas);
        setUnidades(resUnidades ?? []);
      } catch {
        // o api.js já mostrou o erro
      } finally {
        if (ativo) setCarregandoDados(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // O EPI não tem fornecedor fixo (o mesmo EPI pode vir de vários). Então os que já foram
  // comprados do fornecedor escolhido aparecem primeiro, e os demais continuam disponíveis.
  const [episDoFornecedor, outrosEpis] = useMemo(() => {
    if (!nota.fornecedorId) return [[], epis];
    const comprados = new Set(
      entradasAnteriores.filter((e) => Number(e.id_fornecedor) === Number(nota.fornecedorId)).map((e) => Number(e.id_epi))
    );
    return [epis.filter((e) => comprados.has(Number(e.id))), epis.filter((e) => !comprados.has(Number(e.id)))];
  }, [epis, entradasAnteriores, nota.fornecedorId]);

  const total = itens.reduce((acc, item) => acc + Number(item.totalItem || 0), 0);

  const limparErros = (...campos) =>
    setErros((atuais) => {
      const novos = { ...atuais };
      campos.forEach((c) => delete novos[c]);
      return novos;
    });

  const atualizar = (campo, valor) => {
    setNota((atual) => ({ ...atual, [campo]: valor }));
    limparErros(campo);
  };

  const salvar = async () => {
    const novosErros = {};
    if (variasUnidades && !nota.unidadeId) novosErros.unidadeId = "Escolha em qual unidade o material vai entrar.";
    if (!nota.fornecedorId) novosErros.fornecedorId = "Selecione o fornecedor.";
    if (!nota.dataEntrada) novosErros.dataEntrada = "Informe a data.";
    if (!nota.numero.trim()) novosErros.numero = "Informe o número.";
    if (itens.length === 0) novosErros.itens = "Adicione pelo menos um item antes de finalizar.";
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    setSalvando(true);
    try {
      await criarEntrada({
        idfornecedor: Number(nota.fornecedorId),
        nota_fiscal_numero: nota.numero.trim(),
        nota_fiscal_serie: (nota.serie || "1").trim(),
        data_emissao: formatarDataParaGo(nota.dataEntrada),
        ...(variasUnidades && { id_unidade: Number(nota.unidadeId) }),
        itens: itens.map((item) => ({
          id_epi: item.idEpi,
          id_tamanho: item.idTamanho,
          quantidade: item.quantidade,
          data_fabricacao: formatarDataParaGo(item.data_fabricacao),
          data_validade: formatarDataParaGo(item.data_validade),
          lote: item.lote,
          valor_unitario: String(item.valor_unitario),
        })),
      });
      onSalvar?.({ tipo: "sucesso", mensagem: "Entrada de estoque cadastrada com sucesso!" });
      onClose();
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  const campoNota = (campo) => ({
    id: `entrada-${campo}`,
    value: nota[campo],
    onChange: (e) => atualizar(campo, e.target.value),
    className: classeCampoEntrada(erros[campo]),
  });

  return (
    <Dialogo onClose={onClose} className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4 sm:p-6">
      <div className="bg-surface rounded-md shadow-modal w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-line">
        <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-ink tracking-tight">Nova Entrada</h2>
            <p className="text-sm text-ink-2 mt-1">Registre uma nova nota fiscal e seus itens no estoque.</p>
          </div>
          <button onClick={onClose} className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-sunken space-y-6 custom-scrollbar">
          <div className="bg-surface p-6 rounded-md border border-line">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-5">Dados da Nota</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {variasUnidades && (
                <Campo id="entrada-unidadeId" rotulo="Unidade" obrigatorio erro={erros.unidadeId} className="md:col-span-6">
                  <Selecao {...campoNota("unidadeId")}>
                    <option value="">Onde o material vai ficar?</option>
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome}
                      </option>
                    ))}
                  </Selecao>
                </Campo>
              )}

              <Campo id="entrada-fornecedorId" rotulo="Fornecedor" obrigatorio erro={erros.fornecedorId} className="md:col-span-6">
                <Selecao {...campoNota("fornecedorId")} disabled={carregandoDados}>
                  <option value="">{carregandoDados ? "Carregando..." : "Selecione o fornecedor..."}</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome_fantasia || f.razao_social}
                    </option>
                  ))}
                </Selecao>
              </Campo>

              <Campo id="entrada-dataEntrada" rotulo="Data" obrigatorio erro={erros.dataEntrada} className="md:col-span-2">
                <input type="date" {...campoNota("dataEntrada")} />
              </Campo>
              <Campo id="entrada-numero" rotulo="NF Nº" obrigatorio erro={erros.numero} className="md:col-span-2">
                <input type="text" inputMode="numeric" placeholder="Ex: 12345" {...campoNota("numero")} />
              </Campo>
              <Campo id="entrada-serie" rotulo="Série" className="md:col-span-2">
                <input type="text" inputMode="numeric" placeholder="Padrão: 1" {...campoNota("serie")} />
              </Campo>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-md border border-line">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-5">Itens do Lote</h3>
            <FormItemEntrada
              episDoFornecedor={episDoFornecedor}
              outrosEpis={outrosEpis}
              carregando={carregandoDados}
              onIncluir={(item) => {
                setItens((atuais) => [...atuais, item]);
                limparErros("itens");
              }}
            />
            {erros.itens && (
              <div className="mb-4 rounded-md border border-erro-line bg-erro-soft px-4 py-3 text-sm text-erro font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {erros.itens}
              </div>
            )}
            <TabelaItensEntrada itens={itens} onRemover={(id) => setItens((atuais) => atuais.filter((i) => i.id !== id))} />
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-line flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-surface shrink-0">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-ink-3 uppercase tracking-wide">Valor Total da Nota</span>
            <span className="text-xl font-bold text-ink">{formatarPreco(total)}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-ink-2 hover:bg-sunken rounded-md transition-colors w-full sm:w-auto">
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="px-6 py-2.5 flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-on-action font-bold rounded-md text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {salvando ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-action/30 border-t-on-action rounded-full animate-spin"></span> Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Finalizar Entrada
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Dialogo>
  );
}

export default ModalEntrada;
