import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { authRouter } from './routes/auth'
import { pacientesRouter } from './routes/pacientes'
import { turnosRouter } from './routes/turnos'
import { sitioRouter } from './routes/sitio'
import { manejarError } from './middlewares/error'

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    estado: 'ok',
    servicio: 'consultorio-api',
    db: 'pendiente-etapa-2',
  })
})

app.use('/api/auth', authRouter)
app.use('/api/pacientes', pacientesRouter)
app.use('/api/turnos', turnosRouter)
app.use('/api/sitio', sitioRouter)

app.use(manejarError)

app.listen(port, () => {
  console.log(`API del consultorio escuchando en http://localhost:${port}`)
})
