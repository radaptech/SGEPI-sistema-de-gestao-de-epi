import { useEffect, useState } from "react";
import { X, ShieldPlus, ShieldAlert, CheckCircle2, Loader2, PenLine } from "lucide-react";
import { api } from "../../services/api";
import Dialogo from "../Dialogo";
import Selecao from "../Selecao";
import Campo, { inputClass } from "../Campo";
import formatarData from "../../utils/DatasFormater";
import CampoCa from "./epi/CampoCa";
import GradeTamanhos from "./epi/GradeTamanhos";

// dd/mm/aaaa (API) -> aaaa-mm-dd (input date)
const paraInput = (dataBR) => {
  if (!dataBR || !dataBR.includes("/")) return "";
  const [d, m, a] = dataBR.split("/");
  return `${a}-${m}-${d}`;
};

const FORM_VAZIO = {
  nome: "",
  fabricante: "",
  ca: "",
  descricao: "",
  data_validade_ca: "",
  id_tamanho: [],
  id_protecao: "",
  alerta_minimo: "",
  vida_util_dias: "",
};

function validar(form) {
  const erros = {};
  if (!form.nome.trim()) erros.nome = "Informe o nome do EPI.";
  if (!form.id_protecao) erros.id_protecao = "Selecione o tipo de proteção.";
  if (!form.fabricante.trim()) erros.fabricante = "Informe o fabricante.";
  if (!String(form.ca).replace(/\D/g, "")) erros.ca = "Informe o número do CA.";
  if (!form.data_validade_ca) erros.data_validade_ca = "Informe a validade do CA.";
  if (!form.id_tamanho.length) erros.id_tamanho = "Selecione pelo menos um tamanho.";
  if (form.alerta_minimo !== "" && form.alerta_minimo !== null && Number(form.alerta_minimo) < 0) {
    erros.alerta_minimo = "O alerta mínimo não pode ser negativo.";
  }
  const vida = Number(form.vida_util_dias);
  if (form.vida_util_dias !== "" && !(Number.isInteger(vida) && vida >= 0)) {
    erros.vida_util_dias = "Informe a vida útil em dias inteiros (vazio = sem troca periódica).";
  }
  return erros;
}

function ModalNovoEpi({ onClose, onSalvar, epiParaEditar }) {
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [tiposProtecao, setTiposProtecao] = useState([]);
  const [tamanhos, setTamanhos] = useState([]);
  const [erros, setErros] = useState({});
  const [infoCa, setInfoCa] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);

  useEffect(() => {
    (async () => {
      setCarregandoDados(true);
      try {
        const [resProtecoes, resTamanhos] = await Promise.all([api.get("/protecoes"), api.get("/tamanhos")]);
        setTiposProtecao(Array.isArray(resProtecoes) ? resProtecoes : []);
        setTamanhos(Array.isArray(resTamanhos) ? resTamanhos : []);
        if (epiParaEditar) {
          setForm({
            nome: epiParaEditar.nome || "",
            fabricante: epiParaEditar.fabricante || "",
            ca: epiParaEditar.ca || "",
            descricao: epiParaEditar.descricao || "",
            data_validade_ca: paraInput(epiParaEditar.data_validadeCa),
            id_protecao: epiParaEditar.protecao?.id || "",
            id_tamanho: epiParaEditar.tamanhos?.map((t) => t.id) || [],
            alerta_minimo: epiParaEditar.alerta_minimo || "",
            vida_util_dias: epiParaEditar.vida_util_dias || "",
          });
        }
      } catch {
        // o api.js já mostrou o erro
      } finally {
        setCarregandoDados(false);
      }
    })();
  }, [epiParaEditar]);

  const limparErros = (campos) =>
    setErros((atuais) => {
      const novos = { ...atuais };
      campos.forEach((c) => delete novos[c]);
      return novos;
    });

  // campos pode ser função do form atual: usado depois de await, quando o form da renderização já pode estar velho
  const atualizar = (campos, chaves = Object.keys(campos)) => {
    setForm((atual) => ({ ...atual, ...(typeof campos === "function" ? campos(atual) : campos) }));
    limparErros(chaves);
  };

  // Preenche nome, fabricante e validade com o que está na base do MTE
  const consultarCa = async () => {
    if (!form.ca) return setInfoCa(null);
    setInfoCa("carregando");
    try {
      const dados = await api.get(`/gerencial/caepi/${form.ca}`); // 204 (null) = fora da base
      if (!dados) return setInfoCa("nao-encontrado");
      atualizar(
        (atual) => ({
          nome: dados.equipamento,
          fabricante: dados.fabricante.slice(0, 100), // limite do back; há razão social maior na base
          data_validade_ca: paraInput(dados.validade),
          // grupo da NR-6 deduzido do nome do equipamento; sem sugestão, mantém o que já estava
          id_protecao: dados.id_protecao_sugerida ?? atual.id_protecao,
        }),
        ["nome", "fabricante", "data_validade_ca", "id_protecao"]
      );
      setInfoCa(dados);
    } catch {
      setInfoCa(null); // o api já mostrou o erro
    }
  };

  const alternarTamanho = (id) =>
    atualizar(({ id_tamanho }) => ({ id_tamanho: id_tamanho.includes(id) ? id_tamanho.filter((i) => i !== id) : [...id_tamanho, id] }), ["id_tamanho"]);

  const salvar = async () => {
    const novosErros = validar(form);
    setErros(novosErros);
    if (Object.keys(novosErros).length) return;

    const comum = {
      nome: form.nome.trim(),
      fabricante: form.fabricante.trim(),
      ca: String(form.ca).replace(/\D/g, ""),
      descricao: form.descricao || "",
      id_protecao: Number(form.id_protecao),
      alerta_minimo: Number(form.alerta_minimo || 0),
      vida_util_dias: Number(form.vida_util_dias || 0), // 0 = sem troca periódica
    };
    const validade = formatarData(form.data_validade_ca);
    const tamanhosIds = form.id_tamanho.map(Number);

    try {
      setSalvando(true);
      // cadastro e edição usam nomes diferentes para validade e tamanhos
      if (epiParaEditar) {
        await api.patch(`/gerencial/epi/${epiParaEditar.id}`, { ...comum, validade_ca: validade, tamanhos: tamanhosIds });
      } else {
        await api.post("/gerencial/cadastro-epi", { ...comum, data_validade_ca: validade, id_tamanho: tamanhosIds });
      }
      onSalvar?.();
      onClose();
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  const campoTexto = (campo, props) => (
    <input id={`novoepi-${campo}`} value={form[campo]} onChange={(e) => atualizar({ [campo]: e.target.value })} className={inputClass(erros[campo])} {...props} />
  );

  return (
    <Dialogo onClose={onClose} className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink">
      <div className="bg-surface w-full max-w-4xl rounded-md shadow-modal border border-line overflow-hidden flex flex-col max-h-[95vh]">
        <div className="px-6 sm:px-8 py-6 border-b border-line flex items-start justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${epiParaEditar ? "bg-atencao-soft text-atencao" : "bg-sunken text-ink"}`}>
              {epiParaEditar ? <PenLine className="w-6 h-6" strokeWidth={2.5} /> : <ShieldPlus className="w-6 h-6" strokeWidth={2.5} />}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-ink tracking-tight">{epiParaEditar ? `Editar: ${epiParaEditar.nome}` : "Cadastrar Novo EPI"}</h3>
              <p className="text-sm text-ink-2 mt-1">Gestão de Equipamentos de Proteção.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-ink-3 hover:text-ink-2 hover:bg-sunken rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-sunken custom-scrollbar">
          {carregandoDados ? (
            <div className="h-full flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-ink-3 mb-4" />
              <p className="text-ink-2 font-medium">Carregando dados do formulário...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <section className="bg-surface p-6 sm:p-7 rounded-md border border-line">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldAlert className="w-4 h-4 text-ink-3" />
                  <h4 className="text-sm font-bold tracking-wide text-ink-2 uppercase">Identificação</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <Campo id="novoepi-nome" rotulo="Nome do EPI" obrigatorio erro={erros.nome} className="md:col-span-2">
                    {campoTexto("nome", { type: "text", placeholder: "Ex: Capacete de segurança" })}
                  </Campo>
                  <Campo id="novoepi-protecao" rotulo="Tipo de Proteção" obrigatorio erro={erros.id_protecao}>
                    <Selecao
                      id="novoepi-protecao"
                      value={form.id_protecao}
                      onChange={(e) => atualizar({ id_protecao: e.target.value })}
                      className={inputClass(erros.id_protecao)}
                    >
                      <option value="">Selecione...</option>
                      {tiposProtecao.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </Selecao>
                  </Campo>
                  <Campo id="novoepi-fabricante" rotulo="Fabricante" obrigatorio erro={erros.fabricante}>
                    {campoTexto("fabricante", { type: "text", placeholder: "Ex: 3M" })}
                  </Campo>
                </div>
              </section>

              <section className="bg-surface p-6 sm:p-7 rounded-md border border-line">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                  <CampoCa
                    valor={form.ca}
                    onChange={(ca) => {
                      atualizar({ ca });
                      setInfoCa(null); // a situação mostrada era do CA anterior
                    }}
                    onBuscar={consultarCa}
                    info={infoCa}
                    erro={erros.ca}
                  />
                  <Campo id="novoepi-data_validade_ca" rotulo="Validade do CA" obrigatorio erro={erros.data_validade_ca}>
                    {campoTexto("data_validade_ca", { type: "date" })}
                  </Campo>
                  <Campo id="novoepi-alerta_minimo" rotulo="Alerta Estoque Mín." erro={erros.alerta_minimo}>
                    {campoTexto("alerta_minimo", { type: "number", min: "0", placeholder: "Ex: 10" })}
                  </Campo>
                  <Campo id="novoepi-vida_util_dias" rotulo="Vida Útil (dias)" erro={erros.vida_util_dias}>
                    {campoTexto("vida_util_dias", { type: "number", min: "0", step: "1", placeholder: "Ex: 180 (vazio = sem troca)" })}
                  </Campo>
                  <Campo id="novoepi-descricao" rotulo="Descrição do Equipamento" className="md:col-span-3">
                    <textarea
                      id="novoepi-descricao"
                      value={form.descricao}
                      onChange={(e) => atualizar({ descricao: e.target.value })}
                      className={`${inputClass()} !h-auto py-3 min-h-[100px] resize-none`}
                      maxLength={250}
                      placeholder="Observações ou detalhes adicionais do equipamento..."
                    />
                  </Campo>
                </div>
              </section>

              <GradeTamanhos
                tamanhos={tamanhos}
                setTamanhos={setTamanhos}
                selecionados={form.id_tamanho}
                onAlternar={alternarTamanho}
                onAdicionado={(id) => atualizar(({ id_tamanho }) => ({ id_tamanho: [...id_tamanho, id] }), ["id_tamanho"])}
                erro={erros.id_tamanho}
              />
            </div>
          )}
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-line flex flex-col sm:flex-row sm:justify-end gap-3 bg-surface shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-sunken text-ink text-sm font-bold rounded-md hover:bg-line transition-colors w-full sm:w-auto order-2 sm:order-1"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando || carregandoDados}
            className="px-8 py-2.5 flex items-center justify-center gap-2 bg-action hover:bg-action-hover text-on-action font-bold rounded-md text-sm transition-all w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> {epiParaEditar ? "Atualizar EPI" : "Salvar Equipamento"}
              </>
            )}
          </button>
        </div>
      </div>
    </Dialogo>
  );
}

export default ModalNovoEpi;
