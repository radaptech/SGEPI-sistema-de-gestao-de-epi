import { toast } from "react-toastify";
import { api } from "../services/api";

// Baixa a ficha de EPI da entrega. Erro do servidor: o api.js já mostra o toast e o erro sobe para quem chamou.
export const baixarFichaPDF = async (matricula, idEntrega) => {
  if (!matricula || matricula === "-") {
    toast.warning("Matrícula não encontrada para este funcionário.");
    return false;
  }

  const pdf = await api.get(`/gerencial/${matricula}/ficha-pdf/${idEntrega}`); // Blob

  const url = window.URL.createObjectURL(pdf);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Ficha_EPI_${matricula}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
};
