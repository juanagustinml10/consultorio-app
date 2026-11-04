import { Router } from 'express'

// Página pública — lectura de contenido administrable.
// PENDIENTE (etapa 2): servir perfil, horarios, obras sociales, FAQ y avisos
// desde las tablas ContenidoSitio y Aviso.
export const sitioRouter = Router()

sitioRouter.get('/contenido', (_req, res) => {
  res.status(501).json({ error: 'Pendiente de implementación' })
})

sitioRouter.get('/avisos', (_req, res) => {
  res.status(501).json({ error: 'Pendiente de implementación' })
})
