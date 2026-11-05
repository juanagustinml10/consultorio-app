import type { NextFunction, Request, Response } from 'express'
import type { Rol } from '../generated/prisma'
import { obtenerSesion } from '../lib/sessions'

export interface SesionActual {
  id: string
  usuarioId: string
  usuario: {
    id: string
    email: string
    nombre: string
    apellido: string
    rol: Rol
    activo: boolean
  }
}

export interface SolicitudConSesion extends Request {
  sesion?: SesionActual
}

/** Lanza error si no hay sesión (defensivo, tras requireAuth nunca ocurre). */
export function sesionDe(req: Request): SesionActual {
  const s = (req as SolicitudConSesion).sesion
  if (!s) {
    throw new Error('Se llamó a una ruta protegida sin sesión')
  }
  return s
}

/** Middleware de autenticación: exige sesión vigente. */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sesion = await obtenerSesion(req)
  if (!sesion) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }
  ;(req as SolicitudConSesion).sesion = sesion
  next()
}

/** Middleware de autorización por rol. */
export function requireRole(...roles: Rol[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const s = (req as SolicitudConSesion).sesion
    if (!s) {
      res.status(401).json({ error: 'No autenticado' })
      return
    }
    if (!roles.includes(s.usuario.rol)) {
      res.status(403).json({ error: 'No tenés permisos para esta operación' })
      return
    }
    next()
  }
}
