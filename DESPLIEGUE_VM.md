# Guía de Despliegue en VM Ubuntu (Opción 1: Git + Docker)

Esta guía documenta los pasos necesarios para desplegar y actualizar el Sistema de Gestión Escolar en la Máquina Virtual provista por el equipo de IT.

## Arquitectura Resultante en la VM
- **Docker Compose** orquestará tres contenedores: Frontend, Backend y Database.
- **Seguridad**: La base de datos es inaccesible desde internet. Solo expone internamente su puerto al backend.
- **Nginx**: Actuará de proxy inverso, absorbiendo todo el tráfico bajo `https://gestion-escolar-soberania-nacional.tierradelfuego.edu.ar`.

---

## 1. Configuración de Nginx (Entregar esto al equipo de IT)
El equipo de IT debe configurar el virtual host de Nginx para administrar el subdominio y el SSL (HTTPS). Esta es la plantilla que necesitan para enrutar el tráfico correctamente a los contenedores Docker locales.

```nginx
server {
    listen 80;
    server_name gestion-escolar-soberania-nacional.tierradelfuego.edu.ar;
    return 301 https://$host$request_uri; # Redirección a HTTPS gestionada por IT
}

server {
    listen 443 ssl;
    server_name gestion-escolar-soberania-nacional.tierradelfuego.edu.ar;

    # Configuración SSL gestionada por IT (certificados, etc.)
    # ssl_certificate ...
    # ssl_certificate_key ...

    # 1. Rutear tráfico del API al Backend (Puerto 3001)
    location /api/ {
        # Reescribimos la ruta para quitar el /api/ antes de que llegue al backend de NestJS
        rewrite ^/api/(.*) /$1 break;
        
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Opcional (CORS from Nginx)
        # add_header 'Access-Control-Allow-Origin' '*';
    }

    # 2. Rutear el resto del tráfico al Frontend de Next.js (Puerto 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 2. Primera Instalación en la VM (Lo haces tú)

1. Conéctate por SSH a la máquina de Ubuntu.
2. Clona tu repositorio de Git en una carpeta (ej. `/var/www/gestion-escolar-sobnac`).
   ```bash
   git clone <URL_DE_TU_REPO> /var/www/gestion-escolar-sobnac
   cd /var/www/gestion-escolar-sobnac
   ```
3. *(Opcional)* Crea un archivo `.env` en esa misma carpeta raíz para reescribir las claves secretas en producción.
   ```
   # Ejemplo de archivo .env
   DB_PASSWORD=ContraseñaUltraSecretaSQL123!
   JWT_SECRET=SemillaCriptograficaParaTokens123
   ```
4. Levanta y construye los contenedores por primera vez:
   ```bash
   docker compose up --build -d
   ```
5. *(Nota)*: El `Dockerfile` del backend ya ejecutará `npx prisma migrate deploy` cuando arranque. Tu base de datos se creará automáticamente.

---

## 3. Flujo de Trabajo: ¿Cómo subir actualizaciones desde tu casa?

Como decidiste usar la **Opción 1** por ahora, tu flujo de vida ante un cambio en el código será:

### En tu computadora (Local)
1. Escribes el código nuevo o haces arreglos.
2. Haces el commit y empujas el código a tu repositorio de internet:
   ```bash
   git add .
   git commit -m "Se arregló el panel de cursos"
   git push origin main
   ```

### En el Servidor de Producción (VM)
1. Entras a la VM por SSH.
2. Te sitúas en la carpeta del proyecto y descargas los cambios:
   ```bash
   cd /var/www/gestion-escolar-sobnac
   git pull origin main
   ```
3. Le ordenas a Docker que reconstruya las imágenes y reinicie solo lo que cambió:
   ```bash
   docker compose up --build -d
   ```
*(El parámetro `-d` garantiza que el proceso vuelva a segundo plano y no se caiga cuando cierres el SSH).*

> **Preparación para el Módulo CI/CD (Futuro Opción 3):**
> Cuando decidas migrar a la **Opción 3** (cero intervención tuya en el servidor), usaremos un archivo de *GitHub Actions*. Ese script básicamente ingresará a esta VM usando una llave SSH cifrada y ejecutará estos mismos tres comandos (`cd`, `git pull`, `docker compose up`) completamente solo. ¡Pero por ahora la opción 1 es perfecta para tener control absoluto!
