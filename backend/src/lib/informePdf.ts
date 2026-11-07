import PDFDocument from 'pdfkit'
import * as PDFKitModulo from 'pdfkit'
import type { EstadisticasPeriodo } from './estadisticas'

/**
 * El build de PDFKit para Workers (navegador) no incluye las fuentes estándar:
 * hay que registrar explícitamente los datos de las que usa el informe.
 * El build de Node las registra solo, así que allí la función no hace nada.
 */
type PdfKitConRegistro = typeof PDFKitModulo & {
  registerStdFonts?: (...fuentes: unknown[]) => void
}

let fuentesListas: Promise<void> | undefined

async function asegurarFuentesEstandar(): Promise<void> {
  const registrador = PDFKitModulo as PdfKitConRegistro
  if (typeof registrador.registerStdFonts !== 'function') return

  fuentesListas ??= (async () => {
    const [helvetica, helveticaBold] = await Promise.all([
      import('pdfkit/standard-fonts/Helvetica'),
      import('pdfkit/standard-fonts/HelveticaBold'),
    ])
    registrador.registerStdFonts!(helvetica.default, helveticaBold.default)
  })()

  await fuentesListas
}

const COLOR = {
  primary: '#0c2444',
  primaryMedio: '#17427c',
  accent: '#38bdf8',
  verde: '#059669',
  azul: '#1d539a',
  celeste: '#0284c7',
  rosa: '#e11d48',
  slate: '#64748b',
  slateClaro: '#94a3b8',
  fondoSuave: '#f1f5f9',
  borde: '#d9e6f6',
  blanco: '#ffffff',
} as const

const MARGEN = 40
const ANCHO_A4 = 595.28
const ALTO_A4 = 841.89
const ANCHO_CONTENIDO = ANCHO_A4 - MARGEN * 2

function fechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

function fechaLarga(iso: string): string {
  const fecha = new Date(`${iso.slice(0, 10)}T12:00:00`)
  return fecha.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function numero(valor: number, decimales = 0): string {
  return valor.toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })
}

function etiquetaPeriodo(datos: EstadisticasPeriodo): string {
  const { desde, hasta } = datos.periodo
  if (desde === hasta) return `Fecha analizada: ${fechaLarga(desde)}`
  return `Período analizado: ${fechaLarga(desde)} al ${fechaLarga(hasta)}`
}

function dibujarEncabezado(doc: PDFKit.PDFDocument, datos: EstadisticasPeriodo): void {
  doc.rect(0, 0, ANCHO_A4, 132).fill(COLOR.primary)
  doc.rect(0, 132, ANCHO_A4, 4).fill(COLOR.accent)

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLOR.accent)
    .text('CONSULTORIO MÉDICO', MARGEN, 30, { characterSpacing: 1.6 })

  doc
    .font('Helvetica-Bold')
    .fontSize(25)
    .fillColor(COLOR.blanco)
    .text('Informe de atención de pacientes', MARGEN, 48, { width: ANCHO_CONTENIDO })

  doc
    .font('Helvetica')
    .fontSize(10.5)
    .fillColor('#cfe0f5')
    .text(etiquetaPeriodo(datos), MARGEN, 84, { width: ANCHO_CONTENIDO })

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#9fb7d4')
    .text(
      `Generado el ${new Date(datos.generadoEn).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })} hs`,
      MARGEN,
      103,
      { width: ANCHO_CONTENIDO },
    )

  doc.rect(ANCHO_A4 - 150, 30, 110, 1.5).fill(COLOR.accent)
}

function dibujarTarjetas(doc: PDFKit.PDFDocument, datos: EstadisticasPeriodo, y: number): number {
  const tarjetas = [
    { etiqueta: 'Total inscriptos', valor: datos.resumen.totalInscripciones, color: COLOR.primaryMedio },
    { etiqueta: 'Atendidos', valor: datos.resumen.atendidos, color: COLOR.verde },
    { etiqueta: 'En espera', valor: datos.resumen.enEspera, color: COLOR.celeste },
    { etiqueta: 'En atención', valor: datos.resumen.enAtencion, color: COLOR.azul },
    { etiqueta: 'Cancelados', valor: datos.resumen.cancelados, color: COLOR.rosa },
  ]
  const separacion = 8
  const ancho = (ANCHO_CONTENIDO - separacion * (tarjetas.length - 1)) / tarjetas.length
  const alto = 76

  tarjetas.forEach((tarjeta, indice) => {
    const x = MARGEN + indice * (ancho + separacion)
    doc.roundedRect(x, y, ancho, alto, 7).fill(COLOR.fondoSuave)
    doc.roundedRect(x, y, ancho, 3.5, 2).fill(tarjeta.color)
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(COLOR.slate)
      .text(tarjeta.etiqueta.toUpperCase(), x + 9, y + 14, { width: ancho - 18, characterSpacing: 0.3 })
    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor(tarjeta.color)
      .text(numero(tarjeta.valor), x + 9, y + 33, { width: ancho - 18 })
  })

  return y + alto
}

function dibujarGrafico(doc: PDFKit.PDFDocument, datos: EstadisticasPeriodo, y: number): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLOR.primary)
    .text('Pacientes por día', MARGEN, y)
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLOR.slate)
    .text('Cada barra representa las inscripciones reales del día, agrupadas por estado.', MARGEN, y + 17)

  const leyendaY = y + 35
  const leyenda = [
    { etiqueta: 'Atendidos', color: COLOR.verde },
    { etiqueta: 'En atención', color: COLOR.azul },
    { etiqueta: 'En espera', color: COLOR.celeste },
    { etiqueta: 'Cancelados', color: COLOR.rosa },
  ]
  let leyendaX = MARGEN
  for (const item of leyenda) {
    doc.roundedRect(leyendaX, leyendaY + 1, 7, 7, 1.5).fill(item.color)
    doc.font('Helvetica').fontSize(7.5).fillColor(COLOR.slate).text(item.etiqueta, leyendaX + 11, leyendaY)
    leyendaX += 86
  }

  const areaX = MARGEN + 30
  const areaY = leyendaY + 24
  const areaAncho = ANCHO_CONTENIDO - 30
  const areaAlto = 135
  const areaBase = areaY + areaAlto
  const dias = datos.porDia
  const maximo = Math.max(...dias.map((dia) => dia.total), 1)

  // Grilla y escala vertical
  for (let paso = 0; paso <= 4; paso++) {
    const valor = Math.round((maximo * (4 - paso)) / 4)
    const lineaY = areaY + (areaAlto * paso) / 4
    doc
      .moveTo(areaX, lineaY)
      .lineTo(areaX + areaAncho, lineaY)
      .lineWidth(0.4)
      .strokeColor('#dbe5f1')
      .stroke()
    doc.font('Helvetica').fontSize(6.5).fillColor(COLOR.slateClaro).text(String(valor), MARGEN, lineaY - 3, {
      width: 25,
      align: 'right',
    })
  }

  if (dias.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLOR.slateClaro)
      .text('Sin inscripciones en el período seleccionado.', areaX, areaY + areaAlto / 2 - 6, {
        width: areaAncho,
        align: 'center',
      })
    return areaBase + 16
  }

  const paso = areaAncho / dias.length
  const anchoBarra = Math.max(1, Math.min(16, paso * 0.62))
  const cadaEtiqueta = Math.max(1, Math.ceil(dias.length / 10))

  dias.forEach((dia, indice) => {
    const centro = areaX + indice * paso + paso / 2
    const x = centro - anchoBarra / 2
    const segmentos = [
      { valor: dia.atendidos, color: COLOR.verde },
      { valor: dia.enAtencion, color: COLOR.azul },
      { valor: dia.enEspera, color: COLOR.celeste },
      { valor: dia.cancelados, color: COLOR.rosa },
    ]
    let alturaAcumulada = 0
    for (const segmento of segmentos) {
      if (segmento.valor <= 0) continue
      const alto = (segmento.valor / maximo) * areaAlto
      doc
        .rect(x, areaBase - alturaAcumulada - alto, anchoBarra, alto)
        .fill(segmento.color)
      alturaAcumulada += alto
    }

    if (indice % cadaEtiqueta === 0) {
      const [, mes, diaMes] = dia.fecha.split('-')
      doc
        .font('Helvetica')
        .fontSize(6)
        .fillColor(COLOR.slate)
        .text(`${diaMes}/${mes}`, centro - paso, areaBase + 5, { width: paso * 2, align: 'center' })
    }
  })

  doc
    .moveTo(areaX, areaBase)
    .lineTo(areaX + areaAncho, areaBase)
    .lineWidth(0.8)
    .strokeColor('#9fb3cb')
    .stroke()

  return areaBase + 22
}

interface ColumnaTabla {
  etiqueta: string
  ancho: number
  alineacion: 'left' | 'right'
}

function dibujarTabla(doc: PDFKit.PDFDocument, datos: EstadisticasPeriodo, y: number): number {
  const columnas: ColumnaTabla[] = [
    { etiqueta: 'Fecha', ancho: 100, alineacion: 'left' },
    { etiqueta: 'Total', ancho: 68, alineacion: 'right' },
    { etiqueta: 'Atendidos', ancho: 84, alineacion: 'right' },
    { etiqueta: 'En espera', ancho: 84, alineacion: 'right' },
    { etiqueta: 'En atención', ancho: 87, alineacion: 'right' },
    { etiqueta: 'Cancelados', ancho: 87, alineacion: 'right' },
  ]
  const altoFila = 19

  const cabecera = (posicionY: number) => {
    doc.rect(MARGEN, posicionY, ANCHO_CONTENIDO, altoFila).fill(COLOR.primary)
    let x = MARGEN
    for (const columna of columnas) {
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(COLOR.blanco)
        .text(columna.etiqueta, x + 6, posicionY + 6, {
          width: columna.ancho - 12,
          align: columna.alineacion,
        })
      x += columna.ancho
    }
    return posicionY + altoFila
  }

  const tituloY = y
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLOR.primary)
    .text('Detalle por fecha', MARGEN, tituloY)
  let posicionY = cabecera(tituloY + 20)

  if (datos.porDia.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLOR.slateClaro)
      .text('No hay registros de inscripciones para las fechas seleccionadas.', MARGEN, posicionY + 12)
    return posicionY + 34
  }

  datos.porDia.forEach((dia, indice) => {
    if (posicionY + altoFila > ALTO_A4 - 70) {
      doc.addPage()
      posicionY = 56
      posicionY = cabecera(posicionY)
    }

    if (indice % 2 === 0) {
      doc.rect(MARGEN, posicionY, ANCHO_CONTENIDO, altoFila).fill('#f7fafd')
    }

    const valores = [
      fechaCorta(dia.fecha),
      numero(dia.total),
      numero(dia.atendidos),
      numero(dia.enEspera),
      numero(dia.enAtencion),
      numero(dia.cancelados),
    ]
    let x = MARGEN
    columnas.forEach((columna, columnaIndice) => {
      const esFecha = columnaIndice === 0
      const color =
        columnaIndice === 5 && dia.cancelados > 0
          ? COLOR.rosa
          : columnaIndice === 2 && dia.atendidos > 0
            ? COLOR.verde
            : COLOR.primary
      doc
        .font(esFecha ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8)
        .fillColor(color)
        .text(valores[columnaIndice], x + 6, posicionY + 5.5, {
          width: columna.ancho - 12,
          align: columna.alineacion,
        })
      x += columna.ancho
    })

    doc
      .moveTo(MARGEN, posicionY + altoFila)
      .lineTo(MARGEN + ANCHO_CONTENIDO, posicionY + altoFila)
      .lineWidth(0.35)
      .strokeColor(COLOR.borde)
      .stroke()
    posicionY += altoFila
  })

  return posicionY + 16
}

function dibujarConclusiones(doc: PDFKit.PDFDocument, datos: EstadisticasPeriodo, y: number): number {
  if (y > ALTO_A4 - 190) {
    doc.addPage()
    y = 56
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(COLOR.primary)
    .text('Conclusiones estadísticas', MARGEN, y)
  y += 22

  const conclusiones = datos.conclusiones
  const lineas: string[] = []

  if (conclusiones.diaMayorActividad) {
    lineas.push(
      `Día con mayor cantidad de inscripciones: ${fechaLarga(conclusiones.diaMayorActividad.fecha)} con ${numero(conclusiones.diaMayorActividad.total)} ${conclusiones.diaMayorActividad.total === 1 ? 'inscripción' : 'inscripciones'}.`,
    )
  } else {
    lineas.push('No se registraron inscripciones en el período seleccionado.')
  }

  lineas.push(`Total de pacientes atendidos durante el período: ${numero(conclusiones.totalAtendidos)}.`)

  if (conclusiones.porcentajeFinalizacion !== null) {
    lineas.push(
      `Porcentaje de atención finalizada: ${numero(conclusiones.porcentajeFinalizacion, 1)} % del total de inscripciones.`,
    )
  }

  if (conclusiones.promedioDiario !== null) {
    lineas.push(
      `Promedio diario de inscripciones: ${numero(conclusiones.promedioDiario, 1)} (${numero(conclusiones.diasDelPeriodo)} ${conclusiones.diasDelPeriodo === 1 ? 'día' : 'días'} del período).`,
    )
  }

  if (conclusiones.tasaCancelacion !== null && datos.resumen.cancelados > 0) {
    lineas.push(
      `Inscripciones canceladas: ${numero(datos.resumen.cancelados)} (${numero(conclusiones.tasaCancelacion, 1)} % del total).`,
    )
  }

  lineas.push(`Días con actividad registrada: ${numero(conclusiones.diasConActividad)} de ${numero(conclusiones.diasDelPeriodo)}.`)

  for (const linea of lineas) {
    const alto = doc.font('Helvetica').fontSize(9).heightOfString(linea, { width: ANCHO_CONTENIDO - 16 })
    if (y + alto > ALTO_A4 - 70) {
      doc.addPage()
      y = 56
    }
    doc.circle(MARGEN + 3, y + 4.5, 2).fill(COLOR.accent)
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLOR.primary)
      .text(linea, MARGEN + 14, y, { width: ANCHO_CONTENIDO - 16 })
    y += alto + 6
  }

  y += 6
  const nota =
    'Este informe utiliza datos agregados. No incluye nombres, DNI, diagnósticos, tratamientos ni otra información clínica sensible.'
  const altoNota = doc.font('Helvetica').fontSize(8).heightOfString(nota, { width: ANCHO_CONTENIDO - 24 })
  doc.roundedRect(MARGEN, y, ANCHO_CONTENIDO, altoNota + 18, 6).fill('#eef4fb')
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLOR.primaryMedio)
    .text(nota, MARGEN + 12, y + 9, { width: ANCHO_CONTENIDO - 24 })

  return y + altoNota + 18
}

function dibujarPiesDePagina(doc: PDFKit.PDFDocument): void {
  const rango = doc.bufferedPageRange()
  for (let indice = 0; indice < rango.count; indice++) {
    doc.switchToPage(rango.start + indice)
    const y = ALTO_A4 - 32
    doc
      .moveTo(MARGEN, y - 8)
      .lineTo(MARGEN + ANCHO_CONTENIDO, y - 8)
      .lineWidth(0.4)
      .strokeColor(COLOR.borde)
      .stroke()
    doc
      .font('Helvetica')
      .fontSize(6.8)
      .fillColor(COLOR.slateClaro)
      .text('Consultorio App · Informe estadístico de atención', MARGEN, y, {
        width: ANCHO_CONTENIDO - 80,
        lineBreak: false,
      })
    doc
      .font('Helvetica')
      .fontSize(6.8)
      .fillColor(COLOR.slateClaro)
      .text(`Página ${indice + 1} de ${rango.count}`, MARGEN + ANCHO_CONTENIDO - 70, y, {
        width: 70,
        align: 'right',
        lineBreak: false,
      })
  }
}

/** Genera el PDF en memoria (sin archivos temporales). */
export async function generarInformePdf(datos: EstadisticasPeriodo): Promise<Buffer> {
  await asegurarFuentesEstandar()

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGEN,
      bufferPages: true,
      info: {
        Title: 'Informe de atención de pacientes',
        Author: 'Consultorio App',
        Subject: 'Estadísticas agregadas de atención',
        CreationDate: new Date(),
      },
    })

    const partes: Buffer[] = []
    doc.on('data', (parte: Buffer) => partes.push(parte))
    doc.on('end', () => resolve(Buffer.concat(partes)))
    doc.on('error', reject)

    try {
      dibujarEncabezado(doc, datos)
      let y = 152
      y = dibujarTarjetas(doc, datos, y)
      y = dibujarGrafico(doc, datos, y + 22)
      y = dibujarTabla(doc, datos, y + 8)
      dibujarConclusiones(doc, datos, y + 8)
      dibujarPiesDePagina(doc)
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
