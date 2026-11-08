import TabelaItens from "./TabelaItens";
import { Plus, ShoppingCart, Loader2, Shield } from "lucide-react";

function EntregaItensForm({
  epis,
  tamanhos = [],
  carregandoTamanhos,
  idEpiTemp,
  setIdEpiTemp,
  idTamanhoTemp,
  setIdTamanhoTemp,
  qtdTemp,
  setQtdTemp,
  adicionarItem,
  itensParaEntregar,
  removerItem,
  tamanhoSelecionadoObj,
  kitPendente = [],
  usarItemKit,
}) {
  const baseInputClass = "w-full px-4 h-[46px] rounded-md text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-surface border border-line focus:ring-1 focus:ring-ink focus:border-ink appearance-none";
  const labelClass = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 transition-colors";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-5">
          <h3 className="text-base font-bold text-ink ">
            Adicionar itens à entrega
          </h3>
        </div>

        {kitPendente.length > 0 && (
          <div className="mb-5">
            <p className={labelClass}>Kit da função (clique e escolha o tamanho)</p>
            <div className="flex flex-wrap gap-2">
              {kitPendente.map((item) => (
                <button
                  key={item.id_epi}
                  type="button"
                  onClick={() => usarItemKit(item)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                    Number(idEpiTemp) === Number(item.id_epi)
                      ? "bg-action text-on-action border-ink"
                      : "bg-surface text-ink border-line hover:border-ink"
                  }`}
                >
                  {item.nome} × {item.quantidade}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_100px_auto] gap-4 items-end">
          <div>
            <label htmlFor="entregaitensform-1" className={labelClass}>
              EPI
            </label>
            <div className="relative">
              <select id="entregaitensform-1"
                className={baseInputClass}
                value={idEpiTemp}
                onChange={(e) => setIdEpiTemp(e.target.value)}
              >
                <option value="">Selecione...</option>
                {epis.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-ink-3">
                <Shield className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="entregaitensform-2" className={labelClass}>
              Tamanho
            </label>
            <div className="relative">
              <select id="entregaitensform-2"
                className={baseInputClass}
                value={idTamanhoTemp}
                onChange={(e) => {
                  setIdTamanhoTemp(e.target.value);
                }}
                disabled={!idEpiTemp || carregandoTamanhos}
              >
                <option value="">
                  {carregandoTamanhos ? "Carregando..." : "Selecione..."}
                </option>

                {!carregandoTamanhos && idEpiTemp && tamanhos.length === 0 && (
                  <option disabled>Nenhum tamanho disponível</option>
                )}

                {tamanhos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.tamanho} (Estoque: {item.saldo_atual})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="entregaitensform-3" className={labelClass}>
              Qtd.
            </label>
            <input id="entregaitensform-3"
              type="number"
              min="1"
              max={tamanhoSelecionadoObj?.saldo_atual || ""}
              className={baseInputClass}
              value={qtdTemp}
              onChange={(e) => {
                let val = parseInt(e.target.value) || 1;
                const max = tamanhoSelecionadoObj?.saldo_atual;
                if (max !== undefined && val > max) {
                  val = max;
                }

                setQtdTemp(val);
              }}
              disabled={!idTamanhoTemp}
            />
          </div>

          <button
            type="button"
            onClick={adicionarItem}
            disabled={!idTamanhoTemp || carregandoTamanhos}
            className="w-full md:w-auto h-[46px] px-6 bg-action hover:bg-action-hover text-on-action font-bold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {carregandoTamanhos ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" strokeWidth={2.5} />
                <span className="md:hidden lg:inline">Adicionar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2.5 mb-4 px-1">
          <ShoppingCart className="w-5 h-5 text-ink-3 " />
          <label className="text-sm font-bold text-ink flex items-center gap-2">
            Itens na entrega
            <span className="bg-sunken text-ink px-2 py-0.5 rounded-md text-xs font-bold">
              {itensParaEntregar.length}
            </span>
          </label>
        </div>

        <TabelaItens
          itensParaEntregar={itensParaEntregar}
          removerItem={removerItem}
        />
      </div>
    </div>
  );
}

export default EntregaItensForm;