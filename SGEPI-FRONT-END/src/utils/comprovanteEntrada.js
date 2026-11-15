import formatarData from "./DatasFormater";
import { formatarMoedaEntrada, totalEntrada } from "./entradaHelpers";

// PDF de comprovante de uma entrada. O jspdf (~400 kB) só carrega quando alguém pede o comprovante.
export async function baixarComprovanteEntrada(entrada) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(22, 101, 52);
  doc.text("Comprovante de Entrada de EPI", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Data do Registro: ${formatarData(entrada.data_entrada)}`, 14, 28);
  doc.text(`ID do Registro: #00${entrada.id}`, 14, 33);

  doc.setLineWidth(0.2);
  doc.line(14, 38, 196, 38);

  autoTable(doc, {
    startY: 45,
    head: [["Descrição do Campo", "Informação"]],
    body: [
      ["EPI", entrada.epiNome],
      ["Fabricante", entrada.epiFabricante || "-"],
      ["CA", entrada.epiCA || "-"],
      ["Tamanho", entrada.tamanhoNome || "-"],
      ["Lote", entrada.lote || "-"],
      ["Fornecedor", entrada.fornecedorNome],
      ["Nota Fiscal", `Nº ${entrada.nota_fiscal_numero || "-"} / Série ${entrada.nota_fiscal_serie || "-"}`],
      ["Quantidade Adicionada", `${entrada.quantidade} unidades`],
      ["Valor Unitário", formatarMoedaEntrada(entrada.valor_unitario)],
      ["Valor Total da Operação", formatarMoedaEntrada(totalEntrada(entrada))],
    ],
    theme: "grid",
    headStyles: { fillColor: [5, 150, 105] },
    styles: { cellPadding: 4, fontSize: 10 },
  });

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Responsável pelo Lançamento: ${entrada.usuario}`, 14, doc.lastAutoTable.finalY + 25);

  doc.save(`Entrada_EPI_${entrada.id}_${entrada.lote}.pdf`);
}
