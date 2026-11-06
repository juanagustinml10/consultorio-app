import crypto from 'node:crypto'
import { prisma } from './prisma'

const MAX_INTENTOS = 5
const LIMPIAR_CADA_INTENTOS = 128
const ANTIGUEDAD_LIMPIEZA_MS = 24 * 60 * 60 * 1000

interface ReservaIntento {
  keyHash: string
  windowStartedAt: Date
}

interface FilaReserva extends ReservaIntento {}

// Solo el contador de limpieza es local; los límites y bloqueos siempre viven en PostgreSQL.
let intentosDesdeLimpieza = 0

function hashClave(clave: string): string {
  // El secreto dedicado permite rotar credenciales de PostgreSQL sin reiniciar los límites.
  // DATABASE_URL mantiene el desarrollo funcional si no se definió el secreto opcional.
  const secreto = process.env.LOGIN_RATE_LIMIT_SECRET || process.env.DATABASE_URL
  if (!secreto) throw new Error('Falta configurar DATABASE_URL para el límite de intentos de login')
  return crypto.createHmac('sha256', secreto).update(clave).digest('hex')
}

export function claveDe(ip: string | undefined, email: string): string {
  return `${ip ?? 'sin-ip'}|${email.trim().toLowerCase()}`
}

/** Solo se utiliza por los scripts locales de prueba; nunca se habilita en producción. */
export async function limpiarIntentos(clave: string): Promise<void> {
  await prisma.loginRateLimit.deleteMany({ where: { keyHash: hashClave(clave) } })
}

/**
 * Reserva de forma atómica un intento. Se cuentan también las verificaciones
 * concurrentes en curso para que varias instancias no puedan superar el máximo.
 * Si PostgreSQL falla, la solicitud falla cerrada y no continúa el login.
 */
export async function reservarIntento(clave: string): Promise<ReservaIntento | null> {
  const keyHash = hashClave(clave)
  const filas = await prisma.$queryRaw<FilaReserva[]>`
    INSERT INTO "intentos_limite_login"
      ("keyHash", "windowStartedAt", "failures", "activeAttempts", "updatedAt")
    VALUES (${keyHash}, CURRENT_TIMESTAMP, 0, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("keyHash") DO UPDATE SET
      "windowStartedAt" = CASE
        WHEN "intentos_limite_login"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
          THEN CURRENT_TIMESTAMP
        ELSE "intentos_limite_login"."windowStartedAt"
      END,
      "failures" = CASE
        WHEN "intentos_limite_login"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
          THEN 0
        ELSE "intentos_limite_login"."failures"
      END,
      "activeAttempts" = CASE
        WHEN "intentos_limite_login"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
          THEN 1
        ELSE "intentos_limite_login"."activeAttempts" + 1
      END,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "intentos_limite_login"."windowStartedAt" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
       OR "intentos_limite_login"."failures" + "intentos_limite_login"."activeAttempts" < ${MAX_INTENTOS}
    RETURNING "keyHash", "windowStartedAt"
  `

  // Limpieza oportunista: no es parte de la decisión de seguridad y sus fallas
  // no alteran ni desactivan el límite. El índice evita un barrido completo.
  intentosDesdeLimpieza += 1
  if (intentosDesdeLimpieza >= LIMPIAR_CADA_INTENTOS) {
    intentosDesdeLimpieza = 0
    const antesDe = new Date(Date.now() - ANTIGUEDAD_LIMPIEZA_MS)
    await prisma.loginRateLimit
      .deleteMany({ where: { windowStartedAt: { lt: antesDe } } })
      .catch(() => undefined)
  }

  return filas[0] ?? null
}

/** Cierra la reserva; intentos fallidos persisten durante la ventana de 15 minutos. */
export async function finalizarIntento(reserva: ReservaIntento, fallido: boolean): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "intentos_limite_login"
    SET "activeAttempts" = GREATEST("activeAttempts" - 1, 0),
        "failures" = CASE WHEN ${fallido} THEN "failures" + 1 ELSE 0 END,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "keyHash" = ${reserva.keyHash}
      AND "windowStartedAt" = ${reserva.windowStartedAt}
      AND "activeAttempts" > 0
  `
}
