import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Check, Loader2, PenLine, Plus, Trash2, X } from "lucide-react";
import { api } from "../../services/api";
import AcessoUnidades from "./AcessoUnidades";

// Unidades: lojas, obras ou almoxarifados com estoque próprio dentro da empresa.
// Plano: gestao-de-epi--backEnd/docs/PLANO-UNIDADES.md (Fases 2 e 6).

const inputClass =
  "w-full px-4 h-11 rounded-md text-sm font-medium bg-surface text-ink border border-line-strong outline-none focus:ring-1 focus:ring-ink focus:border-ink placeholder-ink-3 transition-colors";
const labelClass = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5";
const botaoIcone =
  "w-9 h-9 flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-sunken transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

// por que esta unidade não pode ser desativada (null = pode)
function bloqueioDesativar(u, total) {
  if (total <= 1) return "A empresa precisa ter pelo menos uma unidade.";
  if (u.saldo > 0 && u.funcionarios > 0) return "Tem estoque e funcionários. Transfira antes de desativar.";
  if (u.saldo > 0) return "Tem estoque. Transfira antes de desativar.";
  if (u.funcionarios > 0) return "Tem funcionários. Mude a lotação deles antes de desativar.";
  return null;
}

export default function AbaUnidades() {
  const [unidades, setUnidades] = useState(null);
  const [nomeNova, setNomeNova] = useState("");
  const [erroNova, setErroNova] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(null); // {id, nome}
  const [confirmandoId, setConfirmandoId] = useState(null);

  const carregar = async () => {
    try {
      setUnidades((await api.get("/unidades")) ?? []);
    } catch {
      setUnidades([]); // o api.js já mostrou o erro
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const criar = async (e) => {
    e.preventDefault();
    if (nomeNova.trim().length < 2) return setErroNova("Digite um nome com pelo menos 2 letras.");
    try {
      setSalvando(true);
      await api.post("/gerencial/unidades", { nome: nomeNova.trim() });
      toast.success(`Unidade "${nomeNova.trim()}" cadastrada.`);
      setNomeNova("");
      await carregar();
    } catch {
      // nome repetido etc.: o api.js já mostrou a mensagem do servidor
    } finally {
      setSalvando(false);
    }
  };

  const renomear = async () => {
    if (editando.nome.trim().length < 2) return toast.warning("Digite um nome com pelo menos 2 letras.");
    try {
      setSalvando(true);
      await api.patch(`/gerencial/unidades/${editando.id}`, { nome: editando.nome.trim() });
      toast.success("Unidade renomeada.");
      setEditando(null);
      await carregar();
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  const desativar = async (u) => {
    try {
      setSalvando(true);
      await api.delete(`/gerencial/unidades/${u.id}`);
      toast.success(`Unidade "${u.nome}" desativada.`);
      setConfirmandoId(null);
      await carregar();
    } catch {
      // o api.js já mostrou o erro
    } finally {
      setSalvando(false);
    }
  };

  const total = unidades?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-3xl">
        <p className="text-sm text-ink-2">
          Unidades são os locais com estoque próprio dentro da empresa: lojas, obras, filiais ou almoxarifados.
          Quem tem um local só não precisa mexer aqui.
        </p>
        <p className="mt-1 text-xs text-ink-3">
          Com duas ou mais, cada entrada, entrega e funcionário fica numa unidade, e a unidade escolhida no topo
          filtra as telas.
        </p>
      </div>

      <form onSubmit={criar} className="bg-sunken p-5 rounded-md border border-line flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label htmlFor="unidade-nova" className={labelClass}>Nova unidade</label>
          <input
            id="unidade-nova"
            className={`${inputClass} ${erroNova ? "border-erro-line bg-erro-soft" : ""}`}
            value={nomeNova}
            maxLength={100}
            onChange={(e) => {
              setNomeNova(e.target.value);
              setErroNova("");
            }}
            placeholder="Ex.: Loja Centro, Obra Residencial Norte"
            aria-invalid={Boolean(erroNova)}
            aria-describedby={erroNova ? "unidade-nova-erro" : undefined}
          />
          {erroNova && <p id="unidade-nova-erro" className="mt-1.5 text-xs font-medium text-erro">{erroNova}</p>}
        </div>
        <button
          type="submit"
          disabled={salvando}
          className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-md bg-action hover:bg-action-hover text-on-action text-sm font-bold transition-colors disabled:opacity-50"
        >
          {salvando && !editando && !confirmandoId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Adicionar
        </button>
      </form>

      <section aria-labelledby="titulo-unidades" className="bg-surface border border-line rounded-md">
        <header className="flex items-center justify-between px-5 py-3 border-b border-line">
          <h3 id="titulo-unidades" className="text-sm font-bold text-ink">Unidades da empresa</h3>
          {unidades && <span className="font-mono text-xs text-ink-3">{total} {total === 1 ? "unidade" : "unidades"}</span>}
        </header>

        {unidades === null ? (
          <p className="px-5 py-8 text-sm text-ink-3 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</p>
        ) : (
          <ul className="divide-y divide-line">
            <li className="hidden sm:grid grid-cols-[1fr_8rem_8rem_6.5rem] gap-4 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
              <span>Nome</span>
              <span className="text-right">Funcionários</span>
              <span className="text-right">Em estoque</span>
              <span className="sr-only">Ações</span>
            </li>
            {unidades.map((u) => {
              const bloqueio = bloqueioDesativar(u, total);
              const emEdicao = editando?.id === u.id;
              const confirmando = confirmandoId === u.id;
              return (
                <li key={u.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_8rem_8rem_6.5rem] gap-x-4 gap-y-1 px-5 py-3 items-center">
                  {emEdicao ? (
                    <form
                      className="col-span-2 sm:col-span-3 flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        renomear();
                      }}
                    >
                      <label htmlFor={`unidade-${u.id}-nome`} className="sr-only">Novo nome de {u.nome}</label>
                      <input
                        id={`unidade-${u.id}-nome`}
                        autoFocus
                        className={inputClass}
                        value={editando.nome}
                        maxLength={100}
                        onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                        onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), setEditando(null))}
                      />
                      <button type="submit" disabled={salvando} className={botaoIcone} aria-label="Salvar nome">
                        <Check className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setEditando(null)} className={botaoIcone} aria-label="Cancelar">
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-ink truncate">{u.nome}</span>
                      <span className="hidden sm:block text-right font-mono text-sm text-ink-2 tabular-nums">{u.funcionarios}</span>
                      <span className="hidden sm:block text-right font-mono text-sm text-ink-2 tabular-nums">{u.saldo} un.</span>
                    </>
                  )}

                  {!emEdicao && (
                    <span className="flex justify-end gap-1 row-span-2 sm:row-span-1">
                      {confirmando ? (
                        <>
                          <button
                            type="button"
                            onClick={() => desativar(u)}
                            disabled={salvando}
                            className="h-9 px-3 rounded-md border border-erro-line bg-erro-soft text-erro text-xs font-bold disabled:opacity-50"
                          >
                            Desativar
                          </button>
                          <button type="button" onClick={() => setConfirmandoId(null)} className={botaoIcone} aria-label="Cancelar">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmandoId(null);
                              setEditando({ id: u.id, nome: u.nome });
                            }}
                            className={botaoIcone}
                            aria-label={`Renomear ${u.nome}`}
                            title="Renomear"
                          >
                            <PenLine className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmandoId(u.id)}
                            disabled={Boolean(bloqueio)}
                            className={`${botaoIcone} hover:text-erro`}
                            aria-label={`Desativar ${u.nome}`}
                            title={bloqueio || "Desativar"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </span>
                  )}

                  {!emEdicao && (
                    <span className="sm:hidden text-xs text-ink-3 font-mono">
                      {u.funcionarios} funcionários · {u.saldo} un. em estoque
                    </span>
                  )}
                  {confirmando && (
                    <span className="col-span-2 sm:col-span-4 text-xs text-ink-2">
                      Desativar "{u.nome}"? Ela some das listas; o histórico continua.
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {total >= 2 && <AcessoUnidades unidades={unidades} />}
    </div>
  );
}
