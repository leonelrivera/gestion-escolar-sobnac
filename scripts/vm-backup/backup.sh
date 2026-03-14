#!/bin/bash

# ==============================================================================
# Script de Backup Automático para Gestión Escolar SOBNAC
# Genera un dump de la DB PostgreSQL en Docker, verifica integridad y sube a Drive.
# Mantiene solo las últimas 2 copias locales.
# ==============================================================================

# --- CONFIGURACIÓN (Rellenar estos datos en la VM o vía .env) ---
# Se recomienda usar un archivo .env en el mismo directorio que este script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/backup.env" ]; then
    source "$SCRIPT_DIR/backup.env"
fi

# Variables (por defecto si no están en backup.env)
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/sgesoberanianacional/backups}"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-gestion_escolar_sobnac}"
GDRIVE_REMOTE="${GDRIVE_REMOTE:-gdrive:/backups}"
SERVER_NAME="${SERVER_NAME:-VM-SGE-SOBNAC}"

# Telegram
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# Tiempos y nombres de archivo
START_TIME=$(date +%s)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="backup_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

# ================ FUNCIONES =================
send_telegram() {
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d parse_mode="HTML" \
            -d text="$1" > /dev/null
    fi
}

# Inicio del proceso
mkdir -p "$BACKUP_DIR"

# 1. Ejecutar Backup y Comprimir
echo "[$(date)] Iniciando backup de la base de datos..."
if ! docker exec -t "$DB_CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILEPATH"; then
    ERROR_MSG="🚨 <b>ERROR BACKUP</b>%0A%0A🛑 Falló la ejecución de pg_dump en el contenedor $DB_CONTAINER_NAME."
    echo "[$(date)] $ERROR_MSG"
    send_telegram "$ERROR_MSG"
    exit 1
fi

# 2. Comprobar Integridad
if gzip -t "$FILEPATH" 2>/dev/null; then
    echo "[$(date)] Archivo íntegro generado: $FILENAME"
else
    ERROR_MSG="🚨 <b>ERROR CRÍTICO</b>%0A%0A🛑 El backup generado ($FILENAME) está corrupto."
    echo "[$(date)] $ERROR_MSG"
    rm -f "$FILEPATH"
    send_telegram "$ERROR_MSG"
    exit 1
fi

# Obtener tamaño del archivo
FILESIZE=$(du -h "$FILEPATH" | cut -f1)

# 3. Subir a Google Drive
echo "[$(date)] Subiendo a Google Drive ($GDRIVE_REMOTE)..."
if rclone copy "$FILEPATH" "$GDRIVE_REMOTE"; then
    echo "[$(date)] Subida exitosa a Google Drive."
else
    ERROR_MSG="🚨 <b>ERROR DE SUBIDA</b>%0A%0A🛑 Falló la subida de $FILENAME a Google Drive."
    echo "[$(date)] $ERROR_MSG"
    send_telegram "$ERROR_MSG"
    exit 1
fi

# 4. Limpieza Local (Mantener los últimos 2)
echo "[$(date)] Limpiando archivos locales antiguos (manteniendo 2)..."
cd "$BACKUP_DIR" || exit
count=$(ls -1tr *.sql.gz 2>/dev/null | wc -l)
if [ "$count" -gt 2 ]; then
    ls -1tr *.sql.gz | head -n -$(($count - 2)) | xargs -r rm -f --
fi

# Calcular duración
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))
FORMATTED_DURATION="${MINUTES}m ${SECONDS}s"

# Enviar resumen por Telegram
SUCCESS_MSG="✅ <b>Backup Exitoso</b>%0A%0A📄 Archivo: <code>$FILENAME</code>%0A📦 Tamaño: <code>$FILESIZE</code>%0A⏱ Duración: <code>$FORMATTED_DURATION</code>%0A🖥 Servidor: <code>$SERVER_NAME</code>"
send_telegram "$SUCCESS_MSG"

echo "[$(date)] Proceso completado. Duración: $FORMATTED_DURATION. Tamaño: $FILESIZE."

