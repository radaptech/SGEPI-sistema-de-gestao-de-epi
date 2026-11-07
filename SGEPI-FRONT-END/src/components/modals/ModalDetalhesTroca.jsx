import { X, RefreshCcw, Info, PackageMinus } from "lucide-react";

function ModalDetalhesTroca({ aberto, devolucao, onClose }) {
  if (!aberto || !devolucao) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in text-slate-700 dark:text-slate-300">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-800 overflow-hidden flex flex-col transition-colors duration-300">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0 transition-colors duration-300">
          <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 text-lg transition-colors">
            {devolucao.houve_troca ? (
              <><RefreshCcw className="w-5 h-5 text-emerald-500" /> Detalhes da Troca</>
            ) : (
              <><Info className="w-5 h-5 text-slate-400" /> Informação</>
            )}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 text-sm text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
          {devolucao.houve_troca ? (
            <div className="space-y-4">
              <p className="leading-relaxed">
                O funcionário devolveu um item antigo e recebeu um novo EPI no mesmo momento:
              </p>
              
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-900/30 p-5 rounded-2xl shadow-sm transition-colors">
                <span className="block text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest mb-1.5 transition-colors">
                  EPI Entregue
                </span>
                <div className="font-extrabold text-emerald-900 dark:text-emerald-400 text-base transition-colors">
                  {devolucao.epi_novo_nome}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/50 transition-colors">
                  <div>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest font-bold mb-1 transition-colors">
                      Tamanho
                    </span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 transition-colors">
                      {devolucao.tamanho_novo_nome}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-widest font-bold mb-1 transition-colors">
                      Quantidade
                    </span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 transition-colors">
                      {devolucao.quantidade_nova || 0} un.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 transition-colors">
                <PackageMinus className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h4 className="font-extrabold text-slate-800 dark:text-white text-base mb-2 transition-colors">
                Sem troca registrada
              </h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
                Esta devolução não gerou uma troca por um novo EPI. O item foi apenas devolvido ao estoque ou descartado.
              </p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800/60 flex justify-end bg-white dark:bg-slate-900 shrink-0 rounded-b-3xl transition-colors duration-300">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalDetalhesTroca;