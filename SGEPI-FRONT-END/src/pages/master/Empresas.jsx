import React, { useMemo, useState, useEffect } from "react";
import ModalNovaEmpresa from "../../components/modals/master/ModalNovaEmpresa";
import ModalVerEmpresa from "../../components/modals/master/ModalVerEmpresa";
import ModalEditarEmpresa from "../../components/modals/master/ModalEditarEmpresa";
import masterDashboardService from "../../services/masterDashboardService";

function Empresas() {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  
  const [empresas, setEmpresas] = useState([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);

  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [modalNovaEmpresaAberto, setModalNovaEmpresaAberto] = useState(false);
  const [modalVerAberto, setModalVerAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setEmpresas((await masterDashboardService.buscarEmpresas()) ?? []);
        setPlanosDisponiveis((await masterDashboardService.buscarPlanos()) ?? []);
      } catch (error) {
        setEmpresas([]);
        setPlanosDisponiveis([]);
      }
    };

    carregarDados();
  }, []);

  const empresasFiltradas = useMemo(() => {
    if (!Array.isArray(empresas)) return [];

    return empresas.filter((empresa) => {
      const nome = empresa?.nome || "";
      const cnpj = empresa?.cnpj || "";
      const responsavel = empresa?.responsavel || "";
      const email = empresa?.email || "";
      const status = empresa?.status || "";

      const termo = busca.toLowerCase().trim();

      const combinaBusca =
        nome.toLowerCase().includes(termo) ||
        cnpj.toLowerCase().includes(termo) ||
        responsavel.toLowerCase().includes(termo) ||
        email.toLowerCase().includes(termo);

      const combinaStatus = statusFiltro === "Todos" || status === statusFiltro;

      return combinaBusca && combinaStatus;
    });
  }, [empresas, busca, statusFiltro]);

  const abrirModalVer = (empresa) => {
    setEmpresaSelecionada(empresa);
    setModalVerAberto(true);
  };

  const abrirModalEditar = (empresa) => {
    setEmpresaSelecionada(empresa);
    setModalEditarAberto(true);
  };

  const fecharModais = () => {
    setEmpresaSelecionada(null);
    setModalVerAberto(false);
    setModalEditarAberto(false);
  };

  const salvarNovaEmpresa = async (payloadApi) => {
    const planoSelecionado = planosDisponiveis.find((p) => String(p.id) === String(payloadApi.planoId));

    const empresaFormatada = {
      ...payloadApi,
      id: Date.now(),
      plano: planoSelecionado ? planoSelecionado.nome : "Básico",
    };

    setEmpresas((prev) => [empresaFormatada, ...prev]);
    setModalNovaEmpresaAberto(false);
  };

  const salvarEdicaoEmpresa = async (id, payloadApi, empresaAtualizadaParaTela) => {
    setEmpresas((prev) =>
      prev.map((empresa) => (empresa.id === id ? empresaAtualizadaParaTela : empresa))
    );
    fecharModais();
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  };

  const formatarData = (data) => {
    if (!data) return "-";
    const [ano, mes, dia] = String(data).split("-");
    if (!ano || !mes || !dia) return data;
    return `${dia}/${mes}/${ano}`;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Ativa":
        return "text-ok bg-ok-soft border-ok-line";
      case "Atrasada":
        return "text-atencao bg-atencao-soft border-atencao-line";
      case "Bloqueada":
        return "text-erro bg-erro-soft border-erro-line";
      case "Em teste":
        return "text-ink bg-sunken border-line";
      default:
        return "text-ink-2 bg-sunken border-line";
    }
  };

  return (
    <div className=" min-h-screen bg-sunken font-sans pb-12">
      <div className="w-full max-w-[1600px] mx-auto p-6 lg:p-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-ink tracking-tight">
              Empresas
            </h1>
            <p className="text-sm text-ink-2 mt-2 font-medium max-w-xl leading-relaxed">
              Gerencie todas as empresas clientes cadastradas na plataforma.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalNovaEmpresaAberto(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Nova empresa
          </button>
        </header>

        <div className="bg-surface rounded-md border border-line overflow-hidden flex flex-col">
          <div className="p-4 md:p-5 border-b border-line bg-surface flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por empresa, CNPJ, responsável ou e-mail..."
                className="w-full pl-11 pr-4 py-2.5 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink placeholder:text-ink-3"
              />
            </div>

            <div className="md:w-64 shrink-0">
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="w-full px-4 py-2.5 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink font-medium appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
              >
                <option value="Todos">Todos os status</option>
                <option value="Ativa">Ativa</option>
                <option value="Atrasada">Atrasada</option>
                <option value="Bloqueada">Bloqueada</option>
                <option value="Em teste">Em teste</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-sunken border-b border-line text-xs font-bold text-ink-2 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-4">Empresa</th>
                  <th className="px-6 py-4">Responsável</th>
                  <th className="px-6 py-4 text-center">Plano</th>
                  <th className="px-6 py-4 text-center">Equipe</th>
                  <th className="px-6 py-4 text-center">EPIs</th>
                  <th className="px-6 py-4 text-right">Mensalidade</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line">
                {empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-sunken transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-ink">{empresa.nome}</p>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-[12px] text-ink-2 font-medium">
                          {empresa.cnpj || "CNPJ não informado"}
                        </p>
                        <p className="text-[12px] text-ink-3">
                          {empresa.email || "E-mail não informado"}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-ink">
                        {empresa.responsavel || "-"}
                      </p>
                      <p className="text-[12px] text-ink-3 mt-1">
                        {empresa.telefone || "Telefone não informado"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-md bg-sunken border border-line text-ink-2 text-xs font-bold tracking-wide">
                        {empresa.planoNome || empresa.plano || "-"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center text-sm font-bold text-ink">
                      {empresa.funcionarios ?? 0}
                    </td>

                    <td className="px-6 py-4 text-center text-sm font-bold text-ink">
                      {empresa.epis ?? 0}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-ink">
                        {formatarMoeda(empresa.mensalidade)}
                      </p>
                      <p className="text-xs text-ink-3 mt-1 font-medium">
                        vence {formatarData(empresa.vencimento)}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-bold tracking-wide ${getStatusClass(empresa.status)}`}>
                        {empresa.status || "Indefinido"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1.5 transition-opacity">
                        <button
                          type="button"
                          onClick={() => abrirModalVer(empresa)}
                          className="px-3 py-1.5 rounded-md text-ink-2 hover:text-ink hover:bg-sunken text-xs font-semibold transition-colors"
                        >
                          Ver
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirModalEditar(empresa)}
                          className="px-3 py-1.5 rounded-md text-ink hover:text-ink hover:bg-sunken text-xs font-semibold transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {empresasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-sm text-ink-2 font-medium">Nenhuma empresa encontrada.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ModalNovaEmpresa
        aberto={modalNovaEmpresaAberto}
        planos={planosDisponiveis}
        onFechar={() => setModalNovaEmpresaAberto(false)}
        onSalvar={salvarNovaEmpresa}
      />

      <ModalVerEmpresa
        aberto={modalVerAberto}
        empresa={empresaSelecionada}
        onFechar={fecharModais}
      />

      <ModalEditarEmpresa
        aberto={modalEditarAberto}
        empresa={empresaSelecionada}
        planos={planosDisponiveis}
        onFechar={fecharModais}
        onSalvar={salvarEdicaoEmpresa}
      />
    </div>
  );
}

export default Empresas;