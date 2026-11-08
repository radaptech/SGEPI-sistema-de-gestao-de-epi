import { AlertCircle, CheckCircle2 } from "lucide-react";

// Layout das telas de acesso (login, esqueci a senha, redefinir senha):
// painel grafite da marca à esquerda, formulário à direita.

// O que o sistema controla, no formato de etiqueta de almoxarifado (fatos do produto, não promessas)
const LINHAS_ETIQUETA = [
  ["CA", "Validade conferida na base do MTE"],
  ["LOTE", "Saída pelo vencimento mais próximo"],
  ["KIT", "EPI exigido por função"],
  ["FICHA", "Assinatura digital e PDF"],
];

// Larguras das barras do código da etiqueta (decorativo, fixo para não mudar a cada render)
const BARRAS = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1];

function CodigoBarras() {
  let x = 0;
  const barras = BARRAS.map((largura, i) => {
    const barra = i % 2 === 0 ? <rect key={i} x={x} y="0" width={largura} height="28" /> : null;
    x += largura;
    return barra;
  });
  return (
    <svg viewBox={`0 0 ${x} 28`} preserveAspectRatio="none" className="h-7 w-40 fill-current" aria-hidden="true">
      {barras}
    </svg>
  );
}

export const inputAcesso =
  "w-full px-4 h-[46px] bg-surface border border-line rounded-md outline-none transition-colors text-sm text-ink placeholder:text-ink-3 focus:border-ink focus:ring-1 focus:ring-ink";
export const labelAcesso = "block text-xs font-bold text-ink-2 uppercase tracking-wide mb-1.5";
export const botaoAcesso =
  "w-full h-[46px] rounded-md bg-action text-on-action font-semibold text-sm transition-colors hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2";
export const botaoSecundarioAcesso =
  "w-full h-[46px] rounded-md border border-line bg-surface text-ink font-semibold text-sm transition-colors hover:border-line-strong flex items-center justify-center gap-2";

export function AvisoAcesso({ tipo = "erro", children }) {
  const erro = tipo === "erro";
  const Icone = erro ? AlertCircle : CheckCircle2;
  return (
    <div
      role={erro ? "alert" : "status"}
      className={`mb-6 px-4 py-3 text-sm rounded-md border flex items-start gap-2.5 font-medium ${
        erro ? "bg-erro-soft text-erro border-erro-line" : "bg-ok-soft text-ok border-ok-line"
      }`}
    >
      <Icone className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default function LayoutAcesso({ titulo, subtitulo, children, rodape }) {
  const ano = new Date().getFullYear();
  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-canvas font-sans">
      <aside className="bg-painel text-painel-ink flex flex-col px-6 py-5 sm:px-10 lg:px-14 lg:py-12">
        <div className="flex items-center justify-between gap-4">
          <img src={`${process.env.PUBLIC_URL}/radaptech.png`} alt="RadapTech" width="480" height="274" className="w-20 lg:w-36 h-auto" />
          <span className="lg:hidden text-lg font-bold tracking-tight">SGEPI</span>
        </div>

        <div className="hidden lg:flex flex-1 flex-col justify-center py-12">
          <p className="text-5xl font-bold tracking-tight">SGEPI</p>
          <p className="mt-3 max-w-sm text-lg text-painel-ink-2">
            Controle de EPI conforme a NR-6: estoque, entrega, devolução e a prova de cada assinatura.
          </p>

          <div className="mt-12 max-w-md border border-painel-line rounded-md">
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-painel-line">
              <span className="font-mono text-xs font-medium tracking-wide text-painel-ink-2">SGEPI · NR-6</span>
              <span className="font-mono text-xs font-medium tracking-wide text-painel-ink-2">ALMOXARIFADO</span>
            </div>
            <dl className="divide-y divide-painel-line">
              {LINHAS_ETIQUETA.map(([chave, valor]) => (
                <div key={chave} className="grid grid-cols-[4.5rem_1fr] gap-4 px-4 py-3 text-sm">
                  <dt className="font-mono font-medium text-painel-ink">{chave}</dt>
                  <dd className="text-painel-ink-2">{valor}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-end justify-between gap-4 px-4 py-3 border-t border-painel-line text-painel-ink-2">
              <CodigoBarras />
              <span className="font-mono text-xs tabular-nums">{ano}</span>
            </div>
          </div>
        </div>

        <p className="hidden lg:block text-xs text-painel-ink-2">Um produto RadapTech · © {ano}</p>
      </aside>

      <main className="flex flex-1 items-start lg:items-center justify-center px-4 pt-10 pb-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{titulo}</h1>
            {subtitulo && <p className="mt-1.5 text-sm text-ink-2">{subtitulo}</p>}
          </div>

          {children}

          {rodape && <p className="mt-8 pt-6 border-t border-line text-xs text-ink-3">{rodape}</p>}
          <p className="lg:hidden mt-3 text-xs text-ink-3">Um produto RadapTech · © {ano}</p>
        </div>
      </main>
    </div>
  );
}
