# Despliegue en Vercel y Supabase

## Estructura de Vercel

Este repositorio usa **Vercel Multi-Service** dentro de un proyecto: `backend` ejecuta Express desde `backend/src/server.ts` y `frontend` publica `frontend/dist`. `vercel.json` enruta `/api/*` y `/health` al backend; las demás rutas van al frontend y sus rutas de React Router reciben `index.html`.

El paquete raíz y el backend fijan Node.js 22.x para el build y la Function. Cada servicio instala desde el lockfile correspondiente y el backend ejecuta `prisma generate` antes de compilar.

## Variables de entorno

Configurar en Vercel para Production y Preview:

- `DATABASE_URL`: conexión de runtime a PostgreSQL Supabase. Preferir Transaction Pooler, puerto `6543`, con SSL requerido y `connection_limit=1` para funciones serverless.
- `DIRECT_URL`: conexión directa o Session Pooler de Supabase para tareas de Prisma que necesitan conexión directa. No usar Transaction Pooler aquí.
- `LOGIN_RATE_LIMIT_SECRET`: recomendado; secreto aleatorio estable de al menos 32 bytes. No compartirlo ni subirlo a Git.
- `SESION_HORAS`: opcional; duración de sesión, por defecto `8`.
- `CORS_ORIGIN`: solo si el navegador usa un origen distinto al dominio de la API. Para frontend y API en el mismo dominio no hace falta.

No guardar `.env` en el repositorio. Las variables del navegador no deben contener credenciales de Supabase.

## Migraciones

El build ejecuta `prisma generate`, pero no aplica migraciones. No ejecutar `migrate reset` ni `db push` contra la base con datos. El estado de Supabase se verificó con `prisma migrate status`: las seis migraciones están aplicadas. No se ejecutó ninguna migración durante esta intervención.

## Validación posterior al despliegue

Comprobar `https://<dominio>/health` (debe responder `estado: ok` y `db: conectada`), luego probar inicio/cierre de sesión, cookies `Secure`/`HttpOnly`/`SameSite=Lax`, rutas de pacientes, turnos e historias clínicas y navegación directa a rutas de React Router.
