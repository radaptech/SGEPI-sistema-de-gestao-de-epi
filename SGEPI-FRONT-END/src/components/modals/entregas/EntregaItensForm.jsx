import TabelaItens from "./TabelaItens";
import { PackagePlus, Plus, ShoppingCart, Loader2, Shield } from "lucide-react";

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
  console.log("DEBUG: Lista 'tamanhos' recebida no Form:", tamanhos);

  const baseInputClass = "w-full px-4 h-[46px] rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white appearance-none";
  const labelClass = "block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 transition-colors";

  return (
    <div className="space-y-6">
      <div className="bg-slate-50/50 dark:bg-slate-800/50 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 transition-colors">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <PackagePlus className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    Number(idEpiTemp) === Number(item.id_epi)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-500"
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
            <label className={labelClass}>
              EPI
            </label>
            <div className="relative">
              <select
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
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <Shield className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Tamanho
            </label>
            <div className="relative">
              <select
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
                    {item.tamanho || item.Tamanho || "Sem nome"}{" "}
                    {item.saldo_atual !== undefined ? `(Estoque: ${item.saldo_atual})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Qtd.
            </label>
            <input
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
            className="w-full md:w-auto h-[46px] px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
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
          <ShoppingCart className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            Itens na entrega
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">
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