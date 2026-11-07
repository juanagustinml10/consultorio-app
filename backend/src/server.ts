import 'dotenv/config'
import app from './app'

const port = Number(process.env.PORT ?? 3001)

// Vercel importa la instancia Express como servicio; localmente abre el puerto.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`API del consultorio escuchando en http://localhost:${port}`)
  })
}

export default app
