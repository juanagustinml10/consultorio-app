# Despliegue en Vercel y Supabase

## Estructura de Vercel

Desplegar el repositorio como **un único proyecto Vercel** con raíz `.`. No usar Vercel Multi-Service. La configuración de `vercel.json` instala los dos workspaces, genera Prisma Client, compila backend y frontend, publica `frontend/dist` y crea una Function Node.js para `/api/*`. El paquete raíz fija Node.js 22.x.

En Settings → Build and Deployment verificar:

- Root Directory: `.`
- Node.js Version: `22.x`
- No activar una instalación independiente para `frontend/` o `backend/`.

`/health` se reescribe a la Function `/api/health`. El frontend usa rutas same-origin `/api/v1/...`, por lo que no necesita una URL de backend aparte.

## Variables de entorno

Configurar en Vercel para Production y Preview:

- `DATABASE_URL`: conexión de runtime a PostgreSQL Supabase. Preferir Transaction Pooler, puerto `6543`, con SSL requerido y `connection_limit=1` para funciones serverless.
- `DIRECT_URL`: conexión directa o Session Pooler de Supabase para tareas de Prisma que necesitan conexión directa. No usar Transaction Pooler aquí.
- `LOGIN_RATE_LIMIT_SECRET`: recomendado; secreto aleatorio estable de al menos 32 bytes. No compartirlo ni subirlo a Git.
- `SESION_HORAS`: opcional; duración de sesión, por defecto `8`.
- `CORS_ORIGIN`: solo si el navegador usa un origen distinto al dominio de la API. Para frontend y API en el mismo proyecto no hace falta.

No guardar `.env` en el repositorio. Las variables del navegador no deben contener credenciales de Supabase.

## Migraciones

El build ejecuta `prisma generate`, pero no aplica migraciones. No ejecutar `migrate reset` ni `db push` contra la base con datos. La migración `20261106140000_limite_intentos_login_compartido` agrega la tabla usada por el limitador de intentos de login; el inicio de sesión requiere que esté aplicada en Supabase. Verificar el estado y aplicar las migraciones pendientes de forma controlada con `prisma migrate deploy` desde un entorno que tenga `DIRECT_URL`. No se ejecutó ninguna migración contra Supabase durante esta intervención.

## Validación posterior al despliegue

Después de desplegar, comprobar `https://<dominio>/health` (debe responder `estado: ok` y `db: conectada`), luego probar inicio/cierre de sesión, cookies `Secure`/`HttpOnly`/`SameSite=Lax`, rutas de pacientes, turnos e historias clínicas y navegación directa a rutas de React Router.
