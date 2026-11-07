import React, { useEffect, useMemo, useState } from "react";
import masterDashboardService from "../../services/masterDashboardService";
import empresaService from "../../services/empresaService";
import ModalNovaEmpresa from "../../components/modals/master/ModalNovaEmpresa";
import ModalEditarEmpresa from "../../components/modals/master/ModalEditarEmpresa";
import { toast } from "react-toastify";

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
};

const formatarNumero = (valor) => {
  return new Intl.NumberFormat("pt-BR").format(Number(valor || 0));
};

const getStatusClass = (status) => {
  switch (status) {
    case "Ativa":
    case "Ativo":
      return "text-emerald-600 bg-emerald-50/50";
    case "Atrasada":
    case "Atrasado":
      return "text-amber-600 bg-amber-50/50";
    case "Bloqueada":
    case "Bloqueado":
      return "text-red-600 bg-red-50/50";
    case "Em teste":
      return "text-blue-600 bg-blue-50/50";
    default:
      return "text-zinc-600 bg-zinc-50";
  }
};

const getAlertaClass = (nivel) => {
  switch (nivel) {
    case "alto":
      return "text-red-700 bg-red-50/50 border-red-100";
    case "medio":
      return "text-amber-700 bg-amber-50/50 border-amber-100";
    default:
      return "text-blue-700 bg-blue-50/50 border-blue-100";
  }
};

function DashboardMaster({ usuarioLogado }) {
  const [resumo, setResumo] = useState({});
  const [empresasRecentes, setEmpresasRecentes] = useState([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);
  // ponytail: o back ainda não tem rota de alertas/atividades; os blocos mostram o estado vazio
  const alertas = [];
  const atividadesRecentes = [];

  const [carregando, setCarregando] = useState(false);
  const [modalNovaEmpresaAberto, setModalNovaEmpresaAberto] = useState(false);
  const [modalEditarEmpresaAberto, setModalEditarEmpresaAberto] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const empresasPorPagina = 3;

  const carregarDashboard = async () => {
    try {
      setCarregando(true);

      const resumoResposta = await masterDashboardService.buscarResumo();
      const empresasResposta = await masterDashboardService.buscarEmpresasRecentes();
      const planosResposta = await masterDashboardService.buscarPlanos();

      setResumo(resumoResposta);
      setEmpresasRecentes(empresasResposta ?? []);
      setPlanosDisponiveis(planosResposta ?? []);

      setPaginaAtual(1);
    } catch (error) {
      toast.error("Erro ao carregar os dados do painel.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, []);

  const salvarNovaEmpresa = async (novaEmpresa) => {
    try {
      await empresaService.criar(novaEmpresa);
      toast.success("Empresa cadastrada com sucesso!");
      await carregarDashboard();
      setModalNovaEmpresaAberto(false);
    } catch {
      // o api.js já mostrou o erro do servidor
    }
  };

  const salvarEdicaoEmpresa = async (id, payloadApi, empresaAtualizadaParaTela) => {
    const promessa = empresaService.atualizar
      ? empresaService.atualizar(id, payloadApi)
      : masterDashboardService.editarPlano(id, payloadApi);

    toast.promise(promessa, {
      pending: "Atualizando dados...",
      success: "Atualizado com sucesso!",
      error: "Erro ao atualizar.",
    });

    try {
      await promessa;
      setEmpresasRecentes((prev) =>
        prev.map((emp) => (emp.id === id ? empresaAtualizadaParaTela : emp))
      );
      fecharModais();
    } catch (error) {}
  };

  const abrirEditarEmpresa = (empresa) => {
    setEmpresaSelecionada(empresa);
    setModalEditarEmpresaAberto(true);
  };

  const fecharModais = () => {
    setModalNovaEmpresaAberto(false);
    setModalEditarEmpresaAberto(false);
    setEmpresaSelecionada(null);
  };

  const resumoSeguro = useMemo(() => {
    return {
      totalEmpresas: resumo?.total_empresas ?? 0,
      empresasAtivas: resumo?.empresas_ativas ?? 0,
      empresasBloqueadas: resumo?.empresas_bloqueadas ?? 0,
      empresasEmTeste: resumo?.empresas_em_teste ?? 0,
      totalFuncionarios: resumo?.total_funcionarios ?? 0,
      totalEpis: resumo?.total_epis ?? 0,
      totalEntregas: resumo?.total_entregas ?? 0,
      mensalidadesPagas: resumo?.mensalidadesPagas ?? 0,
      mensalidadesAtrasadas: resumo?.mensalidadesAtrasadas ?? 0,
      receitaMensal: resumo?.receita_mensal ?? 0,
    };
  }, [resumo]);

  const percentualEmpresasAtivas = useMemo(() => {
    if (!resumoSeguro.totalEmpresas) return 0;
    return Math.round((resumoSeguro.empresasAtivas / resumoSeguro.totalEmpresas) * 100);
  }, [resumoSeguro]);

  const percentualInadimplencia = useMemo(() => {
    const total = resumoSeguro.mensalidadesPagas + resumoSeguro.mensalidadesAtrasadas;
    if (!total) return 0;
    return Math.round((resumoSeguro.mensalidadesAtrasadas / total) * 100);
  }, [resumoSeguro]);

  const indiceUltimaEmpresa = paginaAtual * empresasPorPagina;
  const indicePrimeiraEmpresa = indiceUltimaEmpresa - empresasPorPagina;
  const empresasPaginadas = empresasRecentes.slice(indicePrimeiraEmpresa, indiceUltimaEmpresa);
  const totalPaginas = Math.ceil(empresasRecentes.length / empresasPorPagina);

  const irParaPaginaAnterior = () => {
    if (paginaAtual > 1) setPaginaAtual(paginaAtual - 1);
  };

  const irParaProximaPagina = () => {
    if (paginaAtual < totalPaginas) setPaginaAtual(paginaAtual + 1);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 pb-16 font-sans animate-fade-in">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pt-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Gestão da Plataforma</h1>
            <p className="text-zinc-500 mt-2 text-sm max-w-lg leading-relaxed">
              Acompanhe empresas clientes, mensalidades e indicadores gerais de forma centralizada.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={carregarDashboard}
              disabled={carregando}
              className="px-5 py-2.5 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>
            <button
              type="button"
              onClick={() => setModalNovaEmpresaAberto(true)}
              className="px-5 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nova empresa
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <CardResumo
            titulo="Empresas"
            valor={formatarNumero(resumoSeguro.totalEmpresas)}
            descricao={`${resumoSeguro.empresasAtivas} ativas no sistema`}
            detalhe={`${percentualEmpresasAtivas}% ativas`}
          />
          <CardResumo
            titulo="Funcionários"
            valor={formatarNumero(resumoSeguro.totalFuncionarios)}
            descricao="Somatório entre clientes"
            detalhe="Base operacional"
          />
          <CardResumo
            titulo="EPIs Cadastrados"
            valor={formatarNumero(resumoSeguro.totalEpis)}
            descricao={`${formatarNumero(resumoSeguro.totalEntregas)} entregas`}
            detalhe="Controle de estoque"
          />
          <CardResumo
            titulo="Receita Mensal"
            valor={formatarMoeda(resumoSeguro.receitaMensal)}
            descricao="Previsão de mensalidades"
            detalhe={`${percentualInadimplencia}% em atraso`}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm">
            <TituloSecao titulo="Status das empresas" />
            <div className="space-y-7 mt-8">
              <LinhaStatus label="Ativas" valor={resumoSeguro.empresasAtivas} total={resumoSeguro.totalEmpresas} cor="bg-emerald-500" />
              <LinhaStatus label="Bloqueadas" valor={resumoSeguro.empresasBloqueadas} total={resumoSeguro.totalEmpresas} cor="bg-red-500" />
              <LinhaStatus label="Em teste" valor={resumoSeguro.empresasEmTeste} total={resumoSeguro.totalEmpresas} cor="bg-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm flex flex-col">
            <TituloSecao titulo="Domínios dos clientes" />
            <div className="space-y-3 mt-8 overflow-y-auto max-h-[220px] pr-2 flex-1">
              {empresasRecentes.length === 0 ? (
                <MensagemVazia texto="Nenhum domínio." />
              ) : (
                empresasRecentes.map((empresa, idx) => {
                  const sub = empresa.subdominio || empresa.nome?.toLowerCase().replace(/\s+/g, '') || `cliente${idx}`;
                  const urlCompleta = `https://${sub}.radaptech.com.br`;

                  return (
                    <div key={empresa.id || idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-colors group">
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-zinc-900 truncate">{empresa.nome}</p>
                        <a href={urlCompleta} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors truncate block mt-0.5">
                          {sub}.radaptech.com.br
                        </a>
                      </div>
                      <a href={urlCompleta} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 group-hover:text-zinc-900 group-hover:bg-zinc-100 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm">
            <TituloSecao titulo="Alertas importantes" />
            <div className="space-y-3 mt-8">
              {alertas.length === 0 ? (
                <MensagemVazia texto="Nenhum alerta." />
              ) : (
                alertas.map((alerta) => (
                  <div key={alerta.id} className={`p-4 rounded-2xl border ${getAlertaClass(alerta.nivel)}`}>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-80 mb-1">{alerta.tipo}</p>
                    <p className="text-sm font-medium">{alerta.mensagem}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
              <TituloSecao titulo="Empresas recentes" />
              <button type="button" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                Ver todas
              </button>
            </div>

            <div className="flex-1">
              {empresasRecentes.length === 0 ? (
                <div className="p-8"><MensagemVazia texto="Nenhuma empresa." /></div>
              ) : (
                empresasPaginadas.map((empresa) => (
                  <EmpresaRecenteCard
                    key={empresa.id}
                    empresa={empresa}
                    formatarNumero={formatarNumero}
                    formatarMoeda={formatarMoeda}
                    getStatusClass={getStatusClass}
                    onEditar={abrirEditarEmpresa}
                  />
                ))
              )}
            </div>

            {totalPaginas > 1 && (
              <div className="p-6 border-t border-zinc-50 flex items-center justify-between">
                <button onClick={irParaPaginaAnterior} disabled={paginaAtual === 1} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-30">
                  Anterior
                </button>
                <span className="text-xs text-zinc-400 font-medium">
                  {paginaAtual} de {totalPaginas}
                </span>
                <button onClick={irParaProximaPagina} disabled={paginaAtual === totalPaginas} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-30">
                  Próxima
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm">
            <TituloSecao titulo="Atividades recentes" />
            <div className="space-y-6 mt-8">
              {atividadesRecentes.length === 0 ? (
                <MensagemVazia texto="Nenhuma atividade." />
              ) : (
                atividadesRecentes.map((atividade, index) => (
                  <div key={atividade.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    {index !== atividadesRecentes.length - 1 && (
                      <div className="absolute left-[2.5px] top-4 w-[1px] h-full bg-zinc-100" />
                    )}
                    <p className="text-sm font-medium text-zinc-900">{atividade.empresa}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">{atividade.acao}</p>
                    <p className="text-xs text-zinc-400 mt-1">{atividade.horario}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <ModalNovaEmpresa
        aberto={modalNovaEmpresaAberto}
        onFechar={fecharModais}
        onSalvar={salvarNovaEmpresa}
      />
      <ModalEditarEmpresa
        aberto={modalEditarEmpresaAberto}
        empresa={empresaSelecionada}
        planos={planosDisponiveis}
        onFechar={fecharModais}
        onSalvar={salvarEdicaoEmpresa}
      />
    </div>
  );
}

function EmpresaRecenteCard({ empresa, formatarNumero, formatarMoeda, getStatusClass, onEditar }) {
  return (
    <div className="p-6 md:p-8 hover:bg-zinc-50/50 transition-colors border-b border-zinc-50 last:border-0">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center font-medium text-lg shrink-0">
            {empresa.nome?.charAt(0) || "E"}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-medium text-zinc-900 truncate">{empresa.nome}</h3>
            <p className="text-sm text-zinc-500 mt-0.5 truncate">{empresa.responsavel || "Sem responsável"}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden sm:flex gap-6 text-sm text-zinc-600">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 mb-0.5">Plano</span>
              <span>{empresa.plano || "-"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 mb-0.5">Usuários</span>
              <span>{formatarNumero(empresa.funcionarios)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400 mb-0.5">Valor</span>
              <span>{formatarMoeda(empresa.mensalidade)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${getStatusClass(empresa.status)}`}>
              {empresa.status || "Indefinido"}
            </span>
            <button onClick={() => onEditar?.(empresa)} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TituloSecao({ titulo }) {
  return <h2 className="text-base font-semibold text-zinc-900 tracking-tight">{titulo}</h2>;
}

function CardResumo({ titulo, valor, descricao, detalhe }) {
  return (
    <div className="bg-white rounded-3xl border border-zinc-100 p-7 shadow-sm hover:shadow-md hover:shadow-zinc-100/50 transition-all">
      <p className="text-sm font-medium text-zinc-500">{titulo}</p>
      <h3 className="text-3xl font-semibold text-zinc-900 mt-3">{valor}</h3>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-50">
        <p className="text-xs text-zinc-400">{descricao}</p>
        <span className="text-[11px] font-medium text-zinc-500">{detalhe}</span>
      </div>
    </div>
  );
}

function LinhaStatus({ label, valor, total, cor }) {
  const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-zinc-600">{label}</p>
        <p className="text-sm font-medium text-zinc-900">{valor}</p>
      </div>
      <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div className={`h-full rounded-full ${cor} transition-all duration-1000`} style={{ width: `${porcentagem}%` }} />
      </div>
    </div>
  );
}

function MensagemVazia({ texto }) {
  return (
    <div className="py-6 text-center">
      <p className="text-sm text-zinc-400">{texto}</p>
    </div>
  );
}

export default DashboardMaster;