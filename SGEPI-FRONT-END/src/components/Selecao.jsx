import { Children, Fragment, isValidElement, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

// Lista de escolha própria, no lugar do <select> do sistema (que abre claro e azul mesmo no tema
// escuro). Aceita as mesmas props: value, onChange(e) com e.target.value, disabled, id, className
// e filhos <option>/<optgroup>. Assim a troca é só o nome da tag.
// O menu abre num portal no <body>, para não ser cortado pelo overflow dos modais.

const BUSCA_A_PARTIR_DE = 9;

function texto(no) {
  if (no == null || typeof no === "boolean") return "";
  if (typeof no === "string" || typeof no === "number") return String(no);
  if (Array.isArray(no)) return no.map(texto).join("");
  if (isValidElement(no)) return texto(no.props.children);
  return "";
}

// <option>/<optgroup> (inclusive dentro de fragmentos e arrays) -> [{valor, rotulo, grupo, desabilitado}]
function lerOpcoes(children, grupo = null, saida = []) {
  Children.forEach(children, (filho) => {
    if (!isValidElement(filho)) return;
    if (filho.type === Fragment) return lerOpcoes(filho.props.children, grupo, saida);
    if (filho.type === "optgroup") return lerOpcoes(filho.props.children, filho.props.label, saida);
    if (filho.type === "option") {
      const rotulo = texto(filho.props.children);
      saida.push({
        valor: String(filho.props.value ?? rotulo),
        rotulo,
        grupo,
        desabilitado: Boolean(filho.props.disabled),
      });
    }
  });
  return saida;
}

const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Selecao({ value, onChange, disabled, id, className = "", children, name, ...resto }) {
  const idAuto = useId();
  const idLista = `${id || idAuto}-lista`;
  const gatilho = useRef(null);
  const painel = useRef(null);
  const busca = useRef(null);
  const [aberto, setAberto] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [ativo, setAtivo] = useState(-1);
  const [pos, setPos] = useState(null);

  const opcoes = useMemo(() => lerOpcoes(children), [children]);
  const valor = String(value ?? "");
  const atual = opcoes.find((o) => o.valor === valor);
  const placeholder = opcoes.find((o) => o.valor === "");
  const comBusca = opcoes.length >= BUSCA_A_PARTIR_DE;

  // a opção vazia ("Selecione...") vira o texto do gatilho, não um item da lista
  const visiveis = useMemo(() => {
    const termo = semAcento(filtro.trim());
    return opcoes.filter((o) => o.valor !== "" && (!termo || semAcento(o.rotulo).includes(termo)));
  }, [opcoes, filtro]);

  function escolher(op) {
    if (!op || op.desabilitado) return;
    const alvo = { value: op.valor, id, name };
    onChange?.({ target: alvo, currentTarget: alvo });
    fechar();
  }

  function abrir() {
    if (disabled) return;
    setPos(null);
    setFiltro("");
    setAberto(true);
  }

  function fechar(devolverFoco = true) {
    setAberto(false);
    if (devolverFoco) gatilho.current?.focus({ preventScroll: true });
  }

  // posição do menu: embaixo do campo, ou em cima se não couber
  useLayoutEffect(() => {
    if (!aberto) return;
    function medir() {
      const r = gatilho.current?.getBoundingClientRect();
      if (!r) return;
      const embaixo = window.innerHeight - r.bottom;
      const paraCima = embaixo < 260 && r.top > embaixo;
      setPos({
        left: r.left,
        width: r.width,
        top: paraCima ? undefined : r.bottom + 4,
        bottom: paraCima ? window.innerHeight - r.top + 4 : undefined,
        alturaMax: Math.min(320, (paraCima ? r.top : embaixo) - 16),
      });
    }
    medir();
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [aberto]);

  // ao abrir: destaca o valor atual e foca a busca (ou a lista). Espera o menu existir:
  // ele só é desenhado depois que a posição é medida.
  const menuNaTela = aberto && pos !== null;
  useEffect(() => {
    if (!menuNaTela) return;
    const i = visiveis.findIndex((o) => o.valor === valor);
    setAtivo(i >= 0 ? i : visiveis.findIndex((o) => !o.desabilitado));
    (comBusca ? busca.current : painel.current)?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuNaTela]);

  useEffect(() => {
    if (aberto && filtro) setAtivo(visiveis.findIndex((o) => !o.desabilitado));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  // clique fora fecha
  useEffect(() => {
    if (!aberto) return;
    function fora(e) {
      if (!painel.current?.contains(e.target) && !gatilho.current?.contains(e.target)) fechar(false);
    }
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto]);

  useEffect(() => {
    painel.current?.querySelector(`[data-indice="${ativo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [ativo, menuNaTela]);

  function mover(passo) {
    if (visiveis.length === 0) return;
    let i = ativo;
    for (let n = 0; n < visiveis.length; n++) {
      i = (i + passo + visiveis.length) % visiveis.length;
      if (!visiveis[i].desabilitado) return setAtivo(i);
    }
  }

  function teclaNoMenu(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); mover(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); mover(-1); }
    else if (e.key === "Home") { e.preventDefault(); setAtivo(visiveis.findIndex((o) => !o.desabilitado)); }
    else if (e.key === "End") { e.preventDefault(); setAtivo(visiveis.map((o) => !o.desabilitado).lastIndexOf(true)); }
    else if (e.key === "Enter") { e.preventDefault(); escolher(visiveis[ativo]); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar(); }
    else if (e.key === "Tab") fechar(false);
    else if (!comBusca && e.key.length === 1) {
      // sem campo de busca: a letra pula para o próximo item que começa com ela
      const letra = semAcento(e.key);
      const ordem = [...visiveis.slice(ativo + 1), ...visiveis.slice(0, ativo + 1)];
      const alvo = ordem.find((o) => semAcento(o.rotulo).startsWith(letra));
      if (alvo) setAtivo(visiveis.indexOf(alvo));
    }
  }

  function teclaNoGatilho(e) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      abrir();
    }
  }

  let grupoAnterior = null;

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        id={id}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? idLista : undefined}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={teclaNoGatilho}
        className={`relative text-left pr-9 cursor-pointer disabled:cursor-not-allowed ${className}`}
        {...resto}
      >
        <span className={`block truncate ${atual && atual.valor !== "" ? "" : "text-ink-3"}`}>
          {atual?.rotulo || placeholder?.rotulo || "Selecione..."}
        </span>
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 transition-transform ${aberto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {aberto &&
        pos &&
        createPortal(
          <div
            ref={painel}
            tabIndex={-1}
            aria-activedescendant={!comBusca && ativo >= 0 ? `${idLista}-${ativo}` : undefined}
            onKeyDown={teclaNoMenu}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[70] flex flex-col bg-surface border border-line-strong rounded-md shadow-modal outline-none overflow-hidden"
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, minWidth: pos.width, maxWidth: Math.max(pos.width, 360), maxHeight: pos.alturaMax }}
          >
            {comBusca && (
              <div className="flex items-center gap-2 px-3 border-b border-line shrink-0">
                <Search className="w-4 h-4 text-ink-3 shrink-0" aria-hidden="true" />
                <input
                  ref={busca}
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  placeholder="Buscar..."
                  aria-label="Buscar na lista"
                  aria-controls={idLista}
                  aria-activedescendant={ativo >= 0 ? `${idLista}-${ativo}` : undefined}
                  className="w-full h-10 bg-transparent text-sm text-ink placeholder-ink-3 outline-none"
                />
              </div>
            )}
            <ul
              id={idLista}
              role="listbox"
              className="overflow-y-auto py-1 custom-scrollbar"
            >
              {visiveis.length === 0 && <li className="px-3 py-2.5 text-sm text-ink-3">Nada encontrado.</li>}
              {visiveis.map((o, i) => {
                const cabecalho = o.grupo && o.grupo !== grupoAnterior;
                grupoAnterior = o.grupo;
                const selecionado = o.valor === valor;
                return (
                  <Fragment key={`${o.grupo}-${o.valor}`}>
                    {cabecalho && (
                      <li role="presentation" className="px-3 pt-2.5 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">
                        {o.grupo}
                      </li>
                    )}
                    <li
                      id={`${idLista}-${i}`}
                      data-indice={i}
                      role="option"
                      aria-selected={selecionado}
                      aria-disabled={o.desabilitado || undefined}
                      onPointerMove={() => !o.desabilitado && ativo !== i && setAtivo(i)}
                      onClick={() => escolher(o)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none ${
                        o.desabilitado ? "text-ink-3 cursor-not-allowed" : "text-ink"
                      } ${i === ativo ? "bg-sunken" : ""} ${selecionado ? "font-semibold" : ""}`}
                    >
                      <span className="flex-1 min-w-0">{o.rotulo}</span>
                      {selecionado && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
