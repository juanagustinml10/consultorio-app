import type { AvisoSitio } from '@/types/domain'

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
      'Del 10 al 24 de enero la atención se encuentra suspendida por vacaciones. Consultá novedades por WhatsApp. (aviso de ejemplo)',
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
    pregunta: '¿Puedo cancelar mi inscripción del día?',
    respuesta: 'Sí, se pide avisar con anticipación para liberar el lugar. El número asignado no se reutiliza.',
  },
]


