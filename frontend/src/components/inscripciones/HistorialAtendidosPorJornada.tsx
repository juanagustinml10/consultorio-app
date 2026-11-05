import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronDown, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { ListaInscripciones } from '@/components/inscripciones/ListaInscripciones'
import { getInscripciones, type TurnoApi } from '@/lib/api'

type Perfil = 'MEDICO' | 'SECRETARIA'

function fechaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

function desplazarDia(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 12)
  resultado.setDate(resultado.getDate() + dias)
  return resultado
}

function fechaLegible(dia: string): string {
  return new Date(`${dia}T12:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function HistorialAtendidosPorJornada({ perfil }: { perfil: Perfil }) {
  const hoy = fechaLocal(new Date())
  const [abierto, setAbierto] = useState(false)
  const [desde, setDesde] = useState(fechaLocal(desplazarDia(new Date(), -29)))
  const [hasta, setHasta] = useState(hoy)
  const [turnos, setTurnos] = useState<TurnoApi[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!abierto) return
    if (!desde || !hasta || desde > hasta) {
      setCargando(false)
      return
    }
    let cancelado = false
    setCargando(true)
    setError(null)
    getInscripciones({ desde, hasta, estado: 'ATENDIDO' })
      .then(({ items }) => {
        if (!cancelado) setTurnos(items.filter((item) => item.estado === 'ATENDIDO'))
      })
      .catch(() => {
        if (!cancelado) {
          setTurnos([])
          setError('No se pudo cargar el historial de atenciones.')
        }
      })
      .finally(() => { if (!cancelado) setCargando(false) })
    return () => { cancelado = true }
  }, [abierto, desde, hasta])

  const grupos = useMemo(() => {
    const porDia = new Map<string, TurnoApi[]>()
    for (const turno of turnos) {
      const dia = turno.fechaOrdenAtencion ?? turno.fechaAtencion
      const grupo = porDia.get(dia) ?? []
      grupo.push(turno)
      porDia.set(dia, grupo)
    }
    return [...porDia.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dia, items]) => ({
        dia,
        items: items.sort((a, b) => (a.numeroOrdenDia ?? Number.MAX_SAFE_INTEGER) - (b.numeroOrdenDia ?? Number.MAX_SAFE_INTEGER)),
      }))
  }, [turnos])

  const ayer = fechaLocal(desplazarDia(new Date(), -1))

  return (
    <section className="mt-5" aria-label="Historial de pacientes atendidos por jornada">
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((actual) => !actual)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-primary-100 bg-white px-4 py-3 text-left shadow-card transition hover:bg-primary-50/60"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-primary-900">
          <CalendarDays className="h-4 w-4 text-primary-600" aria-hidden="true" />
          Historial de atendidos por jornada
        </span>
        <ChevronDown className={`h-4 w-4 text-primary-600 transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {abierto && (
        <div className="mt-3 space-y-4">
          <Card className="flex flex-wrap items-end gap-3 p-4">
            <label className="text-xs font-semibold text-primary-900">
              Desde
              <input type="date" value={desde} max={hasta} onChange={(event) => setDesde(event.target.value)} className="mt-1 block rounded-lg border border-primary-200 bg-white px-2.5 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-primary-900">
              Hasta
              <input type="date" value={hasta} min={desde} max={hoy} onChange={(event) => setHasta(event.target.value)} className="mt-1 block rounded-lg border border-primary-200 bg-white px-2.5 py-2 text-sm" />
            </label>
            <p className="pb-2 text-xs text-slate-500">Los totales diarios del dashboard no incluyen estas jornadas anteriores.</p>
          </Card>

          {desde > hasta && <p role="alert" className="text-sm text-rose-700">La fecha inicial debe ser anterior a la fecha final.</p>}
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {cargando ? (
            <Card className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary-800" aria-label="Cargando historial" /></Card>
          ) : !error && grupos.length === 0 ? (
            <Card className="p-6 text-center text-sm text-slate-500">No hay pacientes atendidos en el período seleccionado.</Card>
          ) : (
            grupos.map(({ dia, items }) => (
              <section key={dia} aria-label={`Jornada ${fechaLegible(dia)}`} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold capitalize text-primary-900">{fechaLegible(dia)}</h3>
                    {dia === hoy && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">Hoy</span>}
                    {dia === ayer && <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-800">Ayer</span>}
                  </div>
                  <span className="text-xs font-medium text-slate-500">{items.length} {items.length === 1 ? 'paciente atendido' : 'pacientes atendidos'}</span>
                </div>
                <ListaInscripciones
                  turnos={items}
                  basePacientes={perfil === 'MEDICO' ? '/medico/pacientes' : '/secretaria/pacientes'}
                  perfil={perfil}
                  vacio="No hay pacientes atendidos en esta jornada."
                />
              </section>
            ))
          )}
        </div>
      )}
    </section>
  )
}
