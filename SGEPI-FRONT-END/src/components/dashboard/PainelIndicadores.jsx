import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import DashboardCard from "../DashboardCard";
import GraficoColunas from "./GraficoColunas";
import BarrasRanking from "./BarrasRanking";
import { listar } from "../../services/listas";
import { normalizarFuncionario } from "../../utils/funcionarios";
import { calcularIndicadores, indicadoresPorUnidade } from "../../utils/indicadores";
import { unidadeAtual } from "../../services/unidadeAtual";
import { formatarMoeda } from "../../utils/dashboardFormatters";

const PERIODOS = [3, 6, 12];

const moeda = (v, curto) =>
  curto && v >= 1000
    ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
    : curto
      ? `R$ ${Math.round(v).toLocaleString("pt-BR")}`
      : formatarMoeda(v);
const unidades = (v) => `${v.toLocaleString("pt-BR")} un.`;

function variacao(atual, anterior, rotuloAnterior) {
  if (!anterior) return atual ? `Sem registro em ${rotuloAnterior}` : `Nada em ${rotuloAnterior} também`;
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  if (pct === 0) return `Igual a ${rotuloAnterior}`;
  return `${pct > 0 ? "+" : ""}${pct}% vs. ${rotuloAnterior}`;
}

function Bloco({ titulo, subtitulo, acao, children, className = "" }) {
  return (
    <section className={`bg-surface border border-line rounded-md ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-line">
        <div>
          <h3 className="text-base font-semibold text-ink">{titulo}</h3>
          {subtitulo && <p className="mt-0.5 text-xs text-ink-3">{subtitulo}</p>}
        </div>
        {acao}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

function prazo(dias) {
  if (dias < 0) return { texto: `venceu há ${-dias} d`, estado: "erro" };
  if (dias === 0) return { texto: "vence hoje", estado: "erro" };
  return { texto: `em ${dias} d`, estado: dias <= 30 ? "atencao" : null };
}

const SELO = { erro: "bg-erro-soft text-erro border-erro-line", atencao: "bg-atencao-soft text-atencao border-atencao-line" };

export default function PainelIndicadores({ dados }) {
  const [meses, setMeses] = useState(() => {
    try {
      return Number(localStorage.getItem("dashboard.periodo")) || 12;
    } catch {
      return 12;
    }
  });
  const [departamentoPorFuncionario, setDepartamentoPorFuncionario] = useState({});

  useEffect(() => {
    listar("/funcionarios").then((lista) =>
      setDepartamentoPorFuncionario(
        Object.fromEntries(lista.map(normalizarFuncionario).map((f) => [f.id, f.departamentoNome]))
      )
    );
  }, []);

  const escolherPeriodo = (m) => {
    setMeses(m);
    try {
      localStorage.setItem("dashboard.periodo", String(m));
    } catch {}
  };

  const ind = useMemo(
    () =>
      calcularIndicadores({
        entregas: dados.entregas,
        itensEntregues: dados.itensEntregues,
        entradas: dados.entradas,
        epis: dados.epis,
        funcionarios: dados.funcionarios,
        faltasKit: dados.faltasKit,
        departamentoPorFuncionario,
        meses,
      }),
    [dados, departamentoPorFuncionario, meses]
  );

  // visão da rede: só em "Todas as unidades", com 2 ou mais (em uma loja, as listas já vêm só dela)
  const porUnidade = useMemo(
    () =>
      (dados.unidades ?? []).length >= 2 && !unidadeAtual()
        ? indicadoresPorUnidade({ ...dados, meses })
        : [],
    [dados, meses]
  );

  const carregando = dados.carregandoResumo;
  const base = ind.mesAnteriorAteHoje;
  const subiu = ind.mesAtual.custo > base.custo;
  const Seta = subiu ? ArrowUpRight : ArrowDownRight;

  const kpis = [
    {
      id: "custo",
      titulo: `Custo em EPI · ${ind.mesAtual.rotulo}`,
      valor: carregando ? "--" : moeda(ind.mesAtual.custo),
      descricao: variacao(ind.mesAtual.custo, base.custo, base.rotulo),
      grupo: "indicador",
    },
    {
      id: "entregas",
      titulo: `Entregas · ${ind.mesAtual.rotulo}`,
      valor: carregando ? "--" : ind.mesAtual.entregas,
      descricao: variacao(ind.mesAtual.entregas, base.entregas, base.rotulo),
      grupo: "indicador",
    },
    {
      id: "conformidade",
      titulo: "Kit completo",
      valor: carregando || ind.conformidade === null ? "--" : `${ind.conformidade}%`,
      descricao: `${ind.totalFuncionarios - ind.funcionariosComFalta} de ${ind.totalFuncionarios} funcionários com todo o EPI da função`,
      grupo: "indicador",
    },
    {
      id: "ca",
      titulo: "CAs a vencer em 90 dias",
      valor: carregando ? "--" : ind.caProximos.length,
      descricao: "Inclui vencidos, cancelados e suspensos no MTE",
      grupo: "pendencia",
      estado: ind.caProximos.some((c) => c.bloqueado || c.dias <= 30) ? "erro" : "atencao",
    },
  ];

  const seletorPeriodo = (
    <div role="group" aria-label="Período" className="inline-flex rounded-md border border-line p-0.5 bg-sunken">
      {PERIODOS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => escolherPeriodo(m)}
          aria-pressed={meses === m}
          className={`px-3 h-8 rounded text-xs font-semibold transition-colors ${
            meses === m ? "bg-surface text-ink border border-line" : "text-ink-2 hover:text-ink"
          }`}
        >
          {m} meses
        </button>
      ))}
    </div>
  );

  const proximos = [
    ...ind.caProximos.map((c) => {
      const p = c.bloqueado ? { texto: c.bloqueado.toLowerCase(), estado: "erro" } : prazo(c.dias);
      return {
        id: c.id,
        tipo: "CA",
        texto: c.item,
        codigo: c.ca ? `CA ${c.ca}` : null,
        texto2: p.texto,
        estado: p.estado,
        ordem: c.bloqueado ? -Infinity : c.dias,
      };
    }),
    ...ind.estoqueAcabando.map((e) => ({
      id: e.id,
      tipo: "Estoque",
      texto: e.item,
      codigo: `${e.saldo} un.`,
      texto2: e.dias <= 0 ? "acabou" : `acaba em ~${e.dias} d`,
      estado: e.dias <= 7 ? "erro" : "atencao",
      ordem: e.dias,
    })),
  ].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${carregando ? "opacity-60" : ""}`}>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((card) => (
          <DashboardCard key={card.id} card={card} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-3 max-w-xl">
          Custo estimado pelo preço médio de entrada de cada EPI.
          {ind.itensSemPreco > 0 && ` ${ind.itensSemPreco} item(ns) sem preço de entrada ficaram de fora.`}
        </p>
        {seletorPeriodo}
      </div>

      <Bloco
        titulo="Custo em EPI por mês"
        subtitulo={`Últimos ${meses} meses · o mês atual ainda está em andamento`}
        acao={
          !carregando && base.custo > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-2">
              <Seta className="w-3.5 h-3.5" aria-hidden="true" />
              {variacao(ind.mesAtual.custo, base.custo, base.rotulo)}
            </span>
          ) : null
        }
      >
        <GraficoColunas
          dados={ind.serie.map((m) => ({ chave: m.mes, rotulo: m.rotulo, valor: m.custo, parcial: m.parcial, ...m }))}
          formatar={moeda}
          rotuloSerie="Custo"
          detalhe={(d) => `${d.entregas} entrega(s) · ${d.itens} un.`}
        />
      </Bloco>

      {porUnidade.length > 0 && (
        <Bloco titulo="Por unidade" subtitulo={`Da que mais gastou para a que menos gastou · últimos ${meses} meses`}>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-ink-3 border-b border-line">
                  <th scope="col" className="py-2 pr-4 font-semibold">Unidade</th>
                  <th scope="col" className="py-2 pr-4 font-semibold text-right">Custo em EPI</th>
                  <th scope="col" className="py-2 pr-4 font-semibold text-right">Kit completo</th>
                  <th scope="col" className="py-2 font-semibold text-right">Estoque baixo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {porUnidade.map((u) => (
                  <tr key={u.id}>
                    <th scope="row" className="py-2.5 pr-4 font-medium text-ink text-left">{u.nome}</th>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-ink">{moeda(u.custo)}</td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-ink-2">
                      {u.conformidade === null ? "--" : `${u.conformidade}%`}
                      <span className="ml-1 text-xs text-ink-3">({u.funcionarios - u.comFalta}/{u.funcionarios})</span>
                    </td>
                    <td className="py-2.5 text-right">
                      {u.estoqueBaixo > 0 ? (
                        <span className={`px-2 py-0.5 rounded-sm border text-xs font-semibold ${SELO.atencao}`}>{u.estoqueBaixo} item(ns)</span>
                      ) : (
                        <span className="text-xs text-ink-3">nenhum</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bloco>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Bloco titulo="Custo por departamento" subtitulo={`Últimos ${meses} meses`}>
          <BarrasRanking linhas={ind.custoPorDepartamento} formatar={(v) => moeda(v, true)} vazio="Nenhuma entrega no período." />
        </Bloco>
        <Bloco titulo="EPIs mais entregues" subtitulo={`Unidades · últimos ${meses} meses`}>
          <BarrasRanking linhas={ind.episMaisEntregues} formatar={unidades} vazio="Nenhuma entrega no período." />
        </Bloco>
      </div>

      <Bloco titulo="O que vem pela frente" subtitulo="CA vencendo em até 90 dias e estoque que acaba em até 30 dias no ritmo dos últimos 90 dias">
        {proximos.length === 0 ? (
          <p className="py-6 text-sm text-ink-3 text-center">Nada previsto para os próximos 90 dias.</p>
        ) : (
          <ul className="divide-y divide-line -my-2">
            {proximos.slice(0, 12).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className="w-16 shrink-0 font-mono text-xs font-medium text-ink-3">{p.tipo}</span>
                <span className="flex-1 min-w-[10rem] text-sm text-ink">{p.texto}</span>
                {p.codigo && <span className="font-mono text-xs text-ink-2">{p.codigo}</span>}
                <span
                  className={`px-2 py-0.5 rounded-sm border text-xs font-semibold ${
                    p.estado ? SELO[p.estado] : "bg-sunken text-ink-2 border-line"
                  }`}
                >
                  {p.texto2}
                </span>
              </li>
            ))}
          </ul>
        )}
        {proximos.length > 12 && (
          <p className="mt-3 text-xs text-ink-3">Mostrando os 12 mais urgentes de {proximos.length}.</p>
        )}
      </Bloco>
    </div>
  );
}
