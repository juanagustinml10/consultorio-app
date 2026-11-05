-- Additive relation between a clinical consultation and the daily attendance.
-- Existing consultations remain unlinked; no clinical record is rewritten.
ALTER TABLE "consultas_clinicas"
ADD COLUMN "turnoId" TEXT;

CREATE UNIQUE INDEX "consultas_clinicas_turnoId_key"
ON "consultas_clinicas"("turnoId");

ALTER TABLE "consultas_clinicas"
ADD CONSTRAINT "consultas_clinicas_turnoId_fkey"
FOREIGN KEY ("turnoId") REFERENCES "turnos"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
