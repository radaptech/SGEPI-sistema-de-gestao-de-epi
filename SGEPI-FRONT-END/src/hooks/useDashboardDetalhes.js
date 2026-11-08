import { useMemo } from "react";
import { Package, Truck, AlertTriangle, CircleDollarSign, ShieldAlert, RefreshCw, UserX } from "lucide-react";
import { DIAS_ALERTA_CA, DIAS_ALERTA_TROCA } from "./useDashboardResumo";
import { formatarMoeda } from "../utils/dashboardFormatters";

const VAZIO = {
  titulo: "",
  subtitulo: "",
  icon: null,
  dados: [],
  colunas: [],
  subColunas: null,
};

export function useDashboardDetalhes(cardAberto, resumoDetalhado) {
  const {
    estoqueDetalhado,
    entregasTodasDetalhadas,
    alertasDetalhados,
    caVencendoDetalhado,
    trocasDetalhadas,
    faltasKitDetalhadas,
    valorEstoqueDetalhado,
  } = resumoDetalhado;

  return useMemo(() => {
    if (cardAberto === "estoque") {
      return {
        titulo: "Itens em estoque",
        subtitulo: "Visualização do estoque atual por item e tamanho.",
        icon: <Package className="w-6 h-6" strokeWidth={2.5} />,
        dados: estoqueDetalhado,
        subColunas: null,
        colunas: [
          {
            key: "item",
            label: "Item",
            render: (item) => (
              <div className="font-semibold text-ink ">{item.item}</div>
            ),
          },
          {
            key: "tamanho",
            label: "Tamanho",
            render: (item) => (
              <span className="inline-flex px-2 py-1 rounded-md bg-sunken text-ink text-xs font-bold border border-line ">
                {item.tamanho}
              </span>
            ),
          },
          {
            key: "quantidade",
            label: "Total em Estoque",
            render: (item) => (
              <span className="font-bold text-ink ">{item.quantidade}</span>
            ),
          },
        ],
      };
    }

    if (cardAberto === "entregas") {
      const agrupadas = {};

      (entregasTodasDetalhadas || []).forEach((item) => {
        const chave = item.id ? item.id.split("-")[0] : `${item.data}-${item.matricula}`;

        if (!agrupadas[chave]) {
          agrupadas[chave] = {
            id: chave,
            data: item.data,
            funcionario: item.funcionario,
            matricula: item.matricula,
            totalVolumes: 0,
            itens: [],
          };
        }

        agrupadas[chave].itens.push(item);
        agrupadas[chave].totalVolumes += Number(item.quantidade || 1);
      });

      return {
        titulo: "Histórico de Entregas",
        subtitulo: "Clique na linha da entrega para visualizar os itens detalhados.",
        icon: <Truck className="w-6 h-6" strokeWidth={2.5} />,
        dados: Object.values(agrupadas),
        colunas: [
          {
            key: "data",
            label: "Data",
            render: (item) => <span className="font-medium ">{item.data}</span>,
          },
          {
            key: "funcionario",
            label: "Para quem foi entregue",
            render: (item) => (
              <div>
                <div className="font-semibold text-ink ">
                  {item.funcionario}
                </div>
                <div className="text-xs text-ink-2 ">
                  Matrícula: {item.matricula}
                </div>
              </div>
            ),
          },
          {
            key: "totalVolumes",
            label: "Total de Volumes",
            render: (item) => (
              <span className="font-bold text-ink ">{item.totalVolumes}</span>
            ),
          },
        ],
        subColunas: [
          {
            key: "item",
            label: "Item entregue",
            render: (item) => (
              <div>
                <div className="font-medium ">{item.item}</div>
                <div className="text-xs text-ink-2 ">
                  Tamanho: {item.tamanho}
                </div>
              </div>
            ),
          },
          {
            key: "quantidade",
            label: "Quantidade",
            render: (item) => (
              <span className="font-bold ">{item.quantidade}</span>
            ),
          },
        ],
      };
    }

    if (cardAberto === "alertas") {
      return {
        titulo: "Lotes com Alerta de Estoque Baixo",
        subtitulo:
          "Lotes ativos que atingiram ou estão abaixo do nível de alerta mínimo configurado.",
        icon: <AlertTriangle className="w-6 h-6" strokeWidth={2.5} />,
        dados: alertasDetalhados,
        subColunas: null,
        colunas: [
          {
            key: "item",
            label: "EPI / Item",
            render: (item) => (
              <div className="font-semibold text-ink ">{item.item}</div>
            ),
          },
          {
            key: "lote",
            label: "Lote / CA",
            render: (item) => (
              <span className="inline-flex px-2.5 py-1 rounded-md bg-sunken text-ink text-xs font-mono font-bold border border-line ">
                {item.lote}
              </span>
            ),
          },
          {
            key: "tamanho",
            label: "Tam.",
            render: (item) => (
              <span className="inline-flex px-2 py-0.5 rounded-md bg-sunken text-ink-2 text-xs font-bold border border-line ">
                {item.tamanho}
              </span>
            ),
          },
          {
            key: "quantidade",
            label: "Qtd. Atual",
            render: (item) => (
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-atencao bg-atencao-soft px-3 py-0.5 rounded-md border border-atencao-line text-center w-fit text-sm">
                  {item.quantidade}
                </span>
                <span className="text-xs text-atencao font-bold uppercase tracking-wide">
                  Estoque Baixo
                </span>
              </div>
            ),
          },
          {
            key: "alertaMinimo",
            label: "Alerta Mín.",
            render: (item) => (
              <span className="font-semibold text-ink-3 text-sm">
                {item.alertaMinimo} un.
              </span>
            ),
          },
        ],
      };
    }

    if (cardAberto === "ca") {
      return {
        titulo: "CA vencido ou vencendo",
        subtitulo: `EPIs com CA vencendo nos próximos ${DIAS_ALERTA_CA} dias, vencido ou cancelado/suspenso no MTE. Os vencidos e os cancelados/suspensos não podem ser entregues.`,
        icon: <ShieldAlert className="w-6 h-6" strokeWidth={2.5} />,
        dados: caVencendoDetalhado,
        subColunas: null,
        colunas: [
          {
            key: "item",
            label: "EPI",
            render: (item) => (
              <div className="font-semibold text-ink ">{item.item}</div>
            ),
          },
          {
            key: "ca",
            label: "CA",
            render: (item) => (
              <span className="inline-flex px-2.5 py-1 rounded-md bg-sunken text-ink text-xs font-mono font-bold border border-line ">
                {item.ca}
              </span>
            ),
          },
          {
            key: "validade",
            label: "Validade",
            render: (item) => (
              <span className="font-semibold text-ink text-sm">{item.validade}</span>
            ),
          },
          {
            key: "dias",
            label: "Situação",
            render: (item) =>
              item.bloqueadoMte || item.dias < 0 ? (
                <span className="font-bold text-erro bg-erro-soft px-3 py-0.5 rounded-md border border-erro-line text-xs uppercase">
                  {item.bloqueadoMte ? `${item.bloqueadoMte} no MTE` : "Vencido"}
                </span>
              ) : (
                <span className="font-bold text-atencao bg-atencao-soft px-3 py-0.5 rounded-md border border-atencao-line text-xs">
                  {item.dias === 0 ? "Vence hoje" : `Vence em ${item.dias} dia${item.dias > 1 ? "s" : ""}`}
                </span>
              ),
          },
        ],
      };
    }

    if (cardAberto === "trocas") {
      return {
        titulo: "Trocas periódicas pendentes",
        subtitulo: `EPIs em posse dos funcionários com vida útil vencida ou vencendo nos próximos ${DIAS_ALERTA_TROCA} dias.`,
        icon: <RefreshCw className="w-6 h-6" strokeWidth={2.5} />,
        dados: trocasDetalhadas,
        subColunas: null,
        colunas: [
          {
            key: "funcionario",
            label: "Funcionário",
            render: (item) => (
              <div>
                <div className="font-semibold text-ink ">{item.funcionario}</div>
                <div className="text-xs text-ink-3 ">Matrícula {item.matricula}</div>
              </div>
            ),
          },
          {
            key: "item",
            label: "EPI",
            render: (item) => (
              <div className="font-semibold text-ink ">{item.item}</div>
            ),
          },
          {
            key: "emPosse",
            label: "Em posse",
            render: (item) => (
              <span className="font-bold text-ink ">{item.emPosse}</span>
            ),
          },
          {
            key: "ultimaEntrega",
            label: "Última entrega",
            render: (item) => (
              <span className="font-semibold text-ink text-sm">{item.ultimaEntrega}</span>
            ),
          },
          {
            key: "dias",
            label: "Situação",
            render: (item) =>
              item.dias < 0 ? (
                <span className="font-bold text-erro bg-erro-soft px-3 py-0.5 rounded-md border border-erro-line text-xs">
                  Atrasada há {-item.dias} dia{item.dias < -1 ? "s" : ""}
                </span>
              ) : (
                <span className="font-bold text-atencao bg-atencao-soft px-3 py-0.5 rounded-md border border-atencao-line text-xs">
                  {item.dias === 0 ? "Trocar hoje" : `Trocar em ${item.dias} dia${item.dias > 1 ? "s" : ""}`}
                </span>
              ),
          },
        ],
      };
    }

    if (cardAberto === "faltasKit") {
      return {
        titulo: "Funcionários sem EPI do kit",
        subtitulo: "EPIs que o kit da função exige e o funcionário não tem em posse (entregue menos devolvido).",
        icon: <UserX className="w-6 h-6" strokeWidth={2.5} />,
        dados: faltasKitDetalhadas,
        subColunas: null,
        colunas: [
          {
            key: "funcionario",
            label: "Funcionário",
            render: (item) => (
              <div>
                <div className="font-semibold text-ink ">{item.funcionario}</div>
                <div className="text-xs text-ink-3 ">Matrícula {item.matricula} · {item.funcao}</div>
              </div>
            ),
          },
          {
            key: "item",
            label: "EPI",
            render: (item) => (
              <div className="font-semibold text-ink ">{item.item}</div>
            ),
          },
          {
            key: "emPosse",
            label: "Em posse / exigido",
            render: (item) => (
              <span className="font-bold text-erro bg-erro-soft px-3 py-0.5 rounded-md border border-erro-line text-xs">
                {item.emPosse} de {item.exigido}
              </span>
            ),
          },
        ],
      };
    }

    if (cardAberto === "valor") {
      return {
        titulo: "Valor em estoque",
        subtitulo: "Valor total do estoque atual por item e tamanho.",
        icon: <CircleDollarSign className="w-6 h-6" strokeWidth={2.5} />,
        dados: valorEstoqueDetalhado,
        subColunas: null,
        colunas: [
          {
            key: "item",
            label: "Item",
            render: (item) => (
              <div className="font-semibold text-ink ">{item.item}</div>
            ),
          },
          {
            key: "tamanho",
            label: "Tamanho",
            render: (item) => (
              <span className="inline-flex px-2 py-1 rounded-md bg-ok-soft text-ok text-xs font-bold border border-ok-line ">
                {item.tamanho}
              </span>
            ),
          },
          {
            key: "quantidade",
            label: "Quantidade",
            render: (item) => (
              <span className="font-bold ">{item.quantidade}</span>
            ),
          },
          {
            key: "valorTotal",
            label: "Valor",
            render: (item) => (
              <span className="font-bold text-ok ">
                {formatarMoeda(item.valorTotal)}
              </span>
            ),
          },
        ],
      };
    }

    return VAZIO;
  }, [
    cardAberto,
    estoqueDetalhado,
    entregasTodasDetalhadas,
    alertasDetalhados,
    caVencendoDetalhado,
    trocasDetalhadas,
    faltasKitDetalhadas,
    valorEstoqueDetalhado,
  ]);
}
