// Tipos del dominio, alineados con el esquema de Prisma (backend/prisma/schema.prisma).
// Cuando exista la API real, la capa de servicios serializará/deserializará estas entidades.

export type Rol = 'MEDICO' | 'SECRETARIA'

export type EstadoTurno = 'EN_ESPERA' | 'EN_ATENCION' | 'ATENDIDO' | 'CANCELADO'

export interface Paciente {
  id: string
  nombre: string
  apellido: string
  dni: string
  telefono?: string
  email?: string
  obraSocial?: string
}

export interface Turno {
  id: string
  paciente: Paciente
  /** Fecha local YYYY-MM-DD de la atención (sin horario individual). */
  fechaAtencion?: string
  motivo: string
  estado: EstadoTurno
  numeroOrdenDia?: number
  creadoEn?: string
  cancelacion?: {
    motivo?: string
    fecha?: string
    usuario?: string
  }
}

export interface Actividad {
  id: string
  hora: string
  descripcion: string
  tipo: 'turno' | 'paciente' | 'atencion' | 'aviso'
}

export interface AvisoSitio {
  id: string
  titulo: string
  mensaje: string
}
