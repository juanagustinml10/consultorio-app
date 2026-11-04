import type { AvisoSitio, Actividad, Paciente, Turno } from '@/types/domain'

/**
 * DATOS DE EJEMPLO (ficticios, solo para visualizar las pantallas).
 * No se guardan en ninguna base de datos: desaparecen al recargar la página.
 * En la etapa 2 serán reemplazados por datos reales obtenidos de la API.
 */

export const perfilMedico = {
  nombre: 'Dra. Laura Pérez',
  especialidad: 'Medicina Clínica',
  matricula: '(matrícula de ejemplo)',
  descripcion:
    'Médica clínica con foco en la atención integral de adultos. Recibo por turnos en mi consultorio, con acompañamiento continuo y cercano para cada paciente.',
  fotoUrl: '', // vacío: se muestra un avatar provisorio con iniciales
}

export const datosDemo = {
  consultorio: {
    direccion: 'Av. Siempreviva 742, piso 3, consultorio B (dirección ficticia)',
    ciudad: 'Ciudad de ejemplo',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Av.+Siempreviva+742',
  },
  contacto: {
    telefono: '+54 000 000-0000',
    email: 'turnos@ejemplo.com.ar',
  },
  whatsapp: 'https://wa.me/5490000000000',
}

export const formacionAcademica = [
  {
    titulo: 'Médica (título de grado)',
    instituto: 'Universidad Ejemplo — Facultad de Ciencias Médicas',
    periodo: '2008 – 2013 (ejemplo)',
    detalle: 'Graduada con promedio 8.50',
  },
  {
    titulo: 'Residencia completa en Clínica Médica',
    instituto: 'Hospital Ejemplo',
    periodo: '2014 – 2017 (ejemplo)',
    detalle: 'Rotación por sala general, guardias y ambulatorio',
  },
  {
    titulo: 'Actualización profesional continua',
    instituto: 'Congresos y cursos de posgrado',
    periodo: '2018 en adelante (ejemplo)',
    detalle: 'Certificaciones periódicas en hipertensión, diabetes y medicina preventiva',
  },
]

export const servicios = [
  {
    icono: 'stethoscope' as const,
    titulo: 'Consultas clínicas generales',
    descripcion: 'Evaluación integral, seguimiento de patologías y tratamiento.',
  },
  {
    icono: 'clipboard' as const,
    titulo: 'Chequeos preventivos',
    descripcion: 'Controles de salud anuales con estudios complementarios.',
  },
  {
    icono: 'heart' as const,
    titulo: 'Control de hipertensión y diabetes',
    descripcion: 'Monitoreo periódico y ajuste del tratamiento.',
  },
  {
    icono: 'syringe' as const,
    titulo: 'Ordenes de estudios y vacunación',
    descripcion: 'Indicación y seguimiento de estudios y calendario de vacunas.',
  },
]

export const horariosAtencion = [
  { dias: 'Lunes y Miércoles', franja: '09:00 a 13:00' },
  { dias: 'Martes y Jueves', franja: '16:00 a 20:00' },
  { dias: 'Viernes', franja: '09:00 a 12:00' },
  { dias: 'Sábado y Domingo', franja: 'Sin atención' },
]

export const obrasSociales = [
  'Obra Social Ejemplo A',
  'Prepaga Ejemplo 2',
  'Prepaga Ejemplo 3',
  'Particular',
]

export const avisosSitio: AvisoSitio[] = [
  {
    id: 'aviso-1',
    titulo: 'Ejemplo: atención suspendida por vacaciones',
    mensaje:
      'Del 10 al 24 de enero la atención se encuentra suspendida por vacaciones. Los turnos se reprograman por WhatsApp. (aviso de ejemplo)',
  },
]

export const preguntasFrecuentes = [
  {
    pregunta: '¿Cómo solicito un turno?',
    respuesta: 'Se puede solicitar por WhatsApp al número publicado, o por teléfono durante los horarios de atención.',
  },
  {
    pregunta: '¿Atiende por obra social o prepaga?',
    respuesta: 'Sí. Revisá la sección “Obras sociales y prepagas” para ver las coberturas aceptadas. También hay opción particular.',
  },
  {
    pregunta: '¿Qué debo llevar a la primera consulta?',
    respuesta: 'Documento, carnet de vacunas, estudios previos si los tenés y la lista de medicamentos que consumís.',
  },
  {
    pregunta: '¿Puedo cancelar o reprogramar un turno?',
    respuesta: 'Sí, se pide avisar con al menos 24 horas de anticipación para habilitar el turno a otro paciente.',
  },
]

// ---- Pacientes ficticios ----
export const pacientesDemo: Paciente[] = [
  { id: 'p1', apellido: 'García', nombre: 'Ana', dni: '12345678', telefono: '11 1000-0001', obraSocial: 'Obra Social Ejemplo A' },
  { id: 'p2', apellido: 'Fernández', nombre: 'Carlos', dni: '23456789', telefono: '11 1000-0002', obraSocial: 'Prepaga Ejemplo 2' },
  { id: 'p3', apellido: 'Rodríguez', nombre: 'María', dni: '34567890', telefono: '11 1000-0003', obraSocial: 'Obra Social Ejemplo A' },
  { id: 'p4', apellido: 'López', nombre: 'Julián', dni: '45678901', telefono: '11 1000-0004', obraSocial: 'Particular' },
  { id: 'p5', apellido: 'Sánchez', nombre: 'Lucía', dni: '56789012', telefono: '11 1000-0005', obraSocial: 'Prepaga Ejemplo 3' },
]

const hoy = new Date()
const esHoy = (h: number, m: number) => {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), h, m)
  return d.toISOString()
}

export const turnosDemo: Turno[] = [
  { id: 't1', paciente: pacientesDemo[0], fechaHora: esHoy(9, 0), duracionMin: 30, motivo: 'Seguimiento de hipertensión', estado: 'ATENDIDO', horaLlegada: esHoy(8, 50) },
  { id: 't2', paciente: pacientesDemo[1], fechaHora: esHoy(9, 30), duracionMin: 30, motivo: 'Dolor lumbar — revisación', estado: 'ATENDIDO', horaLlegada: esHoy(9, 20) },
  { id: 't3', paciente: pacientesDemo[2], fechaHora: esHoy(10, 0), duracionMin: 30, motivo: 'Resultados de análisis', estado: 'EN_ATENCION', horaLlegada: esHoy(9, 45) },
  { id: 't4', paciente: pacientesDemo[3], fechaHora: esHoy(10, 30), duracionMin: 30, motivo: 'Control de diabetes', estado: 'LLEGO', horaLlegada: esHoy(10, 15) },
  { id: 't5', paciente: pacientesDemo[4], fechaHora: esHoy(11, 0), duracionMin: 30, motivo: 'Dolor de garganta y cefalea', estado: 'LLEGO', horaLlegada: esHoy(10, 38) },
  { id: 't6', paciente: { id: 'p6', apellido: 'Molina', nombre: 'Rubén', dni: '67890123', obraSocial: 'Obra Social Ejemplo A' }, fechaHora: esHoy(11, 30), duracionMin: 30, motivo: 'Consulta general', estado: 'PROGRAMADO' },
  { id: 't7', paciente: { id: 'p7', apellido: 'Torres', nombre: 'Valeria', dni: '78901234', obraSocial: 'Prepaga Ejemplo 2' }, fechaHora: esHoy(12, 0), duracionMin: 30, motivo: 'Certificados y recetas', estado: 'PROGRAMADO' },
]

export const actividadDemo: Actividad[] = [
  { id: 'a1', hora: '10:20', tipo: 'atencion', descripcion: 'Finalizó la atención de Carlos Fernández' },
  { id: 'a2', hora: '10:05', tipo: 'atencion', descripcion: 'Paciente María Rodríguez en consulta' },
  { id: 'a3', hora: '10:15', tipo: 'paciente', descripcion: 'Julián López llegó a recepción' },
  { id: 'a4', hora: '09:58', tipo: 'paciente', descripcion: 'Lucía Sánchez llegó a recepción' },
  { id: 'a5', hora: '09:30', tipo: 'turno', descripcion: 'Se reservó el turno de 12:00 por WhatsApp' },
]

// Turnos de próximos días (para la agenda)
export const turnosProximosDias: Turno[] = [
  { id: 'f1', paciente: pacientesDemo[0], fechaHora: '2026-11-04T09:00', duracionMin: 30, motivo: 'Control de presión arterial', estado: 'PROGRAMADO' },
  { id: 'f2', paciente: pacientesDemo[3], fechaHora: '2026-11-04T10:00', duracionMin: 30, motivo: 'Consulta general', estado: 'PROGRAMADO' },
  { id: 'f3', paciente: pacientesDemo[4], fechaHora: '2026-11-05T16:00', duracionMin: 30, motivo: 'Resultados de estudios', estado: 'PROGRAMADO' },
]
