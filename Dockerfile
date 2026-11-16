# Imagem única de produção: o Go responde a API em /api e entrega o build do Vite no resto,
# no mesmo endereço (sem CORS e sem URL da API gravada no build). Em dev cada um roda separado
# (docker-compose.dev.yml + os Dockerfile.dev de cada pasta).

# 1. Front: build do Vite
FROM node:22-alpine AS front
WORKDIR /front
COPY SGEPI-FRONT-END/package*.json ./
RUN npm ci
COPY SGEPI-FRONT-END/ ./
RUN npm run build

# 2. API: binário Go. VERSAO vem do release (tag vX.Y.Z) e aparece no GET /api.
#    O FROM golang acompanha a linha "go" do go.mod.
FROM golang:1.26.5-alpine AS api
WORKDIR /api
COPY gestao-de-epi--backEnd/go.mod gestao-de-epi--backEnd/go.sum ./
RUN go mod download
COPY gestao-de-epi--backEnd/ ./
ARG VERSAO=dev
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s -X github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/routers.Versao=${VERSAO}" -o main .

# 3. Imagem final
FROM alpine:3.22
WORKDIR /app
# pg_dump (postgresql17-client) é do cron de backup, que roda nesta mesma imagem
RUN apk --no-cache add ca-certificates postgresql17-client tzdata
ENV TZ=America/Sao_Paulo \
    GIN_MODE=release \
    FRONT_DIR=/app/front
# o golang-migrate procura database/migrate relativo ao diretório de trabalho
COPY --from=api /api/database/migrate ./database/migrate
COPY --from=api /api/main .
COPY --from=front /front/build ./front
EXPOSE 8080
CMD ["./main"]
