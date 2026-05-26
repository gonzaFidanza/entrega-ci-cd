# Dockerfile multi-stage para optimizar el tamaño de la imagen final
# Stage 1: Build - instalar dependencias
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos package.json y package-lock.json primero (mejor caching de capas)
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Producción - solo lo necesario para correr
FROM node:20-alpine

WORKDIR /app

# Usuario no-root por seguridad
RUN addgroup -S app && adduser -S app -G app

# Copiamos node_modules del builder
COPY --from=builder /app/node_modules ./node_modules

# Copiamos el código
COPY src ./src
COPY package.json ./

# Cambiamos al usuario no-root
USER app

# Render asigna el puerto via $PORT, default 3000
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/app.js"]
