# Base de Conocimiento - SGE Soberanía Nacional

Este documento es el "Cerebro" del proyecto. Contiene el contexto crítico, las reglas de negocio y la arquitectura del "Sistema de Gestión Escolar - Soberanía Nacional". 
**Instrucción para la IA:** Al iniciar una nueva conversación o abordar una nueva funcionalidad, SIEMPRE lee este archivo primero para ponerte en contexto y mantener la coherencia del proyecto. Este archivo debe ser **ACTUALIZADO** por la IA cada vez que se agreguen módulos clave o se cambien reglas fundamentales.

## 1. Flujo de Trabajo y Despliegue (¡CRÍTICO!)
*   **Versionamiento y Producción:** El desarrollo se hace en local. Cada vez que se aprueba un cambio en el sistema, se debe hacer un `git commit` y `git push`. Luego, en la Máquina Virtual (MV) de Producción (Linux), se realiza `git pull` y se reinician los servicios (contenedores de Docker).
*   **Base de Datos (Prisma):** 
    *   Cualquier modificación al modelo de base de datos (`schema.prisma`) **DEBE** generar una migración oficial usando `npx prisma migrate dev --name <nombre_descriptivo>`. 
    *   Es vital respetar el historial de migraciones para no tener problemas en producción.
    *   En la MV, la base de datos se actualiza ejecutando `npx prisma migrate deploy`.

## 2. Arquitectura y Stack Tecnológico
*   **Backend:** NestJS + Prisma ORM + PostgreSQL. (Ruta: `/backend`)
*   **Frontend:** Next.js (App Router) + React + Tailwind CSS. (Ruta: `/frontend`)
*   **Generación de Reportes:** Se utiliza `pdfkit` (para control milimétrico de PDFs) y `exceljs` (para hojas de cálculo).

## 3. Sistema de Roles, Seguridad y Permisos
El sistema usa un control de acceso estricto basado en roles (Implementado en `usePermissions.ts` del Frontend y `RolesGuard` del Backend):
*   **Roles Existentes:** ADMIN, DIRECTIVO, SECRETARIO, PROSECRETARIO, DEP_ESTUDIANTES, COORDINADOR, JEFE_PRECEPTOR, PRECEPTOR.
*   **Directivo vs Admin:** El rol DIRECTIVO tiene acceso operativo idéntico al ADMIN, pero con una **restricción jerárquica de seguridad**: no puede crear, editar, ni visualizar en las listas a usuarios con perfiles de nivel ADMIN o DIRECTIVOS.
*   **Visualización de Menú:** Los accesos del menú lateral (`Sidebar.tsx`) se habilitan u ocultan dinámicamente según el rol.

## 4. Estándares de Interfaz Visual y Estilos (CSS)
*   **Textos Oscuros (Contraste):** Todos los inputs, selects y placeholders tienen forzado un `color negro nítido` en el `globals.css` para evitar el color gris tenue por defecto de los navegadores y mejorar la legibilidad.
*   **Diseño Responsivo:** Se utiliza Tailwind CSS priorizando Flexbox y diseños en tarjetas blancas redondeadas con sombra suave.
*   **Tablas de Datos:** Si una tabla tiene demasiada información horizontal (ej. Notas Generales), las columnas de datos cortos (Nº, DNI, Sexo) se comprimen (`w-1 whitespace-nowrap`). Además, se utilizan cabeceras fijas (`sticky top-0`) para permitir un desplazamiento vertical infinito sin perder de vista los títulos de las columnas.

## 5. Reglas Claves por Módulo
*   **Materias (Caja Curricular):** Las materias no se ordenan alfabéticamente de forma automática. Respetan un campo numérico llamado `orden` en la base de datos, lo que permite replicar el orden oficial de la Caja Curricular de la institución. Las consultas y reportes deben ordenar siempre usando: `orderBy: [{ orden: 'asc' }, { nombre: 'asc' }]`.
*   **Reportes PDF (Planillas de Carga Manual):** Se diseñan de forma apaisada (A4 Horizontal). **Regla de oro:** Siempre deben mostrar 30 filas fijas (inyectando filas vacías si sobran espacios) y no dividirse en múltiples hojas, incluyendo un espacio dinámico para "DOCENTE: ______".
*   **Configuración Institucional:** Los activos gráficos (Logo, Sello de Dirección, Firma del Directivo) se almacenan en la base de datos codificados en **Base64** para poder incrustarlos nativamente en los PDFs generados desde el backend sin problemas de rutas de archivos.
