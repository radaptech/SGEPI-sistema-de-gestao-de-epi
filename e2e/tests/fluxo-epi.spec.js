const { test, expect } = require("@playwright/test");
const { SUPER_EMAIL, SUPER_SENHA, entrar, chamarApi, gerarCnpj } = require("./apoio");

// Fluxo completo de um tenant novo: EPI → entrada → entrega → devolução.
// Os testes dependem um do outro (o estoque da entrada é o que se entrega),
// então rodam em série numa página só — e com um único login, por causa do
// rate limit do /login.
test.describe.configure({ mode: "serial" });

const sufixo = Date.now();
const nomeEmpresa = `E2E ${sufixo}`;
const subdominio = `e2e-${sufixo}`; // slug.Make(nome_fantasia) no EmpresaService
const admin = { email: `admin.${sufixo}@e2e.test`, senha: "e2e@12345" };
const nomeEpi = `Luva E2E ${sufixo}`;
const nomeFuncionario = `Colaborador E2E ${sufixo}`;

let page;

// listas da API às vezes vêm puras, às vezes embrulhadas num objeto
const comoLista = (r) => (Array.isArray(r) ? r : Object.values(r || {}).find(Array.isArray) || []);

async function irPara(item) {
  const direto = page.getByRole("button", { name: item, exact: true });
  if (!(await direto.first().isVisible())) await page.getByRole("button", { name: "Mais" }).click();
  await direto.first().click();
}

// Ancora no título: os botões do rodapé mudam de texto enquanto salvam
const modalPorTitulo = (titulo) => {
  const cabecalho = page.getByRole("heading", { name: titulo, exact: true });
  return { cabecalho, modal: page.locator("div.fixed").filter({ has: cabecalho }).last() };
};

// Assina no canvas com o mouse (o canvas escuta pointer events) e conclui
async function assinar(botaoAbrir, botaoConcluir) {
  await page.getByRole("button", { name: botaoAbrir }).click();
  const caixa = await page.locator("canvas").last().boundingBox();
  await page.mouse.move(caixa.x + caixa.width * 0.3, caixa.y + caixa.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(caixa.x + caixa.width * 0.5, caixa.y + caixa.height * 0.4, { steps: 10 });
  await page.mouse.move(caixa.x + caixa.width * 0.7, caixa.y + caixa.height * 0.6, { steps: 10 });
  await page.mouse.up();
  await page.getByRole("button", { name: botaoConcluir, exact: true }).click();
}

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();

  // super admin cria o tenant e o admin dele
  await page.goto("/");
  await entrar(page, SUPER_EMAIL, SUPER_SENHA);
  await expect(page.getByRole("heading", { name: "Gestão da Plataforma" })).toBeVisible();
  await chamarApi(page, "POST", "/painel/cadastrar-empresa", {
    nome_fantasia: nomeEmpresa,
    cnpj: gerarCnpj(),
    responsavel: "E2E",
    email: "empresa@e2e.test",
    plano: "plano de testes", // criado pelo seed.go
    status: "Ativa",
    vencimento: "31/12/2099",
  });
  const empresas = await chamarApi(page, "GET", "/master/dashboard/dados-empresas");
  const empresa = empresas.find((e) => e.nome === nomeEmpresa);
  await chamarApi(page, "POST", "/master/dashboard/salvar-usuarios", {
    nome: "Admin E2E",
    email: admin.email,
    senha: admin.senha,
    role: "admin",
    empresaId: empresa.id,
  });
  // o cookie de sessão vale para qualquer subdomínio: sem logout o tenant abriria logado como super admin
  await chamarApi(page, "POST", "/logout");

  // admin do tenant: cadastros de apoio via API, o foco é o fluxo do estoque
  await page.goto(`http://${subdominio}.localhost/`);
  await entrar(page, admin.email, admin.senha);
  await expect(page.getByRole("button", { name: "Estoque" }).first()).toBeVisible();

  await chamarApi(page, "POST", "/gerencial/cadastro-protecao", { nome: "Mãos e Braços" });
  await chamarApi(page, "POST", "/gerencial/cadastro-tamanho", { tamanho: "M" });
  await chamarApi(page, "POST", "/gerencial/cadastro-fornecedores", {
    razao_social: "Fornecedor E2E LTDA",
    nome_fantasia: "Fornecedor E2E",
    cnpj: gerarCnpj(),
    inscricao_estadual: "123456",
  });
  await chamarApi(page, "POST", "/cadastrar-motivo-devolucao", { motivo: "Desgaste", gera_descarte: false });

  await chamarApi(page, "POST", "/gerencial/cadastro-departamento", { departamento: "Produção" });
  const departamento = comoLista(await chamarApi(page, "GET", "/departamentos")).find((d) => d.departamento === "Produção");
  await chamarApi(page, "POST", "/gerencial/cadastro-funcao", { funcao: "Operador", id_departamento: departamento.id });
  const funcao = comoLista(await chamarApi(page, "GET", "/funcoes")).find((f) => f.cargo === "Operador");
  await chamarApi(page, "POST", "/gerencial/cadastro-funcionario", {
    nome: nomeFuncionario,
    id_departamento: departamento.id,
    id_funcao: funcao.id,
    cpf: String(sufixo).slice(-11).padStart(11, "1"),
  });
});

test.afterAll(async () => {
  await page.close();
});

test("cadastra EPI", async () => {
  await irPara("Administração");
  await page.getByRole("button", { name: "EPIs" }).click();
  await page.getByRole("button", { name: "Cadastrar Novo EPI" }).click();

  const { cabecalho: titulo, modal } = modalPorTitulo("Cadastrar Novo EPI");
  await modal.getByPlaceholder("Ex: Capacete de segurança").fill(nomeEpi);
  await modal.locator("select").first().selectOption({ label: "Mãos e Braços" });
  await modal.getByPlaceholder("Ex: 3M").fill("3M");
  await modal.getByPlaceholder("Apenas números").fill("12345");
  await modal.locator('input[type="date"]').fill("2099-12-31");
  await modal.getByRole("button", { name: "M", exact: true }).click();
  // "Alerta Estoque Mín." fica vazio de propósito: o front manda 0 e o back tem que aceitar
  await modal.getByRole("button", { name: "Salvar Equipamento" }).click();

  await expect(titulo).toBeHidden();
  await expect(page.getByText(nomeEpi).first()).toBeVisible();
});

test("dá entrada de 10 unidades no estoque", async () => {
  await irPara("Entradas");
  await page.getByRole("button", { name: "Nova Entrada" }).click();

  const { modal } = modalPorTitulo("Nova Entrada");
  const selects = modal.locator("select");
  await selects.nth(0).selectOption({ label: "Fornecedor E2E" });
  await modal.getByPlaceholder("Ex: 12345").fill(String(sufixo).slice(-6));
  await selects.nth(1).selectOption({ label: nomeEpi });
  await selects.nth(2).selectOption({ label: "M" });
  await modal.locator('input[type="number"]').first().fill("10");
  await modal.getByPlaceholder("0.00").fill("5.50");
  await modal.getByPlaceholder("Ex: L001").fill("L-E2E");
  const datas = modal.locator('input[type="date"]');
  await datas.nth(1).fill("2025-01-01"); // fabricação
  await datas.nth(2).fill("2099-01-01"); // validade
  await modal.getByRole("button", { name: "Incluir Item" }).click();
  await expect(modal.getByText("L-E2E")).toBeVisible();
  await modal.getByRole("button", { name: "Finalizar Entrada" }).click();

  await expect(page.getByText("Entrada cadastrada com sucesso!")).toBeVisible();
  expect(JSON.stringify(await chamarApi(page, "GET", "/entradas"))).toContain("L-E2E");
});

test("entrega 3 unidades com assinatura", async () => {
  await irPara("Entregas");
  await page.getByRole("button", { name: "Nova Entrega" }).click();

  const { cabecalho, modal } = modalPorTitulo("Nova Entrega");
  await modal.getByPlaceholder("Buscar nome ou matrícula...").fill(nomeFuncionario);
  await modal.getByRole("button", { name: nomeFuncionario }).click();

  const selects = modal.locator("select");
  await selects.nth(0).selectOption({ label: nomeEpi });
  await expect(selects.nth(1).locator("option", { hasText: "M" })).toHaveCount(1);
  await selects.nth(1).selectOption({ index: 1 });
  await modal.locator('input[type="number"]').fill("3");
  await modal.getByRole("button", { name: "Adicionar" }).click();

  await assinar("Assinar", "Concluir");
  await expect(modal.getByAltText("Comprovação da entrega")).toBeVisible();

  await modal.getByRole("button", { name: "Confirmar Entrega" }).click();
  await expect(cabecalho).toBeHidden({ timeout: 15000 });

  const entregas = JSON.stringify(await chamarApi(page, "GET", "/entregas"));
  expect(entregas).toContain(nomeFuncionario);
  expect(entregas).toContain("sem-upload://"); // SUPABASE_BUCKET vazio pula o upload
});

test("devolve 1 unidade com assinatura", async () => {
  await irPara("Devoluções");
  await page.getByRole("button", { name: "Registrar Devolução" }).click();

  const { modal } = modalPorTitulo("Baixa e Devolução");
  await modal.getByPlaceholder("Buscar nome ou matrícula...").fill(nomeFuncionario);
  await modal.getByRole("button", { name: nomeFuncionario }).click();

  const selects = modal.locator("select");
  // a opção traz o saldo em posse: confirma as 3 unidades da entrega anterior
  await expect(selects.nth(0).locator("option", { hasText: `${nomeEpi} (Com ele: 3)` })).toHaveCount(1);
  await selects.nth(0).selectOption({ index: 1 });
  await selects.nth(1).selectOption({ index: 1 });
  await selects.nth(2).selectOption({ label: "Desgaste" });

  await assinar("Assinar Agora", "Concluir Assinatura");
  await expect(modal.getByAltText("Assinatura")).toBeVisible();

  await modal.getByRole("button", { name: "Confirmar Baixa" }).click();
  await expect(page.getByText("Baixa realizada com sucesso!")).toBeVisible();

  expect(JSON.stringify(await chamarApi(page, "GET", "/devolucao"))).toContain(nomeFuncionario);
});
