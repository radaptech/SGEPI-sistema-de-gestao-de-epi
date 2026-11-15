import { FileDown } from "lucide-react";
import { formatarMoedaEntrada, totalEntrada } from "../../utils/entradaHelpers";

const th = "p-4 text-xs font-bold text-ink-2 uppercase tracking-wide";

// Histórico de entradas: tabela no desktop, cartões no celular. onComprovante baixa o PDF da linha.
export default function TabelaEntradas({ itens, onComprovante }) {
  return (
    <>
      <div className="hidden lg:block overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left border-collapse">
          <thead className="bg-sunken border-b border-line">
            <tr>
              <th className={th}>Data</th>
              <th className={th}>EPI / Item</th>
              <th className={`${th} text-center`}>Tam.</th>
              <th className={`${th} text-center`}>Qtd.</th>
              <th className={th}>Fornecedor / Lote</th>
              <th className={`${th} text-right`}>Total</th>
              <th className={`${th} text-center`}>Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {itens.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-ink-2 font-medium">
                  Nenhuma entrada encontrada.
                </td>
              </tr>
            ) : (
              itens.map((entrada) => (
                <tr key={entrada.id} className="hover:bg-sunken transition duration-150 group">
                  <td className="p-4">
                    <span className="text-xs font-bold font-mono text-ink bg-sunken px-2 py-1 rounded block w-fit">{entrada.data_entrada}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-sm text-ink">{entrada.epiNome}</div>
                    <div className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide">CA: {entrada.epiCA}</div>
                  </td>
                  <td className="p-4 text-center font-semibold text-sm text-ink-2">{entrada.tamanhoNome}</td>
                  <td className="p-4 text-center">
                    <span className="bg-ok-soft text-ok border border-ok-line text-xs font-bold px-2.5 py-1 rounded-md">+{entrada.quantidade}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-sm text-ink truncate max-w-[150px]">{entrada.fornecedorNome}</div>
                    <div className="text-xs text-ink-3 font-mono mt-0.5 uppercase tracking-wide">LOTE: {entrada.lote}</div>
                  </td>
                  <td className="p-4 text-right text-ok font-bold font-mono text-sm">{formatarMoedaEntrada(totalEntrada(entrada))}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onComprovante(entrada)}
                      className="p-2 mx-auto rounded-md bg-sunken text-ink-2 border border-transparent hover:border-ok-line hover:text-ok hover:bg-ok-soft transition-all flex items-center justify-center"
                      title="Baixar Comprovante PDF"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-4">
        {itens.length === 0 ? (
          <div className="text-center py-8 text-ink-2 bg-sunken rounded-md border border-dashed border-line-strong text-sm font-medium">
            Nenhuma entrada encontrada.
          </div>
        ) : (
          itens.map((entrada) => (
            <div key={entrada.id} className="bg-surface border border-line rounded-md p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold font-mono text-ink bg-sunken px-2 py-1 rounded">{entrada.data_entrada}</span>
                <button
                  onClick={() => onComprovante(entrada)}
                  className="text-ok bg-ok-soft p-1.5 rounded-md border border-ok-line transition-colors"
                  title="Baixar PDF"
                >
                  <FileDown className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-ink text-lg leading-tight">{entrada.epiNome}</h3>
              <p className="text-xs text-ink-3 font-mono mt-1 uppercase tracking-wide mb-4">
                CA: {entrada.epiCA} • LOTE: {entrada.lote}
              </p>
              <div className="grid grid-cols-2 gap-3 bg-sunken p-4 rounded-md border border-line text-sm">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wide text-ink-3 mb-0.5">Fornecedor</span>
                  <span className="text-xs font-semibold text-ink truncate block">{entrada.fornecedorNome}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wide text-ink-3 mb-0.5">Total</span>
                  <span className="text-xs font-bold font-mono text-ok block">{formatarMoedaEntrada(totalEntrada(entrada))}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-line mt-1 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wide text-ink-3">Quantidade</span>
                  <span className="bg-ok-soft text-ok border border-ok-line text-xs font-bold px-2 py-0.5 rounded-md">+{entrada.quantidade} un</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
