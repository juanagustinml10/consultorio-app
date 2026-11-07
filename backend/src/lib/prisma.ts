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

/**
 * Normaliza el valor de una variable de entorno de tipo cadena.
 *
 * dotenv quita las comillas envolventes del `.env`, pero Vercel inyecta las
 * variables del dashboard tal cual se cargaron. Un `DATABASE_URL` cargado con
 * comillas (`"postgresql://..."`) hace que `new URL` falle y que `pg` reciba
 * un host inválido -> "sin conexión" en producción sin más detalle.
 */
function limpiarValorCadena(valor: string): string {
  let cadena = valor.replace(/^\uFEFF/, '').trim()
  if (cadena.length >= 2) {
    const primera = cadena[0]
    const ultima = cadena[cadena.length - 1]
    if ((primera === '"' && ultima === '"') || (primera === "'" && ultima === "'")) {
      cadena = cadena.slice(1, -1).trim()
    }
  }
  return cadena
}

/** Hostname local: nunca exigir SSL a un servidor propio de desarrollo. */
function esHostLocal(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  )
}

/**
 * Supabase (y PostgreSQL administrado en general) exige TLS. El motor nativo
 * de Prisma activaba SSL por defecto; `pg` no lo hace salvo `sslmode` en la
 * URL u `ssl` explícito. Para hosts remotos sin configuración explícita se
 * activa TLS sin validar certificado (equivalente a `sslmode=require`).
 */
function requiereSsl(cadena: string): boolean {
  try {
    const url = new URL(cadena)
    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') return false
    if (esHostLocal(url.hostname)) return false
    return !url.searchParams.has('sslmode') && !url.searchParams.has('ssl')
  } catch {
    return false
  }
}

function esEntornoWorkers(): boolean {
  return esCloudflareWorkers()
}

function crearCliente(cadenaBruta: string): PrismaClient {
  const cadena = limpiarValorCadena(cadenaBruta)
  const adapter = new PrismaPg({
    connectionString: normalizarUrlPostgres(cadena),
    ...(requiereSsl(cadena) ? { ssl: { rejectUnauthorized: false } } : {}),
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
    const bruta = valorEntorno('DATABASE_URL')
    if (!bruta) {
      throw new Error('Falta configurar DATABASE_URL para conectarse a PostgreSQL')
    }
    const cadena = limpiarValorCadena(bruta)
    if (!cadena) {
      throw new Error('La variable DATABASE_URL está vacía o sólo contiene comillas/espacios')
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
  const bruta =
    env?.HYPERDRIVE?.connectionString ?? env?.DATABASE_URL ?? valorEntorno('DATABASE_URL')
  const cadena = bruta ? limpiarValorCadena(bruta) : undefined

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
