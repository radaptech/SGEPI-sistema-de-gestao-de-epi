import React, { useState, useEffect, useId } from "react";
import masterDashboardService from "../../../services/masterDashboardService";
import { toast } from "react-toastify"; 
import formatarData from "../../../utils/DatasFormater";
import Dialogo from "../../Dialogo";
import Selecao from "../../Selecao";

function ModalNovaEmpresa({ aberto, onFechar, onSalvar }) {
  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    responsavel: "",
    email: "",
    telefone: "",
    plano: "", 
    status: "Em teste",
    mensalidade: "",
    vencimento: "",
    observacoes: "",
  });

  const [planosDoBanco, setPlanosDoBanco] = useState([]);

  useEffect(() => {
    if (aberto) {
      const buscarPlanos = async () => {
        try {
          const resposta = await masterDashboardService.buscarPlanos();
          const dados = resposta.data || resposta;
          
          if (Array.isArray(dados)) {
            const planosAtivos = dados.filter(p => p.status === "Ativo");
            setPlanosDoBanco(planosAtivos);

            if (planosAtivos.length > 0) {
              setForm(prev => ({
                ...prev,
                plano: planosAtivos[0].nome,
                mensalidade: planosAtivos[0].mensalidade
              }));
            }
          }
        } catch (error) {
          toast.error("Não foi possível carregar a lista de planos."); 
        }
      };

      buscarPlanos();
    }
  }, [aberto]);

  const handlePlanoChange = (e) => {
    const nomePlanoSelecionado = e.target.value;
    const planoEncontrado = planosDoBanco.find(p => p.nome === nomePlanoSelecionado);
    
    setForm(prev => ({
      ...prev,
      plano: nomePlanoSelecionado,
      mensalidade: planoEncontrado ? planoEncontrado.mensalidade : 0
    }));
  };

  if (!aberto) return null;

  const alterarCampo = (campo, valor) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const limparFormulario = () => {
    setForm({
      nome: "",
      cnpj: "",
      responsavel: "",
      email: "",
      telefone: "",
      plano: planosDoBanco.length > 0 ? planosDoBanco[0].nome : "",
      status: "Em teste",
      mensalidade: planosDoBanco.length > 0 ? planosDoBanco[0].mensalidade : "",
      vencimento: "",
      observacoes: "",
    });
  };

  const fecharModal = () => {
    limparFormulario();
    onFechar?.();
  };

  const salvarEmpresa = (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      toast.warning("Informe o nome da empresa.");
      return;
    }
    if (!form.responsavel.trim()) {
      toast.warning("Informe o responsável pela empresa.");
      return;
    }
    if (!form.email.trim()) {
      toast.warning("Informe o e-mail de contato.");
      return;
    }
    if (!form.plano) {
      toast.warning("Selecione um plano válido.");
      return;
    }

    const novaEmpresa = {
      nome_fantasia: form.nome.trim(), 
      cnpj: form.cnpj.trim(),
      responsavel: form.responsavel.trim(),
      email: form.email.trim(),
      telefone: form.telefone.trim(),
      plano: form.plano, 
      status: form.status,
      mensalidade: Number(form.mensalidade || 0),
      vencimento: formatarData(form.vencimento), 
      observacoes: form.observacoes.trim(),
    };

    onSalvar?.(novaEmpresa);
    limparFormulario();
  };

  return (
    <Dialogo onClose={fecharModal} className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-overlay transition-opacity"
        onClick={fecharModal}
      />
      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col bg-surface rounded-md shadow-modal border border-line ">
        <div className="shrink-0 bg-surface border-b border-line px-6 md:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>

              <h2 className="text-2xl font-bold text-ink tracking-tight mt-3">
                Nova Empresa
              </h2>

              <p className="text-sm text-ink-2 mt-1.5 font-medium">
                Cadastre uma nova empresa cliente para liberar o acesso à plataforma.
              </p>
            </div>

            <button
              type="button"
              onClick={fecharModal}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-sunken text-ink-3 hover:bg-sunken hover:text-ink transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Corpo Rolável */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 custom-scrollbar">
          <form id="form-nova-empresa" onSubmit={salvarEmpresa} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <CampoTexto
              label="Nome da empresa"
              obrigatorio
              placeholder="Ex: Alfa Segurança do Trabalho"
              value={form.nome}
              onChange={(e) => alterarCampo("nome", e.target.value)}
            />

            <CampoTexto
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              value={form.cnpj}
              onChange={(e) => alterarCampo("cnpj", e.target.value)}
            />

            <CampoTexto
              label="Responsável"
              obrigatorio
              placeholder="Ex: João Silva"
              value={form.responsavel}
              onChange={(e) => alterarCampo("responsavel", e.target.value)}
            />

            <CampoTexto
              label="E-mail de contato"
              obrigatorio
              type="email"
              placeholder="Ex: contato@empresa.com"
              value={form.email}
              onChange={(e) => alterarCampo("email", e.target.value)}
            />

            <CampoTexto
              label="Telefone"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={(e) => alterarCampo("telefone", e.target.value)}
            />

            <CampoSelect
              label="Plano"
              value={form.plano}
              onChange={handlePlanoChange}
              options={planosDoBanco.map(p => p.nome)}
            />

            <CampoSelect
              label="Status inicial"
              value={form.status}
              onChange={(e) => alterarCampo("status", e.target.value)}
              options={["Em teste", "Ativa", "Bloqueada"]}
            />

            <CampoTexto
              label="Mensalidade (R$)"
              type="number"
              placeholder="Automático pelo plano"
              value={form.mensalidade}
              disabled={true} 
            />

            <CampoTexto
              label="Data de Vencimento"
              type="date"
              value={form.vencimento}
              onChange={(e) => alterarCampo("vencimento", e.target.value)}
            />

            <div className="md:col-span-2 mt-2">
              <label htmlFor="novaempresa-1" className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">
                Observações Internas
              </label>

              <textarea id="novaempresa-1"
                value={form.observacoes}
                onChange={(e) => alterarCampo("observacoes", e.target.value)}
                placeholder="Informações adicionais relevantes sobre essa empresa..."
                rows={3}
                className="w-full px-4 py-3 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink placeholder:text-ink-3 resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer Fixo */}
        <div className="shrink-0 bg-sunken border-t border-line px-6 md:px-8 py-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 rounded-b-md">
          <button
            type="button"
            onClick={fecharModal}
            className="px-6 py-2.5 rounded-md bg-surface text-ink-2 border border-line text-sm font-semibold hover:bg-sunken hover:text-ink transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="form-nova-empresa"
            className="px-6 py-2.5 rounded-md bg-action text-on-action text-sm font-semibold hover:bg-action-hover transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Salvar Empresa
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
  placeholder,
  value,
  onChange,
  disabled = false,
}) {
  const idCampo = useId();
  return (
    <div>
      <label htmlFor={idCampo} className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-2">
        {label} {obrigatorio && <span className="text-ink ml-0.5">*</span>}
      </label>

      <input id={idCampo}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-md outline-none transition-all text-sm ${
          disabled 
            ? "bg-sunken border-line text-ink-2 cursor-not-allowed" 
            : "bg-sunken border-line text-ink placeholder:text-ink-3 focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink"
        }`}
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

      <Selecao id={idCampo}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-sunken border border-line rounded-md focus:bg-surface focus:ring-1 focus:ring-ink focus:border-ink outline-none transition-all text-sm text-ink font-medium appearance-none cursor-pointer"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.2em 1.2em` }}
      >
        {options.length === 0 && <option value="">Carregando planos...</option>}
        
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Selecao>
    </div>
  );
}

export default ModalNovaEmpresa;