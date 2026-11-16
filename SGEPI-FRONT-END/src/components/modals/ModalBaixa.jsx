import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
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
import Selecao from "../Selecao";

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
  const motivoSelecionado = motivos.find((m) => String(m.id) === String(idMotivo));
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
                  <Selecao id="baixa-epi" className={inputClass} value={idEpi} onChange={(e) => { setIdEpi(e.target.value); setIdTamanho(""); setQuantidadeADevolver(1); }} disabled={!idFuncionario}>
                    <option value="">{idFuncionario ? "Selecione o EPI..." : "Selecione o funcionário primeiro"}</option>
                    {episFuncionario.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nome} {e.saldo_atual > 0 ? `(com ele: ${e.saldo_atual})` : ""}
                      </option>
                    ))}
                  </Selecao>
                </div>
                <div>
                  <label htmlFor="baixa-tamanho" className={labelClass}>Tamanho</label>
                  <Selecao id="baixa-tamanho" className={inputClass} value={idTamanho} onChange={(e) => { setIdTamanho(e.target.value); setQuantidadeADevolver(1); }} disabled={!idEpi}>
                    <option value="">{idEpi ? "Selecione..." : "Escolha o EPI"}</option>
                    {tamanhosFiltrados.map((t) => (
                      <option key={t.id} value={t.id}>{t.tamanho}</option>
                    ))}
                  </Selecao>
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
                <label htmlFor="baixa-motivo" className={labelClass}>Motivo</label>
                <Selecao id="baixa-motivo" className={inputClass} value={idMotivo} onChange={(e) => setIdMotivo(e.target.value)}>
                  <option value="">Selecione o motivo...</option>
                  <optgroup label="Volta para o estoque">
                    {motivos.filter((m) => !m.descarte).map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </optgroup>
                  <optgroup label="Descarte (não volta para o estoque)">
                    {motivos.filter((m) => m.descarte).map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </optgroup>
                </Selecao>
                {motivoSelecionado && (
                  <p className="mt-1.5 text-xs text-ink-3">
                    {motivoSelecionado.descarte
                      ? "O EPI devolvido será descartado e não volta para o estoque."
                      : "O EPI devolvido volta para o estoque."}
                  </p>
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
                    <Selecao id="baixa-epi-novo" className={inputClass} value={idEpiNovo} onChange={(e) => { setIdEpiNovo(e.target.value); setIdTamanhoNovo(""); setQuantidadeNova(1); }}>
                      <option value="">Selecione...</option>
                      {episEstoque.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                    </Selecao>
                  </div>
                  <div>
                    <label htmlFor="baixa-tamanho-novo" className={labelClass}>Tamanho</label>
                    <Selecao id="baixa-tamanho-novo" className={inputClass} value={idTamanhoNovo} onChange={(e) => { setIdTamanhoNovo(e.target.value); setQuantidadeNova(1); }} disabled={!idEpiNovo || carregandoTamanhosNovo}>
                      <option value="">{carregandoTamanhosNovo ? "Carregando..." : "Selecione..."}</option>
                      {tamanhosEstoqueNovo.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tamanho} {t.saldo_atual !== undefined ? `(estoque: ${t.saldo_atual})` : ""}
                        </option>
                      ))}
                    </Selecao>
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
