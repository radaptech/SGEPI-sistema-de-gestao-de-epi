import { useState } from "react";
import AbaDepartamentos from "./administracao/AbaDepartamento";
import AbaFuncoes from "./administracao/AbaFuncoes";
import AbaFuncionarios from "./administracao/AbaFuncionario";
import AbaEpis from "./administracao/AbaEpi";
import AbaFornecedores from "./administracao/AbaFornecedores";
import { Factory, Building2, Briefcase, Users, ShieldCheck } from "lucide-react";

function Administracao() {
  const [abaAtiva, setAbaAtiva] = useState("fornecedores");

  const tabs = [
    { id: "fornecedores", label: "Fornecedores", icone: <Factory className="w-4 h-4" /> },
    { id: "departamentos", label: "Departamentos", icone: <Building2 className="w-4 h-4" /> },
    { id: "funcoes", label: "Funções", icone: <Briefcase className="w-4 h-4" /> },
    { id: "funcionarios", label: "Funcionários", icone: <Users className="w-4 h-4" /> },
    { id: "epis", label: "EPIs", icone: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-full">
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-ink tracking-tight transition-colors">
              Painel Administrativo
            </h2>
            <p className="text-sm text-ink-2 mt-1 transition-colors">
              Gerencie os cadastros base conforme a estrutura do sistema.
            </p>
          </div>
        </div>
      </div>

      <div role="tablist" className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-line mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={abaAtiva === tab.id}
            onClick={() => setAbaAtiva(tab.id)}
            className={`shrink-0 flex items-center gap-2 h-11 px-3 border-b-2 -mb-px text-sm transition-colors ${
              abaAtiva === tab.id
                ? "border-ink text-ink font-semibold"
                : "border-transparent text-ink-2 hover:text-ink hover:border-line-strong"
            }`}
          >
            {tab.icone}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 transition-all duration-300">
        {abaAtiva === "fornecedores" && <AbaFornecedores />}
        {abaAtiva === "departamentos" && <AbaDepartamentos />}
        {abaAtiva === "funcoes" && <AbaFuncoes />}
        {abaAtiva === "funcionarios" && <AbaFuncionarios />}
        {abaAtiva === "epis" && <AbaEpis />}
      </div>
    </div>
  );
}

export default Administracao;