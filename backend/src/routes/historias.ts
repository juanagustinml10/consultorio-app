import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { parsearIsoLocal, serializarPaciente } from '../lib/serialize'
import { registrarAccionEnTransaccion } from '../lib/audit'
import { requireAuth, sesionDe } from '../middlewares/auth'
import { crearConsultaSchema, editarConsultaSchema, editarEncabezadoSchema } from '../validations'

/**
 * Historias clínicas. Ambos roles (MEDICO y SECRETARIA) tienen permiso de
 * lectura y modificación clínica según lo acordado; las protecciones son las
 * siguientes:
 *   - toda modificación se registra con usuario y fecha (auditoría);
 *   - cada PUT conserva la versión anterior en consultas_clinicas_versiones;
 *   - no existen endpoints DELETE para registros clínicos;
 *   - las correcciones se identifican con el flag esCorreccion.
 */
export const historiasRouter = Router()
historiasRouter.use(requireAuth)

async function historiaActualizada(pacienteId: string) {
  return prisma.historiaClinica.upsert({
    where: { pacienteId },
    update: {},
    create: { pacienteId },
    include: {
      consultas: {
        orderBy: { fecha: 'desc' },
        include: {
          registradoPor: { select: { nombre: true, apellido: true, rol: true } },
          versiones: {
            orderBy: { version: 'desc' },
            select: {
              id: true,
              version: true,
              datos: true,
              capturadoEn: true,
              capturadoPor: { select: { nombre: true, apellido: true, rol: true } },
            },
          },
        },
      },
    },
  })
}

/** GET /medical-records/:patientId — historia completa + consultas cronológicas. */
historiasRouter.get('/:patientId', async (req: Request, res: Response) => {
  const pacienteId = String(req.params.patientId)

  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    include: { obraSocial: { select: { id: true, nombre: true } } },
  })
  if (!paciente) {
    res.status(404).json({ error: 'Paciente no encontrado' })
    return
  }

  const historia = await historiaActualizada(pacienteId)

  res.json({
    paciente: serializarPaciente(paciente),
    historia: {
      ...historia,
      consultas: historia.consultas.map((c) => ({
        id: c.id,
        fecha: c.fecha,
        motivoConsulta: c.motivoConsulta,
        sintomas: c.sintomas,
        evaluacion: c.evaluacion,
        diagnostico: c.diagnostico,
        tratamiento: c.tratamiento,
        indicaciones: c.indicaciones,
        proximoControl: c.proximoControl,
        version: c.version,
        esCorreccion: c.esCorreccion,
        registradoPor: c.registradoPor ? `${c.registradoPor.nombre} ${c.registradoPor.apellido}` : null,
        versiones: c.versiones.map((v) => ({
          id: v.id,
          version: v.version,
          datos: v.datos,
          capturadoEn: v.capturadoEn,
          capturadoPor: v.capturadoPor ? `${v.capturadoPor.nombre} ${v.capturadoPor.apellido}` : null,
        })),
      })),
    },
  })
})

/** PUT /medical-records/:patientId — actualiza antecedentes, alergias, medicación y observaciones clínicas. */
historiasRouter.put('/:patientId', async (req: Request, res: Response) => {
  const datos = editarEncabezadoSchema.parse(req.body)
  const sesion = sesionDe(req)
  const pacienteId = String(req.params.patientId)

  const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true } })
  if (!paciente) {
    res.status(404).json({ error: 'Paciente no encontrado' })
    return
  }

  const historia = await prisma.$transaction(async (tx) => {
    const previa = await tx.historiaClinica.findUnique({ where: { pacienteId } })
    const actualizada = await tx.historiaClinica.upsert({
      where: { pacienteId },
      update: {
        ...(datos.antecedentesPersonales !== undefined && { antecedentesPersonales: datos.antecedentesPersonales }),
        ...(datos.antecedentesFamiliares !== undefined && { antecedentesFamiliares: datos.antecedentesFamiliares }),
        ...(datos.alergias !== undefined && { alergias: datos.alergias }),
        ...(datos.medicacionHabitual !== undefined && { medicacionHabitual: datos.medicacionHabitual }),
        ...(datos.observaciones !== undefined && { observaciones: datos.observaciones }),
        version: { increment: 1 },
      },
      create: {
        pacienteId,
        antecedentesPersonales: datos.antecedentesPersonales ?? null,
        antecedentesFamiliares: datos.antecedentesFamiliares ?? null,
        alergias: datos.alergias ?? null,
        medicacionHabitual: datos.medicacionHabitual ?? null,
        observaciones: datos.observaciones ?? null,
        version: 1,
      },
    })

    const campos = [
      'antecedentesPersonales',
      'antecedentesFamiliares',
      'alergias',
      'medicacionHabitual',
      'observaciones',
    ] as const
    const cambios = campos.flatMap((campo) => {
      const nuevo = datos[campo]
      if (nuevo === undefined) return []
      const anterior = previa?.[campo] ?? null
      const valorNuevo = nuevo ?? null
      return anterior === valorNuevo ? [] : [{ campo, anterior, nuevo: valorNuevo }]
    })

    await registrarAccionEnTransaccion(tx, {
      usuarioId: sesion.usuarioId,
      ip: req.ip,
      accion: 'ACTUALIZACION',
      entidad: 'HistoriaClinica',
      registroId: actualizada.id,
      previo: previa,
      nuevo: { ...actualizada, cambios },
    })
    return actualizada
  })

  res.json({ historia })
})

/** POST /medical-records/:patientId/consultations — nueva consulta independiente. */
historiasRouter.post('/:patientId/consultations', async (req: Request, res: Response) => {
  const datos = crearConsultaSchema.parse(req.body)
  const sesion = sesionDe(req)
  const pacienteId = String(req.params.patientId)

  const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true } })
  if (!paciente) {
    res.status(404).json({ error: 'Paciente no encontrado' })
    return
  }

  let consulta
  try {
    consulta = await prisma.$transaction(async (tx) => {
      if (datos.turnoId) {
        const bloqueados = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "turnos" WHERE "id" = ${datos.turnoId} FOR UPDATE
        `
        const turno = bloqueados.length
          ? await tx.turno.findUnique({ where: { id: datos.turnoId } })
          : null
        if (!turno || turno.pacienteId !== pacienteId) throw new Error('ATENCION_NO_ENCONTRADA')
        if (turno.estado !== 'EN_ATENCION') throw new Error('ATENCION_NO_ACTIVA')
        const diaConsulta = datos.fecha ? datos.fecha.slice(0, 10) : new Date().toLocaleDateString('en-CA')
        if (diaConsulta !== turno.fechaAtencion.toISOString().slice(0, 10)) throw new Error('FECHA_ATENCION_INVALIDA')
      }

      const historia = await tx.historiaClinica.upsert({
        where: { pacienteId }, update: {}, create: { pacienteId },
      })
      const creada = await tx.consultaClinica.create({
        data: {
          historiaId: historia.id,
          turnoId: datos.turnoId,
          fecha: datos.fecha ? parsearIsoLocal(datos.fecha) : new Date(),
          motivoConsulta: datos.motivoConsulta ?? undefined,
          sintomas: datos.sintomas,
          evaluacion: datos.evaluacion,
          diagnostico: datos.diagnostico,
          tratamiento: datos.tratamiento,
          indicaciones: datos.indicaciones,
          proximoControl: datos.proximoControl ? parsearIsoLocal(datos.proximoControl) : null,
          registradoPorId: sesion.usuarioId,
        },
        include: { registradoPor: { select: { nombre: true, apellido: true } } },
      })
      await registrarAccionEnTransaccion(tx, {
        usuarioId: sesion.usuarioId, ip: req.ip, accion: 'CREACION',
        entidad: 'ConsultaClinica', registroId: creada.id, nuevo: creada,
      })
      return creada
    })
  } catch (error) {
    if (error instanceof Error && ['ATENCION_NO_ENCONTRADA', 'ATENCION_NO_ACTIVA', 'FECHA_ATENCION_INVALIDA'].includes(error.message)) {
      res.status(error.message === 'ATENCION_NO_ENCONTRADA' ? 404 : 409).json({
        error: error.message === 'ATENCION_NO_ENCONTRADA' ? 'Atención no encontrada para este paciente.' :
          error.message === 'ATENCION_NO_ACTIVA' ? 'La atención ya no está en curso.' : 'La consulta debe corresponder a la fecha de atención.',
      })
      return
    }
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === 'P2002') {
      res.status(409).json({ error: 'Ya existe una consulta guardada para esta atención.' })
      return
    }
    throw error
  }

  res.status(201).json({
    consulta: {
      ...consulta,
      registradoPor: consulta.registradoPor ? `${consulta.registradoPor.nombre} ${consulta.registradoPor.apellido}` : null,
      versiones: [],
    },
  })
})

/** PUT /medical-records/consultations/:id — corrige una consulta conservando la versión previa. */
historiasRouter.put('/consultations/:id', async (req: Request, res: Response) => {
  const datos = editarConsultaSchema.parse(req.body)
  const sesion = sesionDe(req)
  const id = String(req.params.id)

  const previa = await prisma.consultaClinica.findUnique({
    where: { id },
    include: { registradoPor: { select: { nombre: true, apellido: true } } },
  })
  if (!previa) {
    res.status(404).json({ error: 'Consulta no encontrada' })
    return
  }

  if (previa.turnoId && datos.fecha !== undefined) {
    const atencion = await prisma.turno.findUnique({ where: { id: previa.turnoId }, select: { fechaAtencion: true } })
    if (atencion && datos.fecha.slice(0, 10) !== atencion.fechaAtencion.toISOString().slice(0, 10)) {
      res.status(409).json({ error: 'La fecha de una consulta vinculada debe coincidir con su fecha de atención.' })
      return
    }
  }

  const valoresAnteriores = {
    fecha: previa.fecha.toISOString(),
    motivoConsulta: previa.motivoConsulta,
    sintomas: previa.sintomas,
    evaluacion: previa.evaluacion,
    diagnostico: previa.diagnostico,
    tratamiento: previa.tratamiento,
    indicaciones: previa.indicaciones,
    proximoControl: previa.proximoControl?.toISOString() ?? null,
  }
  const valoresNuevos = {
    ...valoresAnteriores,
    ...(datos.fecha !== undefined && { fecha: parsearIsoLocal(datos.fecha).toISOString() }),
    ...(datos.motivoConsulta !== undefined && { motivoConsulta: datos.motivoConsulta ?? null }),
    ...(datos.sintomas !== undefined && { sintomas: datos.sintomas ?? null }),
    ...(datos.evaluacion !== undefined && { evaluacion: datos.evaluacion ?? null }),
    ...(datos.diagnostico !== undefined && { diagnostico: datos.diagnostico ?? null }),
    ...(datos.tratamiento !== undefined && { tratamiento: datos.tratamiento ?? null }),
    ...(datos.indicaciones !== undefined && { indicaciones: datos.indicaciones ?? null }),
    ...(datos.proximoControl !== undefined && {
      proximoControl: datos.proximoControl
        ? parsearIsoLocal(datos.proximoControl).toISOString()
        : null,
    }),
  }
  const etiquetasCampos: Record<keyof typeof valoresAnteriores, string> = {
    fecha: 'Fecha y hora',
    motivoConsulta: 'Motivo de consulta',
    sintomas: 'Síntomas',
    evaluacion: 'Evolución',
    diagnostico: 'Diagnóstico',
    tratamiento: 'Tratamiento',
    indicaciones: 'Indicaciones y observaciones',
    proximoControl: 'Próximo control',
  }
  const cambios = (Object.keys(etiquetasCampos) as Array<keyof typeof valoresAnteriores>)
    .filter((campo) => campo in datos && valoresAnteriores[campo] !== valoresNuevos[campo])
    .map((campo) => ({
      campo,
      etiqueta: etiquetasCampos[campo],
      anterior: valoresAnteriores[campo],
      nuevo: valoresNuevos[campo],
    }))

  const consulta = await prisma.$transaction(async (tx) => {
    // Conservar la versión anterior (nunca se pierde información previa)
    await tx.consultaClinicaVersion.create({
      data: {
        consultaId: previa.id,
        version: previa.version,
        datos: {
          ...valoresAnteriores,
          version: previa.version,
          esCorreccion: previa.esCorreccion,
          creadoEn: previa.creadoEn,
          actualizadoEn: previa.actualizadoEn,
          registradoPor: previa.registradoPor ? `${previa.registradoPor.nombre} ${previa.registradoPor.apellido}` : null,
          cambios,
        } as object,
        capturadoPorId: sesion.usuarioId,
      },
    })

    const actualizada = await tx.consultaClinica.update({
      where: { id: previa.id },
      data: {
        ...(datos.fecha !== undefined && { fecha: datos.fecha ? parsearIsoLocal(datos.fecha) : undefined }),
        ...(datos.motivoConsulta !== undefined && { motivoConsulta: datos.motivoConsulta ?? null }),
        ...(datos.sintomas !== undefined && { sintomas: datos.sintomas }),
        ...(datos.evaluacion !== undefined && { evaluacion: datos.evaluacion }),
        ...(datos.diagnostico !== undefined && { diagnostico: datos.diagnostico }),
        ...(datos.tratamiento !== undefined && { tratamiento: datos.tratamiento }),
        ...(datos.indicaciones !== undefined && { indicaciones: datos.indicaciones }),
        ...(datos.proximoControl !== undefined && {
          proximoControl: datos.proximoControl ? parsearIsoLocal(datos.proximoControl) : null,
        }),
        version: previa.version + 1,
        esCorreccion: true,
      },
      include: {
        registradoPor: { select: { nombre: true, apellido: true } },
        versiones: {
          orderBy: { version: 'desc' },
          select: {
            id: true,
            version: true,
            datos: true,
            capturadoEn: true,
            capturadoPor: { select: { nombre: true, apellido: true, rol: true } },
          },
        },
      },
    })
    await registrarAccionEnTransaccion(tx, {
      usuarioId: sesion.usuarioId, ip: req.ip, accion: 'ACTUALIZACION',
      entidad: 'ConsultaClinica', registroId: actualizada.id, previo: previa,
      nuevo: { ...actualizada, detalle: `versión ${previa.version} → ${actualizada.version}`, cambios },
    })
    return actualizada
  })

  res.json({
    consulta: {
      ...consulta,
      registradoPor: consulta.registradoPor ? `${consulta.registradoPor.nombre} ${consulta.registradoPor.apellido}` : null,
      versiones: consulta.versiones.map((v) => ({
        id: v.id,
        version: v.version,
        datos: v.datos,
        capturadoEn: v.capturadoEn,
        capturadoPor: v.capturadoPor ? `${v.capturadoPor.nombre} ${v.capturadoPor.apellido}` : null,
      })),
    },
    versionAnterior: previa.version,
  })
})
