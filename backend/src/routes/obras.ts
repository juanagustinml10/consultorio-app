import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'

/**
 * Obras sociales (solo lectura, etapa 3.1).
 * Necesaria para el selector del formulario de pacientes con datos reales de la BD.
 * El CRUD completo de coberturas queda para una etapa posterior.
 */
export const obrasRouter = Router()
obrasRouter.use(requireAuth)

obrasRouter.get('/', async (_req: Request, res: Response) => {
  const obras = await prisma.obraSocial.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true },
  })
  res.json({ items: obras, total: obras.length })
})
