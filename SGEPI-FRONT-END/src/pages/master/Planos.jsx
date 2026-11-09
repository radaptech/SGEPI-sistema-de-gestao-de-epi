import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import masterDashboardService from "../../services/masterDashboardService";
import ModalNovoPlano from "../../components/modals/master/ModalNovoPlano";
import ModalEditarPlano from "../../components/modals/master/ModalEditarPlano";

export const RECURSOS_PADRAO_PLANOS = [
  "Controle de funcionários",
  "Controle de EPIs",
  "Registro de entregas",
  "Relatórios",
  "Controle de fornecedores",
  "Assinatura digital",
  "Dashboard",
  "Auditoria de ações",
];

function Planos() {
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState(null);

  const carregarPlanos = async () => {
    try {
      setCarregando(true);
      setPlanos((await masterDashboardService.buscarPlanos()) ?? []);
    } catch (error) {
      toast.error("Erro ao carregar a lista de planos.");
      setPlanos([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPlanos();
  }, []);

  const abrirEditar = (plano) => {
    setPlanoSelecionado(plano);
    setModalEditarAberto(true);
  };

  const fecharModais = () => {
    setModalNovoAberto(false);
    setModalEditarAberto(false);
    setPlanoSelecionado(null);
  };

  const salvarEdicaoPlano = async (planoAtualizado) => {
    const promessa = masterDashboardService.editarPlano(planoAtualizado.id, planoAtualizado);

    toast.promise(promessa, {
      pending: "Atualizando o plano...",
      success: "Plano atualizado com sucesso!",
      error: "Erro ao atualizar o plano.",
    });

    try {
      await promessa;
      await carregarPlanos();
      fecharModais();
    } catch (error) {}
  };

  const salvarNovoPlano = async (novoPlano) => {
    const promessa = masterDashboardService.salvarPlano(novoPlano);

    toast.promise(promessa, {
      pending: "Criando novo plano...",
      success: "Plano criado com sucesso!",
      error: "Erro ao salvar o plano.",
    });

    try {
      await promessa;
      await carregarPlanos();
      fecharModais();
    } catch (error) {}
  };

  const alternarStatusPlano = async (planoSelecionado) => {
    const novoStatus = planoSelecionado.status === "Ativo" ? "Inativo" : "Ativo";

    const acaoTexto = novoStatus === "Ativo" ? "Ativando plano..." : "Desativando plano...";
    const sucessoTexto = `Plano ${novoStatus === "Ativo" ? "ativado" : "desativado"} com sucesso!`;

    const promessa = masterDashboardService.editarStatusPlano(planoSelecionado.id, novoStatus);

    toast.promise(promessa, {
      pending: acaoTexto,
      success: sucessoTexto,
      error: "Erro ao alterar o status do plano.",
    });

    try {
      await promessa;
      setPlanos((prev) =>
        prev.map((plano) =>
          plano.id === planoSelecionado.id ? { ...plano, status: novoStatus } : plano
        )
      );
    } catch (error) {}
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  };

  const exibirLimite = (valor) => {
    return valor === null ? "Ilimitado" : valor;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Ativo":
        return "text-ok bg-ok-soft border-ok-line";
      case "Inativo":
        return "text-erro bg-erro-soft border-erro-line";
      default:
        return "text-ink-2 bg-sunken border-line";
    }
  };

  return (
    <div className="text-ink pb-16">
      <div className="w-full">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-ink tracking-tight">
              Planos
            </h1>
            <p className="text-sm text-ink-2 mt-2 font-medium max-w-xl leading-relaxed">
              Gerencie os pacotes de assinatura, limites e recursos disponíveis para os clientes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalNovoAberto(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Novo plano
          </button>
        </header>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-ink mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm font-semibold text-ink-2 animate-pulse">Carregando planos...</p>
          </div>
        ) : planos.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-surface rounded-md border border-line ">
            <div className="w-16 h-16 rounded-md bg-sunken flex items-center justify-center mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-xl font-bold text-ink tracking-tight">Nenhum plano cadastrado</p>
            <p className="text-sm text-ink-2 mt-2 mb-8 max-w-md">
              Você ainda não possui planos de assinatura configurados. Crie o primeiro para que as empresas possam se cadastrar.
            </p>
            <button
              type="button"
              onClick={() => setModalNovoAberto(true)}
              className="px-6 py-3 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Criar primeiro plano
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className={`bg-surface rounded-md border p-8   transition-all flex flex-col relative overflow-hidden ${
                  plano.status === "Inativo"
                    ? "border-line opacity-80"
                    : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-ink truncate">
                      {plano.nome}
                    </h2>
                    <p className="text-sm text-ink-2 mt-1.5 font-medium line-clamp-2">
                      {plano.descricao}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-md border text-xs font-bold tracking-wide ${getStatusClass(plano.status)}`}
                  >
                    {plano.status}
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-xs font-bold text-ink-3 uppercase tracking-wide">
                    Mensalidade
                  </p>
                  <h3 className="text-4xl font-bold text-ink mt-2 tracking-tight">
                    {formatarMoeda(plano.mensalidade)}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-8">
                  <InfoPlano label="Usuários" valor={exibirLimite(plano.limite_usuarios)} />
                  <InfoPlano label="Funcionários" valor={exibirLimite(plano.limite_funcionarios)} />
                  <InfoPlano label="EPIs" valor={exibirLimite(plano.limite_epis)} />
                  <InfoPlano label="Unidades" valor={exibirLimite(plano.limite_unidades ?? null)} />
                </div>

                <div className="mt-8 flex-1">
                  <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-4">
                    Recursos Inclusos
                  </p>
                  <div className="space-y-3.5">
                    {RECURSOS_PADRAO_PLANOS.map((recurso) => (
                      <div key={recurso} className="flex items-center gap-3 text-sm text-ink font-medium">
                        <div className="w-5 h-5 rounded-full bg-sunken text-ink flex items-center justify-center shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        {recurso}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-10 pt-6 border-t border-line">
                  <button
                    type="button"
                    onClick={() => abrirEditar(plano)}
                    className="flex-1 px-4 py-3 rounded-md bg-sunken text-ink border border-line text-sm font-semibold hover:bg-sunken hover:border-line transition-colors"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => alternarStatusPlano(plano)}
                    className={`flex-1 px-4 py-3 rounded-md text-sm font-semibold transition-colors ${
                      plano.status === "Ativo"
                        ? "bg-erro-soft text-erro hover:bg-erro-soft"
                        : "bg-ok-soft text-ok hover:bg-ok-soft"
                    }`}
                  >
                    {plano.status === "Ativo" ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ModalNovoPlano
        aberto={modalNovoAberto}
        onFechar={fecharModais}
        onSalvar={salvarNovoPlano}
        recursosPadrao={RECURSOS_PADRAO_PLANOS}
      />

      {planoSelecionado && (
        <ModalEditarPlano
          aberto={modalEditarAberto}
          plano={planoSelecionado}
          onFechar={fecharModais}
          onSalvar={salvarEdicaoPlano}
          recursosPadrao={RECURSOS_PADRAO_PLANOS}
        />
      )}
    </div>
  );
}

function InfoPlano({ label, valor }) {
  return (
    <div className="min-w-0 p-3 rounded-md bg-surface border border-line flex flex-col items-center justify-center text-center">
      <p className="max-w-full truncate text-xs font-bold text-ink-3 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-bold text-ink mt-1">{valor}</p>
    </div>
  );
}

export default Planos;