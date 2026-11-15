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
4. cria a tag `vX.Y.Z` e o GitHub Release. A tag só existe se a imagem subiu.

O deploy no Railway é manual: no serviço, troque a imagem para a versão nova (`.../sgepi:1.0.3`).
Use a tag da versão, não a `latest`: voltar uma versão é só apontar para a tag anterior.
`GET /api` responde a versão que está no ar.

### Configuração única

GitHub, em **Settings → Secrets and variables → Actions**:

| Tipo | Nome | Valor |
|---|---|---|
| Variable | `DOCKERHUB_USUARIO` | usuário ou organização no Docker Hub |
| Secret | `DOCKERHUB_TOKEN` | access token do Docker Hub (Read & Write) |

Railway, com a imagem `<usuario>/sgepi:<versão>`:

- **Web**: healthcheck em `/api` e as variáveis do `.env-example` (banco, `SUPABASE_*`, `RESEND_API_KEY`,
  `URL_FRONTEND_FORMATO`, `SUPER_ADMIN_*` e `R2_*`, incluindo `R2_BUCKET_NAME_LOGOS`). A porta vem do `PORT`
  que o Railway injeta. As migrações rodam sozinhas no boot. Aponte o domínio e o curinga
  `*.radaptech.com.br` (um subdomínio por empresa) para este serviço.
- **Crons**, com a mesma imagem e as mesmas variáveis, trocando o comando de start:
  `./main backup-banco` (backup no R2, ver `gestao-de-epi--backEnd/docs/BACKUP.md`) e
  `./main atualizar-caepi` (base de CAs do MTE, diário ou semanal).

Antes de um release com migração destrutiva, rode o backup.

## Histórico

Este repositório junta três que existiam antes, com o histórico completo de cada um:
`radaptech/sgeepi-infra` (raiz), `radaptech/gestao-de-epi--backEnd` (branch `main`) e
`radaptech/SGEPI-FRONT-END` (branch `homologacao`), importados com `git subtree`.
PRs e issues antigos continuam lá.
