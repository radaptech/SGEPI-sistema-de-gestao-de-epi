import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ArrowRight, Loader2, Undo2, X } from "lucide-react";
import { api } from "../services/api";

// Transferências entre unidades (Fase 7 do PLANO-UNIDADES): as mais recentes que saíram da loja
// escolhida no topo ou chegaram nela (todas, em "Todas as unidades"). Só o admin cancela.
// recarregar: muda quando a tela faz uma transferência nova. onCancelada: o estoque mudou.
export default function ListaTransferencias({ podeCancelar, recarregar, onCancelada }) {
  const [lista, setLista] = useState(null);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    api
      .get("/transferencias")
      .then((dados) => setLista(dados ?? []))
      .catch(() => setLista([])); // o api.js já mostrou o erro
  }, [recarregar]);

  const cancelar = async (t) => {
    try {
      setCancelando(true);
      await api.delete(`/gerencial/transferencias/${t.id}`);
      toast.success(`Transferência para ${t.unidade_destino.nome} cancelada. O estoque voltou para ${t.unidade_origem.nome}.`);
      setConfirmandoId(null);
      setLista((atual) => atual.map((x) => (x.id === t.id ? { ...x, cancelada: true } : x)));
      onCancelada();
    } catch {
      // 409: o destino já usou parte; o api.js mostra a mensagem do servidor
    } finally {
      setCancelando(false);
    }
  };

  return (
    <section aria-labelledby="titulo-transferencias" className="mt-8 bg-surface border border-line rounded-md">
      <header className="px-5 py-3 border-b border-line">
        <h3 id="titulo-transferencias" className="text-sm font-bold text-ink">Transferências entre unidades</h3>
      </header>

      {lista === null ? (
        <p className="px-5 py-6 text-sm text-ink-3 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
      ) : lista.length === 0 ? (
        <p className="px-5 py-6 text-sm text-ink-3">Nenhuma transferência ainda. Use "Transferir" para mandar EPIs de uma loja para outra.</p>
      ) : (
        <ul className="divide-y divide-line">
          {lista.map((t) => {
            const confirmando = confirmandoId === t.id;
            return (
              <li key={t.id} className={`px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${t.cancelada ? "opacity-60" : ""}`}>
                <span className="font-mono text-xs text-ink-3 sm:w-20 shrink-0">{t.data}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink flex items-center gap-1.5 flex-wrap">
                    {t.unidade_origem.nome} <ArrowRight className="w-3.5 h-3.5 text-ink-3" aria-label="para" /> {t.unidade_destino.nome}
                    {t.cancelada && <span className="ml-1 text-xs font-medium text-ink-3">(cancelada)</span>}
                  </p>
                  <p className="text-xs text-ink-2 truncate">
                    {t.itens.map((i) => `${i.quantidade} × ${i.epi_nome} ${i.tamanho_nome} (lote ${i.lote})`).join(" · ")}
                  </p>
                  <p className="text-xs text-ink-3 truncate">
                    por {t.usuario}
                    {t.observacao ? ` · ${t.observacao}` : ""}
                  </p>
                </div>
                {podeCancelar && !t.cancelada && (
                  <span className="flex gap-1 shrink-0">
                    {confirmando ? (
                      <>
                        <button
                          type="button"
                          onClick={() => cancelar(t)}
                          disabled={cancelando}
                          className="h-9 px-3 rounded-md border border-erro-line bg-erro-soft text-erro text-xs font-bold disabled:opacity-50"
                        >
                          Cancelar transferência
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmandoId(null)}
                          className="w-9 h-9 flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-sunken"
                          aria-label="Manter transferência"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmandoId(t.id)}
                        className="h-9 px-3 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-ink-2 hover:text-ink hover:bg-sunken"
                        title="Devolve o estoque à origem, se o destino ainda não usou nada"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Desfazer
                      </button>
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
