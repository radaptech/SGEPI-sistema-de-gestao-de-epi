# Plano: várias unidades (lojas, obras, almoxarifados) dentro de um tenant

Exemplo que guia o plano: uma rede de supermercados com 10 lojas. Ela é **um tenant** (uma URL, um contrato,
um cadastro de EPIs), e as lojas são **unidades** configuradas dentro dele. Cada unidade tem o próprio estoque,
as próprias entregas e os próprios alertas; o gestor da rede vê tudo junto.

Escrito em 08/11/2026, a partir do código atual (migração 000041).

---

## Princípios

1. **Empresa com uma unidade não percebe nada.** A migração cria uma unidade "Principal" em todo tenant e
   preenche tudo com ela. Enquanto o tenant tiver uma unidade só, a tela não muda (sem seletor, sem coluna nova).
2. **Cada fase vai para produção sozinha.** Nenhuma fase deixa o sistema quebrado esperando a próxima.
3. **O saldo continua no lote.** O lote (`entrada_epi_item`) ganha a unidade onde está guardado. Transferir
   é mover quantidade de um lote para um lote novo na outra unidade, não mudar um contador.
4. **Unidade é mais um filtro dentro do tenant**, nunca no lugar do `tenant_id`. Toda query continua com
   `tenant_id = $N`, e as que mexem em estoque ganham também `id_unidade = $M`. 

## O que já existe e ajuda

- O saldo já é por lote, com FEFO e `FOR UPDATE` (`ListarLotesParaConsumo`). Basta filtrar por unidade.
- O cancelamento de entrega repõe no **lote exato** (`ReporEstoqueLote`). Como o lote vai saber a unidade,
  o cancelamento já devolve para a loja certa sem mudança.
- `epis_entregues` aponta para o lote de origem, então dá para saber de qual unidade saiu cada item.
- Cadastros que ficam **compartilhados pela rede** e não mudam: EPI, tamanho, fornecedor, função, kit por
  função, departamento, motivos de devolução, proteção.

## Decisões (com a recomendação)

| # | Pergunta | Recomendação | Por quê |
|---|---|---|---|
| D1 | Onde fica a unidade do estoque? | No **lote** (`entrada_epi_item.id_unidade`); a NF também guarda, para exibir | A transferência divide o lote; se a unidade ficasse só na NF, o lote não poderia estar em dois lugares |
| D2 | De onde sai o EPI na entrega? | Da **unidade do funcionário** por padrão; o balcão pode trocar | É o caso normal (a loja entrega para a própria equipe) e evita escolher toda vez |
| D3 | A entrega guarda a unidade? | **Sim**, `entrega_epi.id_unidade` | O funcionário muda de loja; o relatório de custo por loja não pode mudar junto |
| D4 | Como limitar o usuário a algumas lojas? | Tabela `usuario_unidade`; **sem linha = todas as unidades** | Os admins atuais continuam vendo tudo, sem migrar dados |
| D5 | Como o front diz "estou na Loja 3"? | Header `X-Unidade-ID` (como o `X-Tenant-ID`); vazio = todas as permitidas | Não precisa mudar a assinatura de cada rota |
| D6 | Transferência tem "em trânsito"? | **Não na primeira versão**: sai de uma e entra na outra na hora | Cobre 90% dos casos; trânsito com confirmação de recebimento vem depois |
| D7 | Estoque mínimo por unidade? | Usar o `epi.alerta_minimo` em cada unidade; mínimo próprio por unidade fica para a Fase 8 | Começa simples e já funciona para a maioria |
| D8 | Cobrança | `planos.limite_unidades` (Fase 9) | Mesmo padrão dos limites de funcionários e usuários |

Revise as decisões antes de começar a Fase 1; as outras fases dependem delas.

---

## Fases

Tamanho: **P** (meio dia), **M** (1 a 2 dias), **G** (3 a 5 dias).

### Fase 1: cadastro de unidades e coluna em tudo [M] (feita em 08/11/2026, branch feat/unidades)

> **Como ficou** (difere do rascunho abaixo em dois pontos, para mexer em menos código):
> - Em vez do helper `UnidadePadrao` em cada service, um **trigger** (`preencher_unidade_padrao`) põe a
>   primeira unidade ativa do tenant quando o INSERT não manda `id_unidade`, e outro trigger
>   (`criar_unidade_principal`) cria a "Principal" em toda empresa nova. Nenhum INSERT, importador ou
>   helper de teste precisou mudar. A partir da Fase 3/4 a aplicação passa a mandar a unidade explícita.
> - As FKs são **compostas**, `(id_unidade, tenant_id) → unidade(id, tenant_id)`: o banco recusa um registro
>   apontando para a unidade de outro tenant.
> - Rotas: `GET /api/unidades`, `POST /api/gerencial/unidades`, `PATCH` e `DELETE /api/gerencial/unidades/:id`.
>   A listagem traz `funcionarios` e `saldo` de cada unidade.
> - Testes: `internal/service/testeIntegracaoUnidade_test.go`.

**O quê:** existir a tabela de unidades e todo registro de estoque e de pessoas saber a sua unidade.
Nada muda na tela ainda.

**Como:**
1. `make migration ADD-UNIDADES`:
   - `CREATE TABLE unidade (id SERIAL PK, tenant_id INT NOT NULL REFERENCES empresas, nome VARCHAR(100) NOT NULL, ativo BOOLEAN NOT NULL DEFAULT TRUE, deletado_em TIMESTAMP)` e índice único `(tenant_id, nome) WHERE deletado_em IS NULL`.
   - `INSERT INTO unidade (tenant_id, nome) SELECT id, 'Principal' FROM empresas;`
   - Em `entrada_nf`, `entrada_epi_item`, `funcionario`, `entrega_epi` e `devolucao`:
     `ADD COLUMN id_unidade INT REFERENCES unidade(id)`, `UPDATE ... SET id_unidade = (a Principal do tenant)`
     e depois `SET NOT NULL`.
   - Índice `(tenant_id, id_unidade, id_epi, id_tamanho)` em `entrada_epi_item`, para o consumo FEFO.
   - `.down.sql` derrubando as colunas e a tabela.
2. Toda empresa nova também nasce com a "Principal": no `EmpresaService` (cadastro pelo painel) e no `seed.go`.
3. `database/queries/Unidade.sql`: `CriarUnidade`, `ListarUnidades`, `RenomearUnidade`, `DesativarUnidade`,
   todas com `tenant_id`. A desativação recusa unidade com saldo > 0 ou funcionário ativo.
4. Repository, service e controller no padrão do projeto. Rotas: `GET /api/unidades` e
   `POST/PATCH/DELETE /api/gerencial/unidades`.
5. Os INSERTs que já existem (entrada, funcionário, entrega, devolução) passam a gravar a Principal enquanto
   as próximas fases não chegam. Isso é um helper `UnidadePadrao(ctx, tenantId)` no service.

**Testes:** helper `CreateUnidade` no `SetupDadosTesteIntegracao_test.go` (o `CreateEmpresa` passa a criar a
Principal); teste do CRUD e da recusa de desativar com saldo. Rodar a skill `tenant-isolation-check` em `Unidade.sql`.

**Pronto quando:** a migração roda limpa no banco de dev, todos os testes passam e a tela não mudou.

### Fase 2: tela de unidades [P] (feita em 08/11/2026)

> **Como ficou:** aba "Unidades" em Administração (`src/pages/administracao/AbaUnidades.jsx`): cadastrar, renomear na própria linha e desativar com confirmação na linha. O botão de desativar já vem bloqueado, com o motivo no título, para a última unidade e para unidades com estoque ou funcionários. Testes: `AbaUnidades.test.jsx`.

**O quê:** o admin cadastra as lojas.

**Como:** nova aba "Unidades" em Administração (`src/pages/administracao/`), no mesmo modelo da aba
Departamentos: lista, criar, renomear, desativar. Com uma unidade só, a aba mostra a "Principal" e um texto
curto explicando para que serve.

**Pronto quando:** dá para cadastrar "Loja 1", "Loja 2" e ver na lista.

### Fase 3: funcionário com lotação [P] (feita em 08/11/2026)

> **Como ficou:** `id_unidade` opcional no cadastro (`POST /gerencial/cadastro-funcionario`) e na edição (`PATCH /gerencial/funcionario/:id`); unidade desativada ou de outra empresa → 422. `/funcionarios` e `/funcionario-estoque` devolvem `unidade: {id, nome}`, e `/funcionarios?id_unidade=` filtra. Em Administração → Funcionários, o campo, a coluna e o filtro só aparecem com 2 unidades ou mais. A importação por planilha ficou de fora: não existe importação de funcionários. Testes: `TestFuncionarioLotacao` e `AbaFuncionario.test.jsx`.

**O quê:** cada funcionário pertence a uma unidade.

**Como:**
- `FuncionarioInserir`/`Atualizar` ganham `id_unidade`, opcional no JSON: sem ele, vai a Principal.
- Listagem de funcionários devolve `unidade: {id, nome}`.
- Importação por planilha: coluna opcional "Unidade" (pelo nome; nome desconhecido = erro na linha).
- Front: campo "Unidade" no cadastro de funcionário, que só aparece com 2 unidades ou mais.

**Pronto quando:** dá para mover um funcionário da Loja 1 para a Loja 2 e o histórico dele continua.

### Fase 4: entrada e consumo por unidade [G], a fase central (feita em 08/11/2026)

> **Como ficou:**
> - Entrada: `id_unidade` no corpo; com 2+ unidades ativas, sem ele → 422 "escolha a unidade". Na tela, o campo "Unidade" aparece na Nova Entrada só nesse caso.
> - Entrega: sai da `id_unidade` do pedido ou, sem ela, da unidade do funcionário (`unidadeDaOperacao`), e grava em `entrega_epi.id_unidade`. Faltando, o erro diz quanto há fora: "estoque insuficiente em Loja 1: faltam 3 unidade(s) dentro da validade; há 12 em outras unidades".
> - Devolução e troca: usam a unidade do funcionário. **Limite conhecido** (comentário `ponytail:` no `DevolucaoService`): funcionário transferido devolve na unidade nova; se ela nunca recebeu aquele EPI, não há lote para repor. Resolver junto com a transferência.
> - Tamanhos na tela de entrega: `GET /tamanhos-id-epi/:id?id_unidade=` mostra o saldo da unidade do funcionário escolhido. (`BuscarTamanhosComEstoquePorEpi`, citada no plano, não é usada por nenhuma rota.)
> - O `cadastrar-entrada` respondia 200 "entrada cadastrada" em erro não previsto; agora responde 500.
> - Testes: `TestEstoquePorUnidade` (6 cenários) e `ModalEntrada.test.jsx`.

**O quê:** a nota entra numa loja, e a entrega e a devolução mexem só no estoque da loja.

**Como:**
1. **Entrada:** `cadastrar-entrada` recebe `id_unidade` (obrigatório se o tenant tiver mais de uma unidade).
   `CreateEntradaEpiItem` grava a unidade no lote.
2. **Consumo:** `ListarLotesParaConsumo` ganha `AND id_unidade = $4`. `RegistrarEntrega` decide a unidade:
   a enviada no pedido; senão, a do funcionário. A unidade vai para `entrega_epi.id_unidade`.
3. **Mensagem de falta:** se não fechar o saldo, o erro diz quanto há nas outras unidades
   ("estoque insuficiente na Loja 3; há 12 em outras unidades"). Assim o balcão sabe que pode pedir transferência.
4. **Tamanhos com estoque** (`BuscarTamanhosComEstoquePorEpi`, usado na tela de entrega): filtrar pela unidade.
5. **Devolução:** `ListarLotesParaRepor` filtra pela unidade da devolução (padrão: a do funcionário) e grava
   `devolucao.id_unidade`.
6. **Troca na devolução:** a nova entrega usa a mesma unidade.
7. **Cancelamento:** nada a fazer (repõe no lote exato), mas vale um teste que prova isso.

**Testes de integração** (os mais importantes do plano):
- entrega na Loja 1 não consome lote da Loja 2, mesmo que o da Loja 2 vença antes;
- falta na Loja 1 com saldo na Loja 2 dá erro e não abate nada;
- concorrência: duas entregas simultâneas na mesma unidade (copiar o teste atual de entrega concorrente);
- devolução repõe na unidade certa;
- cancelamento devolve ao lote de origem.

**Pronto quando:** com duas lojas cadastradas, o saldo de cada uma bate com as entradas, entregas e
devoluções dela.

### Fase 5: "em qual loja estou" no app [M] (feita em 08/11/2026)

> **Como ficou:** a unidade vai no header `X-Unidade-ID`, liberado no CORS (`middleware/cors.go`, que substituiu o módulo externo `ginmw`). Cada controller lê com `unidadeEscolhida(ctx)` (0 ou ausente = todas), sem middleware novo. Um `?id_unidade=` na URL vence o header: é o filtro explícito da tela de funcionários e o saldo de tamanhos na entrega. Aceitam o filtro: `/entradas`, `/entradas-estoque`, `/entregas`, `/devolucao`, `/funcionarios`, `/funcionario-estoque`, os `*-dashbord` e as pendências (trocas e faltas de kit). No front, `services/unidadeAtual.js` guarda a loja no `localStorage` e o `api.js` manda o header em toda requisição. O seletor (`components/SeletorUnidade.jsx`) toma o lugar do subtítulo "Gestão de Estoque" no topo, porque ao lado do menu não cabia, e no menu do celular fica embaixo do nome. Trocar de loja recarrega a página. Se a loja guardada for desativada, volta para "Todas". A nova entrada já vem com a loja escolhida. A entrega sai da loja escolhida e, em "Todas", da unidade do funcionário. Testes: `TestFiltroPorUnidade`, `TestUnidadeEscolhida`, `SeletorUnidade.test.jsx` e `api.test.js`.

**O quê:** o usuário escolhe a loja no topo, e o app inteiro mostra os dados dela.

**Como:**
- **Back:** um middleware lê `X-Unidade-ID` e grava no contexto `unidade_id` (0 = todas). As listagens de
  estoque, entradas, entregas, devoluções, funcionários e as rotas `*-dashbord` aceitam o filtro
  opcional `id_unidade`.
- **Front:** `services/api.js` manda o header a partir da unidade guardada no navegador. Um seletor no
  `Header.jsx` ("Loja 3 ▾ / Todas as unidades") aparece só com 2 unidades ou mais. Os formulários de entrada e
  entrega usam a unidade escolhida como padrão. "Todas" serve só para ver; cadastrar pede uma loja.

**Pronto quando:** trocar de loja no topo muda estoque, listas e dashboard, e recarregar a página mantém a loja.

### Fase 6: permissão por loja [M] (feita em 09/11/2026)

> **Como ficou:**
> - Migração 000043: `usuario_unidade (usuario_id, id_unidade, tenant_id)` com FKs compostas para `usuarios(id, tenant_id)` e `unidade(id, tenant_id)`: o banco recusa ligar usuário e unidade de tenants diferentes. Sem linha = todas.
> - **Admin sempre vê todas** (é o gestor da rede): a `Sessao` ignora as linhas de quem é admin. Só o colaborador é limitado, então as rotas `/gerencial` ficaram fora do escopo.
> - O `BuscarSessao` traz as unidades (`int[]`) na mesma query, e a `Sessao` põe no contexto (`middleware.UnidadesKey`).
> - `middleware.LimitarUnidade` (em `api.Use`, depois da sessão): 403 para `?id_unidade=` ou `X-Unidade-ID` fora das permitidas. Depois deixa a unidade só no header (a escolhida ou a primeira permitida) e tira o `id_unidade` da URL, e assim um `?id_unidade=0` não volta a mostrar todas.
> - Escrita: `unidadeDaOperacao`, por onde passam entrega, devolução e troca, recusa unidade fora das permitidas (`ErrUnidadeSemAcesso` → 403), mesmo quando a unidade vem do funcionário.
> - Rotas que ainda somavam o tenant todo ganharam o filtro: `/quantidade-epi`, `/saldo-epi` e o `/tamanhos-id-epi/:id` (agora pelo `unidadeEscolhida`).
> - `GET /unidades` devolve só as permitidas; `/me` traz `unidades` (vazio = todas). Rotas novas: `GET /gerencial/unidades/acessos` e `PUT /gerencial/usuarios/:id/unidades` `{unidades: []}`.
> - Front: seção "Quem vê cada unidade" na aba Unidades (`AcessoUnidades.jsx`, com 2 unidades ou mais), em que cada clique salva. Para usuário limitado, o seletor do topo some com "Todas" e guarda a primeira loja dele.
> - **Limite conhecido** (comentário `ponytail:` em `middleware/unidade.go`): quem tem 2+ lojas vê uma por vez, sem uma visão "todas as minhas". Para ter essa visão, os filtros `id_unidade` viram `int[]` com `ANY`.
> - Testes: `TestLimitarUnidade` (middleware), `TestPermissaoPorUnidade` (integração), `SeletorUnidade.test.jsx` e `AbaUnidades.test.jsx`.

**O quê:** o almoxarife da Loja 3 só vê e mexe na Loja 3; o gestor da rede vê todas.

**Como:**
- Migração: `usuario_unidade (usuario_id, unidade_id, PK composta)`. **Sem linha = todas** (D4).
- `middleware/sessao.go` carrega as unidades permitidas junto com a sessão e grava no contexto.
- O middleware da Fase 5 recusa (403) um `X-Unidade-ID` fora das permitidas; com "todas", os filtros usam
  `id_unidade = ANY($permitidas)`.
- Escrita (entrada, entrega, devolução, transferência) confere se a unidade está entre as permitidas.
  Esse é o ponto que mais exige teste.
- Front: no cadastro de usuário, a escolha "Todas as unidades" ou uma lista de lojas. O seletor do topo mostra
  só as permitidas.

**Testes:** usuário da Loja 3 tentando listar, entregar e dar entrada na Loja 2 recebe 403. É o mesmo
espírito do isolamento entre tenants.

**Pronto quando:** um usuário limitado a uma loja não vê dados das outras em nenhuma tela nem rota.

### Fase 7: transferência entre unidades [M] (feita em 09/11/2026)

> **Como ficou** (difere do rascunho abaixo em um ponto):
> - Migração 000044: tabela `transferencia` (com `CHECK` origem ≠ destino e FKs compostas). **Sem `transferencia_item`**: o lote criado no destino ganha `id_lote_origem` e `id_transferencia`, e isso já liga origem e destino.
> - `TransferenciaService.Transferir`: confere o saldo da origem (`ListarLotesParaConsumo`, `FOR UPDATE`) antes de mexer; faltando, devolve a mesma mensagem da entrega ("há N em outras unidades"). Cada lote consumido vira um lote no destino (`CopiarLoteParaUnidade`: NF, lote, validade, fabricação e valor).
> - Usuário limitado (F6) só transfere **da** própria loja; o destino pode ser qualquer uma. `GET /unidades?destinos=1` lista todas para isso, sem saldo e funcionários das outras.
> - Lote com `id_lote_origem` não é compra: fica fora da tela de Entradas.
> - Cancelar (`DELETE /gerencial/transferencias/:id`, só admin): 409 se o destino já usou algo ou se o lote de origem foi cancelado.
> - Resolveu o limite da F4: funcionário que mudou de loja devolve na nova; sem lote lá, nasce um copiado do último lote do EPI (`ponytail:` no `DevolucaoService`).
> - Rotas: `GET` e `POST /api/transferencias`. Front: botão "Transferir" no Estoque (sai da loja do topo; em "Todas" fica desabilitado) e `ListaTransferencias` embaixo, com "Desfazer" para o admin. A tela manda um EPI por vez (a API aceita vários).
> - Testes: `TestTransferencia` (4 cenários) e `ModalTransferencia.test.jsx`.

**O quê:** mandar 20 botas da Loja 2 para a Loja 5.

**Como:**
- Migração: `transferencia (id, tenant_id, id_unidade_origem, id_unidade_destino, id_usuario, criado_em, observacao)`
  e `transferencia_item (id, tenant_id, id_transferencia, id_lote_origem, id_lote_destino, quantidade)`.
- `TransferenciaService.Transferir`, numa transação:
  - consome FEFO na origem (mesma query da entrega, com `FOR UPDATE`);
  - para cada lote consumido, cria um `entrada_epi_item` na destino copiando NF, lote, validade, fabricação e
    valor unitário (o custo e a rastreabilidade seguem o lote), com `quantidade = quantidade_atual = transferido`;
  - grava os itens ligando os lotes de origem e de destino.
- Cancelar a transferência: só se o lote de destino ainda tiver tudo (`quantidade_atual = quantidade`); aí
  devolve para o lote de origem.
- Front: botão "Transferir" no Estoque (origem = loja atual), com escolha do EPI, tamanho, quantidade e
  destino, e uma lista de transferências.

**Pronto quando:** a soma do estoque da rede não muda com uma transferência, e cada loja vê o que entrou e saiu.

### Fase 8: visão da rede e alertas por loja [M] (feita em 09/11/2026)

> **Como ficou:**
> - Back: `/entradas-dashbord`, `/entregas-dashbord` e `/funcionarios-dashbord` devolvem `id_unidade`. Nenhuma rota nova: as contas seguem no front (`src/utils/indicadores.js`), como o resto da aba.
> - Aba Indicadores, em "Todas as unidades" e com 2 ou mais: bloco "Por unidade" com custo no período, % kit completo e quantos itens estão com estoque baixo em cada loja, da que mais gastou para a que menos gastou (`indicadoresPorUnidade`). Com uma loja escolhida no topo, as listas já vêm só dela e o bloco some.
> - Card "Estoque baixo": antes comparava **cada lote** com o `alerta_minimo` (10 lotes de 3 davam 10 alertas com 30 em estoque). Agora soma os lotes por unidade, EPI e tamanho (`estoqueBaixo`), e saldo zero também conta. Isso muda a contagem também para quem tem uma loja só. A coluna "Unidade" do detalhe só aparece com 2 unidades ou mais; a de lote saiu.
> - O mínimo próprio por unidade (`epi_minimo_unidade`) ficou de fora: o `alerta_minimo` do EPI vale para cada loja (D7).
> - Testes: `indicadores.test.js` (estoque baixo e visão da rede).

**O quê:** o painel que faz a venda para quem tem várias lojas.

**Como:**
- Aba Indicadores, com "Todas as unidades": ranking de custo por loja, % kit completo por loja e lojas com
  estoque baixo. Os cálculos de `src/utils/indicadores.js` ganham o agrupamento por unidade (a entrega já
  traz `id_unidade`).
- Alerta de estoque mínimo por unidade (o card "Estoque baixo" passa a ser por loja).
- Opcional: tabela `epi_minimo_unidade (id_epi, id_unidade, minimo)`, para a loja grande ter mínimo maior.

### Fase 9: plano e master [P]

- `planos.limite_unidades`, com a checagem no `CriarUnidade` (`ErrLimiteExcedido` → 403), como já é feito
  para usuários.
- Telas do master: campo no plano e número de unidades na lista de empresas.

---

## Ordem e dependências

```
F1 ──┬── F2 (tela de unidades)
     ├── F3 (lotação) ──┐
     └──────────────────┴── F4 (consumo) ── F5 (loja atual) ──┬── F6 (permissão)
                                                              ├── F7 (transferência)
                                                              └── F8 (visão da rede)
F9 pode entrar a qualquer momento depois da F1.
```

Para um primeiro cliente com várias lojas, o mínimo vendável é **F1 a F5**: cada loja com seu estoque e o
gestor vendo tudo. Com F6, cada loja ganha o próprio usuário. F7 e F8 são o que faz o produto parecer feito
para rede.

## Riscos e cuidados

- **Query esquecida sem filtro de unidade** mostra saldo errado, mas não vaza entre empresas (o `tenant_id`
  continua lá). As 16 queries que tocam `entrada_epi_item` estão listadas abaixo; revise uma por uma na Fase 4.
- **Permissão (F6) é segurança.** Trate como o isolamento de tenant: teste de 403 para cada rota de escrita.
- **Migração em produção:** o backfill da Fase 1 é um `UPDATE` em cada tabela. Com o volume de hoje é
  instantâneo; com muitos dados, fazer em lotes.
- **Relatórios antigos:** entregas antigas ficam todas na "Principal". Isso está certo: antes não existia loja.

### Queries que tocam o estoque (revisar na Fase 4)

`Estoque.sql`: ListarLotesParaConsumo, AbaterEstoqueLote, ReporEstoqueLote, DevolverItemAoEstoque,
ListarEstoqueAtual, ListarSaldoEstoque.
`EntradaEpi.sql`: CreateEntradaEpiItem, ListarEntradas, CancelarEntrada, ContarItensAtivosNF,
ContarEntradasFiltradas, EntradaDashbord, EntradaEpiEstoque.
`Tamanhos.sql`: BuscarTamanhosPorIdEpi, BuscarTamanhosComEstoquePorEpi.
`Devolucao.sql`: ListarLotesParaRepor.

As que abatem ou repõem por **id do lote** (AbaterEstoqueLote, ReporEstoqueLote) não precisam do filtro: o
lote já é de uma unidade só. O que precisa de filtro é **escolher** o lote (consumo, reposição) e **somar**
saldo (estoque, dashboards).
