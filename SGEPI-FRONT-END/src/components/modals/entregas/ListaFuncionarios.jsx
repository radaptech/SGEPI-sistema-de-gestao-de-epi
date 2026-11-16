import { Search, UserCheck } from "lucide-react";

function ListaFuncionarios({
  buscaFuncionario,
  setBuscaFuncionario,
  funcionariosFiltrados,
  funcionario,
  setFuncionario,
  funcionarioSelecionado,
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="listafuncionarios-1" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1 transition-colors">
        Funcionário
      </label>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-ink-3 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>

        <input id="listafuncionarios-1"
          type="text"
          placeholder="Buscar nome ou matrícula..."
          className="w-full pl-11 pr-4 py-3 border border-line rounded-t-md focus:ring-1 focus:ring-ink focus:border-ink outline-none text-sm bg-sunken text-ink placeholder-ink-3 transition-colors"
          value={buscaFuncionario}
          onChange={(e) => setBuscaFuncionario(e.target.value)}
        />
      </div>

      <div className="w-full border border-line rounded-b-md -mt-2 bg-surface max-h-40 overflow-y-auto border-t-0 custom-scrollbar transition-colors">
        {funcionariosFiltrados.length === 0 ? (
          <div className="p-4 text-sm text-ink-3 text-center italic transition-colors">
            Nenhum funcionário encontrado.
          </div>
        ) : (
          funcionariosFiltrados.map((item) => {
            const isSelected = Number(funcionario) === Number(item.id);

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => setFuncionario(item.id)}
                className={`w-full text-left px-4 py-3 border-b border-line  last:border-0 transition-colors text-sm ${
                  isSelected
                    ? "bg-sunken text-ink font-bold"
                    : "text-ink-2 hover:bg-sunken font-medium"
                }`}
              >
                <span className="font-mono text-xs opacity-60 mr-2.5">
                  [{item.matricula}]
                </span>
                {item.nome}
              </button>
            );
          })
        )}
      </div>

      {funcionarioSelecionado && (
        <div className="mt-2 flex items-center gap-2.5 text-xs text-ok bg-ok-soft border border-ok-line rounded-md px-4 py-3 transition-colors ">
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>
            Selecionado: <b className="font-bold">{funcionarioSelecionado.nome}</b> — Mat. {funcionarioSelecionado.matricula}
          </span>
        </div>
      )}
    </div>
  );
}

export default ListaFuncionarios;