# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar openssl para compatibilidad con Prisma en Alpine
RUN apk add --no-cache openssl

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y generar cliente Prisma
COPY . .
RUN npx prisma generate

# Compilar NestJS
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

WORKDIR /app

# Instalar openssl para que Prisma funcione en Alpine en producción
RUN apk add --no-cache openssl

# Copiar dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar carpetas construidas desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Ejecutar migraciones de DB, poblarla (seed) y arrancar la app
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start:prod"]
