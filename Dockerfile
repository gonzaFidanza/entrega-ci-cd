# Dockerfile multi-stage para optimizar el tamaño final
# Stage 1: Build - instalar dependencias con pnpm
FROM node:20-alpine AS builder

# Habilitar corepack (viene con Node 20) para usar pnpm sin npm install -g
RUN corepack enable

WORKDIR /app

# Copiamos manifests primero para aprovechar el caché de capas
COPY package.json pnpm-lock.yaml ./

# Instalar solo dependencias de producción
RUN pnpm install --frozen-lockfile --prod

# Stage 2: Producción
FROM node:20-alpine

WORKDIR /app

# Usuario no-root por seguridad
RUN addgroup -S app && adduser -S app -G app

# Copiamos node_modules desde el builder
COPY --from=builder /app/node_modules ./node_modules

# Copiamos el código
COPY src ./src
COPY package.json ./

USER app

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/app.js"]