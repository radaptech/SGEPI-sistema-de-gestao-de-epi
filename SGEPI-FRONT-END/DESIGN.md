---
name: SGEPI
description: Controle de estoque, entrega e devolução de EPIs com cara de etiqueta de almoxarifado.
colors:
  canvas: "rgb(238 240 242)"
  surface: "rgb(255 255 255)"
  sunken: "rgb(246 247 248)"
  line: "rgb(217 220 225)"
  line-strong: "rgb(160 166 175)"
  ink: "rgb(22 24 29)"
  ink-2: "rgb(74 80 90)"
  ink-3: "rgb(98 105 116)"
  action: "rgb(22 24 29)"
  action-hover: "rgb(52 56 64)"
  on-action: "rgb(255 255 255)"
  atencao: "rgb(138 98 0)"
  atencao-solid: "rgb(214 154 0)"
  atencao-soft: "rgb(255 244 204)"
  atencao-line: "rgb(236 205 120)"
  erro: "rgb(180 35 24)"
  erro-solid: "rgb(196 50 31)"
  erro-soft: "rgb(253 234 231)"
  erro-line: "rgb(240 180 170)"
  ok: "rgb(36 110 68)"
  ok-solid: "rgb(47 125 79)"
  ok-soft: "rgb(230 242 234)"
  ok-line: "rgb(170 210 185)"
  info: "rgb(29 79 145)"
  info-solid: "rgb(29 79 145)"
  info-soft: "rgb(229 237 247)"
  info-line: "rgb(170 195 228)"
typography:
  headline:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  figure:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\" 1"
  title:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  body:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    fontFeature: "\"tnum\" 1"
  label:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: "1rem"
    letterSpacing: "0.025em"
  data:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
rounded:
  sm: "3px"
  DEFAULT: "4px"
  md: "6px"
spacing:
  grid-gap: "12px"
  card-x: "16px"
  modal-x: "32px"
  modal-section: "24px"
  section-gap: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.on-action}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "46px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
    padding: "0 12px"
    height: "56px"
  tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  etiqueta-faixa:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    padding: "8px 16px"
  etiqueta-faixa-erro:
    backgroundColor: "{colors.erro-soft}"
    textColor: "{colors.erro}"
  etiqueta-faixa-atencao:
    backgroundColor: "{colors.atencao-soft}"
    textColor: "{colors.atencao}"
  aviso-erro:
    backgroundColor: "{colors.erro-soft}"
    textColor: "{colors.erro}"
    rounded: "{rounded.md}"
    padding: "14px"
  table-head:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "16px"
---

# Design System: SGEPI

## Overview

**Creative North Star: "Etiqueta de Almoxarifado"**

Cada registro tem cara de etiqueta impressa de almoxarifado: tinta preta sobre papel branco, presa num quadro cinza frio, contornada por fio de 1px. O sistema é de operação (modo Operate): denso, legível de pé no balcão, e sem nada que precise ser decifrado. O registro vira prova em fiscalização, então a superfície precisa parecer documento confiável, não vitrine.

A cor é reservada para estado. Âmbar avisa, vermelho bloqueia, verde confirma, azul informa; fora disso tudo é tinta e papel em três tons de cinza. O tema escuro não é outro design: é a mesma etiqueta invertida em grafite, obtida trocando os tokens em `.dark`, sem que um componente sequer saiba em que tema está.

O sistema recusa o SaaS de cards azuis translúcidos com glow: nada de neon, gradiente, desfoque ou brilho, exatamente o que o dono pediu para tirar ("cara de IA").

**Key Characteristics:**
- Papel branco sobre quadro cinza frio, fio de 1px como única divisão.
- Cor só para estado, em quatro famílias com variantes texto / solid / soft / line.
- Ação principal em tinta sólida (preto no claro, quase branco no escuro).
- Dados de registro (CA, lote, matrícula, CPF, perfil) em monoespaçada.
- Plano: sombra só em camada que flutua sobre a página.
- Cantos levemente arredondados (3-6px), como etiqueta impressa.

## Colors

Neutros frios de tinta e papel carregam 100% da estrutura; quatro famílias de estado aparecem só quando há algo a dizer. Os valores são tripletos RGB em `src/index.css` (`:root` e `.dark`), expostos ao Tailwind como `rgb(var(--x) / <alpha-value>)`; esse é o formato normativo.

### Primary
- **Tinta de Carimbo** (action / action-hover): fundo do botão principal e do selo do logotipo. É a mesma tinta do texto, propositalmente: a ação mais importante é a mais escura da tela, não a mais colorida. No escuro inverte para quase branco com texto grafite (on-action).

### Neutral
- **Quadro Cinza Frio** (canvas): fundo da página, onde as etiquetas ficam presas.
- **Papel** (surface): toda superfície de conteúdo: etiquetas, tabelas, modais, barra superior, campos.
- **Papel Sombreado** (sunken): faixa neutra da etiqueta, cabeçalho de tabela, hover de item de menu, campo de busca.
- **Fio** (line): bordas de 1px e divisórias (`divide-line`). **Fio Reforçado** (line-strong): borda em hover e sublinhado de aba em hover.
- **Tinta** (ink), **Tinta Média** (ink-2), **Tinta Clara** (ink-3): texto principal; rótulos e itens de navegação inativos; legendas, placeholders, ícones inativos e valor zero de pendência.

### Estado (atencao, erro, ok, info)
Cada família tem quatro papéis fixos: o tom base é texto e ícone, `-soft` é fundo de aviso/faixa/badge, `-line` é a borda desse aviso, `-solid` é preenchimento cheio (toast, hover destrutivo, barra de progresso).
- **Âmbar de Sinalização** (atencao): CA vencendo, estoque baixo, troca próxima.
- **Vermelho de Bloqueio** (erro): sem EPI do kit, CA vencido/cancelado, erros de formulário, ação destrutiva.
- **Verde de Conferido** (ok): ativo, entregue, sucesso.
- **Azul NBR** (info): informação neutra. Previsto no sistema e usado com parcimônia.

### Named Rules
**The Cor-é-Estado Rule.** Cor saturada só aparece para dizer atenção, erro, ok ou info. Nada de cor decorativa, de marca ou de categoria; se não é estado, é tinta.

**The Token-Troca Rule.** Componentes não usam classes `dark:` de cor. Os tokens mudam em `.dark`; o componente escreve `bg-surface text-ink` uma vez e vale nos dois temas. Cor literal (`text-white`, hex inline) fura o tema e não entra.

## Typography

**Body Font:** Archivo Variable (com system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono Variable (com ui-monospace, monospace)

**Character:** Archivo é grotesca de etiqueta industrial, firme no negrito e compacta; JetBrains Mono marca tudo o que é código de registro, como se fosse impresso pela máquina. O body inteiro liga `tnum` para que números alinhem em coluna.

### Hierarchy
- **Headline** (700, 1.5rem/2rem, tracking -0.025em): título de página ("Olá, ...") e título de modal.
- **Figure** (700, 1.875rem, line-height 1, tabular): o número grande da etiqueta.
- **Title** (600, 1rem): título de seção ("Pendências", "Estoque", "Adicionar itens à entrega"), em caixa normal.
- **Body** (400-600, 0.875rem/1.25rem): texto corrente, células, botões, abas. É o tamanho dominante da interface.
- **Label** (700, 0.75rem, tracking 0.025em, CAIXA ALTA): rótulo de campo de formulário e cabeçalho de coluna de tabela; nunca acima de título como chamariz.
- **Caption** (400, 0.75rem, ink-3): descrição sob o número da etiqueta, data, subtítulo do logotipo.
- **Data** (JetBrains Mono, 500, 0.75-0.875rem): CA, lote, matrícula, CPF, código, perfil do usuário, valores do resumo.

### Named Rules
**The Dado-em-Mono Rule.** Todo identificador que alguém confere contra um papel (CA, lote, matrícula, CPF, código) vai em monoespaçada. Nome de pessoa e de EPI ficam em Archivo.

**The Espaço-Estreito Rule.** O espaço da Archivo é estreito e some em caixa alta com tracking; por isso `.uppercase` carrega `word-spacing: 0.14em` globalmente. Não remova, e não monte caixa alta por outro caminho (CSS inline, `text-transform` próprio) que escape dessa regra.

## Layout

Coluna central de até 1280px (`max-w-7xl`), com respiro lateral de 16 / 24 / 32px em mobile, tablet e desktop. A página empilha seções separadas por 32px; cada seção tem um título e uma grade de etiquetas com vão de 12px, em 2 colunas no mobile e 4 a partir de 1280px. A barra superior é fixa no topo (56px), branca, com fio inferior.

Modais centralizados sobre véu escuro, largura máxima de 896px no fluxo de entrega, altura máxima de 95vh com corpo rolável e cabeçalho e rodapé fixos. Respiro interno de 24px (32px a partir de 640px). Dentro do corpo, seções são irmãs separadas por fio (`divide-y`) com 24px acima e abaixo, nunca caixas dentro de caixas.

Controles têm altura fixa: 40px para botões de ação de página, 46px para campos de formulário, 36px para botões compactos da barra (Sair). Abaixo de 1024px a navegação vira menu sanduíche.

### Named Rules
**The Seção-por-Fio Rule.** Dentro de um modal ou formulário, seções se separam por um fio de 1px e espaço, não por cartões aninhados. Uma caixa com borda dentro de outra caixa com borda só é aceita para lista/tabela de dados.

**The Ordem-do-Balcão Rule.** O fluxo de entrega segue a ordem do balcão: colaborador, depois itens, depois assinatura, e a ação de confirmar fica no rodapé à direita. Novos fluxos de movimentação (devolução, troca) seguem a mesma sequência.

## Elevation & Depth

O sistema é plano. Profundidade em repouso vem de tom (canvas sob surface, sunken como faixa) e de fio de 1px, nunca de sombra. Sombra só existe para o que flutua sobre a página e precisa se destacar dela.

### Shadow Vocabulary
- **Modal** (`box-shadow: 0 12px 32px -8px rgb(0 0 0 / 0.25), 0 2px 6px rgb(0 0 0 / 0.08)`): modais, menu suspenso "Mais" e menu mobile.
- **Véu** (`rgb(10 12 15 / 0.55)`, sem desfoque): fundo atrás de modal.

### Named Rules
**The Sombra-só-Flutua Rule.** Etiquetas, tabelas, barras e campos não têm sombra, nem em hover. Hover se mostra trocando o fio de line para line-strong.

## Shapes

Cantos levemente arredondados, como etiqueta impressa: 3px (pequenos selos), 4px (padrão, selo do logotipo, chip de código) e 6px em praticamente tudo (etiquetas, botões, campos, modais). Nunca acima de 8px. Círculo só para spinner e pontos de status. Bordas são sempre 1px sólidas em line; tracejado é reservado para área vazia que espera conteúdo (lista de itens vazia, área de assinatura/foto). Sublinhado de 2px em ink marca a aba ativa.

## Components

### Buttons
Tinta sólida para a ação, papel com fio para o resto.
- **Shape:** cantos de 6px, altura 40px, ícone 16px à esquerda do texto, peso 600.
- **Primary:** fundo action, texto on-action. Uma por contexto ("Nova entrega", "Confirmar Entrega").
- **Hover / Focus:** primary vai para action-hover; secondary troca a borda para line-strong. Foco é anel de 2px em ink com 2px de afastamento (global em `:focus-visible`). Desabilitado = opacidade 50%.
- **Secondary:** fundo surface, fio line, texto ink ("Devolução", "Entrada", "Foto", "Assinar").
- **Ghost:** sem fundo nem borda, texto ink-2, hover em sunken ("Cancelar", fechar modal).
- **Destrutivo:** neutro em repouso; hover em erro com fundo erro-soft e borda erro-line (Sair, excluir linha).

### Badges / Avisos de estado
- **Style:** fundo `-soft`, texto no tom base, fio `-line`, cantos de 6px. O mesmo trio vale para badge de status, faixa da etiqueta e aviso de formulário.
- **State:** a família é escolhida pelo estado (atencao / erro / ok / info), nunca pela categoria do dado.

### Etiquetas (componente assinatura)
A etiqueta de prateleira (`DashboardCard`), reutilizada no Dashboard e nos resumos de Estoque, Funcionários e Entregas.
- **Estrutura:** caixa surface com fio line e cantos de 6px; faixa de cabeçalho (14px, 600, 8px × 16px) com fio inferior; corpo com o número em Figure e a legenda em Caption.
- **Faixa:** neutra (sunken, ink) por padrão. Só ganha cor quando a etiqueta é do grupo pendência e o valor é maior que zero: erro-soft/erro ou atencao-soft/atencao, e o número acompanha o tom. Pendência zerada mostra o número em ink-3.
- **Interação:** com ação vira botão, ganha chevron à direita da faixa e borda line-strong no hover; sem ação é só leitura, sem chevron.

### Cards / Containers
- **Corner Style:** 4px.
- **Background:** surface sobre canvas.
- **Shadow Strategy:** nenhuma (ver Elevation & Depth).
- **Border:** 1px line.
- **Internal Padding:** 16px em etiquetas e linhas de resumo; 24px em painéis maiores.

### Inputs / Fields
- **Style:** fundo surface, fio line, cantos de 6px, altura 46px, texto 14px peso 500, placeholder ink-3. Rótulo em Label acima, a 6px.
- **Focus:** borda e anel de 1px em ink. Caret e accent-color em ink.
- **Error / Disabled:** erro com fio erro-line e mensagem em erro; desabilitado em 50% de opacidade.
- **Busca com lista:** campo em sunken colado à lista de resultados (mesmo fio, cantos só em cima e só embaixo), matrícula em mono entre colchetes.

### Navigation
- **Barra superior:** surface com fio inferior, selo action com ícone à esquerda, abas centralizadas, Sair à direita.
- **Abas sublinhadas:** 14px, ícone de 16px em ink-3; ativa em ink, peso 600, sublinhado de 2px em ink sobreposto ao fio da barra; hover escurece o texto e mostra sublinhado line-strong. Itens excedentes vão para "Mais" (menu suspenso com sombra Modal).
- **Abas internas:** o mesmo padrão sublinhado com 44px de altura e `role="tablist"` / `aria-selected` (Administração).
- **Mobile:** abaixo de 1024px, botão sanduíche abre painel surface com itens empilhados; ativo em sunken, peso 600.

### Tabelas
Cabeçalho em sunken com fio inferior, rótulos em Label ink-2, células em Body com 16px de respiro e linhas separadas por fio. Colunas de dado de registro em mono.

## Do's and Don'ts

### Do:
- **Do** escrever cor só com os tokens semânticos (`bg-surface`, `text-ink`, `border-line`, `bg-erro-soft`...) e deixar o `.dark` trocar.
- **Do** usar `bg-action text-on-action` para a única ação principal do contexto e `border-line bg-surface` para as secundárias.
- **Do** escolher atencao / erro / ok / info pelo estado do dado, no trio soft + base + line.
- **Do** pôr CA, lote, matrícula, CPF e códigos em `font-mono`.
- **Do** reutilizar a etiqueta (`DashboardCard`) para qualquer resumo numérico, com faixa colorida só em pendência maior que zero.
- **Do** separar seções de modal por fio, na ordem colaborador → itens → assinatura.
- **Do** mostrar hover trocando o fio para line-strong.

### Don't:
- **Don't** usar classes `dark:` de cor nem cor literal (`text-white`, hex) em componente.
- **Don't** usar desfoque, gradiente, glow, neon ou translúcido; o véu do modal é opaco a 55% sem blur.
- **Don't** pôr sombra em etiqueta, tabela, campo ou barra; sombra só em modal e menu suspenso; o toast fica só com o fio de 1px.
- **Don't** usar borda esquerda colorida como marcador de estado; estado é faixa ou badge soft + line.
- **Don't** pôr eyebrow/kicker (rótulo pequeno em caixa alta acima de título); caixa alta é só rótulo de campo e cabeçalho de coluna.
- **Don't** aninhar cartão com borda dentro de cartão com borda para separar seções.
- **Don't** colorir a faixa de uma etiqueta que não é pendência ou cujo valor é zero.
