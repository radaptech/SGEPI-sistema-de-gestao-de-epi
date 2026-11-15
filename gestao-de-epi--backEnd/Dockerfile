# ==========================================
# ESTÁGIO 1: O Construtor (Builder)
# ==========================================
FROM golang:1.26.5-alpine AS builder

WORKDIR /app

# Copia e baixa as dependências primeiro (O cache do Docker agradece!)
COPY go.mod go.sum ./
RUN go mod download

# Copia todo o resto do seu código
COPY . .

# Compila o binário otimizado. VERSAO vem do release (tag vX.Y.Z) e aparece no GET /api.
ARG VERSAO=dev
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s -X github.com/davi-fernandesx/sistema-de-gestao-de-epi/internal/routers.Versao=${VERSAO}" -o main .

# ==========================================
# ESTÁGIO 2: A Imagem Final (Produção)
# ==========================================
FROM alpine:3.22

WORKDIR /app

# Instala certificados e configura fuso horário
RUN apk --no-cache add ca-certificates postgresql17-client tzdata
ENV TZ=America/Sao_Paulo

# Desliga os logs coloridos de debug do GIN para ganhar performance
ENV GIN_MODE=release

# 👇 A MÁGICA DOS DIRETÓRIOS AQUI:
# Mantemos a mesma estrutura de pastas do seu projeto original para o Go não se perder
COPY --from=builder /app/database/migrate ./database/migrate

# Copia o binário já compilado
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]