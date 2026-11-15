import { api } from "../services/api";

// Peças comuns dos PDFs gerados no navegador, no mesmo visual das fichas que a API gera.
// O jspdf (~400 kB) só carrega quando alguém pede um PDF.

const MARGEM = 14;
const CINZA = [105, 112, 120];
const FUNDO = [238, 240, 243];
const TEXTO = 25;

const paraDataUrl = (blob) =>
  new Promise((ok, erro) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(leitor.result);
    leitor.onerror = erro;
    leitor.readAsDataURL(blob);
  });

// Símbolo da RadapTech para o rodapé (só o "D" azul: o texto da logo é branco e some no papel).
// Sem conseguir baixar, o PDF sai sem ele.
let simbolo;
async function carregarSimbolo() {
  try {
    return await paraDataUrl(await (await fetch(`${import.meta.env.BASE_URL}radaptech-simbolo.png`)).blob());
  } catch {
    return null;
  }
}

// Logo da empresa para o cabeçalho; a API responde 204 quando não tem. Lida a cada PDF,
// porque o admin pode ter trocado a logo nesse meio-tempo.
async function carregarLogoEmpresa() {
  try {
    const blob = await api.get("/empresa/logo");
    return blob instanceof Blob ? await paraDataUrl(blob) : null;
  } catch {
    return null;
  }
}

// logo: a da empresa, para passar ao cabecalho (null = sem logo).
export async function novoPdf(titulo) {
  const [{ default: jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
    carregarLogoEmpresa(),
  ]);
  simbolo ??= await carregarSimbolo();
  const doc = new jsPDF();
  doc.setProperties({ title: titulo });
  return { doc, autoTable, logo };
}

const vazio = (v) => v === undefined || v === null || String(v).trim() === "" || v === "-" || v === "--";
export const valorOuTraco = (v) => (vazio(v) ? "—" : String(v));

export function formatarCnpj(cnpj) {
  const d = String(cnpj ?? "").replace(/\D/g, "");
  return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : cnpj;
}

// Logo da empresa (se tiver), título, número à direita, subtítulo e filete.
// Devolve o y onde o conteúdo começa.
export function cabecalho(doc, { titulo, subtitulo, numero, logo }) {
  const largura = doc.internal.pageSize.getWidth();
  let x = MARGEM;
  if (logo) {
    // cabe numa caixa de 36x14mm sem distorcer
    const { width, height } = doc.getImageProperties(logo);
    const escala = Math.min(36 / width, 14 / height);
    doc.addImage(logo, "PNG", MARGEM, 11, width * escala, height * escala);
    x += width * escala + 6;
  }
  doc.setTextColor(TEXTO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(titulo, x, 20);
  if (numero) {
    doc.setFontSize(11);
    doc.text(numero, largura - MARGEM, 20, { align: "right" });
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...CINZA);
  doc.text(subtitulo, x, 26);
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
  const texto = `Gerado em ${quando}${geradoPor ? ` por ${geradoPor}` : ""} · Emitido pelo SGEPI · RadapTech`;
  const recuo = simbolo ? 7 : 0;
  const total = doc.getNumberOfPages();

  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(185, 190, 196);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, altura - 14, largura - MARGEM, altura - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...CINZA);
    if (simbolo) doc.addImage(simbolo, "PNG", MARGEM, altura - 11.6, 5, 4.25); // 160x136 px
    doc.text(texto, MARGEM + recuo, altura - 9);
    doc.text(`Página ${p} de ${total}`, largura - MARGEM, altura - 9, { align: "right" });
  }
}
