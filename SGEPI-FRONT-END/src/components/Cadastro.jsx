import { Loader2, PenLine, Plus, Save, Search, Trash2 } from "lucide-react";

// Peças das abas de cadastro da Administração (departamentos, funções, fornecedores):
// cartão do formulário "Novo X / Editar X", lista "X Cadastrados" e os botões de cada linha.

export function CartaoFormulario({ editando, icone: Icone, titulo, obrigatorios = true, children }) {
  return (
    <div className="bg-sunken p-5 sm:p-6 rounded-md border border-line">
      <div className={`flex items-center gap-2.5 ${obrigatorios ? "mb-2" : "mb-5"}`}>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${editando ? "bg-atencao-soft text-atencao" : "bg-sunken text-ink"}`}>
          {editando ? <PenLine className="w-4 h-4" /> : <Icone className="w-4 h-4" />}
        </div>
        <h3 className="text-base font-bold text-ink">{titulo}</h3>
      </div>
      {obrigatorios && (
        <p className="text-xs text-ink-2 mb-5 ml-[42px]">
          Campos marcados com <span className="text-erro font-bold">*</span> são obrigatórios.
        </p>
      )}
      {children}
    </div>
  );
}

// Cancelar só aparece editando; o salvar troca de ícone e texto conforme o modo.
export function BotoesFormulario({ editando, salvando, onSalvar, onCancelar, textoNovo, textoEditando, className = "" }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-2.5 ${className}`}>
      {editando && (
        <button
          onClick={onCancelar}
          disabled={salvando}
          className="w-full sm:w-auto h-[46px] px-6 text-ink-2 hover:bg-line font-bold rounded-md transition-colors text-sm disabled:opacity-50"
        >
          Cancelar
        </button>
      )}
      <button
        onClick={onSalvar}
        disabled={salvando}
        className="w-full sm:w-auto h-[46px] px-6 bg-action hover:bg-action-hover text-on-action font-bold rounded-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {salvando ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : editando ? (
          <>
            <Save className="w-4 h-4" /> {textoEditando}
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" strokeWidth={2.5} /> {textoNovo}
          </>
        )}
      </button>
    </div>
  );
}

export function CartaoLista({ titulo, total, iconeVazio: IconeVazio, mensagemVazio, children }) {
  return (
    <div className="bg-surface rounded-md border border-line overflow-hidden">
      <div className="flex items-center justify-between p-5 sm:px-6 border-b border-line">
        <h3 className="text-base font-bold text-ink">{titulo}</h3>
        <span className="inline-flex items-center justify-center px-2.5 py-1 bg-sunken text-ink-2 text-xs font-bold uppercase tracking-wider rounded-md">
          {total} registro(s)
        </span>
      </div>
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-10 text-ink-3">
          <IconeVazio className="w-10 h-10 opacity-50" strokeWidth={1.5} />
          <span className="font-medium text-sm">{mensagemVazio}</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// Ícones de editar/excluir da linha da tabela; aparecem no hover em telas maiores.
export function AcoesLinha({ onEditar, onExcluir, children, className = "justify-center" }) {
  const botao = "w-8 h-8 flex items-center justify-center rounded-md text-ink-3 transition-colors";
  return (
    <div className={`flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ${className}`}>
      {children}
      <button onClick={onEditar} className={`${botao} hover:text-atencao hover:bg-atencao-soft`} title="Editar">
        <PenLine className="w-4 h-4" />
      </button>
      <button onClick={onExcluir} className={`${botao} hover:text-erro hover:bg-erro-soft`} title="Excluir">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

// Versão do cartão no celular: botões largos com texto.
export function AcoesCartao({ onEditar, onExcluir, children }) {
  const botao = "flex-1 py-2.5 flex justify-center items-center gap-2 rounded-md font-bold text-sm transition-colors";
  return (
    <div className="mt-4 pt-4 border-t border-line flex gap-2">
      {children}
      <button onClick={onEditar} className={`${botao} bg-sunken text-ink-2 hover:text-atencao`}>
        <PenLine className="w-4 h-4" /> Editar
      </button>
      <button onClick={onExcluir} className={`${botao} bg-erro-soft text-erro`}>
        <Trash2 className="w-4 h-4" /> Excluir
      </button>
    </div>
  );
}

export function Rotulo({ children }) {
  return <span className="block text-xs uppercase font-bold text-ink-3 tracking-wide mb-0.5">{children}</span>;
}

// Topo das listas com busca (EPIs, funcionários): título, filtros, busca, total e botão de cadastrar.
// children entra antes da busca (ex.: filtro de unidade).
export function CabecalhoLista({ icone: Icone, titulo, busca, onBusca, placeholder, total, carregando, textoNovo, onNovo, children }) {
  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
      <div className="flex-1 max-w-2xl">
        <h2 className="text-xl font-bold text-ink mb-3 flex items-center gap-2">
          <Icone className="w-5 h-5 text-ink" />
          {titulo}
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {children}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
            <input
              className="w-full h-[46px] pl-11 pr-4 border border-line bg-sunken rounded-md focus:ring-1 focus:ring-ink focus:border-ink outline-none text-sm transition-all text-ink placeholder-ink-3"
              value={busca}
              onChange={(e) => onBusca(e.target.value)}
              placeholder={placeholder}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
        <div className="hidden sm:block text-right pr-4 border-r border-line">
          <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-1">Total</p>
          <p className="text-2xl font-bold text-ink">{carregando ? "..." : total}</p>
        </div>
        <button
          onClick={onNovo}
          className="h-[46px] px-6 bg-action hover:bg-action-hover text-on-action font-bold rounded-md transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} /> {textoNovo}
        </button>
      </div>
    </div>
  );
}

// Carregando ou lista vazia, no lugar das linhas.
export function EstadoLista({ carregando, textoCarregando = "Carregando dados...", icone: Icone, mensagem }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-3">
      {carregando ? <Loader2 className="w-8 h-8 animate-spin text-ink" /> : <Icone className="w-10 h-10 opacity-50" strokeWidth={1.5} />}
      <span className="font-medium text-sm">{carregando ? textoCarregando : mensagem}</span>
    </div>
  );
}
