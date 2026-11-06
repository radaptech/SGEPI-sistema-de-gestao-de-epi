// Funções compartilhadas pelos specs.

// Mesmos defaults do seed.go (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD vazios)
const SUPER_EMAIL = process.env.E2E_EMAIL || "admin@radaptech.com.br";
const SUPER_SENHA = process.env.E2E_SENHA || "Mudar@123";

async function entrar(page, email, senha) {
  await page.getByPlaceholder("seu@email.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(senha);
  await page.getByRole("button", { name: "Entrar no Sistema" }).click();
}

// Chama a API de dentro da página: usa o mesmo cookie de sessão e o mesmo
// X-Tenant-ID (subdomínio) que o front usaria.
async function chamarApi(page, metodo, rota, corpo) {
  const { status, dados } = await page.evaluate(
    async ({ metodo, rota, corpo }) => {
      const r = await fetch(`http://api.localhost/api${rota}`, {
        method: metodo,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": window.location.hostname.split(".")[0],
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      return { status: r.status, dados: await r.json().catch(() => null) };
    },
    { metodo, rota, corpo }
  );
  if (status >= 400) throw new Error(`${metodo} ${rota} → ${status} ${JSON.stringify(dados)}`);
  return dados;
}

// CNPJ com dígitos verificadores válidos (o back valida com a tag `cnpj`)
function gerarCnpj() {
  const n = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).concat([0, 0, 0, 1]);
  const dv = (base) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = base.reduce((s, d, i) => s + d * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  n.push(dv(n));
  n.push(dv(n));
  return n.join("");
}

module.exports = { SUPER_EMAIL, SUPER_SENHA, entrar, chamarApi, gerarCnpj };
