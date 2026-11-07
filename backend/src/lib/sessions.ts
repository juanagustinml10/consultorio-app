import crypto from 'node:crypto'
import type { Request, Response } from 'express'
import { prisma } from './prisma'
import { valorEntorno } from './runtimeConfig'

export const NOMBRE_COOKIE = 'consultorio_sesion'

function horasSesion(): number {
  const horas = Number(valorEntorno('SESION_HORAS') ?? 8)
  return Number.isFinite(horas) && horas > 0 ? horas : 8
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

type SameSiteCookie = 'lax' | 'strict' | 'none'

/**
 * `lax` es el valor seguro por defecto. Si el frontend y la API quedan en
 * dominios distintos (por ejemplo Pages y un Worker en workers.dev), el
 * navegador no envía la cookie en solicitudes cross-site: en ese caso hay que
 * configurar COOKIE_SAMESITE=none, que obliga a usar Secure.
 */
function sameSiteConfigurado(): SameSiteCookie {
  const valor = (valorEntorno('COOKIE_SAMESITE') ?? '').toLowerCase()
  return valor === 'none' || valor === 'strict' || valor === 'lax' ? valor : 'lax'
}

function esHttps(req: Request): boolean {
  const visitanteCloudflare = req.headers['cf-visitor']
  return (
    valorEntorno('NODE_ENV') === 'production' ||
    Boolean(valorEntorno('VERCEL')) ||
    req.secure ||
    req.protocol === 'https' ||
    (typeof visitanteCloudflare === 'string' && visitanteCloudflare.includes('"scheme":"https"'))
  )
}

function opcionesCookie(req: Request) {
  const sameSite = sameSiteConfigurado()
  return {
    httpOnly: true,
    sameSite,
    // SameSite=None sólo es válido con Secure; en local por HTTP se mantiene lax.
    secure: esHttps(req) || sameSite === 'none',
    path: '/',
    maxAge: horasSesion() * 60 * 60 * 1000,
  }
}

/** Crea una sesión en PostgreSQL y coloca la cookie HttpOnly. */
export async function crearSesion(
  req: Request,
  res: Response,
  usuarioId: string,
): Promise<void> {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiraEn = new Date(Date.now() + horasSesion() * 60 * 60 * 1000)

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

  res.cookie(NOMBRE_COOKIE, token, opcionesCookie(req))
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
  res.clearCookie(NOMBRE_COOKIE, { ...opcionesCookie(req), maxAge: 0 })
  return true
}
