// Aplica o tema escuro antes do React montar, para a tela não piscar branca.
// Arquivo à parte (e não <script> inline no index.html) porque a CSP do front não libera script inline.
try {
  if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark");
} catch {
  // sem localStorage (aba anônima bloqueada etc.): fica no claro
}
