-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('MEDICO', 'SECRETARIA');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('PROGRAMADO', 'CONFIRMADO', 'EN_ESPERA', 'EN_ATENCION', 'ATENDIDO', 'AUSENTE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'OBRA_SOCIAL', 'PARTICULAR');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'CUBIERTO', 'ANULADO');

-- CreateEnum
CREATE TYPE "EstadoAviso" AS ENUM ('VIGENTE', 'VENCIDO');

-- CreateEnum
CREATE TYPE "AccionAuditoria" AS ENUM ('CREACION', 'ACTUALIZACION', 'LOGIN', 'LOGOUT');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contrasenaHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras_sociales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obras_sociales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "sexo" "Sexo",
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "obraSocialId" TEXT,
    "numeroAfiliado" TEXT,
    "notas" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historias_clinicas" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "antecedentesPersonales" TEXT,
    "antecedentesFamiliares" TEXT,
    "alergias" TEXT,
    "medicacionHabitual" TEXT,
    "observaciones" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historias_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_clinicas" (
    "id" TEXT NOT NULL,
    "historiaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivoConsulta" TEXT,
    "sintomas" TEXT,
    "evaluacion" TEXT,
    "diagnostico" TEXT,
    "tratamiento" TEXT,
    "indicaciones" TEXT,
    "proximoControl" TIMESTAMP(3),
    "registradoPorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "esCorreccion" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultas_clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_clinicas_versiones" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "datos" JSONB NOT NULL,
    "capturadoPorId" TEXT,
    "capturadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_clinicas_versiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "horaFin" TIMESTAMP(3),
    "duracionMin" INTEGER NOT NULL DEFAULT 30,
    "motivo" TEXT,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'PROGRAMADO',
    "horaLlegada" TIMESTAMP(3),
    "notas" TEXT,
    "registradoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "turnoId" TEXT,
    "consultaClinicaId" TEXT,
    "importe" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "registradoPorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" "AccionAuditoria" NOT NULL,
    "entidad" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "previo" JSONB,
    "nuevo" JSONB,
    "ip" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avisos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoAviso" NOT NULL DEFAULT 'VIGENTE',
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contenido_sitio" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,

    CONSTRAINT "contenido_sitio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sesiones_tokenHash_key" ON "sesiones"("tokenHash");

-- CreateIndex
CREATE INDEX "sesiones_usuarioId_idx" ON "sesiones"("usuarioId");

-- CreateIndex
CREATE INDEX "sesiones_expiraEn_idx" ON "sesiones"("expiraEn");

-- CreateIndex
CREATE UNIQUE INDEX "obras_sociales_nombre_key" ON "obras_sociales"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_dni_key" ON "pacientes"("dni");

-- CreateIndex
CREATE INDEX "pacientes_nombre_apellido_idx" ON "pacientes"("nombre", "apellido");

-- CreateIndex
CREATE UNIQUE INDEX "historias_clinicas_pacienteId_key" ON "historias_clinicas"("pacienteId");

-- CreateIndex
CREATE INDEX "consultas_clinicas_historiaId_fecha_idx" ON "consultas_clinicas"("historiaId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "consultas_clinicas_versiones_consultaId_version_key" ON "consultas_clinicas_versiones"("consultaId", "version");

-- CreateIndex
CREATE INDEX "turnos_fechaHora_idx" ON "turnos"("fechaHora");

-- CreateIndex
CREATE INDEX "turnos_pacienteId_idx" ON "turnos"("pacienteId");

-- CreateIndex
CREATE INDEX "turnos_estado_idx" ON "turnos"("estado");

-- CreateIndex
CREATE INDEX "pagos_pacienteId_idx" ON "pagos"("pacienteId");

-- CreateIndex
CREATE INDEX "pagos_turnoId_idx" ON "pagos"("turnoId");

-- CreateIndex
CREATE INDEX "auditoria_entidad_registroId_idx" ON "auditoria"("entidad", "registroId");

-- CreateIndex
CREATE INDEX "auditoria_usuarioId_idx" ON "auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "auditoria_creadoEn_idx" ON "auditoria"("creadoEn");

-- CreateIndex
CREATE UNIQUE INDEX "contenido_sitio_clave_key" ON "contenido_sitio"("clave");

-- AddForeignKey
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_obraSocialId_fkey" FOREIGN KEY ("obraSocialId") REFERENCES "obras_sociales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historias_clinicas" ADD CONSTRAINT "historias_clinicas_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_clinicas" ADD CONSTRAINT "consultas_clinicas_historiaId_fkey" FOREIGN KEY ("historiaId") REFERENCES "historias_clinicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_clinicas" ADD CONSTRAINT "consultas_clinicas_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_clinicas_versiones" ADD CONSTRAINT "consultas_clinicas_versiones_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas_clinicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_clinicas_versiones" ADD CONSTRAINT "consultas_clinicas_versiones_capturadoPorId_fkey" FOREIGN KEY ("capturadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_consultaClinicaId_fkey" FOREIGN KEY ("consultaClinicaId") REFERENCES "consultas_clinicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
