import React from "react";
import Dialogo from "../../Dialogo";

function ModalConfirmarBloqueioUsuario({
  aberto,
  usuario,
  onFechar,
  onConfirmar,
}) {
  if (!aberto || !usuario) return null;

  const estaBloqueado = usuario.status === false;
  const acao = estaBloqueado ? "desbloquear" : "bloquear";

  return (
    <Dialogo onClose={onFechar} className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-overlay transition-opacity"
        onClick={onFechar}
      />

      <div className="relative w-full max-w-2xl overflow-hidden flex flex-col bg-surface rounded-md shadow-modal border border-line ">
        <div className="shrink-0 bg-surface border-b border-line px-6 md:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink tracking-tight mt-3">
                {estaBloqueado ? "Desbloquear Usuário" : "Bloquear Usuário"}
              </h2>

              <p className="text-sm text-ink-2 mt-1.5 font-medium">
                Confirme esta ação antes de alterar as permissões de login deste usuário.
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

        <div className="p-6 md:px-8 md:py-6">
          <div className="rounded-md bg-sunken border border-line p-5 mb-6">
            <p className="text-xs font-bold text-ink-2 uppercase tracking-wide">
              Usuário Selecionado
            </p>

            <h3 className="text-lg font-bold text-ink mt-2">
              {usuario.nome}
            </h3>

            <div className="mt-2 space-y-1">
              <p className="text-sm text-ink-2 font-medium">
                E-mail: <span className="text-ink">{usuario.email}</span>
              </p>
              <p className="text-sm text-ink-2 font-medium">
                Empresa: <span className="text-ink">{usuario.empresa}</span>
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-md border flex items-start gap-3 ${
            estaBloqueado 
              ? "bg-ok-soft border-ok-line text-ok" 
              : "bg-erro-soft border-erro-line text-erro"
          }`}>
            <div className="shrink-0 mt-0.5">
              {estaBloqueado ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-ok" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-erro" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </div>
            <p className="text-sm font-medium leading-relaxed">
              Ao {acao} este usuário, o status será alterado para{" "}
              <strong className="font-bold">{estaBloqueado ? "Ativo" : "Bloqueado"}</strong>.{" "}
              {estaBloqueado 
                ? "Isso permitirá que o usuário volte a fazer login no sistema normalmente." 
                : "Isso impedirá imediatamente que o usuário consiga fazer login no sistema."}
            </p>
          </div>
        </div>

        <div className="shrink-0 bg-sunken border-t border-line px-6 md:px-8 py-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-md">
          <button
            type="button"
            onClick={onFechar}
            className="px-6 py-2.5 rounded-md bg-surface text-ink-2 border border-line text-sm font-semibold hover:bg-sunken hover:text-ink transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => onConfirmar?.(usuario)}
            className={`px-6 py-2.5 rounded-md text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              estaBloqueado
                ? "bg-ok-solid hover:bg-ok-solid "
                : "bg-erro-solid hover:bg-erro-solid "
            }`}
          >
            {estaBloqueado ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
            {estaBloqueado ? "Confirmar Desbloqueio" : "Confirmar Bloqueio"}
          </button>
        </div>
      </div>
    </Dialogo>
  );
}

export default ModalConfirmarBloqueioUsuario;