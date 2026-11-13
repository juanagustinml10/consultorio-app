import { z } from 'zod'

// Fecha/hora ISO: acepta hora local ("2026-11-04T09:30" o con segundos) y UTC ("...Z").
// El frontend trabaja con ISO local sin zona (ver lib/serialize.ts en el backend).
export const fechaIsoSchema = z.iso.datetime({ local: true })

// ===== Login =====
export const loginSchema = z.object({
  email: z.string().min(1, 'Ingresá tu usuario o correo electrónico').email('El formato del correo no es válido'),
  contrasena: z.string().min(1, 'Ingresá tu contraseña').min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

// ===== Pacientes =====
export const crearPacienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(80),
  apellido: z.string().min(1, 'El apellido es obligatorio').max(80),
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener entre 7 y 8 dígitos'),
  fechaNacimiento: z.string().date().optional().nullable(),
  sexo: z.enum(['MASCULINO', 'FEMENINO', 'OTRO']).optional().nullable(),
  telefono: z.string().min(6, 'El teléfono parece demasiado corto').max(30).optional().nullable(),
  email: z.string().email('Correo inválido').max(120).optional().nullable(),
  direccion: z.string().max(200).optional().nullable(),
  obraSocialId: z.string().min(1).optional().nullable(),
  numeroAfiliado: z.string().max(40).optional().nullable(),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
})

// Edición parcial: todos los campos opcionales
export const editarPacienteSchema = crearPacienteSchema.partial()

// ===== Inscripciones diarias =====
export const crearInscripcionSchema = z.object({
  pacienteId: z.string().min(1, 'Indicá el paciente'),
  fechaAtencion: z.string().date('La fecha de atención no es válida'),
  motivo: z.string().max(300, 'Máximo 300 caracteres').optional().nullable(),
})

export const cambiarEstadoAtencionSchema = z.object({
  estado: z.enum(['EN_ATENCION', 'ATENDIDO'], {
    message: 'El estado solicitado no es válido.',
  }),
})

export const cancelarInscripcionSchema = z.object({
  motivoCancelacion: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
  confirmarAtencionIniciada: z.boolean().optional(),
})

// ===== Estadísticas =====
const fechaDiaSchema = z.string().date('La fecha no es válida')

export const estadisticasQuerySchema = z
  .object({
    desde: fechaDiaSchema.optional(),
    hasta: fechaDiaSchema.optional(),
    fecha: fechaDiaSchema.optional(),
  })
  .transform((datos) => {
    const desde = datos.fecha ?? datos.desde
    const hasta = datos.fecha ?? datos.hasta
    return { desde, hasta }
  })

// ===== Historias clínicas =====
const textoClinico = z
  .string()
  .max(5000, 'Máximo 5000 caracteres')
  .optional()
  .nullable()

export const editarEncabezadoSchema = z
  .object({
    antecedentesPersonales: textoClinico,
    antecedentesFamiliares: textoClinico,
    alergias: textoClinico,
    medicacionHabitual: textoClinico,
    observaciones: textoClinico,
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay campos para actualizar' })

export const crearConsultaSchema = z.object({
  turnoId: z.string().min(1).optional(),
  fecha: fechaIsoSchema.optional(), // si falta, se usa "ahora"
  motivoConsulta: z.string().max(1000).optional().nullable(),
  diagnostico: textoClinico,
  tratamiento: textoClinico,
  indicaciones: textoClinico,
  derivaciones: textoClinico,
  proximoControl: fechaIsoSchema.optional().nullable(),
})

export const editarConsultaSchema = z
  .object({
    fecha: fechaIsoSchema.optional(),
    motivoConsulta: z.string().max(1000).optional().nullable(),
    diagnostico: textoClinico,
    tratamiento: textoClinico,
    indicaciones: textoClinico,
    derivaciones: textoClinico,
    proximoControl: fechaIsoSchema.optional().nullable(),
    esCorreccion: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No hay campos para actualizar' })

// ===== Paginación =====
export const paginacionSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(50).default(10),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CrearPacienteInput = z.infer<typeof crearPacienteSchema>
export type CrearInscripcionInput = z.infer<typeof crearInscripcionSchema>
