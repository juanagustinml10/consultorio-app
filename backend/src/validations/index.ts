import { z } from 'zod'

// ===== Login =====
export const loginSchema = z.object({
  email: z.string().min(1, 'Ingresá tu usuario o correo electrónico').email('El formato del correo no es válido'),
  contrasena: z.string().min(1, 'Ingresá tu contraseña').min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

// ===== Pacientes =====
export const crearPacienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener entre 7 y 8 dígitos'),
  fechaNacimiento: z.string().date().optional().nullable(),
  telefono: z.string().min(6, 'El teléfono parece demasiado corto').optional().nullable(),
  email: z.string().email('Correo inválido').optional().nullable(),
  obraSocial: z.string().optional().nullable(),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
})

// ===== Turnos =====
export const crearTurnoSchema = z.object({
  pacienteId: z.string().min(1, 'Indicá el paciente'),
  fechaHora: z.string().datetime(),
  duracionMin: z.number().int().positive().default(30),
  motivo: z.string().max(300).optional().nullable(),
})

export const cambiarEstadoTurnoSchema = z.object({
  estado: z.enum(['PROGRAMADO', 'LLEGO', 'EN_ATENCION', 'ATENDIDO', 'AUSENTE', 'CANCELADO']),
})

// ===== Registro de llegada (recepción) =====
export const registrarLlegadaSchema = z.object({
  turnoId: z.string().min(1),
  horaLlegada: z.string().datetime().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CrearPacienteInput = z.infer<typeof crearPacienteSchema>
export type CrearTurnoInput = z.infer<typeof crearTurnoSchema>
