// Peças comuns dos PDFs gerados no navegador, no mesmo visual das fichas que a API gera.
// O jspdf (~400 kB) só carrega quando alguém pede um PDF.

const MARGEM = 14;
const CINZA = [105, 112, 120];
const FUNDO = [238, 240, 243];
const TEXTO = 25;

export async function novoPdf(titulo) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF();
  doc.setProperties({ title: titulo });
  return { doc, autoTable };
}

const vazio = (v) => v === undefined || v === null || String(v).trim() === "" || v === "-" || v === "--";
export const valorOuTraco = (v) => (vazio(v) ? "—" : String(v));

export function formatarCnpj(cnpj) {
  const d = String(cnpj ?? "").replace(/\D/g, "");
  return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : cnpj;
}

// Título e número à direita, subtítulo e filete. Devolve o y onde o conteúdo começa.
export function cabecalho(doc, { titulo, subtitulo, numero }) {
  const largura = doc.internal.pageSize.getWidth();
  doc.setTextColor(TEXTO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(titulo, MARGEM, 20);
  if (numero) {
    doc.setFontSize(11);
    doc.text(numero, largura - MARGEM, 20, { align: "right" });
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...CINZA);
  doc.text(subtitulo, MARGEM, 26);
  doc.setDrawColor(TEXTO);
  doc.setLineWidth(0.4);
  doc.line(MARGEM, 30, largura - MARGEM, 30);
  return 36;
}

// Seção com faixa cinza e campos em pares (rótulo | valor | rótulo | valor).
// Campo com { largo: true } ocupa a linha inteira. Devolve o y depois da seção.
export function secao(doc, autoTable, y, titulo, campos) {
  const linhas = [];
  let pendente = null;
  const celula = (c) => [c.rotulo, valorOuTraco(c.valor)];
  for (const campo of campos) {
    if (campo.largo) {
      if (pendente) linhas.push([...celula(pendente), "", ""]);
      pendente = null;
      linhas.push([campo.rotulo, { content: valorOuTraco(campo.valor), colSpan: 3 }]);
    } else if (pendente) {
      linhas.push([...celula(pendente), ...celula(campo)]);
      pendente = null;
    } else {
      pendente = campo;
    }
  }
  if (pendente) linhas.push([...celula(pendente), "", ""]);

  // larguras fixas (A4: 182mm úteis) para os rótulos ficarem alinhados de uma seção para a outra
  const rotulo = { textColor: CINZA, fontSize: 8, cellWidth: 32 };
  const valor = { cellWidth: 59 };
  autoTable(doc, {
    startY: y,
    head: [[{ content: titulo.toUpperCase(), colSpan: 4 }]],
    body: linhas,
    theme: "plain",
    margin: { left: MARGEM, right: MARGEM },
    headStyles: { fillColor: FUNDO, textColor: TEXTO, fontSize: 8, fontStyle: "bold", cellPadding: 2 },
    styles: { fontSize: 9.5, textColor: TEXTO, cellPadding: { top: 2, bottom: 2, left: 2, right: 2 } },
    columnStyles: { 0: rotulo, 1: valor, 2: rotulo, 3: valor },
  });
  return doc.lastAutoTable.finalY + 4;
}

// Filete, "gerado em/por" e número da página no pé de todas as páginas.
export function rodape(doc, geradoPor) {
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const quando = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const texto = `Gerado em ${quando}${geradoPor ? ` por ${geradoPor}` : ""} · SGEPI`;
  const total = doc.getNumberOfPages();

  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(185, 190, 196);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, altura - 14, largura - MARGEM, altura - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...CINZA);
    doc.text(texto, MARGEM, altura - 9);
    doc.text(`Página ${p} de ${total}`, largura - MARGEM, altura - 9, { align: "right" });
  }
}
