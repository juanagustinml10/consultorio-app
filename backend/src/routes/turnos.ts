import { Router, type NextFunction, type Request, type Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { estadoHaciaFrontend, estadosDbDe, serializarTurno, type EstadoTurnoFrontend } from '../lib/serialize'
import { registrarAccion, registrarAccionEnTransaccion } from '../lib/audit'
import { requireAuth, requireRole, sesionDe } from '../middlewares/auth'
import {
  cambiarEstadoAtencionSchema,
  cancelarInscripcionSchema,
  crearInscripcionSchema,
} from '../validations'

const incluirInscripcion = {
  paciente: { include: { obraSocial: { select: { id: true, nombre: true } } } },
  canceladoPor: { select: { nombre: true, apellido: true } },
} as const

const ESTADOS_VISIBLES: EstadoTurnoFrontend[] = ['EN_ESPERA', 'EN_ATENCION', 'ATENDIDO', 'CANCELADO']

export const turnosRouter = Router()
turnosRouter.use(requireAuth)

function diaDeConsulta(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const dia = valor.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return null
  const fecha = new Date(`${dia}T00:00:00.000Z`)
  return Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== dia ? null : dia
}

function diaLocal(fecha: Date): string {
  const pad = (valor: number) => String(valor).padStart(2, '0')
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`
}

function fechaDb(dia: string): Date {
  return new Date(`${dia}T00:00:00.000Z`)
}

function fechaLegada(dia: string): Date {
  return new Date(`${dia}T00:00:00`)
}

async function conReintentoTransaccional<T>(
  operacion: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let intento = 0; ; intento++) {
    try {
      return await prisma.$transaction(operacion, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        !(
          error.code === 'P2034' ||
          error.code === 'P2002' ||
          (error.code === 'P2010' && error.meta?.code === '40001')
        ) ||
        intento >= 4
      ) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, (intento + 1) * 20))
    }
  }
}

function manejarConflictoTransaccional(error: unknown, res: Response): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
    res.status(409).json({ error: 'La lista cambió mientras se procesaba. Actualizá e intentá nuevamente.' })
    return true
  }
  return false
}

/**
 * Asigna el siguiente número correlativo del día usando un contador atómico.
 * El número nunca se reutiliza, ni siquiera cuando una inscripción se cancela.
 */
async function asignarNumeroAtencion(
  tx: Prisma.TransactionClient,
  turnoId: string,
  diaAtencion: string,
): Promise<number> {
  const fecha = fechaDb(diaAtencion)
  const existente = await tx.turno.findUnique({
    where: { id: turnoId },
    select: { fechaOrdenAtencion: true, numeroOrdenDia: true },
  })
  if (
    existente?.fechaOrdenAtencion?.toISOString().slice(0, 10) === diaAtencion &&
    existente.numeroOrdenDia !== null
  ) {
    return existente.numeroOrdenDia
  }

  const [secuencia] = await tx.$queryRaw<Array<{ ultimoNumero: number }>>`
    INSERT INTO "ordenes_atencion_diarias" ("fecha", "ultimoNumero")
    VALUES (${diaAtencion}::date, 1)
    ON CONFLICT ("fecha") DO UPDATE
    SET "ultimoNumero" = "ordenes_atencion_diarias"."ultimoNumero" + 1
    RETURNING "ultimoNumero"
  `
  const numero = secuencia.ultimoNumero
  await tx.turno.update({
    where: { id: turnoId },
    data: { fechaOrdenAtencion: fecha, numeroOrdenDia: numero },
  })
  return numero
}

/**
 * GET /appointments — inscripciones por fecha o rango.
 * Parámetros: fecha | desde+hasta, estado, pacienteId, incluirCancelados=1, cancelados=1.
 */
turnosRouter.get('/', async (req: Request, res: Response) => {
  const q = req.query
  let desde: string
  let hasta: string
  const fecha = diaDeConsulta(q.fecha)
  if (fecha) {
    desde = hasta = fecha
  } else if (q.hoy === '1' || (!q.desde && !q.hasta)) {
    desde = hasta = diaLocal(new Date())
  } else {
    desde = typeof q.desde === 'string' ? diaDeConsulta(q.desde) ?? '' : '0001-01-01'
    hasta = typeof q.hasta === 'string' ? diaDeConsulta(q.hasta) ?? '' : '9999-12-31'
  }
  if (!desde || !hasta || desde > hasta) {
    res.status(400).json({ error: 'El rango de fechas no es válido.' })
    return
  }

  const estadoSolicitado = typeof q.estado === 'string' ? q.estado.toUpperCase() : undefined
  if (estadoSolicitado && !ESTADOS_VISIBLES.includes(estadoSolicitado as EstadoTurnoFrontend)) {
    res.status(400).json({ error: 'El estado solicitado no es válido.' })
    return
  }

  const soloCancelados = q.cancelados === '1' || q.cancelados === 'true'
  const incluirCancelados = q.incluirCancelados === '1' || q.incluirCancelados === 'true'
  const filtroEstado = estadoSolicitado
    ? { estado: { in: estadosDbDe(estadoSolicitado as EstadoTurnoFrontend) } }
    : soloCancelados
      ? { estado: { in: estadosDbDe('CANCELADO') } }
      : incluirCancelados
        ? {}
        : { estado: { notIn: estadosDbDe('CANCELADO') } }

  const filas = await prisma.turno.findMany({
    where: {
      fechaAtencion: { gte: fechaDb(desde), lte: fechaDb(hasta) },
      ...filtroEstado,
      ...(typeof q.pacienteId === 'string' && q.pacienteId ? { pacienteId: q.pacienteId } : {}),
    },
    orderBy: [{ fechaAtencion: 'asc' }, { numeroOrdenDia: 'asc' }, { creadoEn: 'asc' }],
    include: incluirInscripcion,
  })

  res.json({
    items: filas.map(serializarTurno),
    total: filas.length,
    desde,
    hasta,
  })
})

turnosRouter.get('/:id', async (req: Request, res: Response) => {
  const turno = await prisma.turno.findUnique({
    where: { id: String(req.params.id) },
    include: incluirInscripcion,
  })
  if (!turno) {
    res.status(404).json({ error: 'Inscripción no encontrada' })
    return
  }
  const consulta = await prisma.consultaClinica.findUnique({
    where: { turnoId: turno.id },
    select: {
      id: true, fecha: true, motivoConsulta: true, sintomas: true, evaluacion: true,
      diagnostico: true, tratamiento: true, indicaciones: true, proximoControl: true,
      version: true, esCorreccion: true,
    },
  })
  res.json({ turno: serializarTurno(turno), consulta })
})

/** POST /appointments — inscribe un paciente para una fecha y asigna su número. */
turnosRouter.post('/', requireRole('SECRETARIA'), async (req: Request, res: Response) => {
  const datos = crearInscripcionSchema.parse(req.body)
  const sesion = sesionDe(req)
  const dia = datos.fechaAtencion

  const paciente = await prisma.paciente.findUnique({
    where: { id: datos.pacienteId },
    select: { id: true },
  })
  if (!paciente) {
    res.status(404).json({ error: 'Paciente no encontrado. Registrá primero sus datos.' })
    return
  }

  try {
    const turno = await conReintentoTransaccional(async (tx) => {
      const inscripcionActiva = await tx.turno.findFirst({
        where: {
          pacienteId: datos.pacienteId,
          fechaAtencion: fechaDb(dia),
          estado: { in: ['EN_ESPERA', 'PROGRAMADO', 'CONFIRMADO', 'EN_ATENCION'] },
        },
        select: { id: true, numeroOrdenDia: true },
      })
      if (inscripcionActiva) {
        throw new Error('INSCRIPCION_DUPLICADA')
      }

      const creado = await tx.turno.create({
        data: {
          pacienteId: datos.pacienteId,
          fechaAtencion: fechaDb(dia),
          fechaHora: fechaLegada(dia),
          motivo: datos.motivo?.trim() || null,
          estado: 'EN_ESPERA',
          registradoPorId: sesion.usuarioId,
        },
        include: incluirInscripcion,
      })
      await asignarNumeroAtencion(tx, creado.id, dia)
      return tx.turno.findUniqueOrThrow({ where: { id: creado.id }, include: incluirInscripcion })
    })

    await registrarAccion({
      usuarioId: sesion.usuarioId,
      ip: req.ip,
      accion: 'CREACION',
      entidad: 'Turno',
      registroId: turno.id,
      nuevo: {
        pacienteId: turno.pacienteId,
        fechaAtencion: turno.fechaAtencion,
        numeroOrdenDia: turno.numeroOrdenDia,
        estado: turno.estado,
        registradoPorId: turno.registradoPorId,
      },
    })

    res.status(201).json({ turno: serializarTurno(turno), numeroAsignado: turno.numeroOrdenDia })
  } catch (error) {
    if (error instanceof Error && error.message === 'INSCRIPCION_DUPLICADA') {
      res.status(409).json({ error: 'El paciente ya está inscripto para esa fecha.' })
      return
    }
    if (!manejarConflictoTransaccional(error, res)) throw error
  }
})

/** PATCH /appointments/:id/estado — el médico inicia o finaliza una atención. */
turnosRouter.patch('/:id/estado', requireRole('MEDICO'), async (req: Request, res: Response) => {
  const datos = cambiarEstadoAtencionSchema.parse(req.body)
  const sesion = sesionDe(req)
  const id = String(req.params.id)

  let turno
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "turnos" WHERE "id" = ${id} FOR UPDATE`
      const encontrado = await tx.turno.findUnique({ where: { id }, include: incluirInscripcion })
      if (!encontrado) throw new Error('INSCRIPCION_NO_ENCONTRADA')
      const estadoActual = estadoHaciaFrontend(encontrado.estado)
      const transicionValida =
        (datos.estado === 'EN_ATENCION' && estadoActual === 'EN_ESPERA') ||
        (datos.estado === 'ATENDIDO' && estadoActual === 'EN_ATENCION')
      if (!transicionValida) throw new Error('TRANSICION_INVALIDA')

      if (datos.estado === 'ATENDIDO') {
        const consultaGuardada = await tx.consultaClinica.findUnique({
          where: { turnoId: id }, select: { id: true },
        })
        if (!consultaGuardada) throw new Error('CONSULTA_REQUERIDA')
      }
      const actualizado = await tx.turno.update({
        where: { id },
        data: { estado: datos.estado, ...(datos.estado === 'ATENDIDO' && { horaFin: new Date() }) },
        include: incluirInscripcion,
      })
      await registrarAccionEnTransaccion(tx, {
        usuarioId: sesion.usuarioId,
        ip: req.ip,
        accion: 'ACTUALIZACION',
        entidad: 'Turno',
        registroId: actualizado.id,
        previo: {
          estado: encontrado.estado,
          numeroOrdenDia: encontrado.numeroOrdenDia,
          fechaAtencion: encontrado.fechaAtencion,
        },
        nuevo: {
          estado: actualizado.estado,
          numeroOrdenDia: actualizado.numeroOrdenDia,
          fechaAtencion: actualizado.fechaAtencion,
        },
      })
      return actualizado
    })
    turno = resultado
  } catch (error) {
    if (error instanceof Error && ['INSCRIPCION_NO_ENCONTRADA', 'TRANSICION_INVALIDA', 'CONSULTA_REQUERIDA'].includes(error.message)) {
      res.status(error.message === 'INSCRIPCION_NO_ENCONTRADA' ? 404 : 409).json({
        error: error.message === 'INSCRIPCION_NO_ENCONTRADA' ? 'Inscripción no encontrada' :
          error.message === 'CONSULTA_REQUERIDA' ? 'Registrá y guardá la consulta clínica de esta atención antes de finalizarla.' :
            datos.estado === 'EN_ATENCION' ? 'Solo podés iniciar la atención de un paciente que está en espera.' : 'Solo podés finalizar una atención que está en curso.',
      })
      return
    }
    throw error
  }

  res.json({ turno: serializarTurno(turno) })
})

/** POST /appointments/:id/cancelar — secretaría cancela una inscripción activa. */
turnosRouter.post('/:id/cancelar', requireRole('SECRETARIA'), async (req: Request, res: Response) => {
  const datos = cancelarInscripcionSchema.parse(req.body)
  const sesion = sesionDe(req)
  const id = String(req.params.id)

  const previo = await prisma.turno.findUnique({
    where: { id },
    include: incluirInscripcion,
  })
  if (!previo) {
    res.status(404).json({ error: 'Inscripción no encontrada' })
    return
  }

  const estadoActual = estadoHaciaFrontend(previo.estado)
  if (estadoActual === 'CANCELADO') {
    res.status(409).json({ error: 'La inscripción ya está cancelada.' })
    return
  }
  if (estadoActual === 'ATENDIDO') {
    res.status(409).json({ error: 'No se puede cancelar una atención ya finalizada.' })
    return
  }
  if (estadoActual === 'EN_ATENCION' && datos.confirmarAtencionIniciada !== true) {
    res.status(400).json({
      error: 'Confirmá expresamente la cancelación de la atención que ya está en curso.',
    })
    return
  }

  const turno = await prisma.$transaction(async (tx) => {
    const actualizacion = await tx.turno.updateMany({
      where: { id, estado: previo.estado },
      data: {
        estado: 'CANCELADO',
        motivoCancelacion: datos.motivoCancelacion?.trim() || null,
        canceladoEn: new Date(),
        canceladoPorId: sesion.usuarioId,
      },
    })
    if (actualizacion.count === 0) throw new Error('ESTADO_CAMBIO')
    return tx.turno.findUniqueOrThrow({ where: { id }, include: incluirInscripcion })
  })

  await registrarAccion({
    usuarioId: sesion.usuarioId,
    ip: req.ip,
    accion: 'ACTUALIZACION',
    entidad: 'Turno',
    registroId: turno.id,
    previo: {
      estado: previo.estado,
      numeroOrdenDia: previo.numeroOrdenDia,
      fechaAtencion: previo.fechaAtencion,
    },
    nuevo: {
      estado: turno.estado,
      numeroOrdenDia: turno.numeroOrdenDia,
      fechaAtencion: turno.fechaAtencion,
      motivoCancelacion: turno.motivoCancelacion,
      canceladoEn: turno.canceladoEn,
      canceladoPorId: turno.canceladoPorId,
    },
  })

  res.json({ turno: serializarTurno(turno) })
})

// Manejo explícito para que un cambio de estado concurrente no termine en 500.
turnosRouter.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof Error && error.message === 'ESTADO_CAMBIO') {
    res.status(409).json({ error: 'La inscripción cambió mientras se procesaba. Actualizá e intentá nuevamente.' })
    return
  }
  next(error)
})
