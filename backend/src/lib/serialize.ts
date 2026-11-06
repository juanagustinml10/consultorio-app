import type {
  EstadoTurno as EstadoTurnoDB,
  Paciente as PacienteDB,
  Turno as TurnoDB,
} from '@prisma/client'

/** ISO local sin zona ("YYYY-MM-DDTHH:mm") — el frontend lo parsea como hora local. */
export function aIsoLocal(d: Date | null | undefined): string | undefined {
  if (!d) return undefined
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Formas que consume el frontend (espejo de frontend/src/types/domain.ts).
export interface PacienteFrontend {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento?: string // "YYYY-MM-DD" (hora local, no se serializa a UTC)
  sexo?: 'MASCULINO' | 'FEMENINO' | 'OTRO'
  telefono?: string
  email?: string
  direccion?: string
  obraSocialId?: string
  obraSocial?: string
  numeroAfiliado?: string
  notas?: string
  creadoEn?: string // "YYYY-MM-DD" de alta
}

/** Solo la fecha (YYYY-MM-DD) en hora local, para no desfazar días con UTC. */
export function aFechaLocal(d: Date | null | undefined): string | undefined {
  if (!d) return undefined
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export type EstadoTurnoFrontend = 'EN_ESPERA' | 'EN_ATENCION' | 'ATENDIDO' | 'CANCELADO'

export interface TurnoFrontend {
  id: string
  paciente: PacienteFrontend
  fechaAtencion: string
  fechaOrdenAtencion?: string
  horaFin?: string
  motivo?: string
  estado: EstadoTurnoFrontend
  numeroOrdenDia?: number
  creadoEn?: string
  cancelacion?: {
    motivo?: string
    fecha?: string
    usuario?: string
  }
}

/**
 * Normaliza estados históricos a los únicos estados operativos actuales.
 * Los datos originales permanecen intactos en la base de datos.
 */
export function estadoHaciaFrontend(estado: EstadoTurnoDB): EstadoTurnoFrontend {
  switch (estado) {
    case 'EN_ATENCION':
      return 'EN_ATENCION'
    case 'ATENDIDO':
      return 'ATENDIDO'
    case 'AUSENTE':
    case 'CANCELADO':
      return 'CANCELADO'
    default:
      // PROGRAMADO / CONFIRMADO / EN_ESPERA
      return 'EN_ESPERA'
  }
}

/** Estados de BD que representan cada estado operativo visible. */
export function estadosDbDe(estado: EstadoTurnoFrontend): EstadoTurnoDB[] {
  switch (estado) {
    case 'EN_ESPERA':
      return ['EN_ESPERA', 'PROGRAMADO', 'CONFIRMADO']
    case 'EN_ATENCION':
      return ['EN_ATENCION']
    case 'ATENDIDO':
      return ['ATENDIDO']
    case 'CANCELADO':
      return ['CANCELADO', 'AUSENTE']
  }
}

export type PacienteConObraSocial = PacienteDB & {
  obraSocial?: { id?: string; nombre: string } | null
}

/** Devuelve solo los campos que necesita el frontend, sin datos innecesarios. */
export function serializarPaciente(p: PacienteConObraSocial): PacienteFrontend {
  return {
    id: p.id,
    nombre: p.nombre,
    apellido: p.apellido,
    dni: p.dni,
    ...(p.fechaNacimiento && { fechaNacimiento: aFechaLocal(p.fechaNacimiento) }),
    ...(p.sexo && { sexo: p.sexo }),
    ...(p.telefono && { telefono: p.telefono }),
    ...(p.email && { email: p.email }),
    ...(p.direccion && { direccion: p.direccion }),
    ...(p.obraSocial && {
      ...(p.obraSocial.id && { obraSocialId: p.obraSocial.id }),
      obraSocial: p.obraSocial.nombre,
    }),
    ...(p.numeroAfiliado && { numeroAfiliado: p.numeroAfiliado }),
    ...(p.notas && { notas: p.notas }),
    creadoEn: aFechaLocal(p.creadoEn),
  }
}

export type TurnoConInclude = TurnoDB & {
  paciente: PacienteConObraSocial
  canceladoPor?: { nombre: string; apellido: string } | null
}

export function serializarTurno(t: TurnoConInclude): TurnoFrontend {
  const cancelacion = t.estado === 'CANCELADO' || t.estado === 'AUSENTE' || t.canceladoEn
    ? {
      ...(t.motivoCancelacion && { motivo: t.motivoCancelacion }),
      ...(t.canceladoEn && { fecha: t.canceladoEn.toISOString() }),
      ...(t.canceladoPor && { usuario: `${t.canceladoPor.nombre} ${t.canceladoPor.apellido}` }),
    }
    : undefined

  return {
    id: t.id,
    paciente: serializarPaciente(t.paciente),
    fechaAtencion: t.fechaAtencion.toISOString().slice(0, 10),
    ...(t.fechaOrdenAtencion && { fechaOrdenAtencion: t.fechaOrdenAtencion.toISOString().slice(0, 10) }),
    ...(t.horaFin && { horaFin: t.horaFin.toISOString() }),
    ...(t.motivo && { motivo: t.motivo }),
    estado: estadoHaciaFrontend(t.estado),
    ...(t.numeroOrdenDia !== null && { numeroOrdenDia: t.numeroOrdenDia }),
    creadoEn: t.creadoEn.toISOString(),
    ...(cancelacion && { cancelacion }),
  }
}


/** Rango "hoy" en hora local (00:00–23:59:59). */
export function rangoDeHoy(): { desde: Date; hasta: Date } {
  const n = new Date()
  const desde = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0)
  const hasta = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59, 999)
  return { desde, hasta }
}

/** Parsea "YYYY-MM-DDTHH:mm" como hora local (lo mismo que hace el frontend). */
export function parsearIsoLocal(s: string): Date {
  return new Date(s)
}
