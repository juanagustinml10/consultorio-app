import { prisma } from './prisma'
import type { Prisma } from '../generated/prisma'
import type { AccionAuditoria } from '../generated/prisma'

export interface RegistrarAccionEntrada {
  usuarioId?: string | null
  ip?: string | null
  accion: AccionAuditoria
  entidad: string
  registroId: string
  previo?: unknown
  nuevo?: unknown
}

/**
 * Registra una acción de auditoría. Si falla, el error queda registrado y no
 * interrumpe la operación principal.
 * IMPORTANTE: nunca pasar contraseñas, hashes ni tokens en previo/nuevo.
 */
export async function registrarAccion(e: RegistrarAccionEntrada): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        usuarioId: e.usuarioId ?? null,
        accion: e.accion,
        entidad: e.entidad,
        registroId: e.registroId,
        previo: e.previo === undefined ? undefined : (JSON.parse(JSON.stringify(e.previo)) as object),
        nuevo: e.nuevo === undefined ? undefined : (JSON.parse(JSON.stringify(e.nuevo)) as object),
        ip: e.ip ?? null,
      },
    })
  } catch (error) {
    console.error('No se pudo registrar la auditoría:', error)
  }
}

/** Inserta auditoría en la transacción de negocio: cualquier fallo revierte ambos cambios. */
export async function registrarAccionEnTransaccion(
  tx: Prisma.TransactionClient,
  e: RegistrarAccionEntrada,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      usuarioId: e.usuarioId ?? null,
      accion: e.accion,
      entidad: e.entidad,
      registroId: e.registroId,
      previo: e.previo === undefined ? undefined : (JSON.parse(JSON.stringify(e.previo)) as object),
      nuevo: e.nuevo === undefined ? undefined : (JSON.parse(JSON.stringify(e.nuevo)) as object),
      ip: e.ip ?? null,
    },
  })
}
