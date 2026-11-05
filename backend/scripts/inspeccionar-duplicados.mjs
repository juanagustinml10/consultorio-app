import 'dotenv/config'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../src/generated/prisma')
const prisma = new PrismaClient()

try {
  const duplicados = await prisma.$queryRaw`
    SELECT "pacienteId", "fechaAtencion", COUNT(*)::int AS total
    FROM "turnos"
    WHERE "estado"::text IN ('PROGRAMADO', 'CONFIRMADO', 'EN_ESPERA', 'EN_ATENCION')
    GROUP BY "pacienteId", "fechaAtencion"
    HAVING COUNT(*) > 1
  `
  const estados = await prisma.$queryRaw`
    SELECT "estado"::text AS estado, COUNT(*)::int AS total
    FROM "turnos" GROUP BY "estado" ORDER BY "estado"
  `
  console.log(JSON.stringify({ duplicados, estados }, null, 2))
} finally {
  await prisma.$disconnect()
}
