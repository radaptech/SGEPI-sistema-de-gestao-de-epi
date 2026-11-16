import { PackageOpen, Trash2 } from "lucide-react";

function TabelaItens({ itensParaEntregar, removerItem }) {
  if (itensParaEntregar.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-sunken border-2 border-dashed border-line rounded-md text-ink-3 transition-colors">
        <PackageOpen className="w-10 h-10 mb-3 opacity-80" strokeWidth={1.5} />
        <p className="text-sm font-medium text-ink-2 ">
          Nenhum item adicionado à entrega.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-md overflow-hidden bg-surface transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-sunken border-b border-line transition-colors">
            <tr>
              <th className="py-3 px-4 text-xs font-bold text-ink-2 uppercase tracking-wide whitespace-nowrap">
                Item
              </th>
              <th className="py-3 px-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center whitespace-nowrap w-24">
                Tam.
              </th>
              <th className="py-3 px-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-center whitespace-nowrap w-24">
                Qtd.
              </th>
              <th className="py-3 px-4 text-xs font-bold text-ink-2 uppercase tracking-wide text-right whitespace-nowrap w-20">
                Ação
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-line ">
            {itensParaEntregar.map((item) => (
              <tr 
                key={item.id}
                className="hover:bg-sunken transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="font-bold text-ink transition-colors">
                    {item.epiNome}
                  </span>
                </td>
                
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center justify-center px-2 py-1 bg-sunken text-ink-2 text-xs font-bold rounded-md border border-line transition-colors">
                    {item.tamanhoNome}
                  </span>
                </td>
                
                <td className="py-3 px-4 text-center">
                  <span className="font-bold text-ink transition-colors">
                    {item.quantidade}
                  </span>
                </td>
                
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => removerItem(item.id)}
                    className="p-2 inline-flex items-center justify-center text-ink-3 hover:text-erro hover:bg-erro-soft rounded-md transition-colors"
                    title="Remover item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TabelaItens;