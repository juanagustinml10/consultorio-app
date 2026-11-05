ALTER TABLE "turnos"
ADD COLUMN "fechaOrdenAtencion" DATE,
ADD COLUMN "numeroOrdenDia" INTEGER;

WITH "ordenes_existentes" AS (
    SELECT
        "id",
        "horaLlegada"::date AS "fecha",
        ROW_NUMBER() OVER (
            PARTITION BY "horaLlegada"::date
            ORDER BY "horaLlegada", "creadoEn", "id"
        )::INTEGER AS "numero"
    FROM "turnos"
    WHERE "horaLlegada" IS NOT NULL
)
UPDATE "turnos" AS t
SET
    "fechaOrdenAtencion" = o."fecha",
    "numeroOrdenDia" = o."numero"
FROM "ordenes_existentes" AS o
WHERE t."id" = o."id";

CREATE UNIQUE INDEX "turnos_fechaOrdenAtencion_numeroOrdenDia_key"
ON "turnos"("fechaOrdenAtencion", "numeroOrdenDia");

CREATE TABLE "ordenes_atencion_diarias" (
    "fecha" DATE NOT NULL,
    "ultimoNumero" INTEGER NOT NULL,

    CONSTRAINT "ordenes_atencion_diarias_pkey" PRIMARY KEY ("fecha"),
    CONSTRAINT "ordenes_atencion_diarias_ultimoNumero_check" CHECK ("ultimoNumero" > 0)
);

INSERT INTO "ordenes_atencion_diarias" ("fecha", "ultimoNumero")
SELECT "fechaOrdenAtencion", MAX("numeroOrdenDia")
FROM "turnos"
WHERE "fechaOrdenAtencion" IS NOT NULL
GROUP BY "fechaOrdenAtencion";
