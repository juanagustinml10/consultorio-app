import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { esCloudflareWorkers, valorEntorno } from './runtimeConfig'

/**
 * Cliente único de Prisma para toda la aplicación.
 *
 * En Node.js (desarrollo local) se inicializa de forma perezosa desde
 * `process.env.DATABASE_URL`. En Cloudflare Workers el binding de Hyperdrive
 * (o el secreto `DATABASE_URL`) sólo está disponible dentro del handler, por
 * eso `configurarPrisma(env)` se llama al comienzo de cada solicitud.
 *
 * Prisma se ejecuta siempre con el adaptador oficial `@prisma/adapter-pg`
 * sobre node-postgres y el motor WASM del cliente (compatible con Workers).
 */

export interface EntornoPrisma {
  /** Binding de Cloudflare Hyperdrive (si está configurado). */
  HYPERDRIVE?: { connectionString?: string } | null
  /** Secreto/variable con la cadena de conexión directa a PostgreSQL. */
  DATABASE_URL?: string
}

let cliente: PrismaClient | undefined
let cadenaActual: string | undefined

// Parámetros que entiende Prisma pero que node-postgres no debe recibir como
// opciones de conexión (pooler de Supabase, esquema de Prisma, etc.).
const PARAMETROS_SOLO_PRISMA = new Set([
  'schema',
  'pgbouncer',
  'connection_limit',
  'pool_timeout',
  'socket_timeout',
  'statement_cache_size',
])

/** Limpia la URL sin exponer ni modificar credenciales. */
export function normalizarUrlPostgres(cadena: string): string {
  try {
    const url = new URL(cadena)
    for (const parametro of PARAMETROS_SOLO_PRISMA) {
      url.searchParams.delete(parametro)
    }
    return url.toString()
  } catch {
    return cadena
  }
}

function esEntornoWorkers(): boolean {
  return esCloudflareWorkers()
}

function crearCliente(cadena: string): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: normalizarUrlPostgres(cadena),
    // Cloudflare Workers prohíbe reutilizar un socket TCP entre solicitudes
    // distintas ("Cannot perform I/O on behalf of a different request"). El
    // pool de `pg` conserva conexiones ociosas por defecto, por lo que la
    // siguiente solicitud reutilizaría un socket inválido y la petición
    // quedaría colgada hasta que el runtime la cancele.
    //
    // `maxUses: 1` hace que cada conexión se cierre al terminar la operación
    // que la adquirió. En Workers la reutilización real la hace Hyperdrive
    // (pool del lado del edge), no el pool del isolate. En Node se mantiene el
    // pool normal para no degradar el desarrollo local.
    ...(esEntornoWorkers() ? { maxUses: 1 } : {}),
  })
  return new PrismaClient({
    adapter,
    log: valorEntorno('NODE_ENV') === 'production' ? ['error'] : ['error', 'warn'],
  })
}

function obtenerCliente(): PrismaClient {
  if (!cliente) {
    const cadena = valorEntorno('DATABASE_URL')
    if (!cadena) {
      throw new Error('Falta configurar DATABASE_URL para conectarse a PostgreSQL')
    }
    cliente = crearCliente(cadena)
    cadenaActual = cadena
  }
  return cliente
}

/**
 * Inicializa Prisma con el entorno del runtime actual.
 * Hyperdrive tiene prioridad; si no existe, se usa DATABASE_URL.
 * Es idempotente: en llamadas sucesivas del mismo isolate reutiliza el cliente.
 */
export function configurarPrisma(env: EntornoPrisma | undefined): void {
  const cadena =
    env?.HYPERDRIVE?.connectionString ?? env?.DATABASE_URL ?? valorEntorno('DATABASE_URL')

  // Sin configuración no se adelanta un error acá: /health debe poder
  // responder 503 y el resto de las rutas lo reporta al consultar la BD.
  if (!cadena) return
  if (cliente && cadenaActual === cadena) return

  if (cliente) {
    // Cambió la cadena de conexión (por ejemplo, entre entornos): liberamos el
    // pool anterior sin bloquear la solicitud actual.
    void cliente.$disconnect().catch(() => undefined)
  }
  cliente = crearCliente(cadena)
  cadenaActual = cadena
}

/**
 * Proxy transparente: todo el código existente sigue usando `prisma.*` sin
 * cambios, pero cada operación se resuelve contra el cliente inicializado
 * para el runtime.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_destino, propiedad) {
    if (propiedad === 'then') return undefined
    const activo = obtenerCliente()
    const valor = Reflect.get(activo, propiedad, activo)
    return typeof valor === 'function' ? valor.bind(activo) : valor
  },
})
