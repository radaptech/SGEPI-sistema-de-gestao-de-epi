# SGEPI — Sistema de Gestão de EPI

| pasta | o que é |
|---|---|
| `gestao-de-epi--backEnd/` | API em Go (Gin + sqlc + Postgres) |
| `SGEPI-FRONT-END/` | React (Vite) |
| `docker-compose.dev.yml` | ambiente local: traefik, Postgres, pgadmin, mailpit, api e front |

## Rodar local

```sh
make init          # build + sobe o compose
# http://localhost  (api em /api ou api.localhost)
```

Cada app lê o próprio `.env` (fora do git): modelo do back em `gestao-de-epi--backEnd/.env-example`;
o front chama `/api` no mesmo endereço e o `SGEPI-FRONT-END/.env` pode ficar vazio (`REACT_APP_API_URL`
só para apontar para outra API).

## Testes

```sh
cd gestao-de-epi--backEnd && go test ./... -p 1
cd SGEPI-FRONT-END && npm run lint && npm run build && npx vitest run
```

O CI roda o back e o front separados (`.github/workflows/`), cada um só quando a pasta dele muda.

## Deploy (produção)

Produção é **uma imagem só** (`Dockerfile` da raiz): o Go responde a API em `/api` e entrega o build
do Vite no resto, no mesmo endereço. Por isso o front chama `/api` relativo e a mesma imagem serve
qualquer ambiente, sem URL da API gravada no build e sem CORS. Em dev cada um continua separado
(`docker-compose.dev.yml`).

Só a `main` gera imagem. Cada push nela roda o `release.yml`:

1. testes do back, do front e o e2e (os mesmos workflows de sempre);
2. calcula a versão: a primeira é `1.0.0` e cada push sobe o patch. Um commit com `#minor` ou `#major`
   no texto, desde a última tag, sobe a parte correspondente;
3. publica `<usuario>/sgepi` no Docker Hub, com a tag da versão e `latest`;
4. cria a tag `vX.Y.Z` e o GitHub Release. A tag só existe se a imagem subiu;
5. põe no ar no Railway: grava as variáveis do secret `ENV_PRODUCAO` em cada serviço, troca a imagem
   para `sgepi:<versão>` e faz o deploy.

**As variáveis de ambiente moram no GitHub** (secret `ENV_PRODUCAO`). O Railway guarda uma cópia porque
é lá que o container roda, mas quem escreve nela é só o workflow: não edite variável pelo painel do Railway,
porque o próximo release sobrescreve. Variável que existe só no Railway (ex.: uma referência ao Postgres de
lá) é mantida. Para trocar uma senha, edite o secret e rode o `release.yml` de novo (Actions → Run workflow):
ele reaproveita a tag da versão atual e só refaz o deploy.

Voltar uma versão: no Railway, aponte o serviço para a tag anterior (`.../sgepi:1.0.2`).
`GET /api` responde a versão que está no ar.

### Configuração única

GitHub, em **Settings → Secrets and variables → Actions**:

| Tipo | Nome | Valor |
|---|---|---|
| Variable | `DOCKERHUB_USUARIO` | usuário ou organização no Docker Hub |
| Secret | `DOCKERHUB_TOKEN` | access token do Docker Hub (Read & Write) |
| Secret | `ENV_PRODUCAO` | o `.env` de produção inteiro, `KEY=VALOR` por linha (modelo: `gestao-de-epi--backEnd/.env-example`) |
| Secret | `RAILWAY_API_TOKEN` | token de **workspace** do Railway (Account Settings → Tokens). Token de projeto não serve: não troca a imagem |
| Variable | `RAILWAY_PROJECT_ID` | ID do projeto (Project Settings) |
| Variable | `RAILWAY_ENVIRONMENT_ID` | ID do ambiente `production` |
| Variable | `RAILWAY_SERVICOS` | IDs dos serviços separados por espaço: o web e os dois crons |

O `ENV_PRODUCAO` precisa de banco, `SUPABASE_*`, `RESEND_API_KEY`, `URL_FRONTEND_FORMATO`, `SUPER_ADMIN_*`
e `R2_*` (incluindo `R2_BUCKET_NAME_LOGOS`). Não ponha `PORT` nem `FRONT_DIR`: o Railway injeta o primeiro
e a imagem já traz o segundo. O job roda no environment `producao` do GitHub; em Settings → Environments
dá para exigir aprovação antes de cada deploy.

Railway, criando os serviços uma vez (a imagem e as variáveis o workflow preenche):

- **Web**: healthcheck em `/api`. As migrações rodam sozinhas no boot. Aponte o domínio e o curinga
  `*.radaptech.com.br` (um subdomínio por empresa) para este serviço.
- **Crons**, com o comando de start trocado: `./main backup-banco` (backup no R2, ver
  `gestao-de-epi--backEnd/docs/BACKUP.md`) e `./main atualizar-caepi` (base de CAs do MTE, diário ou semanal).

Antes de um release com migração destrutiva, rode o backup.

## Histórico

Este repositório junta três que existiam antes, com o histórico completo de cada um:
`radaptech/sgeepi-infra` (raiz), `radaptech/gestao-de-epi--backEnd` (branch `main`) e
`radaptech/SGEPI-FRONT-END` (branch `homologacao`), importados com `git subtree`.
PRs e issues antigos continuam lá.
