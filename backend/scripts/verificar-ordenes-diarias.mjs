/**
 * Verificación de solo lectura para el backfill y la secuencia diaria.
 * Uso: node scripts/verificar-ordenes-diarias.mjs
 */
import 'dotenv/config'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../src/generated/prisma')
const prisma = new PrismaClient()

try {
  const [faltantes, contadoresAtrasados, resumen] = await Promise.all([
    prisma.turno.count({
      where: { OR: [{ fechaOrdenAtencion: null }, { numeroOrdenDia: null }] },
    }),
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM (
        SELECT t."fechaOrdenAtencion"
        FROM "turnos" t
        LEFT JOIN "ordenes_atencion_diarias" o ON o."fecha" = t."fechaOrdenAtencion"
        WHERE t."fechaOrdenAtencion" IS NOT NULL AND t."numeroOrdenDia" IS NOT NULL
        GROUP BY t."fechaOrdenAtencion", o."ultimoNumero"
        HAVING COALESCE(o."ultimoNumero", 0) < MAX(t."numeroOrdenDia")
      ) AS atrasados
    `,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS turnos,
        COUNT(*) FILTER (WHERE "fechaOrdenAtencion" IS NOT NULL AND "numeroOrdenDia" IS NOT NULL)::int AS con_orden,
        COUNT(*) FILTER (WHERE "fechaOrdenAtencion" IS NULL OR "numeroOrdenDia" IS NULL)::int AS sin_orden,
        COUNT(*) FILTER (WHERE "fechaOrdenAtencion" <> "fechaAtencion")::int AS fecha_desalineada
      FROM "turnos"
    `,
  ])
  const desalineados = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS total
    FROM "turnos"
    WHERE "numeroOrdenDia" IS NOT NULL AND "fechaOrdenAtencion" <> "fechaAtencion"
  `

  console.log(JSON.stringify({
    resumen: resumen[0],
    faltantes,
    fechasDesalineadas: desalineados[0].total,
    contadoresAtrasados: contadoresAtrasados[0].total,
  }, null, 2))
  if (faltantes || desalineados[0].total || contadoresAtrasados[0].total) process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
