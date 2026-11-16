// Unidade escolhida no topo ("em qual loja estou"). Vazio = todas as unidades.
// O localStorage é por origem, e cada empresa tem o seu subdomínio: não mistura empresas.
const CHAVE = "unidade";

export function unidadeAtual() {
  try {
    return localStorage.getItem(CHAVE) || "";
  } catch {
    return "";
  }
}

export function escolherUnidade(id) {
  try {
    if (id) localStorage.setItem(CHAVE, String(id));
    else localStorage.removeItem(CHAVE);
  } catch {
    // navegador sem storage: fica em "todas"
  }
}
