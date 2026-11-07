# Despliegue en Vercel y Supabase

> **Nuevo:** el mismo código también puede ejecutarse en **Cloudflare Workers** sin cambiar rutas, autenticación ni lógica. Ver la sección [Alternativa: backend en Cloudflare Workers](#alternativa-backend-en-cloudflare-workers) al final de este documento.

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

---

# Alternativa: backend en Cloudflare Workers

El backend adapta su mismo código Express 5 para correr en Cloudflare Workers según dos entradas de aplicación:

- **Node.js local (sin cambios):** `backend/src/server.ts` — `npm run dev` / `npm start`. Sigue usando `app.listen()` y el pool normal de `pg`.
- **Workers (nuevo):** `backend/src/worker.ts` — reutiliza la misma app (`src/app.ts`) sobre el servidor `node:http` que provee el runtime (`cloudflare:node` + `handleAsNodeRequest`), sin reescribir a otro framework. No se abre puerto real.

## Qué cambia y por qué

| Cuestión | Antes | Ahora | Notas |
|---|---|---|---|
| Argon2 | `@node-rs/argon2` (nativo, prohibido en Workers) | `@noble/hashes/argon2` en JS puro | Mismos parámetros Argon2id v19, `m=19456, t=2, p=1`, sal 16 B, salida 32 B. Los hashes existentes siguen validando (verificado contra hashes generados por node-rs v16 y v19). |
| Prisma | `PrismaClient` nativo | `@prisma/adapter-pg` + `pg` y motor WASM del cliente (`engineType = "client"` en `schema.prisma`) | Sin binarios nativos necesarios. El bundle incluye `query_compiler_bg.wasm` (`~1,95 MB`). La base de datos, el esquema y las migraciones **no cambiaron**. |
| Pool de `pg` | conexión reutilizada | En Workers, `maxUses: 1` | Workers prohíbe reutilizar un socket TCP entre solicitudes; con el pool por defecto cada segunda solicitud se colgaba. Con Hyperdrive, el pooling real ocurre en el edge. En Node el pool es normal. |
| Cookies | siempre según entorno | `COOKIE_SAMESITE` configurable + detección de HTTPS por solicitud | `lax` por defecto; `none` sólo si frontend y API quedan en dominios distintos. |
| dotenv | `app.ts` y `server.ts` cargaban `.env` | Sólo `server.ts` | Importante: en Workers el `.env` local no debe cargarse. |
| Informe PDF | fuentes estándar internas de PDFKit (Node) | Registro explícito de Helvetica/Helvetica-Bold en Workers (no-op en Node) | PDFKit 0.20 en navegador/Workers exige `registerStdFonts()`. |

## Archivos creados/modificados

- `backend/src/worker.ts` (nuevo): entrypoint de Workers.
- `backend/src/lib/prisma.ts`: singleton perezoso configurado por solicitud (Hyperdrive → `DATABASE_URL` del `env` → `process.env`), con sanitización de parámetros exclusivos de Prisma.
- `backend/src/lib/password.ts`: Argon2id puro JS con formato PHC y comparación en tiempo constante.
- `backend/src/lib/informePdf.ts`: registro de fuentes estándar para Workers.
- `backend/src/lib/sessions.ts`: opciones de cookie por entorno/solicitud.
- `backend/src/app.ts`: idéntico salvo quitar `import 'dotenv/config'`.
- `backend/prisma/schema.prisma`: sólo el bloque `generator` (`engineType = "client"`). Ningún modelo, migración ni dato alterado.
- `backend/wrangler.jsonc` (nuevo): configuración con `nodejs_compat`, `observability` y el `define` de `import.meta.url` que necesita PDFKit.
- `backend/.dev.vars.example` (nuevo) y `.env.example`: variables documentadas sin valores reales.
- `backend/src/types/*` (nuevo): declaraciones para `cloudflare:node` y submódulos de fuentes de PDFKit.
- `backend/prisma/seed.ts` y `backend/scripts/probar-perfil-medico-aislado.mjs`: usan la misma app/lib de la app (sin dependencias nativas).

Scripts nuevos en `backend/package.json`: `dev:worker` (Prisma generate + `wrangler dev`), `build:worker` (generate + typecheck + `wrangler deploy --dry-run`), `deploy:worker`.

> En Windows: cerrá los servidores locales antes de correr `prisma generate`/`npm run build:worker`; si un proceso tiene cargada `query_engine-windows.dll.node`, el generate falla con `EPERM`.

## Prueba local del runtime de Workers (sin desplegar)

```bash
cd backend
cp .dev.vars.example .dev.vars   # completar con la BD local (no se commitea)
npm run dev:worker               # requiere haber corrido prisma generate
```

Prueba en `http://127.0.0.1:8787`. Env de prueba local (`.dev.vars`), con `NODE_ENV=development`.

## Estado de compatibilidad y límites

- CLI y servidor HTTP de Node (`node:net`, `node:stream`, `node:http`), Express 5, cookie-parser, cors, zod, PDFKit y Prisma (WASM) funcionan con `nodejs_compat` (fecha de compatibilidad ≥ 2025-09-01).
- Sesiones y rate limit viven en PostgreSQL → funcionan igual en Workers y sobreviven entre isolate.
- **Plan Free de Workers no alcanza para autenticar:** Argon2id en JavaScript puro es una operación intensiva; Free limita cada petición a 10 ms de CPU y puede responder Error 1102. Se requiere Workers Paid (30 s de CPU por defecto). El bundle del dry-run es 5,55 MiB sin comprimir, por debajo del límite actual de 64 MiB.
- Arranque frío: el isolate carga ~3,7 MB de JS + WASM; primera solicitud de login puede tardar más que en Vercel/Node.

## Configuración en Cloudflare

Variables/secrets del Worker (en ningún caso subirlos a Git):

| Variable | Tipo | Valor |
|---|---|---|
| `HYPERDRIVE` | binding (recomendado) | id devuelto por `wrangler hyperdrive create` |
| `DATABASE_URL` | secret (fallback si no hay Hyperdrive) | conexión directa o *Session pooler* de Supabase (puerto 5432, `sslmode=require`). **Nunca el Transaction pooler (6543).** |
| `DIRECT_URL` | — | sólo para el CLI de Prisma en este `.env` local; no se usa en el Worker |
| `CORS_ORIGIN` | secret/var | `https://<dominio del frontend>`; si frontend y API comparten dominio, puede omitirse |
| `LOGIN_RATE_LIMIT_SECRET` | secret obligatorio | secreto aleatorio estable de 32+ bytes: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Obligatorio si se usa Hyperdrive sin `DATABASE_URL`.
| `SESION_HORAS` | var | `8` |
| `COOKIE_SAMESITE` | var | `lax` (mismo dominio) o `none` (dominios distintos; fuerza cookie `Secure`) |
| `NODE_ENV` | var | `production` |

Frontend actual: configurar en Cloudflare Pages `VITE_API_BASE_URL` con el origen completo del Worker (sin `/api/v1`), reconstruir Pages y configurar en el Worker `CORS_ORIGIN=https://consultorio-app.pages.dev`. En este caso hay que usar `COOKIE_SAMESITE=none; Secure` para la cookie cross-site. Algunos navegadores restringen cookies de terceros; para soporte más consistente conviene exponer API y Pages bajo un dominio propio compartido o agregar un proxy de Pages Functions.

## Pasos exactos de primera publicación

1) `cd backend && npm ci`
2) `npx wrangler login` (abre el navegador; requiere cuenta Cloudflare).
3) Elegir conexión de BD. Se recomienda crear Hyperdrive desde el panel de Cloudflare y guardar allí la cadena de conexión de Supabase; no pegar credenciales en comandos ni en Git. Usar conexión directa o Session pooler, no Transaction pooler. Luego agregar el binding `HYPERDRIVE` en `backend/wrangler.jsonc` con el identificador que Cloudflare genera. No reemplazar el marcador con un ID inventado.
4) Cargar secretos/vars (cada uno pregunta el valor por consola):
   ```bash
   npx wrangler secret put DATABASE_URL          # si no usás Hyperdrive (o como respaldo)
   npx wrangler secret put LOGIN_RATE_LIMIT_SECRET
   npx wrangler secret put CORS_ORIGIN           # o como var en wrangler.jsonc
   npx wrangler secret put NODE_ENV              # valor: production
   npx wrangler secret put COOKIE_SAMESITE       # valor: lax (o none)
   npx wrangler secret put SESION_HORAS          # valor: 8
   ```
5) Verificar sin publicar: `npm run build:worker` (debe terminar en `--dry-run: exiting now.`).
6) Publicar: `npm run deploy:worker` → `https://consultorio-app-api.<subdominio>.workers.dev`.
7) En Cloudflare Pages, configurar `VITE_API_BASE_URL` con el origen del Worker (sin `/api/v1`) y volver a desplegar Pages. En el Worker, configurar `CORS_ORIGIN` con `https://consultorio-app.pages.dev` y `COOKIE_SAMESITE=none`. Para evitar restricciones de cookies de terceros, lo preferible es usar un dominio propio y publicar la API bajo un subdominio del mismo dominio registrable (por ejemplo `api.<dominio propio>`).
8) Verificar: `GET <url>/health` → `{"estado":"ok","db":"conectada"}`; login desde el frontend; `/api/v1/patients`, `/appointments`, `/estadisticas` e informe PDF; logout.
9) Monitoreo: panel del Worker (observability) o `npx wrangler tail`.

Rollback: `npx wrangler rollback` (o `npx wrangler delete` para retirar la Workers). El despliegue de Vercel sigue intacto y puede seguir siendo el primario.

## No hacer en el despliegue

- No correr `prisma migrate dev/deploy/reset/db push` desde el Worker (los CLI no se ejecutan en Cloudflare); las migraciones siguen aplicándose desde el entorno local/CI con `DIRECT_URL`.
- No commitear `.env`, `.dev.vars` ni logs con valores; `backend/.gitignore` ya los excluye (y versiona sus plantillas).
