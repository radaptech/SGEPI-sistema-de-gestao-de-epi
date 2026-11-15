# ==========================================
# ESTÁGIO 1: Construir a aplicação (Build)
# ==========================================
FROM node:22-alpine AS builder

# Define a pasta de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de dependência primeiro (melhora o cache do Docker)
COPY package*.json ./

# Instala as dependências
RUN npm ci

# Copia o resto do código do repositório
COPY . .

# Roda o build do Vite (sai em 'build', configurado no vite.config.js)
RUN npm run build

# ==========================================
# ESTÁGIO 2: Servir a aplicação na nuvem
# ==========================================
FROM node:22-alpine

WORKDIR /app

# Instala o pacote 'serve' globalmente para rodar o site
RUN npm install -g serve

# Copia APENAS os arquivos compilados do estágio anterior
COPY --from=builder /app/build ./build

# O Railway injeta a variável $PORT automaticamente. 
# O comando abaixo diz para o serve escutar nessa porta.
CMD ["sh", "-c", "serve -s build -l tcp://0.0.0.0:${PORT:-3000}"]