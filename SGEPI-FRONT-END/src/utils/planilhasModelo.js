import * as XLSX from "xlsx";

// Planilhas-modelo da importação em lote. As primeiras linhas são orientações; o leitor do back
// procura a linha de cabeçalho, então os nomes das colunas não podem mudar.

function salvar(linhas, opcoes, larguras, aba, arquivo, ajustar = () => {}) {
  const planilha = XLSX.utils.json_to_sheet(linhas, opcoes);
  planilha["!cols"] = larguras.map((wch) => ({ wch }));
  ajustar(planilha);
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, aba);
  XLSX.writeFile(livro, arquivo);
}

export function baixarModeloDepartamentos() {
  const coluna = "Nome do Departamento";
  salvar(
    [
      { "Instruções": "📌 Orientações de Preenchimento:" },
      { "Instruções": "1. Digite um departamento por linha na coluna 'Nome do Departamento'." },
      { "Instruções": "2. Não altere o nome do cabeçalho na linha 5." },
      { "Instruções": "3. Salve o arquivo e faça o upload no sistema." },
      {},
      ...["TI", "Produção", "Logística e Almoxarifado", "Segurança do Trabalho", "Administrativo e RH"].map((d) => ({ [coluna]: d })),
    ],
    { header: [coluna], skipHeader: false },
    [45],
    "Departamentos",
    "modelo_departamentos.xlsx"
  );
}

// duas linhas vazias por departamento, já com o nome dele na coluna B
export function baixarModeloFuncoes(departamentos) {
  const linhas = [
    { "Nome da Função": "📌 Orientações de Preenchimento:" },
    { "Nome da Função": "1. Escreva a função desejada na Coluna A." },
    { "Nome da Função": "2. Na Coluna B, mantivemos os departamentos da empresa pré-preenchidos." },
    { "Nome da Função": "3. Você pode duplicar ou adicionar linhas mantendo o nome do departamento." },
    {},
  ];
  departamentos.forEach((d) => {
    const linha = { "Nome da Função": "", "Departamento Vinculado": d.departamento || d.nome || d };
    linhas.push(linha, { ...linha });
  });
  salvar(linhas, { header: ["Nome da Função", "Departamento Vinculado"], skipHeader: false }, [40, 35], "Funções", "modelo_funcoes.xlsx");
}

export function baixarModeloFornecedores() {
  const vazio = { "Razão Social": "", "Nome Fantasia": "", CNPJ: "", "Inscrição Estadual": "" };
  const linhas = [
    { ...vazio, "Razão Social": "📌 ORIENTAÇÕES DE PREENCHIMENTO:" },
    { ...vazio, "Razão Social": "1. Preencha a Razão Social e o Nome Fantasia." },
    { ...vazio, "Razão Social": "2. O CNPJ pode conter apenas números (14 dígitos) ou estar formatado." },
    {},
    // cabeçalho que o leitor do back procura
    Object.fromEntries(Object.keys(vazio).map((c) => [c, c])),
  ];

  // skipHeader: o cabeçalho de verdade é a última linha acima, não o topo
  salvar(linhas, { skipHeader: true }, [45, 30, 22, 22], "Fornecedores", "modelo_importacao_fornecedores.xlsx", (planilha) => {
    // CNPJ e inscrição como texto, para não perder zeros nem formatação
    const faixa = XLSX.utils.decode_range(planilha["!ref"]);
    for (let r = faixa.s.r; r <= faixa.e.r; ++r) {
      for (const c of [2, 3]) {
        const celula = planilha[XLSX.utils.encode_cell({ r, c })];
        if (celula && typeof celula.v === "string") celula.t = "s";
      }
    }
  });
}
