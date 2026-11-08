import React, { useEffect, useState, useId } from "react";
import Dialogo from "../../Dialogo";

function ModalEditarMensalidade({ aberto, mensalidade, onFechar, onSalvar }) {
  const [form, setForm] = useState({
    empresa: "",
    plano: "Básico",
    valor: "",
    vencimento: "",
    pagamento: "",
    formaPagamento: "",
    status: "Pendente",
  });

  const [erro, setErro] = useState("");

  useEffect(() => {
    if (mensalidade) {
      setForm({
        empresa: mensalidade.empresa || "",
        plano: mensalidade.plano || "Básico",
        valor: mensalidade.valor ?? "",
        vencimento: mensalidade.vencimento || "",
        pagamento: mensalidade.pagamento || "",
        formaPagamento: mensalidade.formaPagamento || "",
        status: mensalidade.status || "Pendente",
      });

      setErro("");
    }
  }, [mensalidade]);

  if (!aberto || !mensalidade) return null;

  const alterarCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErro("");
  };

  const salvar = (e) => {
    e.preventDefault();

    if (!form.empresa.trim()) {
      setErro("Informe a empresa.");
      return;
    }

    if (!form.valor) {
      setErro("Informe o valor.");
      return;
    }

    const mensalidadeAtualizada = {
      ...mensalidade,
      empresa: form.empresa.trim(),
      plano: form.plano,
      valor: Number(form.valor || 0),
      vencimento: form.vencimento,
      pagamento: form.status === "Pago" ? form.pagamento : "",
      formaPagamento: form.status === "Pago" ? form.formaPagamento : "",
      status: form.status,
    };

    onSalvar?.(mensalidadeAtualizada);
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
              <h2 className="text-2xl font-bold text-ink tracking-tight mt-3">
                Editar Mensalidade
              </h2>

              <p className="text-sm text-ink-2 mt-1.5 font-medium">
                Atualize o valor, a data de vencimento, o status ou a forma de pagamento.
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
          <form id="form-editar-mensalidade" onSubmit={salvar}>
            {erro && (
              <div className="mb-6 p-3.5 bg-erro-soft text-erro text-sm rounded-md border border-erro-line flex items-center gap-2.5 font-medium ">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {erro}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              <CampoTexto
                label="Empresa"
                value={form.empresa}
                onChange={(e) => alterarCampo("empresa", e.target.value)}
              />

              <CampoSelect
                label="Plano"
                value={form.plano}
                onChange={(e) => alterarCampo("plano", e.target.value)}
                options={["Básico", "Profissional", "Premium"]}
              />

              <CampoTexto
                label="Valor (R$)"
                type="number"
                value={form.valor}
                onChange={(e) => alterarCampo("valor", e.target.value)}
              />

              <CampoTexto
                label="Vencimento"
                type="date"
                value={form.vencimento}
                onChange={(e) => alterarCampo("vencimento", e.target.value)}
              />

              <CampoSelect
                label="Status"
                value={form.status}
                onChange={(e) => alterarCampo("status", e.target.value)}
                options={["Pago", "Pendente", "Atrasado"]}
              />

              {form.status === "Pago" && (
                <>
                  <CampoTexto
                    label="Data do Pagamento"
                    type="date"
                    value={form.pagamento}
                    onChange={(e) => alterarCampo("pagamento", e.target.value)}
                  />

                  <CampoSelect
                    label="Forma de Pagamento"
                    value={form.formaPagamento}
                    onChange={(e) => alterarCampo("formaPagamento", e.target.value)}
                    options={["", "PIX", "Boleto", "Dinheiro", "Cartão", "Transferência"]}
                  />
                </>
              )}
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
            form="form-editar-mensalidade"
            className="px-6 py-2.5 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Salvar Alterações
          </button>
        </div>
      </div>
    </Dialogo>
  );
}

function CampoTexto({ label, type = "text", value, onChange }) {
  const idCampo = useId();
  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">
        {label}
      </label>

      <input id={idCampo}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink"
      />
    </div>
  );
}

function CampoSelect({ label, value, onChange, options }) {
  const idCampo = useId();
  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">
        {label}
      </label>

      <select id={idCampo}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink font-medium appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
      >
        {options.map((option) => (
          <option key={option || "vazio"} value={option}>
            {option || "Selecione"}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModalEditarMensalidade;