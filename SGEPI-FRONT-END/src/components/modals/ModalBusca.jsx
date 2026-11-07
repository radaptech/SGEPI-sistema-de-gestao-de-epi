import { useEffect, useMemo, useState } from "react";
import { listar } from "../../services/listas";
import {
  X, Search, FileSearch, Loader2,
  SearchX, AlertCircle, CheckCircle2
} from "lucide-react";

// Lote de /entradas-estoque: o EPI aninhado vem em camelCase (validadeCa, alertaMinimo)
function normalizarLote(item) {
  const { epi } = item;
  return {
    id: `lote-${item.id}`,
    idEpi: epi.id,
    nome: epi.nome,
    fabricante: epi.fabricante,
    CA: epi.ca,
    descricao: epi.descricao,
    tipoProtecao: epi.protecao.nome,
    alerta_minimo: epi.alertaMinimo,
    tamanho: item.tamanho.tamanho,
    lote: item.lote,
    quantidade: item.quantidade_atual,
    data_validade_lote: item.data_validade,
    validade_CA: epi.validadeCa,
    valor_unitario: Number(item.valor_unitario), // decimal vem como string
  };
}

// EPI de /epis que ainda não tem lote em estoque
function normalizarEpiSemLote(epi) {
  return {
    id: `epi-${epi.id}`,
    idEpi: epi.id,
    nome: epi.nome,
    fabricante: epi.fabricante,
    CA: epi.ca,
    descricao: epi.descricao,
    tipoProtecao: epi.protecao.nome,
    alerta_minimo: epi.alerta_minimo,
    tamanho: "-",
    lote: "-",
    quantidade: 0,
    data_validade_lote: "",
    validade_CA: epi.validade_ca,
    valor_unitario: 0,
  };
}

// O back manda data em dd/mm/aaaa; new Date() leria isso como mês/dia.
function paraData(valor) {
  if (!valor) return null;

  const texto = String(valor).substring(0, 10);
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  let dt;
  if (br) dt = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  else if (iso) dt = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  else dt = new Date(valor);

  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatarData(data) {
  const dt = paraData(data);
  return dt ? dt.toLocaleDateString("pt-BR") : "-";
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function isVencido(dataValidade) {
  const validade = paraData(dataValidade);
  if (!validade) return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  validade.setHours(0, 0, 0, 0);

  return hoje > validade;
}

function getClasseEstoque(quantidadeAtual, alertaMinimo) {
  if (Number(quantidadeAtual) <= 0) {
    return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30";
  }

  if (
    Number(alertaMinimo) > 0 &&
    Number(quantidadeAtual) <= Number(alertaMinimo)
  ) {
    return "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30";
  }

  return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30";
}

function getTextoEstoque(quantidadeAtual, alertaMinimo) {
  if (Number(quantidadeAtual) <= 0) return "Sem estoque";
  if (
    Number(alertaMinimo) > 0 &&
    Number(quantidadeAtual) <= Number(alertaMinimo)
  ) {
    return "Estoque baixo";
  }
  return "Disponível";
}

function ModalBusca({ onClose }) {
  const [termo, setTermo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [jaBuscou, setJaBuscou] = useState(false);
  const [itens, setItens] = useState([]);

  useEffect(() => {
    let ativo = true;

    async function carregarEstoque() {
      setCarregando(true);

      try {
        const [respLotes, respEpis] = await Promise.all([
          listar("/entradas-estoque"),
          listar("/epis"),
        ]);

        if (!ativo) return;

        const lotes = respLotes.map(normalizarLote);
        const comLote = new Set(lotes.map((item) => item.idEpi));

        const semLote = respEpis
          .filter((epi) => !comLote.has(epi.id))
          .map(normalizarEpiSemLote);

        setItens(
          [...lotes, ...semLote].sort((a, b) =>
            String(a.nome).localeCompare(String(b.nome))
          )
        );
      } catch (erro) {
        console.error("Erro ao carregar estoque:", erro);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarEstoque();

    return () => {
      ativo = false;
    };
  }, []);

  const resultados = useMemo(() => {
    const termoLower = termo.toLowerCase().trim();

    if (!jaBuscou || !termoLower) return [];

    return itens.filter((item) => {
      const validadeTexto = formatarData(
        item.data_validade_lote || item.validade_CA || ""
      );

      return (
        String(item.nome || "").toLowerCase().includes(termoLower) ||
        String(item.CA || "").toLowerCase().includes(termoLower) ||
        String(item.fabricante || "").toLowerCase().includes(termoLower) ||
        String(item.descricao || "").toLowerCase().includes(termoLower) ||
        String(item.tipoProtecao || "").toLowerCase().includes(termoLower) ||
        String(item.lote || "").toLowerCase().includes(termoLower) ||
        String(item.tamanho || "").toLowerCase().includes(termoLower) ||
        String(validadeTexto).toLowerCase().includes(termoLower)
      );
    });
  }, [itens, jaBuscou, termo]);

  function buscar(e) {
    if (e) e.preventDefault();

    if (!termo.trim()) {
      setJaBuscou(false);
      return;
    }

    setJaBuscou(true);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in text-slate-700 dark:text-slate-300">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-start shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 transition-colors">
              <FileSearch className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                Consultar Estoque
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                Pesquise por EPI, CA, Lote ou Fabricante.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Fechar Janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col custom-scrollbar transition-colors duration-300">
          <form onSubmit={buscar} className="flex flex-col sm:flex-row gap-3 mb-6 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Digite o termo para buscar..."
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800 dark:text-white placeholder-slate-400 transition-all shadow-sm"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all w-full sm:w-auto ${carregando
                  ? "bg-amber-400 dark:bg-amber-600/50 text-white cursor-not-allowed opacity-80"
                  : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 active:scale-[0.98]"
                }`}
            >
              {carregando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Buscando...</>
              ) : (
                <><Search className="w-4 h-4" /> Buscar</>
              )}
            </button>
          </form>

          <div className="space-y-4 flex-1">
            {resultados.length > 0 ? (
              resultados.map((item) => {
                const tipoProtecao = item.tipoProtecao || "Sem tipo";
                const dataValidadeBase = item.data_validade_lote || item.validade_CA || "";
                const vencido = isVencido(dataValidadeBase);
                const classeEstoque = getClasseEstoque(item.quantidade, item.alerta_minimo);
                const textoEstoque = getTextoEstoque(item.quantidade, item.alerta_minimo);

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-5 sm:p-6 hover:border-amber-300 dark:hover:border-amber-700/50 transition-colors shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight transition-colors">
                          {item.nome}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                          {item.fabricante || "Fabricante não informado"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 transition-colors">
                          <span className="font-bold text-slate-600 dark:text-slate-300">Tipo:</span> {tipoProtecao}
                        </p>
                      </div>

                      <div className="flex flex-col items-start md:items-end shrink-0">
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest mb-1 transition-colors">
                          C.A.
                        </span>
                        <span className="inline-block text-lg font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                          {item.CA || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-xl px-4 py-4 mb-4 transition-colors">
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                        {item.descricao || "Sem descrição cadastrada."}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                            Lote
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-200 font-bold mt-0.5 block transition-colors">
                            {item.lote || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                            Tamanho
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-200 font-bold mt-0.5 block transition-colors">
                            {item.tamanho || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                            Estoque
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-200 font-bold mt-0.5 block transition-colors">
                            {item.quantidade}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest transition-colors">
                            Vlr Unitário
                          </span>
                          <span className="text-sm text-slate-700 dark:text-slate-200 font-bold mt-0.5 block transition-colors">
                            {formatarMoeda(item.valor_unitario)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4 transition-colors">
                      <div className="flex flex-wrap gap-2.5 items-center">
                        <div className="text-sm flex items-center gap-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-medium transition-colors">
                            Validade:
                          </span>
                          <span className={`font-bold transition-colors ${vencido ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {formatarData(dataValidadeBase)}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-widest transition-colors ${classeEstoque}`}>
                          {textoEstoque}
                        </span>
                      </div>

                      {vencido ? (
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-1.5 justify-center transition-colors">
                          <AlertCircle className="w-3.5 h-3.5" /> VENCIDO
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1.5 justify-center transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VÁLIDO
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                {carregando ? (
                  <>
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 transition-colors">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300 transition-colors">Carregando estoque...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Isso pode levar alguns segundos.</p>
                  </>
                ) : jaBuscou ? (
                  <>
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 transition-colors">
                      <SearchX className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300 transition-colors">Nenhum resultado encontrado</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">Tente buscar por outro termo ou verifique a ortografia.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-500 dark:text-amber-400 mb-4 transition-colors">
                      <Search className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300 transition-colors">O que você está procurando?</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm transition-colors">
                      Digite o nome, CA, fabricante, lote, tamanho ou tipo para começar a busca.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-white dark:bg-slate-900 shrink-0 rounded-b-3xl transition-colors duration-300">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalBusca;