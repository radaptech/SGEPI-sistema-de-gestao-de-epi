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
o front só precisa de `REACT_APP_API_URL` em `SGEPI-FRONT-END/.env`.

## Testes

```sh
cd gestao-de-epi--backEnd && go test ./... -p 1
cd SGEPI-FRONT-END && npm run build && npx vitest run
```

O CI roda o back e o front separados (`.github/workflows/`), cada um só quando a pasta dele muda.

## Histórico

Este repositório junta três que existiam antes, com o histórico completo de cada um:
`radaptech/sgeepi-infra` (raiz), `radaptech/gestao-de-epi--backEnd` (branch `main`) e
`radaptech/SGEPI-FRONT-END` (branch `homologacao`), importados com `git subtree`.
PRs e issues antigos continuam lá.
