#!/bin/sh
# Este script se ejecuta al encender el contenedor de producción.
# Toma el valor real de NEXT_PUBLIC_API_URL (inyectado por docker-compose en runtime)
# y reemplaza el placeholder en todos los archivos compilados de Next.js (.js)

if [ -n "$NEXT_PUBLIC_API_URL" ]; then
  # Reemplazar la URL de respaldo (quemada en el código) con la variante inyectada del ambiente
  # Hay que buscar adentro de las carpetas `.next` que es donde están los JS compilados.
  find /app/.next -type f -name "*.js" -exec sed -i "s|http://localhost:3001|${NEXT_PUBLIC_API_URL}|g" {} +
fi

# Arrancar la aplicación node (Next.js server)
exec "$@"
