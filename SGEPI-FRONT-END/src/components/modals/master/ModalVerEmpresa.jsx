import React from "react";
import Dialogo from "../../Dialogo";

function ModalVerEmpresa({ aberto, empresa, onFechar }) {
  if (!aberto || !empresa) return null;

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Ativa":
        return "bg-ok-soft text-ok border-ok-line";
      case "Atrasada":
        return "bg-atencao-soft text-atencao border-atencao-line";
      case "Bloqueada":
        return "bg-erro-soft text-erro border-erro-line";
      case "Em teste":
        return "bg-sunken text-ink border-line";
      default:
        return "bg-sunken text-ink-2 border-line";
    }
  };

  return (
    <Dialogo onClose={onFechar} className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-overlay transition-opacity"
        onClick={onFechar}
      />

      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col bg-surface rounded-md shadow-modal border border-line ">
        <div className="shrink-0 bg-surface border-b border-line px-6 md:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>

              <h2 className="text-2xl font-bold text-ink tracking-tight">
                {empresa.nome}
              </h2>

              <p className="text-sm text-ink-2 mt-1.5 font-medium">
                Visualização completa dos dados e métricas da empresa cliente.
              </p>
            </div>

            <button
              type="button"
              onClick={onFechar}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-sunken text-ink-3 hover:bg-sunken hover:text-ink transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 custom-scrollbar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8 p-5 rounded-md bg-sunken border border-line">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-action text-on-action flex items-center justify-center text-xl font-bold shrink-0">
                {empresa.nome?.charAt(0)?.toUpperCase() || "E"}
              </div>

              <div>
                <h3 className="text-lg font-bold text-ink">
                  {empresa.nome}
                </h3>
                <p className="text-sm text-ink-2 mt-0.5 font-medium">
                  CNPJ: <span className="text-ink">{empresa.cnpj || "Não informado"}</span>
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <span
                className={`inline-flex items-center justify-center px-3.5 py-1.5 rounded-md border text-xs font-bold tracking-wide uppercase ${getStatusClass(
                  empresa.status
                )}`}
              >
                {empresa.status || "Indefinido"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CampoInfo label="Responsável" valor={empresa.responsavel} />
            <CampoInfo label="E-mail" valor={empresa.email} copyable={true} />
            <CampoInfo label="Telefone" valor={empresa.telefone} />
            <CampoInfo label="Plano Vinculado" valor={empresa.plano} />
            <CampoInfo label="Mensalidade" valor={formatarMoeda(empresa.mensalidade)} />
            <CampoInfo label="Dia de Vencimento" valor={empresa.vencimento} />
            <CampoInfo label="Total de Funcionários" valor={empresa.funcionarios ?? 0} />
            <CampoInfo label="Total de EPIs" valor={empresa.epis ?? 0} />
            <CampoInfo label="Status Atual" valor={empresa.status} />
          </div>
        </div>

        <div className="shrink-0 bg-sunken border-t border-line px-6 md:px-8 py-5 flex justify-end rounded-b-md">
          <button
            type="button"
            onClick={onFechar}
            className="px-8 py-2.5 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </Dialogo>
  );
}

function CampoInfo({ label, valor, copyable = false }) {
  return (
    <div className="rounded-md bg-sunken border border-line p-4 transition-colors hover:bg-surface hover:border-line-strong group">
      <p className="text-xs font-bold text-ink-2 uppercase tracking-wide">
        {label}
      </p>

      <div className="flex items-start justify-between gap-2 mt-1.5">
        <p className="text-sm font-semibold text-ink break-words">
          {valor || "-"}
        </p>
        
        {copyable && valor && (
          <button 
            type="button"
            onClick={() => navigator.clipboard.writeText(valor)}
            className="text-ink-3 hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            title="Copiar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default ModalVerEmpresa;