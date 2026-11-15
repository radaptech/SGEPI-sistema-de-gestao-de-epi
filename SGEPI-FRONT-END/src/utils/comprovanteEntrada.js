import { formatarMoedaEntrada, totalEntrada } from "./entradaHelpers";
import { cabecalho, formatarCnpj, novoPdf, rodape, secao } from "./pdfDocumento";

// PDF de comprovante de uma entrada (um item da nota). geradoPor: nome de quem baixou.
export async function baixarComprovanteEntrada(entrada, geradoPor) {
  const { doc, autoTable, logo } = await novoPdf("Comprovante de entrada de EPI");
  const nf = [entrada.nota_fiscal_numero, entrada.nota_fiscal_serie].filter(Boolean).join(" / série ");

  let y = cabecalho(doc, {
    logo,
    titulo: "COMPROVANTE DE ENTRADA DE EPI",
    subtitulo: "Registro de entrada de Equipamento de Proteção Individual no estoque",
    numero: `Nº ${String(entrada.id).padStart(6, "0")}`,
  });
  y = secao(doc, autoTable, y, "Nota fiscal", [
    { rotulo: "Número / série", valor: nf },
    { rotulo: "Data de emissão", valor: entrada.data_entrada },
    { rotulo: "Fornecedor", valor: entrada.fornecedorNome },
    { rotulo: "CNPJ", valor: formatarCnpj(entrada.fornecedorCnpj) },
  ]);
  y = secao(doc, autoTable, y, "EPI", [
    { rotulo: "Nome", valor: entrada.epiNome, largo: true },
    { rotulo: "CA", valor: entrada.epiCA },
    { rotulo: "Tamanho", valor: entrada.tamanhoNome },
    { rotulo: "Fabricante", valor: entrada.epiFabricante, largo: true },
  ]);
  y = secao(doc, autoTable, y, "Lote", [
    { rotulo: "Lote", valor: entrada.lote },
    { rotulo: "Quantidade recebida", valor: `${entrada.quantidade} un.` },
    { rotulo: "Fabricação", valor: entrada.data_fabricacao },
    { rotulo: "Validade", valor: entrada.data_validade },
    { rotulo: "Saldo atual do lote", valor: entrada.quantidade_atual == null ? null : `${entrada.quantidade_atual} un.` },
  ]);
  secao(doc, autoTable, y, "Valores", [
    { rotulo: "Valor unitário", valor: formatarMoedaEntrada(entrada.valor_unitario) },
    { rotulo: "Valor total", valor: formatarMoedaEntrada(totalEntrada(entrada)) },
    { rotulo: "Lançado por", valor: entrada.usuario, largo: true },
  ]);

  rodape(doc, geradoPor);
  doc.save(`Entrada_EPI_${entrada.id}.pdf`);
}
