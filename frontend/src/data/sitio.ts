/**
 * Datos reales del consultorio para la página pública.
 *
 * El backend los servirá desde las tablas ContenidoSitio y Aviso (sitio.ts,
 * pendiente de implementación); mientras tanto la página pública se alimenta
 * de este módulo, que es su fuente única de verdad.
 */

export const perfilMedico = {
  nombre: 'Dr. Gustavo Puertas',
  matricula: '3503',
  descripcion:
    'Consultorio de atención médica privada, orientado al cuidado integral de la salud, con atención personalizada, compromiso profesional y seguimiento cercano de cada paciente. La atención se realiza mediante inscripción diaria, brindando un servicio organizado, accesible y de confianza.',
}

export const consultorio = {
  ciudad: 'Aguilares, Tucumán, Argentina',
  direccion: 'Pellegrini 824',
  direccionCompleta: 'Pellegrini 824, Aguilares, Tucumán, Argentina',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Pellegrini+824,+Aguilares,+Tucum%C3%A1n,+Argentina',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=Pellegrini+824,+Aguilares,+Tucum%C3%A1n,+Argentina&output=embed',
}

export const contacto = {
  telefonoVisible: '3865 536710',
  telUrl: 'tel:+5493865536710',
  whatsappUrl: 'https://wa.me/5493865536710',
}

export const horariosAtencion = [
  {
    dias: 'Lunes a Viernes',
    franja: 'desde hs 17:00',
  },
]

export const preguntasFrecuentes = [
  {
    pregunta: '¿Cómo solicito una atención?',
    respuesta:
      'Presentate en el consultorio de lunes a viernes a partir de las 17:00 hs e inscribite al llegar. La atención se da por orden de inscripción del día.',
  },
  {
    pregunta: '¿Cómo funciona la inscripción diaria?',
    respuesta:
      'Cada día de atención se abre una lista de inscripción por orden de llegada al momento de presentarse. Los pacientes son atendidos en ese mismo orden; no se asignan turnos con hora fija.',
  },
  {
    pregunta: '¿Cuándo atiende el consultorio?',
    respuesta: 'Lunes a viernes, a partir de las 17:00 hs.',
  },
  {
    pregunta: '¿Puedo cancelar mi inscripción del día?',
    respuesta:
      'Sí. Si ya no podés venir, avisanos por WhatsApp para liberar tu lugar en la lista del día.',
  },
]
