import { toast } from "react-toastify";
import { api } from "../services/api";

function salvarArquivo(blob, nome) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nome);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Fichas geradas pela API. Erro do servidor: o api.js já mostra o toast e o erro sobe para quem chamou.
export const baixarFichaPDF = async (matricula, idEntrega) => {
  if (!matricula || matricula === "-") {
    toast.warning("Matrícula não encontrada para este funcionário.");
    return false;
  }
  salvarArquivo(await api.get(`/gerencial/${matricula}/ficha-pdf/${idEntrega}`), `Ficha_Entrega_EPI_${idEntrega}.pdf`);
  return true;
};

export const baixarFichaDevolucao = async (idDevolucao) => {
  salvarArquivo(await api.get(`/gerencial/devolucoes/${idDevolucao}/pdf`), `Ficha_Devolucao_EPI_${idDevolucao}.pdf`);
};
