import { useMemo } from "react";
import { formatarMoeda } from "../utils/dashboardFormatters";
import { DIAS_ALERTA_CA, DIAS_ALERTA_TROCA } from "./useDashboardResumo";

// grupo "pendencia" ganha cor quando o valor passa de zero; "indicador" é sempre neutro
export function useDashboardCards(resumo, carregandoResumo) {
  return useMemo(() => {
    const v = (x) => (carregandoResumo ? "--" : x);
    return [
      { id: "faltasKit", grupo: "pendencia", estado: "erro", titulo: "Sem EPI do kit", valor: v(resumo.faltasKit), descricao: "Funcionários sem o EPI que a função exige" },
      { id: "ca", grupo: "pendencia", estado: "erro", titulo: "CA vencendo", valor: v(resumo.caVencendo), descricao: `Vencido, cancelado ou vencendo em ${DIAS_ALERTA_CA} dias` },
      { id: "trocas", grupo: "pendencia", estado: "atencao", titulo: "Trocas pendentes", valor: v(resumo.trocas), descricao: `Vida útil vencida ou vencendo em ${DIAS_ALERTA_TROCA} dias` },
      { id: "alertas", grupo: "pendencia", estado: "atencao", titulo: "Estoque baixo", valor: v(resumo.alertas), descricao: "Itens no alerta mínimo ou abaixo" },
      { id: "estoque", grupo: "indicador", titulo: "Itens em estoque", valor: v(resumo.totalItens), descricao: "Por item e tamanho" },
      { id: "entregas", grupo: "indicador", titulo: "Entregas no mês", valor: v(resumo.entregasMes), descricao: "Histórico de entregas" },
      { id: "valor", grupo: "indicador", titulo: "Valor em estoque", valor: v(formatarMoeda(resumo.valorTotal)), descricao: "Item, tamanho, quantidade e valor" },
    ];
  }, [resumo, carregandoResumo]);
}
