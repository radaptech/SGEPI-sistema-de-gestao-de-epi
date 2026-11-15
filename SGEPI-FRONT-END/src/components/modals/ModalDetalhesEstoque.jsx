import { useEffect } from "react";
import { formatarPreco, formatarValidade } from "../../utils/estoqueHelpers";
import { X, Download } from "lucide-react";
import Dialogo from "../Dialogo";
import { cabecalho, novoPdf, rodape, secao } from "../../utils/pdfDocumento";

function ModalDetalhesEstoque({ aberto, item, onClose, geradoPor }) {
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [aberto]);

  if (!aberto || !item) return null;

  const gerarPDF = async () => {
    const { doc, autoTable, logo } = await novoPdf("Detalhes do lote em estoque");
    let y = cabecalho(doc, {
      logo,
      titulo: "DETALHES DO LOTE EM ESTOQUE",
      subtitulo: "Situação de um lote de Equipamento de Proteção Individual",
      numero: item.lote ? `Lote ${item.lote}` : undefined,
    });
    y = secao(doc, autoTable, y, "EPI", [
      { rotulo: "Nome", valor: item.nome, largo: true },
      { rotulo: "CA", valor: item.ca },
      { rotulo: "Tamanho", valor: item.tamanho },
      { rotulo: "Fabricante", valor: item.fabricante },
      { rotulo: "Proteção", valor: item.tipoProtecao },
      { rotulo: "Descrição", valor: item.descricao, largo: true },
    ]);
    secao(doc, autoTable, y, "Lote", [
      { rotulo: "Lote", valor: item.lote },
      { rotulo: "Entrada no estoque", valor: item.data_entrada },
      { rotulo: "Validade", valor: formatarValidade(item.validade) },
      { rotulo: "Preço unitário", valor: formatarPreco(item.preco) },
      { rotulo: "Quantidade inicial", valor: `${item.quantidadeInicial} un.` },
      { rotulo: "Quantidade atual", valor: `${item.quantidadeAtual} un.` },
      { rotulo: "Valor em estoque", valor: formatarPreco(item.quantidadeAtual * item.preco) },
    ]);
    rodape(doc, geradoPor);
    doc.save(`Lote_${item.nome}_${item.lote || item.id}.pdf`.replace(/[^\wÀ-ú.-]+/g, "_"));
  };

  const InfoCard = ({ label, value }) => (
    <div className="bg-surface p-4 sm:p-5 rounded-md border border-line transition-colors">
      <span className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 transition-colors">
        {label}
      </span>
      <strong className="text-sm font-bold text-ink block truncate transition-colors">
        {value}
      </strong>
    </div>
  );

  return (
    <Dialogo onClose={onClose} className="fixed inset-0 z-[120] bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink ">
      <div className="w-full max-w-3xl bg-surface rounded-md shadow-modal border border-line overflow-hidden flex flex-col max-h-[95vh] transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink tracking-tight transition-colors">
                Detalhes do Item
              </h2>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Informações completas do lote em estoque.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-sunken space-y-5 custom-scrollbar transition-colors duration-300">
          <div className="max-w-full">
            <span className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 transition-colors">
              EPI
            </span>
            <strong className="text-lg font-bold text-ink block transition-colors">
              {item.nome}
            </strong>
            <p className="text-sm text-ink-2 mt-1.5 leading-relaxed transition-colors">
              {item.descricao || "Nenhuma descrição adicional cadastrada para este item."}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            <InfoCard label="Fabricante" value={item.fabricante || "-"} />
            <InfoCard label="Tipo de proteção" value={item.tipoProtecao || "-"} />
            <InfoCard label="CA" value={item.ca || "-"} />
            <InfoCard label="Lote" value={item.lote || "-"} />
            <InfoCard label="Tamanho" value={item.tamanho || "-"} />
            <InfoCard label="Preço unitário" value={formatarPreco(item.preco)} />
            <InfoCard label="Qtd. inicial" value={item.quantidadeInicial} />
            <InfoCard label="Qtd. atual" value={item.quantidadeAtual} />
            <InfoCard label="Alerta mínimo" value={item.alertaMinimo} />

            <div className="col-span-2 md:col-span-3">
              <InfoCard label="Validade" value={formatarValidade(item.validade)} />
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-line flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-center bg-surface shrink-0 rounded-b-md transition-colors duration-300">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-ink-2 hover:bg-sunken rounded-md transition-colors w-full sm:w-auto order-2 sm:order-1"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={gerarPDF}
            className="px-6 py-2.5 flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-on-action font-bold rounded-md text-sm transition-all w-full sm:w-auto order-1 sm:order-2"
          >
            <Download className="w-4 h-4" /> Baixar PDF
          </button>
        </div>

      </div>
    </Dialogo>
  );
}

export default ModalDetalhesEstoque;