# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Argumento para la URL de la API (para compilar en Next.js)
# En producción será la URL pública gestionada por Nginx
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Copiar el build de Next.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Preparar el script de entrypoint para inyección en tiempo de ejecución
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]
CMD ["npm", "run", "start"]
