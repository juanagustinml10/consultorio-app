import { Router, type Request, type Response } from 'express'
import { requireAuth, sesionDe } from '../middlewares/auth'
import { estadisticasQuerySchema } from '../validations'
import { obtenerEstadisticas } from '../lib/estadisticas'
import { generarInformePdf } from '../lib/informePdf'
import { registrarAccion } from '../lib/audit'

export const estadisticasRouter = Router()
estadisticasRouter.use(requireAuth)

function diaLocal(fecha: Date): string {
  const pad = (valor: number) => String(valor).padStart(2, '0')
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`
}

function sumarDias(dia: string, cantidad: number): string {
  const fecha = new Date(`${dia}T00:00:00.000Z`)
  fecha.setUTCDate(fecha.getUTCDate() + cantidad)
  return fecha.toISOString().slice(0, 10)
}

function diasEntre(desde: string, hasta: string): number {
  const inicio = new Date(`${desde}T00:00:00.000Z`).getTime()
  const fin = new Date(`${hasta}T00:00:00.000Z`).getTime()
  return Math.floor((fin - inicio) / 86_400_000) + 1
}

function resolverPeriodo(req: Request): { desde: string; hasta: string } | { error: string } {
  const consulta = estadisticasQuerySchema.parse(req.query)
  let { desde, hasta } = consulta

  if (!desde && !hasta) {
    hasta = diaLocal(new Date())
    desde = sumarDias(hasta, -6)
  }

  if (!desde || !hasta) {
    return { error: 'Indicá la fecha de inicio y la fecha de fin del período.' }
  }
  if (desde > hasta) {
    return { error: 'La fecha de inicio no puede ser posterior a la fecha de fin.' }
  }

  const dias = diasEntre(desde, hasta)
  if (dias > 366) {
    return { error: 'El período no puede superar los 366 días.' }
  }

  return { desde, hasta }
}

/** GET /estadisticas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD */
estadisticasRouter.get('/', async (req: Request, res: Response) => {
  const periodo = resolverPeriodo(req)
  if ('error' in periodo) {
    res.status(400).json({ error: periodo.error })
    return
  }

  const datos = await obtenerEstadisticas(periodo.desde, periodo.hasta)
  res.json(datos)
})

/** GET /estadisticas/informe.pdf?desde=...&hasta=... */
estadisticasRouter.get('/informe.pdf', async (req: Request, res: Response) => {
  const periodo = resolverPeriodo(req)
  if ('error' in periodo) {
    res.status(400).json({ error: periodo.error })
    return
  }

  const datos = await obtenerEstadisticas(periodo.desde, periodo.hasta)
  const pdf = await generarInformePdf(datos)
  const sesion = sesionDe(req)

  await registrarAccion({
    usuarioId: sesion.usuarioId,
    ip: req.ip,
    accion: 'EXPORTACION',
    entidad: 'InformeEstadistico',
    registroId: `${periodo.desde}_${periodo.hasta}`,
    nuevo: {
      desde: periodo.desde,
      hasta: periodo.hasta,
      resumen: datos.resumen,
      generadoEn: datos.generadoEn,
    },
  })

  const nombre =
    periodo.desde === periodo.hasta
      ? `informe-atencion-${periodo.desde}.pdf`
      : `informe-atencion-${periodo.desde}_a_${periodo.hasta}.pdf`

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`)
  res.setHeader('Content-Length', String(pdf.length))
  res.setHeader('Cache-Control', 'no-store')
  res.send(pdf)
})
