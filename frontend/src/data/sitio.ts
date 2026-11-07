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
    'Atención médica personalizada y seguimiento cercano de cada paciente. La inscripción es por orden de llegada: te registrás al llegar y esperás tu lugar.',
}

export const consultorio = {
  ciudad: 'Aguilares, Tucumán, Argentina',
  direccion: 'Laprida 787',
  direccionCompleta: 'Laprida 787, Aguilares, Tucumán, Argentina',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Laprida+787,+Aguilares,+Tucum%C3%A1n,+Argentina',
  mapsEmbedUrl:
    'https://www.google.com/maps?q=Laprida+787,+Aguilares,+Tucum%C3%A1n,+Argentina&output=embed',
}

export const contacto = {
  telefonoVisible: '3865 536710',
  telUrl: 'tel:+5493865536710',
  whatsappUrl: 'https://wa.me/5493865536710',
}

export const horariosAtencion = [
  {
    dias: 'Lunes a Viernes',
    franja: 'desde las 17 hs',
  },
]

/**
 * PROVISORIO: coberturas de ejemplo del sistema (seed del backend).
 * Reemplazar por los nombres reales cuando estén definidos.
 */
export const obrasSociales = [
  'Obra Social Ejemplo A',
  'Prepaga Ejemplo 2',
  'Prepaga Ejemplo 3',
  'Particular',
]

export const preguntasFrecuentes = [
  {
    pregunta: '¿Cómo solicito una atención?',
    respuesta:
      'Podés comunicarte por WhatsApp o teléfono al 3865 481557, o presentarte directamente en el consultorio durante los horarios de atención.',
  },
  {
    pregunta: '¿Cuándo atiende el consultorio?',
    respuesta: 'De lunes a viernes desde las 17 hs. Podés pasar a inscribirte en ese horario.',
  },
  {
    pregunta: '¿Cómo funciona la inscripción del día?',
    respuesta:
      'La inscripción es por orden de llegada: al registrarte recibís un número que determina el orden de atención de ese día. El número no se reutiliza.',
  },
  {
    pregunta: '¿Puedo cancelar mi inscripción del día?',
    respuesta:
      'Sí, se pide avisar con anticipación para liberar el lugar. El número asignado no se reutiliza.',
  },
]
