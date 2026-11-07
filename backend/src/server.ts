import 'dotenv/config'
import express, { type Express } from 'express'

const port = Number(process.env.PORT ?? 3001)

let carga: Promise<Express> | undefined

function cargarApp(): Promise<Express> {
  carga ??= import('./app')
    .then((modulo) => modulo.default)
    .catch((error: unknown) => {
      carga = undefined
      throw error
    })
  return carga
}

// Separa el arranque de Express del núcleo para que Vercel pueda responder
// aunque una dependencia falle al inicializarse; el detalle queda solo en logs.
const app = express()
// Endpoint temporal de diagnóstico: no lee ni expone valores de configuración.
app.get('/api/__runtime', (_req, res) => {
  res.json({ node: process.versions.node.split('.')[0], databaseConfigured: Boolean(process.env.DATABASE_URL) })
})
app.use((req, res, next) => {
  void cargarApp()
    .then((api) => api(req, res, next))
    .catch((error: unknown) => {
      console.error('No se pudo inicializar el núcleo de la API:', error)
      if (!res.headersSent) {
        res.status(503).json({ error: 'El servicio no está disponible temporalmente' })
      }
    })
})

// En Vercel el adaptador invoca la app; solo el entorno local abre un puerto.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  void cargarApp().then((api) => {
    api.listen(port, () => {
      console.log(`API del consultorio escuchando en http://localhost:${port}`)
    })
  })
}

export default app
