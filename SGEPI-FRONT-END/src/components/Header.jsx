import React, { useEffect, useRef, useState } from "react";
import SeletorUnidade from "./SeletorUnidade";

function Header({ paginaAtual, setPagina, onLogout, usuario }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [menuMaisAberto, setMenuMaisAberto] = useState(false);
  const menuMaisRef = useRef(null);

  const nomeUsuario = usuario?.nome || "Usuário";
  const isSuperAdmin = usuario?.role === "super_admin";
  const isAdminEmpresa = usuario?.role === "admin";
  const perfilNormalizado = String(usuario?.role ?? "").toUpperCase();

  useEffect(() => {
    function handleClickFora(event) {
      if (menuMaisRef.current && !menuMaisRef.current.contains(event.target)) {
        setMenuMaisAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  function Botao({ label, icone, nomePagina, isMobile = false }) {
    const ativo = paginaAtual === nomePagina;

    return (
      <button
        type="button"
        onClick={() => {
          setPagina(nomePagina);
          setMenuMaisAberto(false);
          if (isMobile) setMenuAberto(false);
        }}
        aria-current={ativo ? "page" : undefined}
        className={`
          shrink-0 flex items-center gap-2 text-sm transition-colors duration-150
          ${isMobile
            ? `w-full justify-start px-3 py-3 rounded-md ${ativo ? "bg-sunken text-ink font-semibold" : "text-ink-2 hover:bg-sunken hover:text-ink"}`
            : `h-14 px-3 border-b-2 -mb-px ${ativo ? "border-ink text-ink font-semibold" : "border-transparent text-ink-2 hover:text-ink hover:border-line-strong"}`
          }
        `}
      >
        <span className={`shrink-0 transition-colors ${isMobile ? "" : "hidden xl:inline"} ${ativo ? "text-ink " : "text-ink-3 "}`}>{icone}</span>
        <span>{label}</span>
      </button>
    );
  }

  const strokeW = 1.75;

  const IconDashboard = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );

  const IconEstoque = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const IconFuncionarios = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M17 20h5v-1a4 4 0 00-5-3.87M9 20H4v-1a4 4 0 015-3.87m8-6.13a4 4 0 11-8 0 4 4 0 018 0zm6 2a3 3 0 11-6 0 3 3 0 016 0zM6 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const IconDepartamentos = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
    </svg>
  );

  const IconFornecedores = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  const IconEntradas = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
    </svg>
  );

  const IconEntregas = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M5 13l4 4L19 7" />
    </svg>
  );

  const IconDevolucoes = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M4.582 9H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2M19.419 15H15" />
    </svg>
  );

  const IconAdmin = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M11.983 5.5a1.5 1.5 0 013.034 0l.18 1.271a1.5 1.5 0 001.19 1.25l1.26.252a1.5 1.5 0 01.597 2.69l-1.02.78a1.5 1.5 0 00-.5 1.683l.41 1.218a1.5 1.5 0 01-2.198 1.77l-1.116-.666a1.5 1.5 0 00-1.54 0l-1.116.666a1.5 1.5 0 01-2.198-1.77l.41-1.218a1.5 1.5 0 00-.5-1.683l-1.02-.78a1.5 1.5 0 01.597-2.69l1.26-.252a1.5 1.5 0 001.19-1.25l.18-1.271zM13.5 13a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );

  const IconEmpresa = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M3 21h18M6 21V5a2 2 0 012-2h8a2 2 0 012 2v16M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1" />
    </svg>
  );

  const IconFinanceiro = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-1m0 0c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const IconPlanos = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-4-2-3 2-3-2-4 2V6a2 2 0 012-2z" />
    </svg>
  );

  const IconUsuario = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeW} d="M5.121 17.804A9 9 0 1118.879 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const itensSuperAdmin = [
    { label: "Painel Master", nome: "DashboardMaster", principal: true, icon: IconDashboard },
    { label: "Empresas", nome: "Empresas", principal: true, icon: IconEmpresa },
    { label: "Mensalidades", nome: "Mensalidades", principal: true, icon: IconFinanceiro },
    { label: "Planos", nome: "Planos", principal: true, icon: IconPlanos },
    { label: "Usuários", nome: "UsuariosMaster", principal: true, icon: IconUsuario },
  ];

  const itensAdminEmpresa = [
    // operação do dia a dia na barra; cadastros de apoio no "Mais"
    { label: "Dashboard", nome: "Dashboard", principal: true, icon: IconDashboard },
    { label: "Entregas", nome: "Entregas", principal: true, icon: IconEntregas },
    { label: "Devoluções", nome: "Devoluções", principal: true, icon: IconDevolucoes },
    { label: "Estoque", nome: "Estoque", principal: true, icon: IconEstoque },
    { label: "Entradas", nome: "Entradas", principal: true, icon: IconEntradas },
    { label: "Funcionários", nome: "Funcionários", principal: true, icon: IconFuncionarios },
    { label: "Departamentos", nome: "Departamentos", icon: IconDepartamentos },
    { label: "Fornecedores", nome: "Fornecedores", icon: IconFornecedores },
    { label: "Administração", nome: "Administracao", icon: IconAdmin },
  ];

  const itensFuncionario = [
    { label: "Dashboard", nome: "Dashboard", principal: true, icon: IconDashboard },
    { label: "Entregas", nome: "Entregas", principal: true, icon: IconEntregas },
    { label: "Devoluções", nome: "Devoluções", principal: true, icon: IconDevolucoes },
  ];

  const irParaInicio = () => {
    setPagina(isSuperAdmin ? "DashboardMaster" : "Dashboard");
    setMenuAberto(false);
    setMenuMaisAberto(false);
  };

  const navItems = isSuperAdmin ? itensSuperAdmin : isAdminEmpresa ? itensAdminEmpresa : itensFuncionario;

  const menuPrincipal = navItems.filter((item) => item.principal);
  const menuSecundario = navItems.filter((item) => !item.principal);
  const paginaNoMenuSecundario = menuSecundario.some((item) => item.nome === paginaAtual);

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-2 lg:py-0">
        <div className="hidden lg:grid grid-cols-[auto_1fr_auto] items-center gap-4 xl:gap-8">
          {/* com 2+ unidades, o seletor de unidade toma o lugar do subtítulo: na barra não cabe mais nada */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={irParaInicio}
              title="Ir para o início"
              className="w-9 h-9 bg-action rounded flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5 text-on-action" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="sr-only">Ir para o início</span>
            </button>
            <div className="flex flex-col items-start">
              <button
                type="button"
                onClick={irParaInicio}
                className="text-lg font-bold tracking-tight text-ink leading-none hover:text-ink-2 transition-colors"
              >
                SGEPI
              </button>
              {isSuperAdmin ? (
                <span className="text-xs text-ink-3 mt-0.5">Painel Master</span>
              ) : (
                <SeletorUnidade compacto semUnidades={<span className="text-xs text-ink-3 mt-0.5">Gestão de Estoque</span>} />
              )}
            </div>
          </div>

          <div className="flex justify-center min-w-0">
            <nav className="flex items-center gap-1">
              {menuPrincipal.map((item) => (
                <Botao key={item.nome} label={item.label} nomePagina={item.nome} icone={item.icon} />
              ))}

              {menuSecundario.length > 0 && (
                <div className="relative" ref={menuMaisRef}>
                  <button
                    type="button"
                    onClick={() => setMenuMaisAberto((prev) => !prev)}
                    aria-expanded={menuMaisAberto}
                    className={`
                      shrink-0 flex items-center gap-1.5 h-14 px-3 border-b-2 -mb-px text-sm transition-colors duration-150
                      ${paginaNoMenuSecundario
                        ? "border-ink text-ink font-semibold"
                        : "border-transparent text-ink-2 hover:text-ink hover:border-line-strong"
                      }
                    `}
                  >
                    <span>Mais</span>
                    <svg className={`w-4 h-4 transition-transform duration-150 ${menuMaisAberto ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {menuMaisAberto && (
                    <div className="absolute top-full right-0 min-w-[220px] rounded-md border border-line bg-surface shadow-modal p-1">
                      <div className="flex flex-col gap-0.5">
                        {menuSecundario.map((item) => {
                          const ativo = paginaAtual === item.nome;
                          return (
                            <button
                              key={item.nome}
                              type="button"
                              onClick={() => {
                                setPagina(item.nome);
                                setMenuMaisAberto(false);
                              }}
                              className={`
                                w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm text-left transition-colors
                                ${ativo
                                  ? "bg-sunken text-ink font-semibold"
                                  : "text-ink-2 hover:bg-sunken hover:text-ink "
                                }
                              `}
                            >
                              <span className={ativo ? "text-ink " : "text-ink-3 "}>{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          <div className="flex items-center justify-end gap-5 shrink-0">
            <div className="hidden 2xl:flex flex-col items-end justify-center">
              <span className="text-sm text-ink">
                Olá, <b className="font-semibold text-ink">{nomeUsuario}</b>
              </span>
              <span className="font-mono text-xs text-ink-3 mt-0.5">
                {perfilNormalizado}
              </span>
            </div>
            
            <div className="w-px h-8 bg-line hidden 2xl:block"></div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 h-9 px-3 rounded-md border border-line text-sm text-ink-2 hover:text-erro hover:border-erro-line hover:bg-erro-soft transition-colors whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sair</span>
            </button>
          </div>
        </div>

        <div className="flex lg:hidden items-center justify-between">
          <button
            type="button"
            onClick={irParaInicio}
            title="Ir para o início"
            className="flex items-center gap-3 shrink-0 text-left rounded-md -m-1 p-1 hover:bg-sunken transition-colors"
          >
            <span className="w-9 h-9 bg-action rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-on-action" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-ink leading-none">SGEPI</span>
              <span className="text-xs text-ink-3 mt-0.5">
                {isSuperAdmin ? "Painel Master" : "Gestão de Estoque"}
              </span>
            </span>
            <span className="sr-only">, ir para o início</span>
          </button>

          <button
            type="button"
            onClick={() => setMenuAberto((prev) => !prev)}
            aria-expanded={menuAberto}
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            className="p-2 text-ink-2 hover:text-ink hover:bg-sunken rounded-md transition-colors shrink-0"
          >
            {menuAberto ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {menuAberto && (
          <div className="lg:hidden mt-4 rounded-md border border-line bg-surface p-4 shadow-modal">
            <div className="px-2 pb-4 mb-4 border-b border-line">
              <p className="text-sm text-ink">
                Olá, <b className="font-semibold text-ink">{nomeUsuario}</b>
              </p>
              <p className="font-mono text-xs text-ink-3 mt-1">
                {perfilNormalizado}
              </p>
              {!isSuperAdmin && <SeletorUnidade id="seletor-unidade-mobile" className="mt-3" />}
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Botao key={item.nome} label={item.label} nomePagina={item.nome} icone={item.icon} isMobile={true} />
              ))}
            </nav>

            <div className="mt-4 pt-4 border-t border-line">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium text-erro bg-erro-soft hover:bg-erro-solid hover:text-white transition-colors"
              >
                <span>Sair do Sistema</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;