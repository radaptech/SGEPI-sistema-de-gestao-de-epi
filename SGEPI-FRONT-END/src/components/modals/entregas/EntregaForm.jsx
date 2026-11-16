import ListaFuncionarios from "./ListaFuncionarios";
import { Loader2 } from "lucide-react";

function EntregaForm({
  carregandoDados,
  buscaFuncionario,
  setBuscaFuncionario,
  funcionariosFiltrados,
  funcionario,
  setFuncionario,
  funcionarioSelecionado,
  dataEntrega,
  setDataEntrega,
}) {
  const baseInputClass = "w-full px-4 h-[46px] rounded-md text-sm font-medium outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-surface border border-line focus:ring-1 focus:ring-ink focus:border-ink placeholder-ink-3 appearance-none";
  const labelClass = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 transition-colors";

  return (
    <div className="space-y-6 sm:space-y-8">
      {carregandoDados && (
        <div className="flex items-center gap-3 bg-sunken text-ink border border-line rounded-md p-4 text-sm font-bold transition-colors ">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span>Carregando funcionários, EPIs e tamanhos...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <ListaFuncionarios
          buscaFuncionario={buscaFuncionario}
          setBuscaFuncionario={setBuscaFuncionario}
          funcionariosFiltrados={funcionariosFiltrados}
          funcionario={funcionario}
          setFuncionario={setFuncionario}
          funcionarioSelecionado={funcionarioSelecionado}
        />

        <div>
          <label htmlFor="entregaform-1" className={labelClass}>
            Data da Entrega
          </label>
          <input id="entregaform-1"
            type="date"
            className={baseInputClass}
            value={dataEntrega}
            onChange={(e) => setDataEntrega(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default EntregaForm;