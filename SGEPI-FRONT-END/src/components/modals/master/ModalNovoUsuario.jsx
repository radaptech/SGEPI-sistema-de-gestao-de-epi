import React, { useState, useId } from "react";
import Dialogo from "../../Dialogo";

function ModalNovoUsuario({ aberto, onFechar, onSalvar, empresas = [] }) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    empresa: "",
    tipo: "colaborador", 
    status: "Ativo",
    senhaTemporaria: "",
  });

  const [erro, setErro] = useState("");

  if (!aberto) return null;

  const alterarCampo = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErro("");
  };

  const limpar = () => {
    setForm({
      nome: "",
      email: "",
      empresa: "",
      tipo: "colaborador", 
      status: "Ativo",
      senhaTemporaria: "",
    });
    setErro("");
  };

  const fechar = () => {
    limpar();
    onFechar?.();
  };

  const salvar = (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      setErro("Informe o nome do usuário.");
      return;
    }

    if (!form.email.trim()) {
      setErro("Informe o e-mail do usuário.");
      return;
    }

    if (!form.empresa && form.tipo !== "super_admin") {
      setErro("Selecione a empresa vinculada.");
      return;
    }

    const payloadApi = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      senha: form.senhaTemporaria.trim(),
      role: form.tipo, 
      status: form.status === "Ativo", 
    };

    if (form.empresa) {
      payloadApi.empresa_id = Number(form.empresa);
    }

    const novoUsuarioParaTela = {
      id: Date.now(), 
      nome: form.nome.trim(),
      email: form.email.trim(),
      empresa: empresas.find(emp => Number(emp.id) === Number(form.empresa))?.nome || "Sem empresa",
      tipo: form.tipo,
      status: form.status === "Ativo",
      ultimo_acesso: "Nunca acessou", 
    };

    onSalvar?.(payloadApi, novoUsuarioParaTela);
    limpar();
  };

  const opcoesEmpresas = [
    { value: "", label: "Selecione uma empresa..." },
    ...empresas.map((emp) => ({
      value: emp.id, 
      label: emp.nome,
    })),
  ];

  return (
    <Dialogo onClose={fechar} className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-overlay transition-opacity"
        onClick={fechar}
      />

      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col bg-surface rounded-md shadow-modal border border-line ">
        <div className="shrink-0 bg-surface border-b border-line px-6 md:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-ink tracking-tight mt-3">
                Novo Usuário
              </h2>

              <p className="text-sm text-ink-2 mt-1.5 font-medium">
                Cadastre um usuário master, administrador ou usuário interno e defina suas permissões.
              </p>
            </div>

            <button
              type="button"
              onClick={fechar}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-sunken text-ink-3 hover:bg-sunken hover:text-ink transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 custom-scrollbar">
          <form id="form-novo-usuario" onSubmit={salvar}>
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
                label="Nome Completo"
                obrigatorio
                value={form.nome}
                onChange={(e) => alterarCampo("nome", e.target.value)}
                placeholder="Ex: João Silva"
              />

              <CampoTexto
                label="E-mail de Acesso"
                obrigatorio
                type="email"
                value={form.email}
                onChange={(e) => alterarCampo("email", e.target.value)}
                placeholder="usuario@email.com"
              />

              <CampoSelect
                label="Empresa Vinculada"
                obrigatorio={form.tipo !== "super_admin"} 
                value={form.empresa}
                onChange={(e) => alterarCampo("empresa", e.target.value)}
                options={opcoesEmpresas}
              />

              <CampoSelect
                label="Nível de Permissão (Tipo)"
                value={form.tipo}
                onChange={(e) => alterarCampo("tipo", e.target.value)}
                options={[
                  { value: "super_admin", label: "Master (Acesso Total)" },
                  { value: "admin", label: "Administrador da Empresa" },
                  { value: "colaborador", label: "Colaborador Padrão" },
                ]}
              />

              <CampoSelect
                label="Status de Acesso"
                value={form.status}
                onChange={(e) => alterarCampo("status", e.target.value)}
                options={[
                  { value: "Ativo", label: "Ativo" },
                  { value: "Bloqueado", label: "Bloqueado" },
                ]}
              />

              <CampoTexto
                label="Senha Temporária"
                value={form.senhaTemporaria}
                onChange={(e) => alterarCampo("senhaTemporaria", e.target.value)}
                placeholder="Opcional por enquanto"
              />
            </div>
          </form>
        </div>

        <div className="shrink-0 bg-sunken border-t border-line px-6 md:px-8 py-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-md">
          <button
            type="button"
            onClick={fechar}
            className="px-6 py-2.5 rounded-md bg-surface text-ink-2 border border-line text-sm font-semibold hover:bg-sunken hover:text-ink transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="form-novo-usuario"
            className="px-6 py-2.5 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Salvar Usuário
          </button>
        </div>
      </div>
    </Dialogo>
  );
}

function CampoTexto({
  label,
  obrigatorio,
  type = "text",
  value,
  onChange,
  placeholder,
}) {
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
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink placeholder:text-ink-3"
      />
    </div>
  );
}

function CampoSelect({ label, value, onChange, options, disabled, obrigatorio }) {
  const idCampo = useId();
  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">
        {label} {obrigatorio && <span className="text-ink ml-0.5">*</span>}
      </label>

      <select id={idCampo}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-md outline-none transition-all text-sm font-medium appearance-none ${
          disabled
            ? "bg-sunken border-line text-ink-2 cursor-not-allowed"
            : "bg-sunken border-line text-ink cursor-pointer focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink"
        }`}
        style={!disabled ? { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` } : {}}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.value === ""}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModalNovoUsuario;