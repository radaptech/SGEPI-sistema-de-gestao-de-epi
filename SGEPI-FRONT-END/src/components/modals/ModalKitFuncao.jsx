import { useEffect, useState } from "react";
import { Loader2, Save, ShieldCheck, X } from "lucide-react";
import { api } from "../../services/api";
import { listarEpisEntrega } from "../../services/entregaService";
import { normalizarEpiEntrega } from "../../utils/entregaNormalizers";

// Monta o kit de EPI da função: marca os EPIs e a quantidade de cada um.
export default function ModalKitFuncao({ funcao, onClose, mostrarToast }) {
  const [epis, setEpis] = useState([]);
  const [kit, setKit] = useState({}); // { [idEpi]: quantidade }
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    Promise.all([listarEpisEntrega(), api.get(`/funcao/${funcao.id}/kit`)])
      .then(([listaEpis, respKit]) => {
        if (!ativo) return;
        setEpis(listaEpis.map(normalizarEpiEntrega));
        setKit(Object.fromEntries((respKit ?? []).map((i) => [i.id_epi, i.quantidade])));
      })
      .catch((erro) => console.error("Erro ao carregar kit da função:", erro))
      .finally(() => ativo && setCarregando(false));
    return () => { ativo = false; };
  }, [funcao.id]);

  const alternar = (id) =>
    setKit((atual) => {
      const novo = { ...atual };
      if (novo[id]) delete novo[id];
      else novo[id] = 1;
      return novo;
    });

  const mudarQuantidade = (id, valor) =>
    setKit((atual) => ({ ...atual, [id]: Math.max(1, parseInt(valor) || 1) }));

  const salvar = async () => {
    setSalvando(true);
    try {
      const itens = Object.entries(kit).map(([id, qtd]) => ({ id_epi: Number(id), quantidade: Number(qtd) }));
      await api.put(`/gerencial/funcao/${funcao.id}/kit`, { itens });
      mostrarToast("Kit da função salvo!", "sucesso");
      onClose();
    } catch (erro) {
      console.error("Erro ao salvar kit:", erro);
      mostrarToast("Não foi possível salvar o kit.", "erro");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 capitalize">
              Kit de EPI: {funcao.cargo}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" title="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {carregando ? (
            <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : epis.length === 0 ? (
            <p className="text-sm text-slate-500 text-center p-6">Nenhum EPI cadastrado.</p>
          ) : (
            epis.map((epi) => (
              <label
                key={epi.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <input type="checkbox" checked={Boolean(kit[epi.id])} onChange={() => alternar(epi.id)} className="w-4 h-4" />
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{epi.nome}</span>
                {kit[epi.id] && (
                  <input
                    type="number"
                    min="1"
                    value={kit[epi.id]}
                    onChange={(e) => mudarQuantidade(epi.id, e.target.value)}
                    className="w-20 h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm dark:text-white"
                    aria-label={`Quantidade de ${epi.nome}`}
                  />
                )}
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2.5 p-5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="h-[42px] px-5 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando || carregando}
            className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar kit</>}
          </button>
        </div>
      </div>
    </div>
  );
}
