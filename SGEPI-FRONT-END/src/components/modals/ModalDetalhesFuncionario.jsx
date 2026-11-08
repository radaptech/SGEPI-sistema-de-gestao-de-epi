import { X } from "lucide-react";
import Dialogo from "../Dialogo";

function ModalDetalhesFuncionario({ aberto, funcionario, onClose }) {
  if (!aberto || !funcionario) return null;

  return (
    <Dialogo onClose={onClose} className="fixed inset-0 z-[120] bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink ">
      <div className="w-full max-w-3xl bg-surface rounded-md shadow-modal border border-line overflow-hidden flex flex-col max-h-[95vh] transition-colors duration-300">
        <div className="px-6 sm:px-8 py-6 border-b border-line flex justify-between items-start shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-ink tracking-tight transition-colors">
                Detalhes do Funcionário
              </h3>
              <p className="text-sm text-ink-2 mt-1 transition-colors">
                Informações consolidadas do colaborador.
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

        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-sunken space-y-6 custom-scrollbar transition-colors duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <InfoCard
              label="Nome"
              value={funcionario.nome}
              isLarge
            />
            <InfoCard
              label="CPF"
              value={funcionario.cpf || "Não informado"}
              isMono
            />
            <InfoCard
              label="Matrícula"
              value={funcionario.matricula || "-"}
              isMono
            />
            <InfoCard
              label="Departamento"
              value={funcionario.departamentoNome || "-"}
            />
            <div className="md:col-span-2">
              <InfoCard
                label="Função"
                value={funcionario.funcaoNome || "-"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <KpiCard
              label="Entregas"
              value={funcionario.totalEntregas}
              className="border-line bg-sunken text-ink "
            />
            <KpiCard
              label="Devoluções"
              value={funcionario.totalDevolucoes}
              className="border-erro-line bg-erro-soft text-erro "
            />
            <KpiCard
              label="Última movimentação"
              value={funcionario.ultimaMovimentacao || "-"}
              className="border-ok-line bg-ok-soft text-ok "
              small
            />
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

function InfoCard({ label, value, isMono = false, isLarge = false }) {
  return (
    <div className="bg-surface p-4 sm:p-5 rounded-md border border-line transition-colors">
      <span className="block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5 transition-colors">
        {label}
      </span>
      <strong className={`${isLarge ? 'text-lg font-bold text-ink ' : 'text-sm font-bold text-ink '} ${isMono ? 'font-mono tracking-tight' : ''} block transition-colors`}>
        {value}
      </strong>
    </div>
  );
}

function KpiCard({ label, value, className = "", small = false }) {
  return (
    <div className={`rounded-md border p-4 sm:p-5  transition-colors ${className}`}>
      <span className="text-xs uppercase tracking-wide font-bold block mb-1.5 opacity-80">
        {label}
      </span>
      <strong className={`block font-bold ${small ? "text-lg" : "text-3xl"}`}>
        {value}
      </strong>
    </div>
  );
}

export default ModalDetalhesFuncionario;