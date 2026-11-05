ALTER TABLE "turnos"
ADD COLUMN "fechaAtencion" DATE;

UPDATE "turnos"
SET "fechaAtencion" = "fechaHora"::date
WHERE "fechaAtencion" IS NULL;

ALTER TABLE "turnos"
ALTER COLUMN "fechaAtencion" SET NOT NULL;

CREATE INDEX "turnos_fechaAtencion_idx"
ON "turnos"("fechaAtencion");
