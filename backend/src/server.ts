import 'dotenv/config'
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
import { manejarError } from './middlewares/error'

const app = express()
const port = Number(process.env.PORT ?? 3001)
const origenFrontend = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: origenFrontend, credentials: true }))
app.use(express.json({ limit: '256kb' }))
app.use(cookieParser())

// Salud del servidor (con conexión real a PostgreSQL)
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ estado: 'ok', servicio: 'consultorio-api', db: 'conectada' })
  } catch {
    res.status(503).json({ estado: 'degradado', servicio: 'consultorio-api', db: 'sin conexión' })
  }
})

// Alias legado (etapa 1) del health
app.get('/api/health', (_req, res) => {
  res.redirect(307, '/health')
})

// API v1
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/patients', pacientesRouter)
app.use('/api/v1/obras-sociales', obrasRouter)
app.use('/api/v1/appointments', turnosRouter)
app.use('/api/v1/medical-records', historiasRouter)
app.use('/api/v1/estadisticas', estadisticasRouter)

// Sitio público (contenido administrable) — pendiente de implementación
app.use('/api/sitio', sitioRouter)

// 404 JSON para rutas API desconocidas
app.all('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))
app.use('/api', (req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` }))

app.use(manejarError)

app.listen(port, () => {
  console.log(`API del consultorio escuchando en http://localhost:${port}`)
})
