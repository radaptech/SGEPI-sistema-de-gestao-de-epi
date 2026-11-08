import React, { useEffect, useState, useId } from "react";
import formatarData from "../../../utils/DatasFormater";
import Dialogo from "../../Dialogo";

function ModalEditarEmpresa({ aberto, empresa, planos = [], onFechar, onSalvar, onExcluir }) {
  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    responsavel: "",
    email: "",
    telefone: "",
    planoId: "",
    vencimento: "",
    status: "Ativa",
    observacoes: "", // 👈 Adicionado ao estado inicial
  });

  const [erro, setErro] = useState("");

  useEffect(() => {
    if (empresa && aberto) {
      // /dados-empresas manda o nome do plano, não o id
      const planoAtual = planos.find((p) => p.nome === empresa.plano);
      const planoInicial = planoAtual ? String(planoAtual.id) : "";

      setForm({
        nome: empresa.nome || "",
        cnpj: empresa.cnpj || "",
        responsavel: empresa.responsavel || "",
        email: empresa.email || "",
        telefone: empresa.telefone || "",
        planoId: planoInicial, 
        vencimento: formatarData(empresa.vencimento),
        status: empresa.status || "Ativa",
        observacoes: empresa.observacoes || "", // 👈 Carrega do banco de dados
      });

      setErro("");
    }

  }, [empresa?.id, aberto, planos]); // eslint-disable-line react-hooks/exhaustive-deps -- só reinicia o form ao trocar de empresa

  if (!aberto || !empresa) return null;

  const alterarCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setErro("");
  };

  const salvar = (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      setErro("Informe o nome da empresa.");
      return;
    }

    if (!form.responsavel.trim()) {
      setErro("Informe o responsável.");
      return;
    }

    if (!form.email.trim()) {
      setErro("Informe o e-mail.");
      return;
    }

    if (!form.planoId) {
      setErro("Selecione um plano.");
      return;
    }

    const payloadApi = {
      nome: form.nome.trim(),
      cnpj: form.cnpj.trim(),
      responsavel: form.responsavel.trim(),
      email: form.email.trim(),
      telefone: form.telefone.trim(),
      plano_id: Number(form.planoId),
      vencimento: formatarData(form.vencimento),
      status: form.status,
      observacoes: form.observacoes.trim(), // 👈 Adicionado ao payload enviado ao Go
    };

    const planoSelecionado = planos.find(p => String(p.id) === String(form.planoId));
    
    const empresaAtualizadaParaTela = {
      ...empresa, 
      ...payloadApi,
      planoNome: planoSelecionado ? planoSelecionado.nome : empresa.planoNome,
    };

    onSalvar?.(empresa.id, payloadApi, empresaAtualizadaParaTela);
  };

  const excluir = () => {
    if (window.confirm(`Tem certeza que deseja excluir a empresa ${form.nome}? Esta ação não poderá ser desfeita.`)) {
      onExcluir?.(empresa.id);
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
              <h2 className="text-2xl font-bold text-ink tracking-tight mt-3">
                Editar Empresa
              </h2>

              <p className="text-sm text-ink-2 mt-1.5 font-medium">
                Atualize as informações cadastrais, status e plano desta empresa.
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
          <form id="form-editar-empresa" onSubmit={salvar}>
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
                label="Nome da empresa"
                obrigatorio
                value={form.nome}
                onChange={(e) => alterarCampo("nome", e.target.value)}
              />

              <CampoTexto
                label="CNPJ"
                value={form.cnpj}
                onChange={(e) => alterarCampo("cnpj", e.target.value)}
              />

              <CampoTexto
                label="Responsável"
                obrigatorio
                value={form.responsavel}
                onChange={(e) => alterarCampo("responsavel", e.target.value)}
              />

              <CampoTexto
                label="E-mail"
                obrigatorio
                type="email"
                value={form.email}
                onChange={(e) => alterarCampo("email", e.target.value)}
              />

              <CampoTexto
                label="Telefone"
                value={form.telefone}
                onChange={(e) => alterarCampo("telefone", e.target.value)}
              />

              <CampoSelect
                label="Plano"
                value={String(form.planoId || "")}
                onChange={(e) => alterarCampo("planoId", e.target.value)}
                options={
                  Array.isArray(planos) 
                    ? planos.map((p) => ({ value: String(p.id), label: p.nome })) 
                    : []
                }
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
                options={[
                  { value: "Ativa", label: "Ativa" },
                  { value: "Atrasada", label: "Atrasada" },
                  { value: "Bloqueada", label: "Bloqueada" },
                  { value: "Em teste", label: "Em teste" },
                ]}
              />
            </div>
          </form>
        </div>

        <div className="shrink-0 bg-sunken border-t border-line px-6 md:px-8 py-5 flex flex-col-reverse sm:flex-row sm:justify-between gap-3 rounded-b-md">
          <button
            type="button"
            onClick={excluir}
            className="px-6 py-2.5 rounded-md bg-erro-soft text-erro text-sm font-semibold hover:bg-erro-soft transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir Empresa
          </button>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={onFechar}
              className="px-6 py-2.5 rounded-md bg-surface text-ink-2 border border-line text-sm font-semibold hover:bg-sunken hover:text-ink transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              form="form-editar-empresa"
              className="px-6 py-2.5 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </Dialogo>
  );
}

// Sub-componentes mantidos inalterados
function CampoTexto({ label, obrigatorio, type = "text", value, onChange }) {
  const idCampo = useId();
  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">
        {label} {obrigatorio && <span className="text-ink ml-0.5">*</span>}
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
  const listaOpcoes = Array.isArray(options) ? options : [];

  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">
        {label}
      </label>
      <select id={idCampo}
        value={value || ""} 
        onChange={onChange}
        className="w-full px-4 py-3 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink font-medium appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
      >
        <option value="" disabled>
          {listaOpcoes.length === 0 ? "Carregando planos..." : "Selecione uma opção"}
        </option>
        {listaOpcoes.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModalEditarEmpresa;