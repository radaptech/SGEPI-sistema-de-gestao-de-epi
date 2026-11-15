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

# O Vite grava a URL da API dentro do JS no build: ela tem que chegar aqui como build arg.
# Sem ela, o api.js cai no endereço padrão (homologação).
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Roda o build do Vite (sai em 'build', configurado no vite.config.js)
RUN npm run build

# ==========================================
# ESTÁGIO 2: Servir a aplicação na nuvem
# ==========================================
FROM node:22-alpine

WORKDIR /app

# Instala o pacote 'serve' globalmente para rodar o site
RUN npm install -g serve@14.2.4

# Copia APENAS os arquivos compilados do estágio anterior
COPY --from=builder /app/build ./build

# O Railway injeta a variável $PORT automaticamente. 
# O comando abaixo diz para o serve escutar nessa porta.
CMD ["sh", "-c", "serve -s build -l tcp://0.0.0.0:${PORT:-3000}"]