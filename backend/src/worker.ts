/**
 * Entrypoint para Cloudflare Workers.
 *
 * Express 5 se ejecuta sobre la implementación de `node:http` que provee el
 * runtime de Workers (compatibilidad `nodejs_compat`). `handleAsNodeRequest`
 * traduce cada solicitud Fetch al servidor Node interno, sin abrir un puerto
 * real ni usar `app.listen()` como en desarrollo local.
 *
 * El desarrollo local con Node sigue usando `src/server.ts`.
 */
import { handleAsNodeRequest } from 'cloudflare:node'
import app from './app'
import { configurarPrisma, type EntornoPrisma } from './lib/prisma'
import { configurarEntorno, type RuntimeConfig } from './lib/runtimeConfig'

interface Env extends EntornoPrisma, RuntimeConfig {}

// Puerto interno de ruteo (no es un puerto de red real en Workers).
const PUERTO_INTERNO = 8080

// Cloudflare termina TLS antes del Worker y agrega X-Forwarded-Proto/IP.
// Express necesita confiar en ese proxy para req.protocol, req.ip y cookies.
app.set('trust proxy', 1)

// En Workers `listen()` sólo registra el servidor para el ruteo interno.
app.listen(PUERTO_INTERNO)

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    configurarEntorno(env)
    configurarPrisma(env)
    return handleAsNodeRequest(PUERTO_INTERNO, request)
  },
}
