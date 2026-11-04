// Tipos del dominio, alineados con el esquema de Prisma (backend/prisma/schema.prisma).
// Cuando exista la API real, la capa de servicios serializará/deserializará estas entidades.

export type Rol = 'MEDICO' | 'SECRETARIA'

export type EstadoTurno =
  | 'PROGRAMADO'
  | 'LLEGO'
  | 'EN_ATENCION'
  | 'ATENDIDO'
  | 'AUSENTE'
  | 'CANCELADO'

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
  /** ISO local, p. ej. 2026-11-03T09:30 */
  fechaHora: string
  duracionMin: number
  motivo: string
  estado: EstadoTurno
  horaLlegada?: string
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
