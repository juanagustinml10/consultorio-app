import { Router } from 'express'

// Módulo de autenticación. PENDIENTE (etapa 2):
// - Verificación de credenciales contra la tabla Usuario.
// - Hash de contraseñas (bcrypt/argon2) y emisión de JWT.
// - Middlewares de permisos por rol (MEDICO / SECRETARIA).
export const authRouter = Router()

authRouter.post('/login', (_req, res) => {
  res.status(501).json({
    error: 'Pendiente de implementación',
    detalle: 'La autenticación real se integrará cuando exista la base de datos (etapa 2).',
  })
})
