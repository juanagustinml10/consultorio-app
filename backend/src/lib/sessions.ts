import crypto from 'node:crypto'
import type { Request, Response } from 'express'
import { prisma } from './prisma'

export const NOMBRE_COOKIE = 'consultorio_sesion'

const HORAS_SESION = Number(process.env.SESION_HORAS ?? 8)

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

const opcionesCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production', // en desarrollo: http://localhost sin HTTPS
  path: '/',
  maxAge: HORAS_SESION * 60 * 60 * 1000,
}

/** Crea una sesión en PostgreSQL y coloca la cookie HttpOnly. */
export async function crearSesion(
  req: Request,
  res: Response,
  usuarioId: string,
): Promise<void> {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiraEn = new Date(Date.now() + HORAS_SESION * 60 * 60 * 1000)

  // Limpieza oportunista de sesiones vencidas
  await prisma.session.deleteMany({ where: { expiraEn: { lt: new Date() } } })

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      usuarioId,
      ip: req.ip ?? null,
      userAgent: (req.headers['user-agent'] ?? '').slice(0, 200) || null,
      expiraEn,
    },
  })

  res.cookie(NOMBRE_COOKIE, token, opcionesCookie)
}

/** Lee la cookie y devuelve la sesión vigente con su usuario, o null. */
export async function obtenerSesion(req: Request) {
  const token = (req.cookies?.[NOMBRE_COOKIE] as string | undefined) ?? undefined
  if (!token) return null

  const sesion = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: { select: { id: true, email: true, nombre: true, apellido: true, rol: true, activo: true } } },
  })
  if (!sesion) return null

  if (sesion.expiraEn.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: sesion.id } }).catch(() => undefined)
    return null
  }
  if (!sesion.usuario.activo) return null

  return sesion
}

/** Cierra la sesión (borra fila y cookie). */
export async function cerrarSesion(req: Request, res: Response): Promise<boolean> {
  const token = (req.cookies?.[NOMBRE_COOKIE] as string | undefined) ?? undefined
  if (!token) return false

  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  res.clearCookie(NOMBRE_COOKIE, { ...opcionesCookie, maxAge: 0 })
  return true
}
