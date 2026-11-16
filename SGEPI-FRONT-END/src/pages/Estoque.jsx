import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, ArrowLeftRight } from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import ModalDetalhesEstoque from "../components/modals/ModalDetalhesEstoque";
import ModalTransferencia from "../components/modals/ModalTransferencia";
import ListaTransferencias from "../components/ListaTransferencias";
import FiltroEstoque from "../components/estoque/FiltroEstoque";
import TabelaEstoque from "../components/estoque/TabelaEstoque";
import Paginacao, { usePaginacao } from "../components/Paginacao";
import { unidadeAtual } from "../services/unidadeAtual";
import { CancelarEntrada, ValidarRegrasCancelamento } from "../services/estoqueService";
import { api } from "../services/api";
import { temPermissao } from "../utils/permissoes";
import { filtrarEstoque, formatarPreco, ordenarPorEntrada, resumirEstoque } from "../utils/estoqueHelpers";
import { normalizarEntradaCompleta } from "../utils/estoqueNormalizers";

function Estoque({ usuarioLogado }) {
  const [entradas, setEntradas] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("nome");
  const [carregando, setCarregando] = useState(true);
  const [itemDetalhe, setItemDetalhe] = useState(null);
  // transferência (Fase 7): só com 2 unidades ou mais, e sai da loja escolhida no topo
  const [unidades, setUnidades] = useState([]);
  const [transferindo, setTransferindo] = useState(false);
  const [versaoTransferencias, setVersaoTransferencias] = useState(0);
  const origem = unidades.find((u) => String(u.id) === unidadeAtual());

  const lista = useMemo(() => ordenarPorEntrada(filtrarEstoque(entradas, filtro, busca)), [entradas, filtro, busca]);
  const resumo = useMemo(() => resumirEstoque(entradas), [entradas]);
  const { itens, ...paginacao } = usePaginacao(lista, 5);
  const { setPagina } = paginacao;

  const carregar = async () => {
    setCarregando(true);
    try {
      const lotes = await api.get("/entradas-estoque");
      setEntradas((lotes ?? []).map(normalizarEntradaCompleta));
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
    api.get("/unidades?destinos=1").then((lista) => setUnidades(lista ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [busca, filtro, setPagina]);

  const filtrar = (campo, valor) => {
    setFiltro(campo);
    setBusca(valor);
  };

  const cancelarEntrada = async (item) => {
    try {
      ValidarRegrasCancelamento(item);
    } catch (erro) {
      return toast.error(erro.message);
    }
    const confirmou = window.confirm(
      `ATENÇÃO: Deseja realmente cancelar a entrada do lote ${item.lote} de ${item.nome}? Esta ação subtrairá as quantidades do estoque atual.`
    );
    if (!confirmou) return;

    try {
      setCarregando(true);
      await CancelarEntrada(item.id);
      toast.success("Entrada cancelada e estoque revertido com sucesso!");
      await carregar();
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setCarregando(false);
    }
  };

  if (!temPermissao(usuarioLogado, "visualizar_estoque")) {
    return (
      <div className="bg-surface p-8 rounded-md border border-line flex items-center justify-center">
        <div className="bg-atencao-soft border border-atencao-line rounded-md p-6 text-atencao flex items-center gap-3 font-medium">
          <AlertTriangle className="w-5 h-5" />
          Você não tem permissão para visualizar a tela de estoque.
        </div>
      </div>
    );
  }

  const valor = (v) => (carregando ? "--" : v);

  return (
    <>
      <div className="max-w-full">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink tracking-tight">Controle de Estoque</h2>
            <p className="text-sm text-ink-2 mt-1">Visualize lotes, tamanhos e validade dos EPIs.</p>
          </div>
          {unidades.length >= 2 && (
            <button
              type="button"
              onClick={() => setTransferindo(true)}
              disabled={!origem || carregando}
              title={origem ? `Mandar EPIs de ${origem.nome} para outra unidade` : "Escolha a unidade no topo para transferir dela"}
              className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-md border border-line bg-surface text-sm font-bold text-ink hover:bg-sunken transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftRight className="w-4 h-4" /> Transferir
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-8">
          <DashboardCard card={{ titulo: "Todos os lotes", valor: valor(resumo.totalLotes) }} onClick={() => filtrar("nome", "")} />
          <DashboardCard card={{ titulo: "Em estoque", valor: valor(resumo.totalItens) }} onClick={() => filtrar("logica_estoque", "disponivel")} />
          <DashboardCard
            card={{ titulo: "Estoque baixo", grupo: "pendencia", estado: "atencao", valor: valor(resumo.estoqueBaixo) }}
            onClick={() => filtrar("logica_estoque", "baixo")}
          />
          <DashboardCard
            card={{ titulo: "Sem estoque", grupo: "pendencia", estado: "erro", valor: valor(resumo.semEstoque) }}
            onClick={() => filtrar("logica_estoque", "vazio")}
          />
          <DashboardCard card={{ titulo: "Valor estimado", valor: valor(formatarPreco(resumo.valorTotal)) }} />
        </div>

        <FiltroEstoque filtro={filtro} busca={busca} onFiltro={(campo) => filtrar(campo, "")} onBusca={setBusca} />

        {carregando ? (
          <div className="border border-dashed border-line-strong rounded-md p-12 flex flex-col items-center justify-center text-ink-2 gap-3">
            <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold tracking-wide">Carregando estoque...</span>
          </div>
        ) : (
          <>
            <TabelaEstoque itens={itens} onDetalhe={setItemDetalhe} onCancelar={cancelarEntrada} />
            <Paginacao {...paginacao} className="mt-6 flex items-center justify-between" />
          </>
        )}

        {unidades.length >= 2 && (
          <ListaTransferencias podeCancelar={usuarioLogado?.role === "admin"} recarregar={versaoTransferencias} onCancelada={carregar} />
        )}
      </div>

      {transferindo && origem && (
        <ModalTransferencia
          origem={origem}
          unidades={unidades}
          lotes={entradas}
          onClose={() => setTransferindo(false)}
          onSalvo={() => {
            setTransferindo(false);
            setVersaoTransferencias((v) => v + 1);
            carregar();
          }}
        />
      )}

      <ModalDetalhesEstoque aberto={!!itemDetalhe} item={itemDetalhe} onClose={() => setItemDetalhe(null)} geradoPor={usuarioLogado?.nome} />
    </>
  );
}

export default Estoque;
