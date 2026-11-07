import { Router, type Request, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { serializarPaciente } from '../lib/serialize'
import { registrarAccion } from '../lib/audit'
import { requireAuth, sesionDe } from '../middlewares/auth'
import { crearPacienteSchema, editarPacienteSchema, paginacionSchema } from '../validations'

// Ambos roles (MEDICO y SECRETARIA) administran pacientes: solo se exige sesión.
export const pacientesRouter = Router()
pacientesRouter.use(requireAuth)

const incluirObraSocial = { obraSocial: { select: { id: true, nombre: true } } } as const

pacientesRouter.get('/', async (req: Request, res: Response) => {
  const { pagina, porPagina } = paginacionSchema.parse(req.query)
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  const filtro = q
    ? {
        OR: [
          { nombre: { contains: q, mode: 'insensitive' as const } },
          { apellido: { contains: q, mode: 'insensitive' as const } },
          { dni: { contains: q } },
        ],
      }
    : {}

  const [total, filas] = await Promise.all([
    prisma.paciente.count({ where: filtro }),
    prisma.paciente.findMany({
      where: filtro,
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      include: incluirObraSocial,
    }),
  ])

  res.json({ items: filas.map(serializarPaciente), total, pagina, porPagina })
})

pacientesRouter.get('/:id', async (req: Request, res: Response) => {
  const paciente = await prisma.paciente.findUnique({
    where: { id: String(req.params.id) },
    include: incluirObraSocial,
  })
  if (!paciente) {
    res.status(404).json({ error: 'Paciente no encontrado' })
    return
  }
  res.json({ paciente: serializarPaciente(paciente) })
})

pacientesRouter.post('/', async (req: Request, res: Response) => {
  const datos = crearPacienteSchema.parse(req.body)
  const sesion = sesionDe(req)

  // Resolver obra social: puede venir como ID, nombre de texto libre, o vacío.
  // Si es un nombre que no existe, se crea la obra social automáticamente.
  let obraSocialIdResuelto: string | undefined = undefined
  if (datos.obraSocialId) {
    const porId = await prisma.obraSocial.findUnique({
      where: { id: datos.obraSocialId },
      select: { id: true },
    })
    if (porId) {
      obraSocialIdResuelto = porId.id
    } else {
      const porNombre = await prisma.obraSocial.findFirst({
        where: { nombre: datos.obraSocialId },
        select: { id: true },
      })
      if (porNombre) {
        obraSocialIdResuelto = porNombre.id
      } else {
        const creada = await prisma.obraSocial.create({
          data: { nombre: datos.obraSocialId },
          select: { id: true },
        })
        obraSocialIdResuelto = creada.id
      }
    }
  }

  try {
    const paciente = await prisma.paciente.create({
      data: {
        ...datos,
        fechaNacimiento: datos.fechaNacimiento
          ? new Date(`${datos.fechaNacimiento}T00:00:00`)
          : undefined,
        obraSocialId: obraSocialIdResuelto,
      },
      include: incluirObraSocial,
    })

    registrarAccion({
      usuarioId: sesion.usuarioId,
      ip: req.ip,
      accion: 'CREACION',
      entidad: 'Paciente',
      registroId: paciente.id,
      nuevo: datoSeguro(paciente),
    })

    res.status(201).json({ paciente: serializarPaciente(paciente) })
  } catch (e) {
    if (esDuplicadoDni(e)) {
      res.status(409).json({ error: 'Ya existe un paciente con ese DNI' })
      return
    }
    throw e
  }
})

pacientesRouter.put('/:id', async (req: Request, res: Response) => {
  const datos = editarPacienteSchema.parse(req.body)
  const sesion = sesionDe(req)
  const id = String(req.params.id)

  const previo = await prisma.paciente.findUnique({ where: { id } })
  if (!previo) {
    res.status(404).json({ error: 'Paciente no encontrado' })
    return
  }

  // Resolver obra social: puede venir como ID, nombre de texto libre, null o undefined.
  let obraSocialIdResuelto: string | null | undefined = undefined
  if (datos.obraSocialId !== undefined) {
    if (!datos.obraSocialId) {
      obraSocialIdResuelto = null
    } else {
      const porId = await prisma.obraSocial.findUnique({
        where: { id: datos.obraSocialId },
        select: { id: true },
      })
      if (porId) {
        obraSocialIdResuelto = porId.id
      } else {
        const porNombre = await prisma.obraSocial.findFirst({
          where: { nombre: datos.obraSocialId },
          select: { id: true },
        })
        if (porNombre) {
          obraSocialIdResuelto = porNombre.id
        } else {
          const creada = await prisma.obraSocial.create({
            data: { nombre: datos.obraSocialId },
            select: { id: true },
          })
          obraSocialIdResuelto = creada.id
        }
      }
    }
  }

  try {
    const paciente = await prisma.paciente.update({
      where: { id },
      data: {
        ...datos,
        ...(datos.fechaNacimiento !== undefined && {
          fechaNacimiento: datos.fechaNacimiento
            ? new Date(`${datos.fechaNacimiento}T00:00:00`)
            : null,
        }),
        ...(obraSocialIdResuelto !== undefined && { obraSocialId: obraSocialIdResuelto }),
      },
      include: incluirObraSocial,
    })

    registrarAccion({
      usuarioId: sesion.usuarioId,
      ip: req.ip,
      accion: 'ACTUALIZACION',
      entidad: 'Paciente',
      registroId: paciente.id,
      previo: datoSeguro(previo),
      nuevo: datoSeguro(paciente),
    })

    res.json({ paciente: serializarPaciente(paciente) })
  } catch (e) {
    if (esDuplicadoDni(e)) {
      res.status(409).json({ error: 'Ya existe un paciente con ese DNI' })
      return
    }
    throw e
  }
})

function esDuplicadoDni(e: unknown): boolean {
  return (
    typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === 'P2002'
  )
}

/** Copia segura para la auditoría: solo campos clínicamente/administrativamente relevantes. */
function datoSeguro(p: unknown): object {
  const d = p as Record<string, unknown>
  return {
    nombre: d.nombre,
    apellido: d.apellido,
    dni: d.dni,
    telefono: d.telefono,
    email: d.email,
    direccion: d.direccion,
    obraSocialId: d.obraSocialId,
    numeroAfiliado: d.numeroAfiliado,
    notas: d.notas,
    fechaNacimiento: d.fechaNacimiento,
    sexo: d.sexo,
  }
}
