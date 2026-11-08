import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, X } from "lucide-react";
import { api } from "../../services/api";
import { formatarDataParaGo } from "../../utils/entradaHelpers";
import { listar } from "../../services/listas";
import {
  normalizarFuncionario,
  normalizarEpi,
  normalizarTamanho,
  normalizarMotivo,
} from "../../services/DevolucaoModal";
import { useSignaturePad } from "../../hooks/useSignaturePad";
import Dialogo from "../Dialogo";
import EntregaHeader from "./entregas/EntregaHeader";
import EntregaFooter from "./entregas/EntregaFooter";
import ListaFuncionarios from "./entregas/ListaFuncionarios";
import AssinaturaPreview from "./entregas/AssinaturaPreview";
import ModalAssinatura from "./entregas/ModalAssinatura";
import ModalFoto from "./entregas/ModalFoto";

const MOTIVOS_PADRAO = [
  "Desgaste natural",
  "Dano ou Quebra",
  "Perda ou Roubo",
  "Vencimento do EPI / CA",
  "Desligamento da empresa",
  "Troca de função",
  "Tamanho Incorreto / Diferente",
  "Defeito de Fabricação",
  "Outros",
];

// data local (não UTC): depois das 21h o toISOString já seria o dia seguinte
function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputClass =
  "w-full px-4 h-[46px] rounded-md text-sm font-medium outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-surface border border-line focus:ring-1 focus:ring-ink focus:border-ink placeholder-ink-3";
const labelClass = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5";

function ModalBaixa({ onClose, onSalvar }) {
  const sig = useSignaturePad();
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState(null);
  const confirmacao = fotoCapturada || sig.assinaturaPreview;

  const [mostrandoAddMotivo, setMostrandoAddMotivo] = useState(false);
  const [novoMotivoNome, setNovoMotivoNome] = useState("");
  const [geraDescarteNovoMotivo, setGeraDescarteNovoMotivo] = useState(false);
  const [salvandoNovoMotivo, setSalvandoNovoMotivo] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);
  const [episFuncionario, setEpisFuncionario] = useState([]);
  const [episEstoque, setEpisEstoque] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [idFuncionario, setIdFuncionario] = useState("");
  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  const [idEpi, setIdEpi] = useState("");
  const [idTamanho, setIdTamanho] = useState("");
  const [quantidadeADevolver, setQuantidadeADevolver] = useState(1);
  const [idMotivo, setIdMotivo] = useState("");
  const [dataDevolucao, setDataDevolucao] = useState(hojeLocal);
  const [observacao, setObservacao] = useState("");
  const [houveTroca, setHouveTroca] = useState(false);
  const [idEpiNovo, setIdEpiNovo] = useState("");
  const [idTamanhoNovo, setIdTamanhoNovo] = useState("");
  const [quantidadeNova, setQuantidadeNova] = useState(1);
  const [tamanhosEstoqueNovo, setTamanhosEstoqueNovo] = useState([]);
  const [carregandoTamanhosNovo, setCarregandoTamanhosNovo] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    Promise.all([listar("/funcionarios"), listar("/epis"), listar("/motivos")])
      .then(([listaF, listaE, listaM]) => {
        setFuncionarios(listaF.map(normalizarFuncionario));
        setEpisEstoque(listaE.map(normalizarEpi));
        setMotivos(listaM.map(normalizarMotivo));
      })
      .catch(() => toast.error("Não foi possível carregar funcionários, EPIs e motivos. Feche e abra de novo."));
  }, []);

  useEffect(() => {
    if (!idFuncionario) {
      setEpisFuncionario([]);
      return;
    }
    listar(`/funcionarios/${idFuncionario}/epis`)
      .then((lista) => setEpisFuncionario(lista.map(normalizarEpi)))
      .catch(() => toast.error("Não foi possível carregar os EPIs deste funcionário."));
  }, [idFuncionario]);

  useEffect(() => {
    let ativo = true;
    if (!idEpiNovo || !houveTroca) {
      setTamanhosEstoqueNovo([]);
      return;
    }
    setCarregandoTamanhosNovo(true);
    api.get(`/tamanhos-id-epi/${idEpiNovo}`)
      .then((response) => {
        if (!ativo) return;
        setTamanhosEstoqueNovo((response ?? []).map((item) => ({
          id: item.id,
          tamanho: item.tamanho,
          saldo_atual: item.quantidade_atual,
        })));
      })
      .catch(() => {
        setTamanhosEstoqueNovo([]);
        toast.error("Não foi possível carregar os tamanhos do novo EPI.");
      })
      .finally(() => ativo && setCarregandoTamanhosNovo(false));
    return () => { ativo = false; };
  }, [idEpiNovo, houveTroca]);

  function escolherFuncionario(id) {
    setIdFuncionario(id);
    setIdEpi("");
    setIdTamanho("");
    setQuantidadeADevolver(1);
  }

  async function handleAddNovoMotivo() {
    if (!novoMotivoNome.trim()) return;
    try {
      setSalvandoNovoMotivo(true);
      const response = await api.post("/cadastrar-motivo-devolucao", {
        motivo: novoMotivoNome.trim(),
        gera_descarte: geraDescarteNovoMotivo,
      });
      const novoItem = normalizarMotivo(response);
      setMotivos((prev) => [...prev, novoItem]);
      setIdMotivo(novoItem.id);
      setNovoMotivoNome("");
      setGeraDescarteNovoMotivo(false);
      setMostrandoAddMotivo(false);
      toast.success("Motivo cadastrado.");
    } catch {
      // o api.js já mostrou o erro do servidor
    } finally {
      setSalvandoNovoMotivo(false);
    }
  }

  async function salvarBaixa() {
    if (!idFuncionario) return toast.warning("Selecione o funcionário.");
    if (!idEpi || !idTamanho) return toast.warning("Escolha o item devolvido e o tamanho.");
    if (!idMotivo) return toast.warning("Escolha o motivo da devolução.");
    if (!dataDevolucao) return toast.warning("Informe a data da devolução.");
    if (houveTroca && (!idEpiNovo || !idTamanhoNovo || !quantidadeNova)) {
      return toast.warning("Preencha o EPI novo, o tamanho e a quantidade da troca.");
    }
    if (!confirmacao) return toast.warning("Peça a assinatura do funcionário.");

    setCarregando(true);
    const payload = {
      id_funcionario: Number(idFuncionario),
      id_epi: Number(idEpi),
      id_motivo: Number(idMotivo),
      houve_troca: houveTroca,
      data_devolucao: formatarDataParaGo(dataDevolucao),
      id_tamanho: Number(idTamanho),
      quantidade_a_devolver: Number(quantidadeADevolver),
      id_epi_novo: houveTroca ? Number(idEpiNovo) : null,
      id_tamanho_novo: houveTroca ? Number(idTamanhoNovo) : null,
      quantidade_nova: houveTroca ? Number(quantidadeNova) : null,
      assinatura_digital: confirmacao,
      observacao: observacao?.trim() || null,
    };

    try {
      await api.post("/cadastro-devolucao", payload);
      toast.success(houveTroca ? "Devolução e troca registradas." : "Devolução registrada.");
      if (onSalvar) await onSalvar();
      onClose();
    } catch {
      // o api.js já mostrou o erro do servidor
    } finally {
      setCarregando(false);
    }
  }

  const funcionariosFiltrados = useMemo(() => {
    const termo = buscaFuncionario.toLowerCase().trim();
    return termo
      ? funcionarios.filter((f) => f.nome.toLowerCase().includes(termo) || String(f.matricula).includes(termo))
      : funcionarios;
  }, [funcionarios, buscaFuncionario]);

  const funcionarioSelecionado = useMemo(
    () => funcionarios.find((f) => Number(f.id) === Number(idFuncionario)) || null,
    [funcionarios, idFuncionario]
  );

  const epiSelecionado = useMemo(
    () => episFuncionario.find((e) => Number(e.id) === Number(idEpi)),
    [episFuncionario, idEpi]
  );

  const tamanhosFiltrados = useMemo(() => {
    if (!epiSelecionado) return [];
    const itens = epiSelecionado.tamanhos.map(normalizarTamanho);
    return itens.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
  }, [epiSelecionado]);

  const tamanhoNovoSelecionadoObj = useMemo(
    () => tamanhosEstoqueNovo.find((t) => Number(t.id) === Number(idTamanhoNovo)) || null,
    [tamanhosEstoqueNovo, idTamanhoNovo]
  );

  return (
    <>
      <Dialogo onClose={onClose} rotulo="Devolução" className="fixed inset-0 z-50 bg-overlay flex items-center justify-center p-4 sm:p-6 text-ink">
        <div className="bg-surface rounded-md shadow-modal w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-line">
          <EntregaHeader
            onClose={onClose}
            titulo="Devolução"
            subtitulo="Registre a devolução, troca ou descarte de um EPI."
          />

          <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-surface divide-y divide-line [&>*]:py-6 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <ListaFuncionarios
                buscaFuncionario={buscaFuncionario}
                setBuscaFuncionario={setBuscaFuncionario}
                funcionariosFiltrados={funcionariosFiltrados}
                funcionario={idFuncionario}
                setFuncionario={escolherFuncionario}
                funcionarioSelecionado={funcionarioSelecionado}
              />
              <div>
                <label htmlFor="baixa-data" className={labelClass}>Data da devolução</label>
                <input id="baixa-data" type="date" className={inputClass} value={dataDevolucao} max={hojeLocal()} onChange={(e) => setDataDevolucao(e.target.value)} />
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-base font-bold text-ink">Item devolvido</h3>
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_100px] gap-4">
                <div>
                  <label htmlFor="baixa-epi" className={labelClass}>EPI</label>
                  <select id="baixa-epi" className={inputClass} value={idEpi} onChange={(e) => { setIdEpi(e.target.value); setIdTamanho(""); setQuantidadeADevolver(1); }} disabled={!idFuncionario}>
                    <option value="">{idFuncionario ? "Selecione o EPI..." : "Selecione o funcionário primeiro"}</option>
                    {episFuncionario.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nome} {e.saldo_atual > 0 ? `(com ele: ${e.saldo_atual})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="baixa-tamanho" className={labelClass}>Tamanho</label>
                  <select id="baixa-tamanho" className={inputClass} value={idTamanho} onChange={(e) => { setIdTamanho(e.target.value); setQuantidadeADevolver(1); }} disabled={!idEpi}>
                    <option value="">{idEpi ? "Selecione..." : "Escolha o EPI"}</option>
                    {tamanhosFiltrados.map((t) => (
                      <option key={t.id} value={t.id}>{t.tamanho}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="baixa-qtd" className={labelClass}>Qtd.</label>
                  <input
                    id="baixa-qtd"
                    type="number"
                    min="1"
                    max={epiSelecionado?.saldo_atual || 1}
                    className={`${inputClass} font-mono tabular-nums`}
                    value={quantidadeADevolver}
                    onChange={(e) => {
                      const max = epiSelecionado?.saldo_atual || 1;
                      setQuantidadeADevolver(Math.min(parseInt(e.target.value) || 1, max));
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label htmlFor={mostrandoAddMotivo ? "baixa-motivo-novo" : "baixa-motivo"} className={`${labelClass} mb-0`}>Motivo</label>
                  <button
                    type="button"
                    onClick={() => { setMostrandoAddMotivo(!mostrandoAddMotivo); setGeraDescarteNovoMotivo(false); }}
                    className="text-xs text-ink-2 font-bold hover:text-ink underline-offset-2 hover:underline flex items-center gap-1"
                  >
                    {mostrandoAddMotivo ? <><X className="w-3 h-3" /> Cancelar</> : <><Plus className="w-3 h-3" /> Cadastrar novo motivo</>}
                  </button>
                </div>

                {!mostrandoAddMotivo ? (
                  <select id="baixa-motivo" className={inputClass} value={idMotivo} onChange={(e) => setIdMotivo(e.target.value)}>
                    <option value="">Selecione o motivo...</option>
                    {motivos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                ) : (
                  <div className="flex flex-col gap-3 bg-sunken p-4 rounded-md border border-line">
                    <div className="flex gap-2">
                      <input
                        id="baixa-motivo-novo"
                        autoFocus
                        list="baixa-motivos-sugeridos"
                        value={novoMotivoNome}
                        onChange={(e) => setNovoMotivoNome(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNovoMotivo()}
                        placeholder="Digite ou escolha uma sugestão"
                        className={inputClass}
                      />
                      <datalist id="baixa-motivos-sugeridos">
                        {MOTIVOS_PADRAO.map((m) => <option key={m} value={m} />)}
                      </datalist>
                      <button
                        type="button"
                        onClick={handleAddNovoMotivo}
                        disabled={salvandoNovoMotivo || !novoMotivoNome.trim()}
                        className="px-5 h-[46px] bg-action hover:bg-action-hover text-on-action rounded-md font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {salvandoNovoMotivo ? "Salvando..." : "Adicionar"}
                      </button>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium text-ink-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={geraDescarteNovoMotivo}
                        onChange={(e) => setGeraDescarteNovoMotivo(e.target.checked)}
                        className="rounded border-line-strong text-ink focus:ring-ink bg-surface"
                      />
                      Este motivo inutiliza o EPI (ele não volta para o estoque)
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <label className="flex items-center gap-3 text-sm font-bold text-ink cursor-pointer w-fit">
                <input type="checkbox" checked={houveTroca} onChange={(e) => setHouveTroca(e.target.checked)} className="rounded border-line-strong text-ink focus:ring-ink w-4 h-4 bg-surface" />
                Entregar um EPI novo no lugar (troca)
              </label>

              {houveTroca && (
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_100px] gap-4">
                  <div>
                    <label htmlFor="baixa-epi-novo" className={labelClass}>EPI novo</label>
                    <select id="baixa-epi-novo" className={inputClass} value={idEpiNovo} onChange={(e) => { setIdEpiNovo(e.target.value); setIdTamanhoNovo(""); setQuantidadeNova(1); }}>
                      <option value="">Selecione...</option>
                      {episEstoque.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="baixa-tamanho-novo" className={labelClass}>Tamanho</label>
                    <select id="baixa-tamanho-novo" className={inputClass} value={idTamanhoNovo} onChange={(e) => { setIdTamanhoNovo(e.target.value); setQuantidadeNova(1); }} disabled={!idEpiNovo || carregandoTamanhosNovo}>
                      <option value="">{carregandoTamanhosNovo ? "Carregando..." : "Selecione..."}</option>
                      {tamanhosEstoqueNovo.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tamanho} {t.saldo_atual !== undefined ? `(estoque: ${t.saldo_atual})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="baixa-qtd-nova" className={labelClass}>Qtd.</label>
                    <input
                      id="baixa-qtd-nova"
                      type="number"
                      min="1"
                      max={tamanhoNovoSelecionadoObj?.saldo_atual || 1}
                      className={`${inputClass} font-mono tabular-nums`}
                      value={quantidadeNova}
                      onChange={(e) => {
                        let val = parseInt(e.target.value) || 1;
                        const max = tamanhoNovoSelecionadoObj?.saldo_atual;
                        if (max !== undefined && val > max) val = max;
                        setQuantidadeNova(val);
                      }}
                      disabled={!idTamanhoNovo}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="baixa-obs" className={labelClass}>Observações (opcional)</label>
                <textarea id="baixa-obs" className={`${inputClass} h-auto py-3 resize-none min-h-[80px]`} placeholder="Detalhes sobre a devolução..." value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              </div>
            </div>

            <AssinaturaPreview
              titulo="Confirmação da devolução"
              assinaturaPreview={confirmacao}
              limparAssinatura={() => (fotoCapturada ? setFotoCapturada(null) : sig.limparAssinatura())}
              abrirAssinatura={sig.abrirModalAssinatura}
              abrirCamera={() => setModalFotoAberto(true)}
            />
          </div>

          <EntregaFooter
            onClose={onClose}
            onSalvar={salvarBaixa}
            carregando={carregando}
            rotulo={houveTroca ? "Confirmar devolução e troca" : "Confirmar devolução"}
          />
        </div>
      </Dialogo>

      <ModalAssinatura
        aberto={sig.modalAssinaturaAberto}
        isMobileViewport={sig.isMobileViewport}
        canvasRef={sig.canvasRef}
        canvasWrapperRef={sig.canvasWrapperRef}
        startDrawing={sig.startDrawing}
        draw={sig.draw}
        finishDrawing={sig.finishDrawing}
        assinaturaVazia={sig.assinaturaVazia}
        ferramentaAtiva={sig.ferramentaAtiva}
        setFerramentaAtiva={sig.setFerramentaAtiva}
        limparAssinatura={sig.limparAssinatura}
        concluirAssinatura={sig.concluirAssinatura}
        fecharAssinatura={sig.fecharModalAssinatura}
        painelFerramentasAberto={sig.painelFerramentasAberto}
        setPainelFerramentasAberto={sig.setPainelFerramentasAberto}
      />

      <ModalFoto
        aberto={modalFotoAberto}
        fecharFoto={() => setModalFotoAberto(false)}
        onFotoCapturada={(url) => setFotoCapturada(url)}
      />
    </>
  );
}

export default ModalBaixa;
