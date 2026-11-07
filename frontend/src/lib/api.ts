/**
 * Cliente HTTP para la API del backend.
 *
 * Las solicitudes van al mismo origen (Cloudflare Pages) y el proxy de
 * Pages Functions (frontend/functions/api/[[path]].ts) las reenvía al
 * backend de Vercel. Usa cookies HttpOnly para la sesión
 * (credentials: 'include').
 */

export const API_BASE = '/api/v1'

export class ApiError extends Error {
  readonly status: number
  /** Detalle por campo cuando la API responde 400 (validación Zod). */
  readonly detalles?: Array<{ campo: string; mensaje: string }>
  constructor(status: number, message: string, detalles?: Array<{ campo: string; mensaje: string }>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detalles = detalles
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // envía y recibe cookies HttpOnly
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.error ?? `Error ${res.status}`, body?.detalles)
  }
  return res.json() as Promise<T>
}

// ===== Auth =====

export interface UsuarioSesion {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: 'MEDICO' | 'SECRETARIA'
}

export async function login(email: string, contrasena: string): Promise<UsuarioSesion> {
  const data = await apiFetch<{ usuario: UsuarioSesion }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, contrasena }),
  })
  return data.usuario
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' })
}

export async function getMe(): Promise<UsuarioSesion | null> {
  try {
    const data = await apiFetch<{ usuario: UsuarioSesion }>('/auth/me')
    return data.usuario
  } catch {
    return null
  }
}

// ===== Pacientes =====

export interface PacienteApi {
  id: string
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento?: string
  sexo?: 'MASCULINO' | 'FEMENINO' | 'OTRO'
  telefono?: string
  email?: string
  direccion?: string
  obraSocialId?: string
  obraSocial?: string
  numeroAfiliado?: string
  notas?: string
  creadoEn?: string
}

export interface PayloadPaciente {
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento?: string | null
  sexo?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  obraSocialId?: string | null
  numeroAfiliado?: string | null
  notas?: string | null
}

export async function getPacientes(
  q?: string,
  pagina = 1,
  porPagina = 10,
): Promise<{ items: PacienteApi[]; total: number; pagina: number; porPagina: number }> {
  const p = new URLSearchParams({ pagina: String(pagina), porPagina: String(porPagina) })
  if (q) p.set('q', q)
  return apiFetch(`/patients?${p.toString()}`)
}

export async function getPaciente(id: string): Promise<{ paciente: PacienteApi }> {
  return apiFetch(`/patients/${id}`)
}

/** Crea un paciente. Devuelve también los datos para actualizar el listado. */
export async function crearPaciente(payload: PayloadPaciente): Promise<{ paciente: PacienteApi }> {
  return apiFetch('/patients', { method: 'POST', body: JSON.stringify(payload) })
}

/** Modifica un paciente existente (PUT parcial: se envía el formulario completo). */
export async function editarPaciente(
  id: string,
  payload: PayloadPaciente,
): Promise<{ paciente: PacienteApi }> {
  return apiFetch(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

// ===== Obras sociales =====

export interface ObraSocialApi {
  id: string
  nombre: string
}

export async function getObrasSociales(): Promise<{ items: ObraSocialApi[] }> {
  return apiFetch('/obras-sociales')
}

// ===== Inscripciones diarias =====

export type EstadoAtencionApi = 'EN_ESPERA' | 'EN_ATENCION' | 'ATENDIDO' | 'CANCELADO'

export interface TurnoApi {
  id: string
  paciente: PacienteApi
  fechaAtencion: string
  fechaOrdenAtencion?: string
  horaFin?: string
  motivo?: string
  estado: EstadoAtencionApi
  numeroOrdenDia?: number
  creadoEn?: string
  cancelacion?: {
    motivo?: string
    fecha?: string
    usuario?: string
  }
}

export interface ConsultaAtencionApi {
  id: string
  fecha: string
  motivoConsulta?: string | null
  sintomas?: string | null
  evaluacion?: string | null
  diagnostico?: string | null
  tratamiento?: string | null
  indicaciones?: string | null
  proximoControl?: string | null
  version: number
  esCorreccion: boolean
}

export interface PayloadInscripcion {
  pacienteId: string
  fechaAtencion: string
  motivo?: string | null
}

export async function getInscripciones(opts?: {
  fecha?: string
  desde?: string
  hasta?: string
  estado?: EstadoAtencionApi
  pacienteId?: string
  incluirCancelados?: boolean
  soloCancelados?: boolean
}): Promise<{ items: TurnoApi[]; total: number; desde: string; hasta: string }> {
  const params = new URLSearchParams()
  if (opts?.fecha) params.set('fecha', opts.fecha)
  if (opts?.desde) params.set('desde', opts.desde)
  if (opts?.hasta) params.set('hasta', opts.hasta)
  if (opts?.estado) params.set('estado', opts.estado)
  if (opts?.pacienteId) params.set('pacienteId', opts.pacienteId)
  if (opts?.incluirCancelados) params.set('incluirCancelados', '1')
  if (opts?.soloCancelados) params.set('cancelados', '1')
  const query = params.size > 0 ? `?${params}` : ''
  return apiFetch(`/appointments${query}`)
}

export async function getInscripcion(id: string): Promise<{ turno: TurnoApi; consulta: ConsultaAtencionApi | null }> {
  return apiFetch(`/appointments/${id}`)
}

export async function crearInscripcion(
  payload: PayloadInscripcion,
): Promise<{ turno: TurnoApi; numeroAsignado?: number }> {
  return apiFetch('/appointments', { method: 'POST', body: JSON.stringify(payload) })
}

export async function cambiarEstadoAtencion(
  id: string,
  estado: 'EN_ATENCION' | 'ATENDIDO',
): Promise<{ turno: TurnoApi }> {
  return apiFetch(`/appointments/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export async function cancelarInscripcion(
  id: string,
  payload: { motivoCancelacion?: string | null; confirmarAtencionIniciada?: boolean } = {},
): Promise<{ turno: TurnoApi }> {
  return apiFetch(`/appointments/${id}/cancelar`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ===== Estadísticas e informes =====

export interface EstadisticasDiaApi {
  fecha: string
  total: number
  atendidos: number
  enEspera: number
  enAtencion: number
  cancelados: number
}

export interface EstadisticasApi {
  periodo: { desde: string; hasta: string; dias: number }
  resumen: {
    totalInscripciones: number
    atendidos: number
    enEspera: number
    enAtencion: number
    cancelados: number
    activos: number
  }
  porDia: EstadisticasDiaApi[]
  conclusiones: {
    diaMayorActividad: { fecha: string; total: number } | null
    totalAtendidos: number
    porcentajeFinalizacion: number | null
    promedioDiario: number | null
    tasaCancelacion: number | null
    diasConActividad: number
    diasDelPeriodo: number
  }
  generadoEn: string
}

export async function getEstadisticas(desde: string, hasta: string): Promise<EstadisticasApi> {
  const params = new URLSearchParams({ desde, hasta })
  return apiFetch(`/estadisticas?${params}`)
}

/** Descarga el PDF con cookies de sesión incluidas. */
export async function descargarInformeEstadistico(desde: string, hasta: string): Promise<void> {
  const params = new URLSearchParams({ desde, hasta })
  const res = await fetch(`${API_BASE}/estadisticas/informe.pdf?${params}`, {
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.error ?? `Error ${res.status}`, body?.detalles)
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  const disposicion = res.headers.get('Content-Disposition') ?? ''
  const nombre = /filename="([^"]+)"/.exec(disposicion)?.[1] ??
    `informe-atencion-${desde === hasta ? desde : `${desde}_a_${hasta}`}.pdf`
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

// ===== Historias clínicas =====

export interface ConsultaVersionApi {
  id: string
  version: number
  datos: {
    fecha?: string
    motivoConsulta?: string | null
    sintomas?: string | null
    evaluacion?: string | null
    diagnostico?: string | null
    tratamiento?: string | null
    indicaciones?: string | null
    proximoControl?: string | null
    version?: number
    registradoPor?: string | null
    cambios?: Array<{
      campo: string
      etiqueta: string
      anterior: string | null
      nuevo: string | null
    }>
    [key: string]: unknown
  }
  capturadoEn: string
  capturadoPor?: string | null
}

export interface ConsultaApi {
  id: string
  turnoId?: string | null
  fecha: string
  motivoConsulta?: string | null
  sintomas?: string | null
  evaluacion?: string | null
  diagnostico?: string | null
  tratamiento?: string | null
  indicaciones?: string | null
  proximoControl?: string | null
  version: number
  esCorreccion: boolean
  registradoPor?: string | null
  versiones?: ConsultaVersionApi[]
}

export interface HistoriaClinicaApi {
  paciente: PacienteApi
  historia: {
    id: string
    antecedentesPersonales?: string | null
    antecedentesFamiliares?: string | null
    alergias?: string | null
    medicacionHabitual?: string | null
    observaciones?: string | null
    version: number
    consultas: ConsultaApi[]
  }
}

export interface PayloadConsulta {
  fecha?: string
  motivoConsulta?: string | null
  sintomas?: string | null
  evaluacion?: string | null
  diagnostico?: string | null
  tratamiento?: string | null
  indicaciones?: string | null
  proximoControl?: string | null
  esCorreccion?: boolean
}

export interface PayloadEncabezadoHistoria {
  antecedentesPersonales?: string | null
  antecedentesFamiliares?: string | null
  alergias?: string | null
  medicacionHabitual?: string | null
  observaciones?: string | null
}

export async function getHistoriaClinica(patientId: string): Promise<HistoriaClinicaApi> {
  return apiFetch(`/medical-records/${patientId}`)
}

export async function editarEncabezadoHistoria(
  patientId: string,
  datos: PayloadEncabezadoHistoria,
): Promise<{ historia: HistoriaClinicaApi['historia'] }> {
  return apiFetch(`/medical-records/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
}

export async function crearConsulta(
  patientId: string,
  datos: PayloadConsulta,
  turnoId?: string,
): Promise<{ consulta: ConsultaApi }> {
  return apiFetch(`/medical-records/${patientId}/consultations`, {
    method: 'POST',
    body: JSON.stringify({ ...datos, ...(turnoId ? { turnoId } : {}) }),
  })
}

export async function editarConsulta(
  consultaId: string,
  datos: PayloadConsulta,
): Promise<{ consulta: ConsultaApi; versionAnterior: number }> {
  return apiFetch(`/medical-records/consultations/${consultaId}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
}
