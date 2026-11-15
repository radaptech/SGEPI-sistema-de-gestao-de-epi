import { Trash2 } from "lucide-react";
import { formatarDataParaGo } from "../../../utils/entradaHelpers";
import { formatarPreco } from "../../../utils/estoqueHelpers";

const th = "p-3.5 text-xs font-bold text-ink-2 uppercase tracking-wide";

export default function TabelaItensEntrada({ itens, onRemover }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="w-full text-left border-collapse">
        <thead className="bg-sunken border-b border-line">
          <tr>
            <th className={th}>EPI / CA</th>
            <th className={`${th} text-center`}>Tamanho</th>
            <th className={`${th} text-center`}>Qtd</th>
            <th className={`${th} text-center`}>Lote</th>
            <th className={`${th} text-center`}>Validade</th>
            <th className={`${th} text-right`}>Total</th>
            <th className={`${th} text-center`}>Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {itens.length === 0 ? (
            <tr>
              <td colSpan="7" className="p-8 text-center text-ink-3 font-medium bg-surface">
                Nenhum item adicionado à nota ainda.
              </td>
            </tr>
          ) : (
            itens.map((item) => (
              <tr key={item.id} className="bg-surface hover:bg-sunken transition-colors">
                <td className="p-3.5">
                  <div className="font-bold text-sm text-ink">{item.epiNome}</div>
                  <div className="text-xs text-ink-3 uppercase tracking-wide mt-0.5">CA: {item.ca}</div>
                </td>
                <td className="p-3.5 text-center text-sm font-semibold text-ink-2">{item.tamanhoNome}</td>
                <td className="p-3.5 text-center">
                  <span className="inline-block px-2 py-1 bg-sunken rounded-md text-xs font-bold text-ink">{item.quantidade}</span>
                </td>
                <td className="p-3.5 text-center text-sm font-medium text-ink-2">{item.lote}</td>
                <td className="p-3.5 text-center text-sm font-medium text-ink-2">{formatarDataParaGo(item.data_validade) || "-"}</td>
                <td className="p-3.5 text-right font-bold text-ok">{formatarPreco(item.totalItem)}</td>
                <td className="p-3.5 text-center">
                  <button
                    onClick={() => onRemover(item.id)}
                    className="p-1.5 text-ink-3 hover:text-erro hover:bg-erro-soft rounded-md transition-colors inline-flex items-center justify-center"
                    title="Remover Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
