import React, { useState } from "react";
import Dialogo from "../../Dialogo";

function ModalConfirmarPagamento({ aberto, mensalidade, onFechar, onConfirmar }) {
  const [pagamento, setPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [erro, setErro] = useState("");

  if (!aberto || !mensalidade) return null;

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  };

  const confirmar = (e) => {
    e.preventDefault();

    if (!pagamento) {
      setErro("Informe a data do pagamento.");
      return;
    }

    onConfirmar?.({
      ...mensalidade,
      status: "Pago",
      pagamento,
      formaPagamento,
    });
  };

  return (
    <Dialogo onClose={onFechar} className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-overlay transition-opacity"
        onClick={onFechar}
      />

      <div className="relative w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col bg-surface rounded-md shadow-modal border border-line ">
        <div className="shrink-0 bg-surface border-b border-line px-6 md:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>

              <h2 className="text-2xl font-bold text-ink tracking-tight">
                Marcar como Pago
              </h2>

              <p className="text-sm text-ink-2 mt-1.5 font-medium">
                Confirme os dados do recebimento antes de alterar o status desta cobrança.
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
          <form id="form-confirmar-pagamento" onSubmit={confirmar}>
            {erro && (
              <div className="mb-6 p-3.5 bg-erro-soft text-erro text-sm rounded-md border border-erro-line flex items-center gap-2.5 font-medium ">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {erro}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <CampoInfo label="Empresa" valor={mensalidade.empresa} />
              <CampoInfo label="Plano" valor={mensalidade.plano} />
              <CampoInfo label="Valor da Cobrança" valor={formatarMoeda(mensalidade.valor)} destaque />
              <CampoInfo label="Data de Vencimento" valor={mensalidade.vencimento} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              <div>
                <label htmlFor="confirmarpagamento-1" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">
                  Data do Pagamento <span className="text-ink ml-0.5">*</span>
                </label>

                <input id="confirmarpagamento-1"
                  type="date"
                  value={pagamento}
                  onChange={(e) => {
                    setPagamento(e.target.value);
                    setErro("");
                  }}
                  className="w-full px-4 py-3 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink"
                />
              </div>

              <div>
                <label htmlFor="confirmarpagamento-2" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">
                  Forma de Pagamento
                </label>

                <select id="confirmarpagamento-2"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full px-4 py-3 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink font-medium appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
                >
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>
            </div>
          </form>
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
            type="submit"
            form="form-confirmar-pagamento"
            className="px-6 py-2.5 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </Dialogo>
  );
}

function CampoInfo({ label, valor, destaque = false }) {
  return (
    <div className={`rounded-md border p-4 transition-colors ${
      destaque 
        ? "bg-sunken border-line" 
        : "bg-sunken border-line hover:bg-surface hover:border-line-strong"
    }`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${
        destaque ? "text-ink" : "text-ink-2"
      }`}>
        {label}
      </p>

      <p className={`text-sm mt-1.5 break-words ${
        destaque ? "font-bold text-ink" : "font-semibold text-ink"
      }`}>
        {valor || "-"}
      </p>
    </div>
  );
}

export default ModalConfirmarPagamento;