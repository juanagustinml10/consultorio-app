-- Almacena únicamente un HMAC del identificador IP + correo normalizado.
-- El límite se aplica mediante UPSERT condicional, sin depender de memoria local.
CREATE TABLE "intentos_limite_login" (
    "keyHash" VARCHAR(64) NOT NULL,
    "windowStartedAt" TIMESTAMPTZ(6) NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "activeAttempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intentos_limite_login_pkey" PRIMARY KEY ("keyHash"),
    CONSTRAINT "intentos_limite_login_failures_check" CHECK ("failures" BETWEEN 0 AND 5),
    CONSTRAINT "intentos_limite_login_active_check" CHECK ("activeAttempts" BETWEEN 0 AND 5),
    CONSTRAINT "intentos_limite_login_total_check" CHECK ("failures" + "activeAttempts" <= 5)
);

CREATE INDEX "intentos_limite_login_windowStartedAt_idx"
    ON "intentos_limite_login"("windowStartedAt");
