import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { formatarDataParaGo } from "../../utils/entradaHelpers";
import Toast from "../Toast";
import { listar } from "../../services/listas";
import {
  normalizarFuncionario,
  normalizarEpi,
  normalizarTamanho,
  normalizarMotivo,
} from "../../services/DevolucaoModal";

import { useSignaturePad } from "../../hooks/useSignaturePad";

import {
  X, PackageMinus, Search, Plus,
  RotateCcw, PenLine, Eraser, CheckCircle2
} from "lucide-react";

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

function ModalBaixa({ onClose, onSalvar }) {
  const sig = useSignaturePad();
  const [mostrandoAddMotivo, setMostrandoAddMotivo] = useState(false);
  const [novoMotivoNome, setNovoMotivoNome] = useState("");
  const [geraDescarteNovoMotivo, setGeraDescarteNovoMotivo] = useState(false);
  const [salvandoNovoMotivo, setSalvandoNovoMotivo] = useState(false);
  const [notificacao, setNotificacao] = useState({ exibir: false, type: "success", message: "" });
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
  const [dataDevolucao, setDataDevolucao] = useState(new Date().toISOString().split("T")[0]);
  const [observacao, setObservacao] = useState("");
  const [houveTroca, setHouveTroca] = useState(false);
  const [idEpiNovo, setIdEpiNovo] = useState("");
  const [idTamanhoNovo, setIdTamanhoNovo] = useState("");
  const [quantidadeNova, setQuantidadeNova] = useState(1);
  const [tamanhosEstoqueNovo, setTamanhosEstoqueNovo] = useState([]);
  const [carregandoTamanhosNovo, setCarregandoTamanhosNovo] = useState(false);
  const [carregando, setCarregando] = useState(false);


  useEffect(() => {
    async function carregarDadosIniciais() {
      const [listaF, listaE, listaM] = await Promise.all([
        listar("/funcionarios"),
        listar("/epis"),
        listar("/motivos"),
      ]);

      setFuncionarios(listaF.map(normalizarFuncionario));
      setEpisEstoque(listaE.map(normalizarEpi));
      setMotivos(listaM.map(normalizarMotivo));
    }
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    if (!idFuncionario) {
      setIdEpi("");
      setEpisFuncionario([]);
      return;
    }
    listar(`/funcionarios/${idFuncionario}/epis`).then((lista) => {
      setEpisFuncionario(lista.map(normalizarEpi));
    });
  }, [idFuncionario]);

  useEffect(() => {
    let ativo = true;
    async function buscarTamanhosNovoEpi() {
      if (!idEpiNovo || !houveTroca) {
        setTamanhosEstoqueNovo([]);
        return;
      }
      try {
        setCarregandoTamanhosNovo(true);
        const response = await api.get(`/tamanhos-id-epi/${idEpiNovo}`);
        if (!ativo) return;

        setTamanhosEstoqueNovo((response ?? []).map((item) => ({
          id: item.id,
          tamanho: item.tamanho,
          saldo_atual: item.quantidade_atual,
        })));
      } catch (err) {
        console.error("Erro ao buscar tamanhos do novo EPI:", err);
        setTamanhosEstoqueNovo([]);
      } finally {
        if (ativo) setCarregandoTamanhosNovo(false);
      }
    }
    buscarTamanhosNovoEpi();
    return () => { ativo = false; };
  }, [idEpiNovo, houveTroca]);


  async function handleAddNovoMotivo() {
    if (!novoMotivoNome) return;
    try {
      setSalvandoNovoMotivo(true);
      const response = await api.post("/cadastrar-motivo-devolucao", {
        motivo: novoMotivoNome,
        gera_descarte: geraDescarteNovoMotivo
      });

      const novoItem = normalizarMotivo(response);
      setMotivos(prev => [...prev, novoItem]);
      setIdMotivo(novoItem.id);
      setNovoMotivoNome("");
      setGeraDescarteNovoMotivo(false);
      setMostrandoAddMotivo(false);
      setNotificacao({ exibir: true, type: "success", message: "Motivo cadastrado com sucesso!" });
    } catch {
      // o api.js já mostrou o erro do servidor
    } finally {
      setSalvandoNovoMotivo(false);
    }
  }

  async function salvarBaixa() {
    if (!idFuncionario || !idEpi || !idMotivo || !dataDevolucao || !idTamanho) {
      return setNotificacao({ exibir: true, type: "warning", message: "Preencha todos os campos obrigatórios." });
    }
    if (houveTroca && (!idEpiNovo || !idTamanhoNovo || !quantidadeNova)) {
      return setNotificacao({ exibir: true, type: "warning", message: "Preencha os dados da Troca (EPI Novo, Tamanho e Quantidade)." });
    }
    if (!sig.assinaturaPreview) {
      return setNotificacao({ exibir: true, type: "warning", message: "A assinatura do colaborador é obrigatória." });
    }

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
      assinatura_digital: sig.assinaturaPreview,
      observacao: observacao?.trim() || null,
    };

    try {
      await api.post("/cadastro-devolucao", payload);
      setNotificacao({ exibir: true, type: "success", message: "Baixa realizada com sucesso!" });
      setTimeout(async () => {
        if (onSalvar) await onSalvar();
        onClose();
      }, 2000);
    } catch {
      // o api.js já mostrou o erro do servidor
    } finally {
      setCarregando(false);
    }
  }

  const funcionariosFiltrados = useMemo(() => {
    const termo = buscaFuncionario.toLowerCase().trim();
    return termo
      ? funcionarios.filter(f => f.nome.toLowerCase().includes(termo) || String(f.matricula).includes(termo))
      : funcionarios;
  }, [funcionarios, buscaFuncionario]);

  const epiSelecionado = useMemo(() => episFuncionario.find(e => Number(e.id) === Number(idEpi)), [episFuncionario, idEpi]);

  const tamanhosFiltrados = useMemo(() => {
    if (!epiSelecionado) return [];
    const itens = epiSelecionado.tamanhos.map(normalizarTamanho);
    return itens.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  }, [epiSelecionado]);

  const tamanhoNovoSelecionadoObj = useMemo(() => {
    return tamanhosEstoqueNovo.find(t => Number(t.id) === Number(idTamanhoNovo)) || null;
  }, [tamanhosEstoqueNovo, idTamanhoNovo]);


  function renderBotoesSidebarMobile() {
    return (
      <aside className="w-[78px] h-full absolute top-0 right-0 z-20 border-l border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 rounded-l-3xl shadow-lg flex flex-col items-center py-3 px-1 transition-colors duration-300">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest rotate-90 mt-6 mb-10">Ferramentas</div>
        <div className="flex-1 flex flex-col items-center justify-start gap-4 w-full">
          <button type="button" onClick={() => sig.setFerramentaAtiva("caneta")} className={`w-[60px] h-[44px] rounded-xl text-[10px] font-bold transition-all rotate-90 flex items-center justify-center gap-1.5 ${sig.ferramentaAtiva === "caneta" ? "bg-red-600 text-white shadow-md shadow-red-600/20" : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"}`}><PenLine className="w-3.5 h-3.5" /> Caneta</button>
          <button type="button" onClick={() => sig.setFerramentaAtiva("borracha")} className={`w-[60px] h-[44px] rounded-xl text-[10px] font-bold transition-all rotate-90 flex items-center justify-center gap-1.5 ${sig.ferramentaAtiva === "borracha" ? "bg-slate-800 dark:bg-slate-700 text-white shadow-md shadow-slate-800/20" : "bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"}`}><Eraser className="w-3.5 h-3.5" /> Apagar</button>
          <button type="button" onClick={sig.limparAssinatura} className="w-[60px] h-[44px] rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors rotate-90 flex items-center justify-center mt-2">Limpar</button>
        </div>
        <div className="flex flex-col items-center gap-4 pb-4">
          <button type="button" onClick={sig.fecharModalAssinatura} className="w-[60px] h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors rotate-90 flex items-center justify-center">Sair</button>
          <button type="button" onClick={sig.concluirAssinatura} className="w-[76px] h-[46px] rounded-xl bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition-all shadow-md shadow-red-600/20 rotate-90 flex items-center justify-center">Concluir</button>
        </div>
      </aside>
    );
  }

  function renderFerramentasDesktop() {
    return sig.painelFerramentasAberto ? (
      <div className="absolute top-6 right-6 z-10 max-w-[calc(100vw-3rem)] animate-fade-in">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-xl p-2 sm:p-2.5 transition-colors duration-300">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => sig.setFerramentaAtiva("caneta")} className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${sig.ferramentaAtiva === "caneta" ? "bg-red-600 text-white shadow-md shadow-red-600/20" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}><PenLine className="w-4 h-4" /> Escrever</button>
            <button type="button" onClick={() => sig.setFerramentaAtiva("borracha")} className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${sig.ferramentaAtiva === "borracha" ? "bg-slate-800 dark:bg-slate-700 text-white shadow-md shadow-slate-800/20" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}><Eraser className="w-4 h-4" /> Borracha</button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button type="button" onClick={sig.limparAssinatura} className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs sm:text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Limpar</button>
            <button type="button" onClick={() => sig.setPainelFerramentasAberto(false)} className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Ocultar</button>
            <button type="button" onClick={sig.fecharModalAssinatura} className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Sair</button>
            <button type="button" onClick={sig.concluirAssinatura} className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-600/20">Concluir Assinatura</button>
          </div>
        </div>
      </div>
    ) : (
      <div className="absolute top-6 right-6 z-10 animate-fade-in">
        <button type="button" onClick={() => sig.setPainelFerramentasAberto(true)} className="rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-200/60 dark:border-slate-700/60 shadow-lg px-5 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"><PenLine className="w-4 h-4" /> Abrir ferramentas</button>
      </div>
    );
  }

  const baseInputClass = "w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:text-white placeholder-slate-400";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200/60 dark:border-slate-800 transition-colors duration-300">
          <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-start shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 transition-colors">
                <PackageMinus className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                  Baixa e Devolução
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                  Registre a devolução ou descarte de um EPI.
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:px-8 bg-slate-50/50 dark:bg-slate-900/50 space-y-6 custom-scrollbar transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 relative">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Funcionário <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar nome ou matrícula..."
                      className={`${baseInputClass} pl-10`}
                      value={buscaFuncionario}
                      onChange={(e) => setBuscaFuncionario(e.target.value)}
                    />
                  </div>
                  <div className="mt-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 rounded-xl max-h-40 overflow-y-auto overflow-hidden shadow-sm custom-scrollbar transition-colors">
                    {funcionariosFiltrados.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => { setIdFuncionario(f.id); setIdEpi(""); setIdTamanho(""); setQuantidadeADevolver(1); }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 ${Number(idFuncionario) === Number(f.id) ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-bold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                      >
                        <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 mr-2">[{f.matricula}]</span> {f.nome}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Item devolvido <span className="text-red-500">*</span></label>
                  <select className={baseInputClass} value={idEpi} onChange={(e) => { setIdEpi(e.target.value); setIdTamanho(""); setQuantidadeADevolver(1); }} disabled={!idFuncionario}>
                    <option value="">{idFuncionario ? "Selecione o EPI..." : "Selecione funcionário primeiro"}</option>
                    {episFuncionario.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.nome} {e.saldo_atual > 0 ? `(Com ele: ${e.saldo_atual})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Tamanho <span className="text-red-500">*</span></label>
                  <select className={baseInputClass} value={idTamanho} onChange={(e) => { setIdTamanho(e.target.value); setQuantidadeADevolver(1); }} disabled={!idEpi}>
                    <option value="">{idEpi ? "Selecione..." : "Selecione o item"}</option>
                    {tamanhosFiltrados.map(t => (
                      <option key={t.id} value={t.id}>{t.tamanho}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Quantidade <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    max={epiSelecionado?.saldo_atual || 1}
                    className={baseInputClass}
                    value={quantidadeADevolver}
                    onChange={(e) => {
                      let val = parseInt(e.target.value) || 1;
                      const max = epiSelecionado?.saldo_atual || 1;
                      if (val > max) val = max;
                      setQuantidadeADevolver(val);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Data Devolução <span className="text-red-500">*</span></label>
                  <input type="date" className={baseInputClass} value={dataDevolucao} onChange={(e) => setDataDevolucao(e.target.value)} />
                </div>

                <div className="md:col-span-2">
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Motivo <span className="text-red-500">*</span></label>
                    <button type="button" onClick={() => {
                      setMostrandoAddMotivo(!mostrandoAddMotivo);
                      setGeraDescarteNovoMotivo(false);
                    }} className="text-[11px] text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-1 transition-colors">
                      {mostrandoAddMotivo ? <><X className="w-3 h-3" /> Cancelar</> : <><Plus className="w-3 h-3" /> Cadastrar Novo</>}
                    </button>
                  </div>

                  {!mostrandoAddMotivo ? (
                    <select className={baseInputClass} value={idMotivo} onChange={(e) => setIdMotivo(e.target.value)}>
                      <option value="">Selecione o motivo...</option>
                      {motivos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                  ) : (
                    <div className="flex flex-col gap-3 animate-fade-in bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex gap-2">
                        <select autoFocus value={novoMotivoNome} onChange={(e) => setNovoMotivoNome(e.target.value)} className={`${baseInputClass} !border-red-200 dark:!border-red-900/30 !bg-red-50/50 dark:!bg-red-900/10`}>
                          <option value="">Escolha uma sugestão ou digite...</option>
                          {MOTIVOS_PADRAO.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <button type="button" onClick={handleAddNovoMotivo} disabled={salvandoNovoMotivo || !novoMotivoNome} className="px-5 py-2.5 bg-red-600 dark:bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50">
                          {salvandoNovoMotivo ? "..." : "Adicionar"}
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={geraDescarteNovoMotivo}
                          onChange={(e) => setGeraDescarteNovoMotivo(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-600 text-red-600 focus:ring-red-500 bg-white dark:bg-slate-900"
                        />
                        Marque se este motivo <b className="text-red-600 dark:text-red-400">INUTILIZA</b> o EPI (Não retorna ao estoque)
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${houveTroca ? 'border-blue-200/60 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10' : 'border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 p-5'}`}>
              {!houveTroca ? (
                <label className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={houveTroca} onChange={(e) => setHouveTroca(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 bg-white dark:bg-slate-900" />
                  Houve troca por um novo EPI?
                </label>
              ) : (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-extrabold text-blue-900 dark:text-blue-400 tracking-tight">Dados da Troca</h3>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={houveTroca} onChange={(e) => setHouveTroca(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      Cancelar Troca
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-blue-800/70 dark:text-blue-400/70 uppercase tracking-widest mb-1.5">Novo EPI</label>
                      <select className={baseInputClass} value={idEpiNovo} onChange={(e) => { setIdEpiNovo(e.target.value); setIdTamanhoNovo(""); setQuantidadeNova(1); }}>
                        <option value="">Selecione...</option>
                        {episEstoque.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-blue-800/70 dark:text-blue-400/70 uppercase tracking-widest mb-1.5">Novo Tamanho</label>
                      <select className={baseInputClass} value={idTamanhoNovo} onChange={(e) => { setIdTamanhoNovo(e.target.value); setQuantidadeNova(1); }} disabled={!idEpiNovo || carregandoTamanhosNovo}>
                        <option value="">{carregandoTamanhosNovo ? "Carregando..." : "Selecione..."}</option>
                        {tamanhosEstoqueNovo.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.tamanho} {t.saldo_atual !== undefined ? `(Estoque: ${t.saldo_atual})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-blue-800/70 dark:text-blue-400/70 uppercase tracking-widest mb-1.5">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        max={tamanhoNovoSelecionadoObj?.saldo_atual || 1}
                        className={baseInputClass}
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
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Observações Adicionais</label>
              <textarea className={`${baseInputClass} resize-none min-h-[80px]`} placeholder="Detalhes opcionais sobre a devolução..." value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Assinatura do Colaborador</label>
                <button type="button" onClick={sig.abrirModalAssinatura} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                  <PenLine className="w-3.5 h-3.5" />
                  {sig.assinaturaPreview ? "Refazer Assinatura" : "Assinar Agora"}
                </button>
              </div>
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center min-h-[140px] overflow-hidden">
                {sig.assinaturaPreview ? (
                  <img src={sig.assinaturaPreview} alt="Assinatura" className="max-h-[120px] -rotate-90 sm:rotate-0 mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:rounded-xl dark:p-2" />
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest">Assinatura pendente</span>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 sm:justify-end sm:items-center bg-white dark:bg-slate-900 shrink-0 rounded-b-3xl transition-colors duration-300">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors w-full sm:w-auto order-2 sm:order-1">
              Cancelar
            </button>
            <button type="button" onClick={salvarBaixa} disabled={carregando} className="px-6 py-2.5 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-red-600/20 w-full sm:w-auto order-1 sm:order-2">
              {carregando ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Processando...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Confirmar Baixa</>
              )}
            </button>
          </div>
        </div>
      </div>

      {sig.modalAssinaturaAberto && (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-[#0B1120] flex flex-col md:flex-row overflow-hidden animate-fade-in transition-colors duration-300">
          <div className="relative flex-1 p-4 sm:p-8">
            <div ref={sig.canvasWrapperRef} className="relative h-full w-full rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white overflow-hidden shadow-sm transition-colors duration-300">
              <canvas
                ref={sig.canvasRef}
                onPointerDown={sig.startDrawing}
                onPointerMove={sig.draw}
                onPointerUp={sig.finishDrawing}
                className="absolute inset-0 block w-full h-full touch-none bg-white cursor-crosshair"
              />
              {!sig.isMobileViewport && (
                <div className="absolute top-6 left-6 z-10 pointer-events-none">
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl px-5 py-4 shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3 transition-colors duration-300">
                    <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                      <PenLine className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 tracking-tight transition-colors">Assinatura de Devolução</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">O colaborador deve assinar abaixo.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {sig.isMobileViewport ? renderBotoesSidebarMobile() : renderFerramentasDesktop()}
        </div>
      )}

      {notificacao.exibir && (
        <Toast
          type={notificacao.type}
          message={notificacao.message}
          onClose={() => setNotificacao({ ...notificacao, exibir: false })}
        />
      )}
    </>
  );
}

export default ModalBaixa;