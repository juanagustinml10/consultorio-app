import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function manejarError(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Datos inválidos',
      detalles: error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    })
    return
  }
  console.error(error)
  res.status(500).json({ error: 'Error interno del servidor' })
}
