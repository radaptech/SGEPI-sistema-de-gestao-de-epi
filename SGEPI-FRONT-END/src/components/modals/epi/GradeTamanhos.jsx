import { useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Plus, X } from "lucide-react";
import { api } from "../../../services/api";
import Selecao from "../../Selecao";
import { inputClass } from "../../Campo";

const TAMANHOS_SUGERIDOS = ["Único", "PP", "P", "M", "G", "GG", "EXG", ...Array.from({ length: 13 }, (_, i) => String(34 + i))];

const nome = (t) => t.tamanho || t.nome;

// Botões de tamanho do EPI (marca/desmarca) e cadastro de tamanho novo, que já entra marcado.
export default function GradeTamanhos({ tamanhos, setTamanhos, selecionados, onAlternar, onAdicionado, erro }) {
  const [adicionando, setAdicionando] = useState(false);
  const [novo, setNovo] = useState("");
  const [salvando, setSalvando] = useState(false);

  const nomesSelecionados = selecionados.length
    ? tamanhos.filter((t) => selecionados.includes(t.id)).map(nome).join(", ")
    : "Nenhum selecionado";

  const adicionar = async () => {
    if (!novo) return toast.error("Selecione um tamanho para adicionar.");
    try {
      setSalvando(true);
      // a resposta é só {"mensagem"}: recarrega a lista e marca o tamanho novo pelo nome
      await api.post("/gerencial/cadastro-tamanho", { tamanho: novo });
      const lista = (await api.get("/tamanhos")) ?? [];
      setTamanhos(lista);
      const criado = lista.find((t) => t.tamanho === novo);
      if (criado) onAdicionado(criado.id);
      setNovo("");
      setAdicionando(false);
      toast.success("Tamanho adicionado com sucesso!");
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="bg-surface p-6 sm:p-7 rounded-md border border-line">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h4 className="text-sm font-bold tracking-wide text-ink-2 uppercase">
            Grade de Tamanhos <span className="text-erro">*</span>
          </h4>
          <p className="text-xs font-medium text-ink-3 mt-1">
            Selecionados: <span className="text-ink font-bold">{nomesSelecionados}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdicionando(!adicionando)}
          className="text-ink text-xs uppercase tracking-wide font-bold flex items-center gap-1 transition-colors w-fit"
        >
          {adicionando ? (
            <>
              <X className="w-3 h-3" /> Cancelar
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" /> Novo Tamanho
            </>
          )}
        </button>
      </div>

      {adicionando && (
        <div className="mb-6 p-4 sm:p-5 bg-sunken border border-line rounded-md flex flex-col sm:flex-row gap-3">
          <Selecao value={novo} onChange={(e) => setNovo(e.target.value)} className={inputClass()}>
            <option value="">Selecione da lista...</option>
            {TAMANHOS_SUGERIDOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Selecao>
          <button
            onClick={adicionar}
            disabled={salvando}
            className="px-6 py-3 bg-action hover:bg-action-hover text-on-action rounded-md font-bold text-sm transition-all disabled:opacity-50"
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
          </button>
        </div>
      )}

      <div className={`rounded-md p-5 border ${erro ? "border-erro-line bg-erro-soft" : "border-line bg-sunken"}`}>
        {tamanhos.length === 0 ? (
          <p className="text-sm font-medium text-ink-3 italic text-center py-2">Nenhum tamanho disponível.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {tamanhos.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onAlternar(t.id)}
                aria-pressed={selecionados.includes(t.id)}
                className={`min-w-[56px] h-[42px] px-4 rounded-md border text-sm font-bold transition-all duration-200 ${
                  selecionados.includes(t.id) ? "bg-action border-ink text-on-action" : "bg-surface border-line text-ink-2"
                }`}
              >
                {nome(t)}
              </button>
            ))}
          </div>
        )}
      </div>
      {erro && <p className="text-xs font-medium text-erro mt-2">{erro}</p>}
    </section>
  );
}
