import { Router, type Request, type Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireAuth, sesionDe } from '../middlewares/auth'
import { paginacionSchema } from '../validations'

/**
 * Auditoría de modificaciones.
 * Ambos roles (MEDICO y SECRETARIA) pueden consultar el historial de cambios.
 * Toda entrada identifica al usuario responsable, fecha/hora, qué cambió y conserva
 * la versión anterior (previo vs nuevo).
 */
export const auditoriaRouter = Router()
auditoriaRouter.use(requireAuth)

/** GET /audit-log — lista entradas de auditoría con filtros opcionales. */
auditoriaRouter.get('/', async (req: Request, res: Response) => {
  const { pagina, porPagina } = paginacionSchema.parse(req.query)
  const entidad = typeof req.query.entidad === 'string' ? req.query.entidad : undefined
  const registroId = typeof req.query.registroId === 'string' ? req.query.registroId : undefined
  const desde = typeof req.query.desde === 'string' ? req.query.desde : undefined
  const hasta = typeof req.query.hasta === 'string' ? req.query.hasta : undefined

  const where: Prisma.AuditLogWhereInput = {}
  if (entidad) where.entidad = entidad
  if (registroId) where.registroId = registroId
  if (desde || hasta) {
    where.creadoEn = {}
    if (desde) where.creadoEn.gte = new Date(`${desde}T00:00:00.000Z`)
    if (hasta) where.creadoEn.lte = new Date(`${hasta}T23:59:59.999Z`)
  }

  const [total, filas] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: {
        usuario: { select: { id: true, email: true, nombre: true, apellido: true, rol: true } },
      },
    }),
  ])

  res.json({
    items: filas.map((a) => ({
      id: a.id,
      accion: a.accion,
      entidad: a.entidad,
      registroId: a.registroId,
      previo: a.previo,
      nuevo: a.nuevo,
      ip: a.ip,
      creadoEn: a.creadoEn,
      usuario: a.usuario,
    })),
    total,
    pagina,
    porPagina,
  })
})
