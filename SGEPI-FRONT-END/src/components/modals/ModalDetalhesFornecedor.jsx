import { X } from "lucide-react";
import Dialogo from "../Dialogo";

function ModalDetalhesFornecedor({ aberto, fornecedor, onClose }) {
  if (!aberto || !fornecedor) return null;

  const InfoCard = ({ label, value, isMono = false, isLarge = false }) => (
    <div className="bg-surface p-4 sm:p-5 rounded-md border border-line transition-colors">
      <span className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 transition-colors">
        {label}
      </span>
      <strong className={`${isLarge ? 'text-lg font-bold text-ink ' : 'text-sm font-bold text-ink '} ${isMono ? 'font-mono tracking-tight' : ''} block transition-colors`}>
        {value}
      </strong>
    </div>
  );

  return (
    <Dialogo onClose={onClose} className="fixed inset-0 z-[120] bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink ">
      <div className="w-full max-w-2xl bg-surface rounded-md shadow-modal border border-line overflow-hidden flex flex-col max-h-[95vh] transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-ink tracking-tight transition-colors">
                Detalhes do Fornecedor
              </h3>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Informações completas do cadastro.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors shrink-0"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-sunken space-y-4 sm:space-y-5 custom-scrollbar transition-colors duration-300">
          <InfoCard 
            label="Razão Social" 
            value={fornecedor.razao_social || "-"} 
            isLarge={true} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <InfoCard 
              label="Nome Fantasia" 
              value={fornecedor.nome_fantasia || "-"} 
            />
            
            <InfoCard 
              label="CNPJ" 
              value={fornecedor.cnpj || "-"} 
              isMono={true} 
            />

            <div className="md:col-span-2">
              <InfoCard 
                label="Inscrição Estadual" 
                value={fornecedor.inscricao_estadual || "-"} 
              />
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-line flex justify-end bg-surface shrink-0 rounded-b-md transition-colors duration-300">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-sunken text-ink text-sm font-bold rounded-md hover:bg-line transition-colors w-full sm:w-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </Dialogo>
  );
}

export default ModalDetalhesFornecedor;