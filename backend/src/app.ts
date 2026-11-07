/**
 * Núcleo de la API: toda la configuración de Express vive acá.
 * El entrypoint (server.ts) lo importa dinámicamente: así un fallo al
 * cargar algún módulo/native puede reportarse por /health sin tumbar la función.
 */
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { prisma } from './lib/prisma'
import { authRouter } from './routes/auth'
import { pacientesRouter } from './routes/pacientes'
import { obrasRouter } from './routes/obras'
import { turnosRouter } from './routes/turnos'
import { historiasRouter } from './routes/historias'
import { estadisticasRouter } from './routes/estadisticas'
import { sitioRouter } from './routes/sitio'
import { auditoriaRouter } from './routes/auditoria'
import { manejarError } from './middlewares/error'
import { valorEntorno } from './lib/runtimeConfig'

const app = express()
const port = Number(process.env.PORT ?? 3001)
// Vercel finaliza TLS en su proxy; confiar un salto recupera la IP real para
// el rate limit y permite comparar el origen same-origin detrás del HTTPS proxy.
if (process.env.VERCEL) app.set('trust proxy', 1)

app.use(cors((req, callback) => {
  const origenMismoDominio = `${req.protocol}://${req.get('host')}`
  const origenConfigurado = valorEntorno('CORS_ORIGIN') ?? 'http://localhost:5173'
  const origenesPermitidos = [origenConfigurado, origenMismoDominio]
  callback(null, {
    origin: origenesPermitidos,
    credentials: true,
  })
}))
app.use(express.json({ limit: '256kb' }))
app.use(cookieParser())

// Salud del servidor (con conexión real a PostgreSQL).
const health = async (_req: express.Request, res: express.Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ estado: 'ok', servicio: 'consultorio-api', db: 'conectada' })
  } catch (error) {
    // Detalle sólo en los logs del servidor (Runtime Logs de Vercel);
    // la respuesta pública se mantiene estable sin filtrar datos.
    console.error('[health] consulta a la BD falló:', error instanceof Error ? error.message : error)
    res.status(503).json({ estado: 'degradado', servicio: 'consultorio-api', db: 'sin conexión' })
  }
}
app.get('/health', health)
// Vercel expone las Functions bajo /api; vercel.json reescribe /health aquí.
app.get('/api/health', health)

// Alias legado (etapa 1) del health
app.get('/api/v1/health', (_req, res) => {
  res.redirect(307, '/health')
})

// API v1
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/patients', pacientesRouter)
app.use('/api/v1/obras-sociales', obrasRouter)
app.use('/api/v1/appointments', turnosRouter)
app.use('/api/v1/medical-records', historiasRouter)
app.use('/api/v1/estadisticas', estadisticasRouter)
app.use('/api/v1/audit-log', auditoriaRouter)

// Sitio público (contenido administrable) — pendiente de implementación
app.use('/api/sitio', sitioRouter)

// 404 JSON para rutas API desconocidas
app.all('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))
app.use('/api', (req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` }))

app.use(manejarError)

export default app
export { port }
