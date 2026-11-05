/**
 * Asigna orden persistente a turnos históricos sin número, respetando los
 * contadores ya existentes y sin modificar pacientes ni datos clínicos.
 * Uso: node scripts/asignar-ordenes-faltantes.mjs
 */
import 'dotenv/config'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { Prisma, PrismaClient } = require('../src/generated/prisma')
const prisma = new PrismaClient()

const diaIso = (fecha) => fecha.toISOString().slice(0, 10)

async function asignar(turno) {
  for (let intento = 0; ; intento++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const actual = await tx.turno.findUnique({
          where: { id: turno.id },
          select: {
            fechaAtencion: true,
            fechaOrdenAtencion: true,
            numeroOrdenDia: true,
          },
        })
        if (!actual) return 'omitido'

        const dia = diaIso(actual.fechaAtencion)
        const ordenAnterior = actual.fechaOrdenAtencion
          ? { fecha: diaIso(actual.fechaOrdenAtencion), numero: actual.numeroOrdenDia }
          : null
        if (ordenAnterior?.fecha === dia && ordenAnterior.numero !== null) return 'ya numerado'

        const [secuencia] = await tx.$queryRaw`
          INSERT INTO "ordenes_atencion_diarias" ("fecha", "ultimoNumero")
          VALUES (${dia}::date, 1)
          ON CONFLICT ("fecha") DO UPDATE
          SET "ultimoNumero" = "ordenes_atencion_diarias"."ultimoNumero" + 1
          RETURNING "ultimoNumero"
        `
        await tx.turno.update({
          where: { id: turno.id },
          data: { fechaOrdenAtencion: new Date(`${dia}T00:00:00.000Z`), numeroOrdenDia: secuencia.ultimoNumero },
        })
        await tx.auditLog.create({
          data: {
            accion: 'ACTUALIZACION',
            entidad: 'Turno',
            registroId: turno.id,
            previo: ordenAnterior,
            nuevo: {
              fechaOrdenAtencion: dia,
              numeroOrdenDia: secuencia.ultimoNumero,
              ajusteAutomaticoNumeracion: true,
            },
          },
        })
        return 'asignado'
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      const codigo = error?.code === 'P2010' ? error?.meta?.code : error?.code
      if (!['P2002', 'P2034', '40001'].includes(codigo) || intento >= 4) throw error
      await new Promise((resolve) => setTimeout(resolve, (intento + 1) * 20))
    }
  }
}

try {
  await prisma.$executeRaw`
    INSERT INTO "ordenes_atencion_diarias" ("fecha", "ultimoNumero")
    SELECT "fechaOrdenAtencion", MAX("numeroOrdenDia")
    FROM "turnos"
    WHERE "fechaOrdenAtencion" IS NOT NULL AND "numeroOrdenDia" IS NOT NULL
    GROUP BY "fechaOrdenAtencion"
    ON CONFLICT ("fecha") DO UPDATE
    SET "ultimoNumero" = GREATEST(
      "ordenes_atencion_diarias"."ultimoNumero",
      EXCLUDED."ultimoNumero"
    )
  `
  const pendientes = await prisma.$queryRaw`
    SELECT "id", "fechaAtencion", "fechaOrdenAtencion", "numeroOrdenDia", "creadoEn"
    FROM "turnos"
    WHERE "fechaOrdenAtencion" IS NULL
      OR "numeroOrdenDia" IS NULL
      OR "fechaOrdenAtencion" <> "fechaAtencion"
    ORDER BY "fechaAtencion", "creadoEn", "id"
  `
  const resultados = { revisados: pendientes.length, asignados: 0, omitidos: 0 }
  for (const turno of pendientes) {
    const resultado = await asignar(turno)
    if (resultado === 'asignado') resultados.asignados++
    else resultados.omitidos++
  }
  console.log(JSON.stringify(resultados, null, 2))
} finally {
  await prisma.$disconnect()
}
