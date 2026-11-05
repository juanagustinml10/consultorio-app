import { prisma } from './prisma'

export interface FilaEstadisticaDia {
  fecha: string
  total: number
  atendidos: number
  enEspera: number
  enAtencion: number
  cancelados: number
}

export interface ResumenEstadistico {
  totalInscripciones: number
  atendidos: number
  enEspera: number
  enAtencion: number
  cancelados: number
  activos: number
}

export interface ConclusionesEstadisticas {
  diaMayorActividad: { fecha: string; total: number } | null
  totalAtendidos: number
  porcentajeFinalizacion: number | null
  promedioDiario: number | null
  tasaCancelacion: number | null
  diasConActividad: number
  diasDelPeriodo: number
}

export interface EstadisticasPeriodo {
  periodo: { desde: string; hasta: string; dias: number }
  resumen: ResumenEstadistico
  porDia: FilaEstadisticaDia[]
  conclusiones: ConclusionesEstadisticas
  generadoEn: string
}

interface FilaCruda {
  fecha: string
  total: bigint | number
  atendidos: bigint | number
  enEspera: bigint | number
  enAtencion: bigint | number
  cancelados: bigint | number
}

function aNumero(valor: bigint | number): number {
  return typeof valor === 'bigint' ? Number(valor) : valor
}

function diasEntre(desde: string, hasta: string): number {
  const inicio = new Date(`${desde}T00:00:00.000Z`).getTime()
  const fin = new Date(`${hasta}T00:00:00.000Z`).getTime()
  return Math.floor((fin - inicio) / 86_400_000) + 1
}

function redondear(valor: number, decimales = 1): number {
  const factor = 10 ** decimales
  return Math.round(valor * factor) / factor
}

/**
 * Obtiene estadísticas agregadas directamente de PostgreSQL.
 * No incluye nombres, DNI ni datos clínicos.
 *
 * Los estados históricos se normalizan para los indicadores:
 *   PROGRAMADO/CONFIRMADO -> en espera
 *   AUSENTE -> cancelado
 */
export async function obtenerEstadisticas(
  desde: string,
  hasta: string,
): Promise<EstadisticasPeriodo> {
  const filasCrudas = await prisma.$queryRaw<FilaCruda[]>`
    SELECT
      TO_CHAR("fechaAtencion", 'YYYY-MM-DD') AS "fecha",
      COUNT(*) AS "total",
      COUNT(*) FILTER (WHERE "estado"::text = 'ATENDIDO') AS "atendidos",
      COUNT(*) FILTER (WHERE "estado"::text IN ('EN_ESPERA', 'PROGRAMADO', 'CONFIRMADO')) AS "enEspera",
      COUNT(*) FILTER (WHERE "estado"::text = 'EN_ATENCION') AS "enAtencion",
      COUNT(*) FILTER (WHERE "estado"::text IN ('CANCELADO', 'AUSENTE')) AS "cancelados"
    FROM "turnos"
    WHERE "fechaAtencion" BETWEEN ${desde}::date AND ${hasta}::date
    GROUP BY 1
    ORDER BY 1
  `

  const porDia: FilaEstadisticaDia[] = filasCrudas.map((fila) => ({
    fecha: fila.fecha,
    total: aNumero(fila.total),
    atendidos: aNumero(fila.atendidos),
    enEspera: aNumero(fila.enEspera),
    enAtencion: aNumero(fila.enAtencion),
    cancelados: aNumero(fila.cancelados),
  }))

  const resumen = porDia.reduce<ResumenEstadistico>(
    (acumulado, dia) => ({
      totalInscripciones: acumulado.totalInscripciones + dia.total,
      atendidos: acumulado.atendidos + dia.atendidos,
      enEspera: acumulado.enEspera + dia.enEspera,
      enAtencion: acumulado.enAtencion + dia.enAtencion,
      cancelados: acumulado.cancelados + dia.cancelados,
      activos: acumulado.activos + dia.enEspera + dia.enAtencion,
    }),
    { totalInscripciones: 0, atendidos: 0, enEspera: 0, enAtencion: 0, cancelados: 0, activos: 0 },
  )

  const diasDelPeriodo = diasEntre(desde, hasta)
  const diaMayorActividad = porDia.reduce<FilaEstadisticaDia | null>((mayor, dia) => {
    if (!mayor) return dia
    return dia.total > mayor.total ? dia : mayor
  }, null)

  const conclusiones: ConclusionesEstadisticas = {
    diaMayorActividad: diaMayorActividad
      ? { fecha: diaMayorActividad.fecha, total: diaMayorActividad.total }
      : null,
    totalAtendidos: resumen.atendidos,
    porcentajeFinalizacion:
      resumen.totalInscripciones > 0
        ? redondear((resumen.atendidos / resumen.totalInscripciones) * 100)
        : null,
    promedioDiario:
      resumen.totalInscripciones > 0 ? redondear(resumen.totalInscripciones / diasDelPeriodo) : null,
    tasaCancelacion:
      resumen.totalInscripciones > 0
        ? redondear((resumen.cancelados / resumen.totalInscripciones) * 100)
        : null,
    diasConActividad: porDia.length,
    diasDelPeriodo,
  }

  return {
    periodo: { desde, hasta, dias: diasDelPeriodo },
    resumen,
    porDia,
    conclusiones,
    generadoEn: new Date().toISOString(),
  }
}
