import { X, RefreshCcw, Info, PackageMinus } from "lucide-react";
import Dialogo from "../Dialogo";

function ModalDetalhesTroca({ aberto, devolucao, onClose }) {
  if (!aberto || !devolucao) return null;

  return (
    <Dialogo onClose={onClose} className="fixed inset-0 z-[60] bg-overlay flex items-center justify-center p-4 text-ink ">
      <div className="w-full max-w-sm bg-surface rounded-md shadow-modal border border-line overflow-hidden flex flex-col transition-colors duration-300">
        <div className="px-6 py-5 border-b border-line flex justify-between items-center bg-surface shrink-0 transition-colors duration-300">
          <h3 className="font-bold text-ink flex items-center gap-2.5 text-lg transition-colors">
            {devolucao.houve_troca ? (
              <><RefreshCcw className="w-5 h-5 text-ok" /> Detalhes da Troca</>
            ) : (
              <><Info className="w-5 h-5 text-ink-3" /> Informação</>
            )}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 text-sm text-ink-2 bg-sunken transition-colors">
          {devolucao.houve_troca ? (
            <div className="space-y-4">
              <p className="leading-relaxed">
                O funcionário devolveu um item antigo e recebeu um novo EPI no mesmo momento:
              </p>
              
              <div className="bg-ok-soft border border-ok-line p-5 rounded-md transition-colors">
                <span className="block text-xs text-ok font-bold uppercase tracking-wide mb-1.5 transition-colors">
                  EPI Entregue
                </span>
                <div className="font-bold text-ok text-base transition-colors">
                  {devolucao.epi_novo_nome}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-ok-line transition-colors">
                  <div>
                    <span className="block text-xs text-ok uppercase tracking-wide font-bold mb-1 transition-colors">
                      Tamanho
                    </span>
                    <span className="font-bold text-ok transition-colors">
                      {devolucao.tamanho_novo_nome}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-ok uppercase tracking-wide font-bold mb-1 transition-colors">
                      Quantidade
                    </span>
                    <span className="font-bold text-ok transition-colors">
                      {devolucao.quantidade_nova || 0} un.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="bg-sunken w-16 h-16 rounded-md flex items-center justify-center mx-auto mb-5 border border-line text-ink-3 transition-colors">
                <PackageMinus className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <h4 className="font-bold text-ink text-base mb-2 transition-colors">
                Sem troca registrada
              </h4>
              <p className="text-ink-2 leading-relaxed transition-colors">
                Esta devolução não gerou uma troca por um novo EPI. O item foi apenas devolvido ao estoque ou descartado.
              </p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-5 border-t border-line flex justify-end bg-surface shrink-0 rounded-b-md transition-colors duration-300">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-sunken text-ink font-bold rounded-md hover:bg-line transition-colors w-full sm:w-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </Dialogo>
  );
}

export default ModalDetalhesTroca;