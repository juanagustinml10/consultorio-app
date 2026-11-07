import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { verificarContrasena } from '../lib/password'
import { cerrarSesion, crearSesion, obtenerSesion } from '../lib/sessions'
import { registrarAccion } from '../lib/audit'
import { reservarIntento, finalizarIntento, limpiarIntentos, claveDe } from '../lib/limiter'
import { loginSchema } from '../validations'
import type { SolicitudConSesion } from '../middlewares/auth'
import { valorEntorno } from '../lib/runtimeConfig'

// Datos del usuario que se pueden exponer (nunca hash ni tokens).
const DATOS_USUARIO = {
  id: true,
  email: true,
  nombre: true,
  apellido: true,
  rol: true,
  activo: true,
} as const

export const authRouter = Router()

authRouter.post('/login', async (req: Request, res: Response) => {
  const datos = loginSchema.parse(req.body)
  const clave = claveDe(req.ip, datos.email)

  if (valorEntorno('NODE_ENV') !== 'production' && req.headers['x-reset-limiter'] === 'true') {
    await limpiarIntentos(clave)
  }

  const intento = await reservarIntento(clave)
  if (!intento) {
    res.status(429).json({
      error: 'Demasiados intentos fallidos. Probá de nuevo en unos minutos.',
    })
    return
  }

  let intentoFinalizado = false
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email: datos.email } })

  // Hash real de un valor fijo: si el email no existe, la comparación corre igual
  // y no se revela la existencia del correo por tiempo de respuesta.
  const HASH_DUMMY =
    '$argon2id$v=19$m=19456,t=2,p=1$Cokeee7gMTipXFDitD7cBg$iPpi216Txxsm3o7lauGG/gO83E/pDfE/WZI8b04qkqw'

    const hash = usuario?.contrasenaHash ?? HASH_DUMMY
    const credencialesOk = await verificarContrasena(hash, datos.contrasena)

    if (!usuario || !credencialesOk || !usuario.activo) {
      if (intento) {
        await finalizarIntento(intento, true)
        intentoFinalizado = true
      }
      res.status(401).json({ error: 'Credenciales inválidas' })
      return
    }

    await crearSesion(req, res, usuario.id)
    if (intento) {
      await finalizarIntento(intento, false)
      intentoFinalizado = true
    }

    registrarAccion({
      usuarioId: usuario.id,
      ip: req.ip,
      accion: 'LOGIN',
      entidad: 'Usuario',
      registroId: usuario.id,
    })

    res.json({ usuario: { ...usuario, contrasenaHash: undefined } })
  } finally {
    // Si falla la consulta, la sesión o la auditoría, libera la reserva contabilizándola
    // como fallida; las solicitudes concurrentes no quedan retenidas hasta expirar.
    if (intento && !intentoFinalizado) await finalizarIntento(intento, true)
  }
})

authRouter.post('/logout', async (req: Request, res: Response) => {
  const sesion = await obtenerSesion(req)
  const cerrada = await cerrarSesion(req, res)

  if (sesion) {
    registrarAccion({
      usuarioId: sesion.usuarioId,
      ip: req.ip,
      accion: 'LOGOUT',
      entidad: 'Usuario',
      registroId: sesion.usuarioId,
    })
  }

  res.json({ ok: cerrada })
})

authRouter.get('/me', async (req: SolicitudConSesion, res: Response) => {
  const sesion = await obtenerSesion(req)
  if (!sesion) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }
  res.json({ usuario: sesion.usuario })
})
