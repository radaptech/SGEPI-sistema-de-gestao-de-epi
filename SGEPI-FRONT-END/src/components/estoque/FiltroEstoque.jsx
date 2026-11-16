import { ListFilter, Search, ShieldAlert, X } from "lucide-react";
import Selecao from "../Selecao";

const CAMPO = "w-full bg-transparent border-none py-3 pl-3 pr-10 focus:ring-0 outline-none";

// Busca do estoque: o campo escolhido à direita muda o tipo da busca (texto, data ou status de validade).
export default function FiltroEstoque({ filtro, busca, onFiltro, onBusca }) {
  const porValidade = filtro === "status_validade";
  return (
    <div className="flex flex-col md:flex-row mb-6 bg-sunken rounded-md border border-line p-1.5 gap-1.5">
      <div className="relative flex items-center bg-surface rounded-md border border-line flex-1">
        <div className="pl-4 text-ink-3">{porValidade ? <ShieldAlert className="w-4 h-4" /> : <Search className="w-4 h-4" />}</div>
        {porValidade ? (
          <Selecao value={busca} onChange={(e) => onBusca(e.target.value)} className={`${CAMPO} text-sm font-semibold text-ink appearance-none cursor-pointer`}>
            <option value="">Todos os status...</option>
            <option value="vencido">Vencidos</option>
            <option value="proximo">Próximos de Vencer</option>
            <option value="normal">Dentro da Validade</option>
          </Selecao>
        ) : (
          <input
            type={filtro === "data_entrada" ? "date" : "text"}
            placeholder="Pesquisar lotes, nomes ou fabricantes..."
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            className={`${CAMPO} text-sm font-semibold text-ink placeholder-ink-3`}
          />
        )}
        {busca && (
          <button
            onClick={() => onBusca("")}
            aria-label="Limpar busca"
            className="absolute right-3 p-1 rounded-md text-ink-3 hover:text-ink-2 hover:bg-sunken transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative flex items-center bg-surface rounded-md border border-line md:w-56">
        <div className="pl-4 text-ink-3 pointer-events-none">
          <ListFilter className="w-4 h-4" />
        </div>
        <Selecao
          value={filtro}
          onChange={(e) => onFiltro(e.target.value)}
          className={`${CAMPO} text-xs font-bold uppercase tracking-wide text-ink-2 appearance-none cursor-pointer`}
        >
          <option value="nome">Nome do EPI</option>
          <option value="status_validade">Validade</option>
          <option value="data_entrada">Entrada</option>
          <option value="fabricante">Fabricante</option>
          <option value="ca">CA</option>
          <option value="lote">Lote</option>
          <option value="tipoProtecao">Proteção</option>
          <option value="tamanho">Tamanho</option>
        </Selecao>
      </div>
    </div>
  );
}
