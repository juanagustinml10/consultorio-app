import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import {
  descargarInformeEstadistico,
  getEstadisticas,
  type EstadisticasApi,
  type EstadisticasDiaApi,
} from '@/lib/api'
import { mensajeDeError } from '@/pages/pacientes/errores'
import { useAuth } from '@/lib/auth'

type Preset = 'hoy' | 'semana' | 'mes' | 'treinta' | 'personalizado'

interface Rango {
  desde: string
  hasta: string
}

const PRESETS: Array<{ id: Preset; etiqueta: string }> = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: 'semana', etiqueta: 'Últimos 7 días' },
  { id: 'treinta', etiqueta: 'Últimos 30 días' },
  { id: 'mes', etiqueta: 'Este mes' },
  { id: 'personalizado', etiqueta: 'Personalizado' },
]

function aIso(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

function hoyLocal(): string {
  return aIso(new Date())
}

function sumarDias(fecha: string, cantidad: number): string {
  const d = new Date(`${fecha}T12:00:00`)
  d.setDate(d.getDate() + cantidad)
  return aIso(d)
}

function rangoDePreset(preset: Preset): Rango {
  const hoy = hoyLocal()
  switch (preset) {
    case 'hoy':
      return { desde: hoy, hasta: hoy }
    case 'semana':
      return { desde: sumarDias(hoy, -6), hasta: hoy }
    case 'treinta':
      return { desde: sumarDias(hoy, -29), hasta: hoy }
    case 'mes':
      return { desde: `${hoy.slice(0, 8)}01`, hasta: hoy }
    default:
      return { desde: sumarDias(hoy, -6), hasta: hoy }
  }
}

function fechaLinda(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function fechaCorta(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  })
}

function numero(valor: number): string {
  return valor.toLocaleString('es-AR')
}

function porcentaje(valor: number | null): string {
  if (valor === null) return '—'
  return `${valor.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`
}

function diasEntre(desde: string, hasta: string): number {
  const inicio = new Date(`${desde}T00:00:00`).getTime()
  const fin = new Date(`${hasta}T00:00:00`).getTime()
  return Math.floor((fin - inicio) / 86_400_000) + 1
}

const DIA_VACIO = (fecha: string): EstadisticasDiaApi => ({
  fecha,
  total: 0,
  atendidos: 0,
  enEspera: 0,
  enAtencion: 0,
  cancelados: 0,
})

export default function EstadisticasPage() {
  const { usuario } = useAuth()
  const rol = usuario?.rol === 'MEDICO' ? 'MEDICO' : 'SECRETARIA'

  const [preset, setPreset] = useState<Preset>('semana')
  const [rango, setRango] = useState<Rango>(() => rangoDePreset('semana'))
  const [borrador, setBorrador] = useState<Rango>(() => rangoDePreset('semana'))
  const [datos, setDatos] = useState<EstadisticasApi | null>(null)
  const [cargando, setCargando] = useState(true)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorPdf, setErrorPdf] = useState<string | null>(null)
  const [refresco, setRefresco] = useState(0)

  const cargar = useCallback(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    getEstadisticas(rango.desde, rango.hasta)
      .then((data) => {
        if (!cancelado) setDatos(data)
      })
      .catch((e) => {
        if (!cancelado) setError(mensajeDeError(e, 'No se pudieron obtener las estadísticas.'))
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [rango.desde, rango.hasta, refresco])

  useEffect(() => cargar(), [cargar])

  const elegirPreset = (nuevo: Preset) => {
    setPreset(nuevo)
    setErrorPdf(null)
    if (nuevo === 'personalizado') {
      setBorrador(rango)
      return
    }
    const nuevoRango = rangoDePreset(nuevo)
    setBorrador(nuevoRango)
    setRango(nuevoRango)
  }

  const aplicarPersonalizado = () => {
    if (!borrador.desde || !borrador.hasta) {
      setError('Indicá la fecha de inicio y la de fin.')
      return
    }
    if (borrador.desde > borrador.hasta) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.')
      return
    }
    if (diasEntre(borrador.desde, borrador.hasta) > 366) {
      setError('El período no puede superar los 366 días.')
      return
    }
    setError(null)
    setErrorPdf(null)
    if (borrador.desde === rango.desde && borrador.hasta === rango.hasta) {
      setRefresco((valor) => valor + 1)
    } else {
      setRango({ ...borrador })
    }
  }

  const descargarPdf = () => {
    setGenerandoPdf(true)
    setErrorPdf(null)
    descargarInformeEstadistico(rango.desde, rango.hasta)
      .catch((e) => setErrorPdf(mensajeDeError(e, 'No se pudo generar el informe en PDF.')))
      .finally(() => setGenerandoPdf(false))
  }

  const datosGrafico = useMemo(() => {
    if (!datos) return []
    const porFecha = new Map(datos.porDia.map((dia) => [dia.fecha, dia]))
    const salida: EstadisticasDiaApi[] = []
    let cursor = datos.periodo.desde
    let seguridad = 0
    while (cursor <= datos.periodo.hasta && seguridad < 400) {
      salida.push(porFecha.get(cursor) ?? DIA_VACIO(cursor))
      cursor = sumarDias(cursor, 1)
      seguridad += 1
    }
    return salida
  }, [datos])

  const etiquetaPeriodo =
    rango.desde === rango.hasta
      ? fechaLinda(rango.desde)
      : `${fechaLinda(rango.desde)} al ${fechaLinda(rango.hasta)}`

  const sinDatos = datos !== null && datos.resumen.totalInscripciones === 0

  return (
    <DashboardLayout rol={rol}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold text-primary-950 sm:text-xl">
              <BarChart3 className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Estadísticas e informes
            </h1>
            <p className="mt-0.5 text-sm capitalize text-slate-500">{etiquetaPeriodo}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRefresco((valor) => valor + 1)}
              disabled={cargando}
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-3.5 py-2 text-sm font-semibold text-primary-800 transition hover:bg-primary-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true" />
              Actualizar
            </button>
            <button
              type="button"
              onClick={descargarPdf}
              disabled={generandoPdf || cargando || !datos}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-800 disabled:opacity-50"
            >
              {generandoPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              Descargar PDF
            </button>
          </div>
        </div>

        {errorPdf && (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {errorPdf}
          </p>
        )}

        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Período del informe">
            {PRESETS.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={preset === opcion.id}
                onClick={() => elegirPreset(opcion.id)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  preset === opcion.id
                    ? 'bg-primary-900 text-white shadow-card'
                    : 'border border-primary-100 bg-white text-primary-800 hover:bg-primary-50'
                }`}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>

          {preset === 'personalizado' && (
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-primary-100 pt-4">
              <label className="text-sm font-semibold text-primary-900">
                Desde
                <input
                  type="date"
                  value={borrador.desde}
                  max={borrador.hasta || undefined}
                  onChange={(event) => setBorrador((valor) => ({ ...valor, desde: event.target.value }))}
                  className="mt-1.5 block rounded-xl border border-primary-100 bg-slate-50 px-3 py-2 text-sm text-primary-950 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
                />
              </label>
              <label className="text-sm font-semibold text-primary-900">
                Hasta
                <input
                  type="date"
                  value={borrador.hasta}
                  min={borrador.desde || undefined}
                  onChange={(event) => setBorrador((valor) => ({ ...valor, hasta: event.target.value }))}
                  className="mt-1.5 block rounded-xl border border-primary-100 bg-slate-50 px-3 py-2 text-sm text-primary-950 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
                />
              </label>
              <button
                type="button"
                onClick={aplicarPersonalizado}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-800"
              >
                <CalendarRange className="h-4 w-4" aria-hidden="true" />
                Aplicar período
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </Card>

        {cargando && !datos ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-800" aria-hidden="true" />
            <p className="text-sm text-slate-500">Calculando estadísticas del período…</p>
          </Card>
        ) : datos ? (
          <>
            <section aria-label="Resumen del período" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard
                titulo="Inscripciones"
                valor={datos.resumen.totalInscripciones}
                detalle="total del período"
                icono={<CalendarDays className="h-4.5 w-4.5" aria-hidden="true" />}
                tono="azul"
              />
              <StatCard
                titulo="Atendidos"
                valor={datos.resumen.atendidos}
                detalle={porcentaje(datos.conclusiones.porcentajeFinalizacion)}
                icono={<CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />}
                tono="verde"
              />
              <StatCard
                titulo="En espera"
                valor={datos.resumen.enEspera}
                detalle="sin iniciar atención"
                icono={<Users className="h-4.5 w-4.5" aria-hidden="true" />}
                tono="celeste"
              />
              <StatCard
                titulo="En atención"
                valor={datos.resumen.enAtencion}
                detalle="consulta en curso"
                icono={<Activity className="h-4.5 w-4.5" aria-hidden="true" />}
              />
              <StatCard
                titulo="Cancelados"
                valor={datos.resumen.cancelados}
                detalle={porcentaje(datos.conclusiones.tasaCancelacion)}
                icono={<XCircle className="h-4.5 w-4.5" aria-hidden="true" />}
              />
            </section>

            {sinDatos ? (
              <Card className="p-10 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-primary-900">No hay inscripciones en este período.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Probá con otro rango de fechas o inscribí pacientes desde el panel de recepción.
                </p>
              </Card>
            ) : (
              <>
                <Card className="p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold text-primary-900 sm:text-base">Evolución diaria</h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Inscripciones por día según su estado actual.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-semibold text-primary-800">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      {numero(datos.conclusiones.promedioDiario ?? 0)} por día en promedio
                    </span>
                  </div>
                  <div className="h-72 w-full sm:h-80" role="img" aria-label="Gráfico de inscripciones por día">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosGrafico} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d9e6f6" vertical={false} />
                        <XAxis
                          dataKey="fecha"
                          tickFormatter={fechaCorta}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#d9e6f6' }}
                          minTickGap={16}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(42, 107, 184, 0.06)' }}
                          labelFormatter={(fecha) => fechaLinda(String(fecha))}
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #d9e6f6',
                            boxShadow: '0 8px 24px -4px rgba(12, 36, 68, 0.12)',
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                        <Bar dataKey="atendidos" name="Atendidos" stackId="estado" fill="#059669" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="enEspera" name="En espera" stackId="estado" fill="#38bdf8" />
                        <Bar dataKey="enAtencion" name="En atención" stackId="estado" fill="#1d539a" />
                        <Bar dataKey="cancelados" name="Cancelados" stackId="estado" fill="#e11d48" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                  <Card className="overflow-hidden">
                    <div className="border-b border-primary-100 px-4 py-3.5 sm:px-5">
                      <h2 className="text-sm font-bold text-primary-900">Detalle por fecha</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Solo se muestran los días con inscripciones.</p>
                    </div>
                    <div className="max-h-80 overflow-auto">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th scope="col" className="px-4 py-2.5 font-semibold">Fecha</th>
                            <th scope="col" className="px-3 py-2.5 text-right font-semibold">Total</th>
                            <th scope="col" className="px-3 py-2.5 text-right font-semibold">Atendidos</th>
                            <th scope="col" className="px-3 py-2.5 text-right font-semibold">En espera</th>
                            <th scope="col" className="px-3 py-2.5 text-right font-semibold">En atención</th>
                            <th scope="col" className="px-4 py-2.5 text-right font-semibold">Cancelados</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-100/70">
                          {datos.porDia.map((dia) => (
                            <tr key={dia.fecha} className="hover:bg-primary-50/40">
                              <td className="whitespace-nowrap px-4 py-2.5 font-medium text-primary-900">
                                {fechaCorta(dia.fecha)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold tabular-nums text-primary-950">{numero(dia.total)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">{numero(dia.atendidos)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-sky-700">{numero(dia.enEspera)}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-primary-700">{numero(dia.enAtencion)}</td>
                              <td className="px-4 py-2.5 text-right tabular-nums text-rose-700">{numero(dia.cancelados)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t-2 border-primary-100 bg-slate-50 text-xs font-bold text-primary-950">
                          <tr>
                            <td className="px-4 py-2.5">Total del período</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{numero(datos.resumen.totalInscripciones)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{numero(datos.resumen.atendidos)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{numero(datos.resumen.enEspera)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{numero(datos.resumen.enAtencion)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{numero(datos.resumen.cancelados)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </Card>

                  <Card className="p-4 sm:p-5">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-primary-900">
                      <FileText className="h-4 w-4 text-primary-600" aria-hidden="true" />
                      Conclusiones del período
                    </h2>
                    <ul className="mt-3 space-y-3 text-sm text-slate-600">
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" aria-hidden="true" />
                        <span>
                          Se registraron <strong className="text-primary-950">{numero(datos.resumen.totalInscripciones)}</strong>{' '}
                          inscripciones en {numero(datos.conclusiones.diasConActividad)} de{' '}
                          {numero(datos.conclusiones.diasDelPeriodo)} días del período.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                        <span>
                          Se atendieron <strong className="text-primary-950">{numero(datos.conclusiones.totalAtendidos)}</strong>{' '}
                          pacientes, un {porcentaje(datos.conclusiones.porcentajeFinalizacion)} del total inscripto.
                        </span>
                      </li>
                      {datos.conclusiones.diaMayorActividad && (
                        <li className="flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" aria-hidden="true" />
                          <span>
                            El día de mayor actividad fue el{' '}
                            <strong className="text-primary-950">
                              {fechaLinda(datos.conclusiones.diaMayorActividad.fecha)}
                            </strong>{' '}
                            con {numero(datos.conclusiones.diaMayorActividad.total)} inscripciones.
                          </span>
                        </li>
                      )}
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
                        <span>
                          Se cancelaron <strong className="text-primary-950">{numero(datos.resumen.cancelados)}</strong>{' '}
                          inscripciones ({porcentaje(datos.conclusiones.tasaCancelacion)} del total).
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                        <span>
                          Promedio diario: <strong className="text-primary-950">{numero(datos.conclusiones.promedioDiario ?? 0)}</strong>{' '}
                          inscripciones.
                        </span>
                      </li>
                    </ul>
                    <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                      <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      Datos agregados en tiempo real desde PostgreSQL. El informe PDF no incluye nombres, DNI ni
                      información clínica.
                    </p>
                  </Card>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
