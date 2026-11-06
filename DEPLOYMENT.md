# Despliegue en Vercel y Supabase

## Vercel Multi-Service Project

Importar el repositorio con la raíz del proyecto y seleccionar **Services** como framework del proyecto. `vercel.json` define dos servicios: `backend` (Express, `backend/`) y `frontend` (Vite, `frontend/`). Las rutas `/api/*`, `/api` y `/health` van al backend; el resto va al frontend. El rewrite interno del frontend entrega `index.html` para las rutas de React Router.

Vercel Services figura actualmente como Beta. Confirmar que esté habilitado para el equipo antes de crear el proyecto.

## Variables de entorno

Configurar en **Vercel → Project → Settings → Environment Variables** para Production y Preview:

- `DATABASE_URL`: cadena de Supabase **Transaction pooler**, puerto `6543`, con `sslmode=require`, `pgbouncer=true` y `connection_limit=1`. Es la conexión de runtime de Prisma para las funciones serverless.
- `DIRECT_URL`: cadena directa de Supabase para Prisma CLI y migraciones. Si el entorno que ejecuta migraciones no tiene IPv6, usar la cadena **Session pooler**, puerto `5432`, en vez de la conexión directa. No apuntar esta variable al pooler transaccional.
- `LOGIN_RATE_LIMIT_SECRET`: opcional pero recomendado; secreto aleatorio estable de al menos 32 bytes para el HMAC del identificador del rate limit. Si no se define, el backend usa `DATABASE_URL` como clave HMAC. No usar una clave distinta entre Preview/Production sin necesidad; rotarla invalida los hashes previos, que caducan y se limpian con el tiempo.
- `SESION_HORAS`: opcional, por defecto `8`.
- `CORS_ORIGIN`: opcional. Las solicitudes same-origin se permiten automáticamente; si se usa otro origen web, declarar aquí su origen exacto (`https://...`).

En local, `DATABASE_URL` sigue apuntando a PostgreSQL local y `DIRECT_URL` puede usar la misma cadena. No guardar cadenas con credenciales en Git. La plantilla está en `backend/.env.example`.

## Supabase y Prisma

Crear un proyecto PostgreSQL en Supabase y copiar las cadenas desde **Connect**. La app no usa credenciales Supabase desde el navegador: Prisma conecta desde el backend. Revisar y aplicar las migraciones existentes desde un entorno controlado con `DIRECT_URL`, incluido `20261106140000_limite_intentos_login_compartido`. Este repositorio no aplica migraciones automáticamente durante el despliegue.

La tabla `intentos_limite_login` conserva solo un HMAC del par IP/correo, el inicio de ventana, fallos y reservas activas. La migración debe aplicarse antes de habilitar la nueva versión del backend; hasta entonces, la nueva versión responderá con error al login porque el rate limit falla de forma cerrada.

## Validación del despliegue

La configuración del repositorio prepara el build, pero no crea el proyecto de Vercel, no configura variables remotas y no ejecuta migraciones. Antes de producción, validar el Preview de Vercel, login, cookies `Secure`/`HttpOnly`/`SameSite=Lax`, lecturas/escrituras con Supabase y las rutas profundas de React Router.
