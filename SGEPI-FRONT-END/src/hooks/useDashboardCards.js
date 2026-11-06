import { useMemo } from "react";
import { formatarMoeda } from "../utils/dashboardFormatters";
import { Package, Truck, AlertTriangle, CircleDollarSign, ShieldAlert, RefreshCw } from "lucide-react"; 
import { DIAS_ALERTA_CA, DIAS_ALERTA_TROCA } from "./useDashboardResumo";

export function useDashboardCards(
  resumo,
  carregandoResumo
) {
  return useMemo(
    () => [
      {
        id: "estoque",
        titulo: "Total em Estoque",
        valor: carregandoResumo
          ? "--"
          : resumo.totalItens,
        descricao:
          "Clique para ver item por tamanho",
        icone: <Package className="w-6 h-6" strokeWidth={2} />,
        iconeBox:
          "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        ring:
          "hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-slate-800/80",
        badge:
          "Estoque atual detalhado",
      },
      {
        id: "entregas",
        titulo: "Entregas no Mês",
        valor: carregandoResumo
          ? "--"
          : resumo.entregasMes,
        descricao:
          "Clique para pesquisar no histórico",
        icone: <Truck className="w-6 h-6" strokeWidth={2} />,
        iconeBox:
          "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        ring:
          "hover:border-purple-200 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-slate-800/80",
        badge: "Movimento do mês",
      },
      {
        id: "alertas",
        titulo: "Alertas",
        valor: carregandoResumo
          ? "--"
          : resumo.alertas,
        descricao:
          "Clique para ver os itens acabando",
        icone: <AlertTriangle className="w-6 h-6" strokeWidth={2} />,
        iconeBox:
          "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
        ring:
          "hover:border-orange-200 dark:hover:border-orange-700 hover:bg-orange-50/40 dark:hover:bg-slate-800/80",
        badge: "Estoque baixo",
      },
      {
        id: "ca",
        titulo: "CA Vencendo",
        valor: carregandoResumo
          ? "--"
          : resumo.caVencendo,
        descricao:
          `Vencidos ou vencendo em ${DIAS_ALERTA_CA} dias`,
        icone: <ShieldAlert className="w-6 h-6" strokeWidth={2} />,
        iconeBox:
          "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
        ring:
          "hover:border-red-200 dark:hover:border-red-700 hover:bg-red-50/40 dark:hover:bg-slate-800/80",
        badge: "Certificado de aprovação",
      },
      {
        id: "trocas",
        titulo: "Trocas Pendentes",
        valor: carregandoResumo
          ? "--"
          : resumo.trocas,
        descricao:
          `Vida útil vencida ou vencendo em ${DIAS_ALERTA_TROCA} dias`,
        icone: <RefreshCw className="w-6 h-6" strokeWidth={2} />,
        iconeBox:
          "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        ring:
          "hover:border-amber-200 dark:hover:border-amber-700 hover:bg-amber-50/40 dark:hover:bg-slate-800/80",
        badge: "Troca periódica",
      },
      {
        id: "valor",
        titulo: "Valor em Estoque",
        valor: carregandoResumo
          ? "--"
          : formatarMoeda(
              resumo.valorTotal
            ),
        descricao:
          "Clique para ver item, tamanho, quantidade e valor",
        icone: <CircleDollarSign className="w-6 h-6" strokeWidth={2} />,
        iconeBox:
          "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        ring:
          "hover:border-green-200 dark:hover:border-green-700 hover:bg-green-50/40 dark:hover:bg-slate-800/80",
        badge:
          "Financeiro do estoque",
      },
    ],
    [resumo, carregandoResumo]
  );
}