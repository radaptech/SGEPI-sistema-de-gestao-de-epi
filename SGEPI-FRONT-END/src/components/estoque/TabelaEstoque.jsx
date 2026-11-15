import { AlertTriangle, CheckCircle2, Clock, Eye, Trash2 } from "lucide-react";
import { calcularStatusValidade, formatarPreco, formatarValidade, getStatusTexto } from "../../utils/estoqueHelpers";

const ALERTA_VALIDADE = {
  vencido: { texto: "Validade vencida", classe: "bg-erro-soft text-erro border-erro-line", Icone: AlertTriangle },
  proximo: { texto: "Próximo do vencimento", classe: "bg-atencao-soft text-atencao border-atencao-line", Icone: Clock },
  normal: { texto: "Dentro da validade", classe: "bg-ok-soft text-ok border-ok-line", Icone: CheckCircle2 },
};

const th = "p-4 text-xs font-bold text-ink-2 uppercase tracking-wide";
const abaixoDoMinimo = (item) => Number(item.quantidadeAtual) <= Number(item.alertaMinimo);

function SeloValidade({ validade }) {
  const { texto, classe, Icone } = ALERTA_VALIDADE[calcularStatusValidade(validade)];
  return (
    <span className={`px-2 py-0.5 rounded flex items-center gap-1 text-xs font-bold uppercase tracking-wide border ${classe}`}>
      <Icone className="w-3 h-3" strokeWidth={2.5} />
      {texto}
    </span>
  );
}

// Lotes do estoque: tabela no desktop, cartões no celular.
export default function TabelaEstoque({ itens, onDetalhe, onCancelar }) {
  return (
    <>
      <div className="hidden lg:block overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left border-collapse">
          <thead className="bg-sunken border-b border-line">
            <tr>
              <th className={th}>EPI</th>
              <th className={th}>Entrada</th>
              {["Lote / CA", "Tam.", "Preço Unit.", "Qtd. Inicial", "Qtd. Atual", "Validade", "Ações"].map((t) => (
                <th key={t} className={`${th} text-center`}>
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {itens.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-ink-2 font-medium">
                  Nenhum item encontrado.
                </td>
              </tr>
            ) : (
              itens.map((item) => (
                <tr key={item.id} className="hover:bg-sunken transition duration-150 group">
                  <td className="p-4">
                    <div className="font-bold text-sm text-ink">{item.nome}</div>
                    <div className="text-xs text-ink-2 mt-0.5 font-medium">{item.fabricante || "-"}</div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-ink-2">{formatarValidade(item.data_entrada)}</td>
                  <td className="p-4 text-center">
                    <span className="text-xs font-bold font-mono text-ink block">{item.lote}</span>
                    <span className="text-xs text-ink-3 font-mono mt-0.5 block">CA {item.ca}</span>
                  </td>
                  <td className="p-4 text-center text-ink-2 text-sm font-semibold">{item.tamanho}</td>
                  <td className="p-4 text-center text-ink-2 text-sm font-semibold">{formatarPreco(item.preco)}</td>
                  <td className="p-4 text-center">
                    <span className="text-sm font-bold text-ink-3">{item.quantidadeInicial}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          abaixoDoMinimo(item) ? "bg-erro-soft text-erro border-erro-line" : "bg-ok-soft text-ok border-ok-line"
                        }`}
                      >
                        {item.quantidadeAtual}
                      </span>
                      <span className="text-xs text-ink-3 font-bold uppercase tracking-wide">{getStatusTexto(item.quantidadeAtual, item.alertaMinimo)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-ink text-sm font-bold">{formatarValidade(item.validade)}</span>
                      <SeloValidade validade={item.validade} />
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onDetalhe(item)}
                        title="Ver Detalhes"
                        className="p-2 rounded-md bg-sunken text-ink-2 border border-transparent hover:border-line hover:bg-surface transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onCancelar(item)}
                        title="Cancelar Entrada"
                        className="p-2 rounded-md bg-erro-soft text-erro border border-transparent hover:border-erro-line hover:bg-surface transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-4">
        {itens.map((item) => (
          <div key={item.id} className="bg-surface border border-line rounded-md p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-ink">{item.nome}</h3>
              <span className="text-xs bg-sunken px-2 py-1 rounded-md font-bold uppercase tracking-wide text-ink-2">
                {formatarValidade(item.data_entrada)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-3 text-xs font-semibold mb-4">
              {[
                ["Lote", item.lote],
                ["Tamanho", item.tamanho],
                ["Qtd. Inicial", item.quantidadeInicial],
              ].map(([rotulo, valor]) => (
                <p key={rotulo}>
                  <span className="text-ink-3 block text-xs uppercase tracking-wide mb-0.5">{rotulo}</span>
                  {valor}
                </p>
              ))}
              <p>
                <span className="text-ink-3 block text-xs uppercase tracking-wide mb-0.5">Qtd. Atual</span>
                <span className={`font-bold ${abaixoDoMinimo(item) ? "text-erro" : "text-ok"}`}>{item.quantidadeAtual}</span>
              </p>
            </div>
            <div className="flex gap-2 border-t border-line pt-4">
              <button
                onClick={() => onDetalhe(item)}
                className="flex-1 py-2.5 bg-sunken text-ink font-bold rounded-md text-xs flex items-center justify-center gap-2 transition"
              >
                <Eye className="w-4 h-4" /> Detalhes
              </button>
              <button
                onClick={() => onCancelar(item)}
                title="Cancelar"
                aria-label="Cancelar entrada"
                className="px-4 py-2.5 bg-erro-soft text-erro font-bold rounded-md text-sm border border-transparent hover:border-erro-line transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
