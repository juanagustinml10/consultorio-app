import { Router } from 'express'

// Módulo de turnos. PENDIENTE (etapa 2): CRUD real contra la tabla Turno,
// incluyendo el flujo de estados PROGRAMADO → LLEGO → EN_ATENCION → ATENDIDO.
export const turnosRouter = Router()

turnosRouter.get('/', (_req, res) => {
  res.status(501).json({ error: 'Pendiente de implementación' })
})

turnosRouter.post('/', (_req, res) => {
  res.status(501).json({ error: 'Pendiente de implementación' })
})

turnosRouter.patch('/:id/estado', (_req, res) => {
  res.status(501).json({ error: 'Pendiente de implementación' })
})
