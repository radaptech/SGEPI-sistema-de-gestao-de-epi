import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { ArrowRight, Loader2, X } from "lucide-react";
import { api } from "../../services/api";
import { calcularStatusValidade } from "../../utils/estoqueHelpers";
import Dialogo from "../Dialogo";
import Selecao from "../Selecao";

const inputClass =
  "w-full px-4 h-11 rounded-md text-sm font-medium bg-surface text-ink border border-line outline-none focus:ring-1 focus:ring-ink focus:border-ink placeholder-ink-3 transition-colors";
const labelClass = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5";

// Mandar EPIs da loja atual para outra (Fase 7 do PLANO-UNIDADES). Sai na hora, pelo FEFO.
// lotes: os lotes da loja atual, já carregados pela tela de Estoque (normalizarEntradaCompleta).
// ponytail: um EPI por transferência; a API aceita vários itens, a tela pede um de cada vez
export default function ModalTransferencia({ origem, unidades, lotes, onClose, onSalvo }) {
  const [destino, setDestino] = useState("");
  const [chave, setChave] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  // saldo transferível por EPI e tamanho: só lote dentro da validade, como o FEFO do back
  const opcoes = useMemo(() => {
    const mapa = new Map();
    for (const l of lotes) {
      if (Number(l.quantidadeAtual) <= 0 || calcularStatusValidade(l.validade) === "vencido") continue;
      const k = `${l.idEpi}-${l.idTamanho}`;
      const atual = mapa.get(k) ?? { chave: k, idEpi: l.idEpi, idTamanho: l.idTamanho, rotulo: `${l.nome} · ${l.tamanho}`, saldo: 0 };
      atual.saldo += Number(l.quantidadeAtual);
      mapa.set(k, atual);
    }
    return [...mapa.values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo));
  }, [lotes]);

  const escolhido = opcoes.find((o) => o.chave === chave);
  const destinos = unidades.filter((u) => String(u.id) !== String(origem.id));
  const qtd = Number(quantidade);
  const erroQtd = escolhido && (qtd < 1 || qtd > escolhido.saldo) ? `Escolha de 1 a ${escolhido.saldo}.` : "";
  const podeSalvar = destino && escolhido && !erroQtd && !salvando;

  const salvar = async (e) => {
    e.preventDefault();
    if (!podeSalvar) return;
    try {
      setSalvando(true);
      await api.post("/transferencias", {
        id_unidade_origem: Number(origem.id),
        id_unidade_destino: Number(destino),
        observacao: observacao.trim(),
        itens: [{ id_epi: escolhido.idEpi, id_tamanho: escolhido.idTamanho, quantidade: qtd }],
      });
      const nomeDestino = destinos.find((u) => String(u.id) === destino)?.nome;
      toast.success(`${qtd} un. de ${escolhido.rotulo} enviadas para ${nomeDestino}.`);
      onSalvo();
    } catch {
      // o api.js já mostrou a mensagem do servidor (ex.: estoque insuficiente)
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialogo onClose={onClose} rotulo="Transferir estoque" className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink">
      <div className="w-full max-w-lg bg-surface border border-line rounded-md shadow-xl">
        <form onSubmit={salvar}>
          <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
            <div>
              <h3 className="text-base font-bold text-ink">Transferir estoque</h3>
              <p className="mt-0.5 text-xs text-ink-3">Sai de {origem.nome} agora e entra no destino na hora. Os lotes que vencem antes vão primeiro.</p>
            </div>
            <button type="button" onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-sunken" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="px-5 py-4 flex flex-col gap-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <div>
                <span className={labelClass}>De</span>
                <p className="h-11 px-4 flex items-center rounded-md bg-sunken border border-line text-sm font-semibold text-ink truncate">{origem.nome}</p>
              </div>
              <ArrowRight className="w-4 h-4 mb-3.5 text-ink-3" aria-hidden="true" />
              <div>
                <label htmlFor="transf-destino" className={labelClass}>Para</label>
                <Selecao id="transf-destino" className={inputClass} value={destino} onChange={(e) => setDestino(e.target.value)}>
                  <option value="">Escolha</option>
                  {destinos.map((u) => (
                    <option key={u.id} value={String(u.id)}>{u.nome}</option>
                  ))}
                </Selecao>
              </div>
            </div>

            <div>
              <label htmlFor="transf-epi" className={labelClass}>EPI e tamanho</label>
              {opcoes.length === 0 ? (
                <p className="text-sm text-ink-3">{origem.nome} não tem estoque dentro da validade para transferir.</p>
              ) : (
                <Selecao id="transf-epi" className={inputClass} value={chave} onChange={(e) => setChave(e.target.value)}>
                  <option value="">Escolha</option>
                  {opcoes.map((o) => (
                    <option key={o.chave} value={o.chave}>{`${o.rotulo} (${o.saldo} em estoque)`}</option>
                  ))}
                </Selecao>
              )}
            </div>

            <div>
              <label htmlFor="transf-qtd" className={labelClass}>Quantidade</label>
              <input
                id="transf-qtd"
                type="number"
                min={1}
                max={escolhido?.saldo}
                className={`${inputClass} ${erroQtd ? "border-erro-line bg-erro-soft" : ""}`}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                aria-invalid={Boolean(erroQtd)}
                aria-describedby={erroQtd ? "transf-qtd-erro" : undefined}
              />
              {erroQtd && <p id="transf-qtd-erro" className="mt-1.5 text-xs font-medium text-erro">{erroQtd}</p>}
            </div>

            <div>
              <label htmlFor="transf-obs" className={labelClass}>Observação (opcional)</label>
              <input id="transf-obs" className={inputClass} maxLength={500} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: reforço para a obra nova" />
            </div>
          </div>

          <footer className="flex justify-end gap-2 px-5 py-4 border-t border-line">
            <button type="button" onClick={onClose} className="h-11 px-4 rounded-md border border-line text-sm font-semibold text-ink-2 hover:bg-sunken">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podeSalvar}
              className="h-11 px-5 inline-flex items-center gap-2 rounded-md bg-action hover:bg-action-hover text-on-action text-sm font-bold disabled:opacity-50"
            >
              {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
              Transferir
            </button>
          </footer>
        </form>
      </div>
    </Dialogo>
  );
}
