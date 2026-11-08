import React, { useState } from "react";
import { Moon, Sun, Truck, RotateCcw, PackagePlus, Search } from "lucide-react";
import ModalDetalhesDashboard from "../components/modals/ModalDetalhesDashboard";
import DashboardCard from "../components/DashboardCard";
import PainelIndicadores from "../components/dashboard/PainelIndicadores";
import DashboardModals from "../components/dashboard/DashboardModals";
import { useDashboardResumo } from "../hooks/useDashboardResumo";
import { useDashboardCards } from "../hooks/useDashboardCards";
import { useDashboardModals } from "../hooks/useDashboardModals";
import { useDashboardDetalhes } from "../hooks/useDashboardDetalhes";

import { temPermissao } from "../utils/permissoes";

function Dashboard({ usuarioLogado }) {
  const dadosResumo = useDashboardResumo();
  const {
    epis,
    entradas,
    funcionarios,
    carregandoResumo,
    resumo,
    carregarResumo,
  } = dadosResumo;

  const {
    modalAberto,
    detalheCardAberto,
    abrirModal,
    fecharModal,
    abrirDetalhes,
    fecharDetalhes,
  } = useDashboardModals();

  const cards = useDashboardCards(resumo, carregandoResumo);

  const detalhe = useDashboardDetalhes(detalheCardAberto, dadosResumo);

  const nomeExibicao = usuarioLogado?.nome || "Usuário";

  const podeVisualizar = !usuarioLogado
    ? true
    : temPermissao(usuarioLogado, "visualizar_dashboard");

  // Indicadores (visão do gestor) só para admin; o colaborador vê só as pendências
  const mostrarAbas = usuarioLogado?.role === "admin";
  const [aba, setAba] = useState(() => {
    try {
      return localStorage.getItem("dashboard.aba") || "indicadores";
    } catch {
      return "indicadores";
    }
  });
  const escolherAba = (id) => {
    setAba(id);
    try {
      localStorage.setItem("dashboard.aba", id);
    } catch {}
  };

  // o tema salvo já é aplicado no <head> do index.html, antes do React montar
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    const escuro = !isDark;
    document.documentElement.classList.toggle("dark", escuro);
    try { localStorage.setItem("theme", escuro ? "dark" : "light"); } catch {}
    setIsDark(escuro);
  };

  const aoSalvar = async () => {
    await carregarResumo();
    fecharModal();
  };

  if (!podeVisualizar) {
    return (
      <div className="flex items-center justify-center p-8 bg-surface rounded-md border border-line ">
        <p className="text-ink-2 font-semibold text-sm">
          Você não tem permissão para visualizar o dashboard.
        </p>
      </div>
    );
  }

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const pendencias = cards.filter((c) => c.grupo === "pendencia");
  const totalPendencias = carregandoResumo ? 0 : pendencias.filter((c) => Number(c.valor) > 0).length;
  const indicadores = cards.filter((c) => c.grupo === "indicador");
  const resumoLinhas = [
    ["EPIs cadastrados", epis.length],
    ["Entradas registradas", entradas.length],
    ["Devoluções hoje", resumo.devolucoesHoje],
  ];
  const botao = "inline-flex items-center gap-2 h-10 px-4 rounded-md text-sm font-semibold transition-colors";

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Olá, {nomeExibicao}</h1>
            <p className="mt-1 text-sm text-ink-3 first-letter:uppercase">{hoje}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => abrirModal("entrega")} className={`${botao} bg-action text-on-action hover:bg-action-hover`}>
              <Truck className="w-4 h-4" /> Nova entrega
            </button>
            <button type="button" onClick={() => abrirModal("baixa")} className={`${botao} border border-line bg-surface text-ink hover:border-line-strong`}>
              <RotateCcw className="w-4 h-4" /> Devolução
            </button>
            <button type="button" onClick={() => abrirModal("entrada")} className={`${botao} border border-line bg-surface text-ink hover:border-line-strong`}>
              <PackagePlus className="w-4 h-4" /> Entrada
            </button>
            <button type="button" onClick={() => abrirModal("busca")} className={`${botao} border border-line bg-surface text-ink hover:border-line-strong`}>
              <Search className="w-4 h-4" /> Consultar estoque
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-line bg-surface text-ink-2 hover:text-ink hover:border-line-strong transition-colors"
              title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
              aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {mostrarAbas && (
          <div role="tablist" aria-label="Visão do dashboard" className="flex gap-1 border-b border-line -mt-2">
            {[
              ["indicadores", "Indicadores"],
              ["pendencias", "Pendências"],
            ].map(([id, rotulo]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`aba-${id}`}
                aria-selected={aba === id}
                aria-controls={`painel-${id}`}
                onClick={() => escolherAba(id)}
                className={`h-11 px-4 -mb-px border-b-2 text-sm transition-colors ${
                  aba === id ? "border-ink text-ink font-semibold" : "border-transparent text-ink-2 hover:text-ink hover:border-line-strong"
                }`}
              >
                {rotulo}
                {id === "pendencias" && totalPendencias > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-sm bg-sunken border border-line font-mono text-xs text-ink-2">
                    {totalPendencias}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {mostrarAbas && aba === "indicadores" ? (
          <div role="tabpanel" id="painel-indicadores" aria-labelledby="aba-indicadores">
            <PainelIndicadores dados={dadosResumo} />
          </div>
        ) : (
        <div role={mostrarAbas ? "tabpanel" : undefined} id="painel-pendencias" aria-labelledby={mostrarAbas ? "aba-pendencias" : undefined} className="flex flex-col gap-8">
        <section aria-labelledby="titulo-pendencias">
          <h2 id="titulo-pendencias" className="mb-3 text-base font-semibold text-ink">Pendências</h2>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {pendencias.map((card) => (
              <DashboardCard key={card.id} card={card} onClick={() => abrirDetalhes(card.id)} />
            ))}
          </div>
        </section>

        <section aria-labelledby="titulo-estoque">
          <h2 id="titulo-estoque" className="mb-3 text-base font-semibold text-ink">Estoque</h2>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {indicadores.map((card) => (
              <DashboardCard key={card.id} card={card} onClick={() => abrirDetalhes(card.id)} />
            ))}
            <dl className="bg-surface border border-line rounded-md divide-y divide-line text-sm">
              {resumoLinhas.map(([rotulo, valor]) => (
                <div key={rotulo} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt className="text-ink-2">{rotulo}</dt>
                  <dd className="font-mono font-medium text-ink tabular-nums">{carregandoResumo ? "--" : valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        </div>
        )}
      </div>

      <ModalDetalhesDashboard
        aberto={!!detalheCardAberto}
        titulo={detalhe.titulo}
        subtitulo={detalhe.subtitulo}
        icon={detalhe.icon}
        dados={detalhe.dados}
        colunas={detalhe.colunas}
        subColunas={detalhe.subColunas}
        onClose={fecharDetalhes}
      />

      <DashboardModals
        modalAberto={modalAberto}
        fecharModal={fecharModal}
        aoSalvar={aoSalvar}
        epis={epis}
        funcionarios={funcionarios}
      />
    </>
  );
}

export default Dashboard;