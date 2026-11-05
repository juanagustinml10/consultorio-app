-- Inscripción diaria: datos de cancelación explícitos y auditoría de informes.
-- Migración aditiva: no elimina registros ni columnas históricas.

ALTER TYPE "AccionAuditoria" ADD VALUE IF NOT EXISTS 'EXPORTACION';

ALTER TABLE "turnos"
ADD COLUMN "motivoCancelacion" TEXT,
ADD COLUMN "canceladoEn" TIMESTAMP(3),
ADD COLUMN "canceladoPorId" TEXT;

ALTER TABLE "turnos" ALTER COLUMN "estado" SET DEFAULT 'EN_ESPERA';

CREATE INDEX "turnos_fechaAtencion_estado_idx"
ON "turnos"("fechaAtencion", "estado");

ALTER TABLE "turnos"
ADD CONSTRAINT "turnos_canceladoPorId_fkey"
FOREIGN KEY ("canceladoPorId") REFERENCES "usuarios"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
