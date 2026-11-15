import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, Plus, Search, X, Layers, Hash, DollarSign } from "lucide-react";
import ModalEntrada from "../components/modals/ModalEntrada";
import TabelaEntradas from "../components/entradas/TabelaEntradas";
import Selecao from "../components/Selecao";
import Paginacao, { usePaginacao } from "../components/Paginacao";
import { listarEntradas, listarEpis, listarFornecedores, listarTamanhos } from "../services/entradaService";
import { temPermissao } from "../utils/permissoes";
import { formatarMoedaEntrada, resolverEntradas, totalEntrada } from "../utils/entradaHelpers";
import { baixarComprovanteEntrada } from "../utils/comprovanteEntrada";
import { normalizarEntrada, normalizarEpiEntrada, normalizarFornecedorEntrada, normalizarTamanhoEntrada } from "../utils/entradaNormalizers";

// dd/mm/aaaa -> timestamp, para ordenar
const timestamp = (data) => {
  const [d, m, a] = (data || "").split("/");
  return new Date(a, m - 1, d).getTime() || 0;
};

function filtrar(entradas, filtro, busca) {
  const termo = busca.toLowerCase().trim();
  if (!termo) return entradas;
  return entradas.filter((e) => {
    if (filtro === "data_entrada") {
      const [d, m, a] = (e.data_entrada || "").split("/");
      return `${a}-${m}-${d}` === termo; // o input date devolve aaaa-mm-dd
    }
    return String(e[filtro] ?? "").toLowerCase().includes(termo);
  });
}

function Resumo({ icone: Icone, titulo, valor, destaque }) {
  return (
    <div className={`${destaque ? "bg-ok-soft border-ok-line" : "bg-sunken border-line"} border rounded-md p-5 flex flex-col gap-2`}>
      <div className={`flex items-center gap-2 ${destaque ? "text-ok" : "text-ink-2"}`}>
        <Icone className="w-4 h-4" />
        <p className="text-xs uppercase font-bold tracking-wide">{titulo}</p>
      </div>
      <p className={`text-2xl sm:text-3xl font-bold mt-auto tracking-tight ${destaque ? "text-ok" : "text-ink"}`}>{valor}</p>
    </div>
  );
}

function Entradas({ usuarioLogado }) {
  const [entradas, setEntradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("epiNome");

  const podeVisualizar = !usuarioLogado || temPermissao(usuarioLogado, "visualizar_estoque");
  const podeCadastrar = !usuarioLogado || ["admin", "gerente"].includes(usuarioLogado.role);

  const lista = useMemo(
    () => filtrar(entradas, filtro, busca).sort((a, b) => timestamp(b.data_entrada) - timestamp(a.data_entrada)),
    [entradas, filtro, busca]
  );
  const { itens, ...paginacao } = usePaginacao(lista, 5);
  const { setPagina } = paginacao;

  const carregar = async () => {
    setCarregando(true);
    try {
      const [fornecedores, epis, tamanhos, resEntradas] = await Promise.all([listarFornecedores(), listarEpis(), listarTamanhos(), listarEntradas()]);
      setEntradas(
        resolverEntradas(
          resEntradas.map(normalizarEntrada),
          epis.map(normalizarEpiEntrada),
          tamanhos.map(normalizarTamanhoEntrada),
          fornecedores.map(normalizarFornecedorEntrada)
        )
      );
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [busca, filtro, setPagina]);

  if (!podeVisualizar) {
    return (
      <div className="bg-surface p-8 rounded-md border border-line flex items-center justify-center">
        <div className="bg-atencao-soft border border-atencao-line rounded-md p-6 text-atencao flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de entradas.
        </div>
      </div>
    );
  }

  const valor = (v) => (carregando ? "--" : v);

  return (
    <>
      <div className="max-w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-ink tracking-tight">Registro de Entradas</h2>
            <p className="text-sm text-ink-2 mt-1">Histórico de abastecimento e entradas de estoque.</p>
          </div>
          {podeCadastrar && (
            <button
              onClick={() => setModalAberto(true)}
              className="w-full lg:w-auto bg-action hover:bg-action-hover text-on-action px-5 py-3 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              Nova Entrada
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
          <Resumo icone={Layers} titulo="Registros" valor={valor(lista.length)} />
          <Resumo icone={Hash} titulo="Quantidade Total" valor={valor(lista.reduce((acc, e) => acc + Number(e.quantidade || 0), 0))} />
          <Resumo icone={DollarSign} titulo="Valor Total" valor={valor(formatarMoedaEntrada(lista.reduce((acc, e) => acc + totalEntrada(e), 0)))} destaque />
        </div>

        <div className="relative mb-8 flex flex-col md:flex-row items-stretch md:items-center bg-sunken rounded-md border border-line p-1.5 gap-1.5 md:gap-0">
          <div className="relative w-full md:w-auto bg-surface rounded-md md:rounded-l-md md:rounded-r-none border border-line md:border-r-0 flex items-center px-4 py-1 h-[46px]">
            <Selecao
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value);
                setBusca("");
              }}
              className="bg-transparent text-ink-2 font-bold text-xs uppercase tracking-wide outline-none pr-6 appearance-none w-full md:w-40 cursor-pointer h-full"
            >
              <option value="epiNome">EPI / Item</option>
              <option value="data_entrada">Data</option>
              <option value="fornecedorNome">Fornecedor</option>
              <option value="lote">Lote</option>
              <option value="nota_fiscal_numero">Nota Fiscal</option>
            </Selecao>
          </div>
          <div className="relative flex items-center bg-surface rounded-md md:rounded-r-md md:rounded-l-none border border-line flex-1 w-full h-[46px]">
            <div className="pl-4 text-ink-3">
              <Search className="w-4 h-4" />
            </div>
            <input
              type={filtro === "data_entrada" ? "date" : "text"}
              placeholder="Pesquisar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 text-sm font-semibold text-ink outline-none placeholder-ink-3 h-full"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
                className="absolute right-3 p-1 rounded-md text-ink-3 hover:text-ink-2 hover:bg-sunken transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {carregando ? (
          <div className="border border-dashed border-line-strong rounded-md p-12 flex flex-col items-center justify-center text-ink-2 gap-3">
            <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando entradas...</span>
          </div>
        ) : (
          <>
            <TabelaEntradas itens={itens} onComprovante={(entrada) => baixarComprovanteEntrada(entrada, usuarioLogado?.nome)} />
            <Paginacao {...paginacao} className="mt-6 flex items-center justify-between" />
          </>
        )}
      </div>

      {modalAberto && (
        <ModalEntrada
          onClose={() => setModalAberto(false)}
          onSalvar={async () => {
            setModalAberto(false);
            await carregar();
            setPagina(1);
            toast.success("Entrada cadastrada com sucesso!");
          }}
        />
      )}
    </>
  );
}

export default Entradas;
