import { Router } from 'express'

// Módulo de pacientes. PENDIENTE (etapa 2): CRUD real contra la tabla Paciente
// usando las validaciones de src/validations (crearPacienteSchema).
export const pacientesRouter = Router()

pacientesRouter.get('/', (_req, res) => {
  res.status(501).json({ error: 'Pendiente de implementación' })
})

pacientesRouter.post('/', (_req, res) => {
  res.status(501).json({ error: 'Pendiente de implementación' })
})
