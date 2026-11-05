import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  Stethoscope,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { ListaInscripciones } from '@/components/inscripciones/ListaInscripciones'
import { HistorialAtendidosPorJornada } from '@/components/inscripciones/HistorialAtendidosPorJornada'
import { cambiarEstadoAtencion, getInscripciones, type TurnoApi } from '@/lib/api'
import { mensajeDeError } from '@/pages/pacientes/errores'

function hoyLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fechaLinda(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

type SeccionPacientes = 'espera' | 'atencion' | 'atendidos' | 'cancelados'

const SECCIONES: Array<{ id: SeccionPacientes; etiqueta: string }> = [
  { id: 'espera', etiqueta: 'En espera' },
  { id: 'atencion', etiqueta: 'En atención' },
  { id: 'atendidos', etiqueta: 'Atendidos' },
  { id: 'cancelados', etiqueta: 'Cancelados' },
]

export default function MedicoPanel() {
  const navigate = useNavigate()
  const hoy = hoyLocal()
  const { usuario } = useAuth()
  const [fecha, setFecha] = useState(hoy)
  const [turnos, setTurnos] = useState<TurnoApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procesandoId, setProcesandoId] = useState<string | null>(null)
  const [refresco, setRefresco] = useState(0)
  const [seccion, setSeccion] = useState<SeccionPacientes>('espera')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    let cancelado = false
    setError(null)
    getInscripciones({ fecha, incluirCancelados: true })
      .then(({ items }) => {
        if (!cancelado) setTurnos(items)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los pacientes del día.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [fecha, refresco])

  useEffect(() => {
    const intervalo = window.setInterval(() => setRefresco((valor) => valor + 1), 15_000)
    return () => window.clearInterval(intervalo)
  }, [])

  const enEspera = useMemo(() => turnos.filter((t) => t.estado === 'EN_ESPERA'), [turnos])
  const enAtencion = useMemo(() => turnos.filter((t) => t.estado === 'EN_ATENCION'), [turnos])
  const atendidos = useMemo(() => turnos.filter((t) => t.estado === 'ATENDIDO'), [turnos])
  const cancelados = useMemo(() => turnos.filter((t) => t.estado === 'CANCELADO'), [turnos])

  const seccionActual = seccion === 'espera'
    ? enEspera
    : seccion === 'atencion'
      ? enAtencion
      : seccion === 'atendidos'
        ? atendidos
        : cancelados

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es-AR')
    if (!termino) return seccionActual
    return seccionActual.filter((turno) =>
      `${turno.paciente.nombre} ${turno.paciente.apellido} ${turno.paciente.dni} ${turno.motivo ?? ''}`
        .toLocaleLowerCase('es-AR')
        .includes(termino),
    )
  }, [busqueda, seccionActual])

  async function cambiarEstado(turno: TurnoApi, estado: 'EN_ATENCION' | 'ATENDIDO') {
    setProcesandoId(turno.id)
    setError(null)
    try {
      await cambiarEstadoAtencion(turno.id, estado)
      setRefresco((valor) => valor + 1)
      if (estado === 'EN_ATENCION') {
        navigate(`/medico/pacientes/${turno.paciente.id}/historia?turnoId=${encodeURIComponent(turno.id)}`)
      }
      if (estado === 'ATENDIDO') setSeccion('atendidos')
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo actualizar el estado de atención.'))
    } finally {
      setProcesandoId(null)
    }
  }

  if (cargando) {
    return (
      <DashboardLayout rol="MEDICO">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-900" aria-hidden="true" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout rol="MEDICO">
      <div className="mx-auto max-w-6xl space-y-5">
        <p className="text-sm font-medium text-primary-600">Hola, {usuario?.nombre ?? 'doctor/a'}</p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-primary-950 sm:text-xl">Atención del día</h1>
            <p className="mt-0.5 text-sm capitalize text-slate-500">{fechaLinda(fecha)}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Fecha
              <input type="date" value={fecha} onChange={(event) => { setTurnos([]); setCargando(true); setFecha(event.target.value) }} className="ml-2 rounded-lg border border-primary-200 bg-white px-2.5 py-2 text-sm text-primary-900" />
            </label>
            <button
            type="button"
            onClick={() => setRefresco((valor) => valor + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-3.5 py-2 text-sm font-semibold text-primary-800 transition hover:bg-primary-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Actualizar
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <section aria-label="Resumen de pacientes del día" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            titulo="En espera"
            valor={enEspera.length}
            detalle="listos para ingresar"
            icono={<Users className="h-4.5 w-4.5" aria-hidden="true" />}
            tono="celeste"
          />
          <StatCard
            titulo="En atención"
            valor={enAtencion.length}
            detalle={enAtencion[0] ? enAtencion[0].paciente.apellido : 'sin consulta en curso'}
            icono={<Activity className="h-4.5 w-4.5" aria-hidden="true" />}
            tono="azul"
          />
          <StatCard
            titulo="Atendidos"
            valor={atendidos.length}
            detalle="atención finalizada"
            icono={<CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />}
            tono="verde"
          />
          <StatCard
            titulo="Inscriptos del día"
            valor={turnos.length}
            detalle={`${cancelados.length} cancelados`}
            icono={<Clock3 className="h-4.5 w-4.5" aria-hidden="true" />}
          />
        </section>

        <section aria-label="Accesos rápidos" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setSeccion('espera')}
            className="rounded-xl border border-primary-100 bg-white p-3 text-left text-xs font-semibold text-primary-800 shadow-card transition hover:bg-primary-50"
          >
            <Users className="mb-2 h-4 w-4 text-primary-600" aria-hidden="true" />
            Sala de espera
            <span className="block text-[11px] font-normal text-slate-500">{enEspera.length} {enEspera.length === 1 ? 'paciente' : 'pacientes'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSeccion('atencion')}
            className="rounded-xl border border-primary-100 bg-white p-3 text-left text-xs font-semibold text-primary-800 shadow-card transition hover:bg-primary-50"
          >
            <Stethoscope className="mb-2 h-4 w-4 text-primary-600" aria-hidden="true" />
            Consulta actual
            <span className="block text-[11px] font-normal text-slate-500">
              {enAtencion.length > 0 ? `${enAtencion.length} en curso` : 'sin paciente'}
            </span>
          </button>
          <Link to="/medico/pacientes" className="rounded-xl border border-primary-100 bg-white p-3 text-xs font-semibold text-primary-800 shadow-card transition hover:bg-primary-50">
            <Search className="mb-2 h-4 w-4 text-primary-600" aria-hidden="true" />
            Buscar pacientes
          </Link>
          <Link
            to="/medico/historias"
            className="rounded-xl border border-primary-100 bg-white p-3 text-xs font-semibold text-primary-800 shadow-card transition hover:bg-primary-50"
          >
            <ClipboardList className="mb-2 h-4 w-4 text-primary-600" aria-hidden="true" />
            Historias clínicas
          </Link>
          <Link
            to="/medico/estadisticas"
            className="rounded-xl border border-primary-100 bg-white p-3 text-xs font-semibold text-primary-800 shadow-card transition hover:bg-primary-50"
          >
            <BarChart3 className="mb-2 h-4 w-4 text-primary-600" aria-hidden="true" />
            Estadísticas e informes
          </Link>
        </section>

        <Card className="overflow-hidden">
          <div className="border-b border-primary-100 p-3 sm:p-4">
            <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Secciones de pacientes">
              {SECCIONES.map(({ id, etiqueta }) => {
                const cantidad =
                  id === 'espera'
                    ? enEspera.length
                    : id === 'atencion'
                      ? enAtencion.length
                      : id === 'atendidos'
                        ? atendidos.length
                        : cancelados.length
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={seccion === id}
                    onClick={() => setSeccion(id)}
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                      seccion === id
                        ? 'bg-primary-900 text-white'
                        : 'text-slate-600 hover:bg-primary-50 hover:text-primary-900'
                    }`}
                  >
                    {etiqueta} <span className="ml-1 opacity-75">{cantidad}</span>
                  </button>
                )
              })}
            </div>
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar por nombre o DNI en esta sección"
                aria-label="Buscar pacientes por nombre o DNI"
                className="w-full rounded-xl border border-primary-100 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </label>
          </div>

          <div className="bg-slate-50/60 p-3 sm:p-4">
            <ListaInscripciones
              turnos={filtrados}
              basePacientes="/medico/pacientes"
              perfil="MEDICO"
              procesandoId={procesandoId}
              onIniciar={(turno) => void cambiarEstado(turno, 'EN_ATENCION')}
              onFinalizar={(turno) => void cambiarEstado(turno, 'ATENDIDO')}
              vacio={
                busqueda
                  ? 'No hay pacientes que coincidan con la búsqueda.'
                  : seccion === 'espera'
                    ? 'No hay pacientes esperando en este momento.'
                    : seccion === 'atencion'
                      ? 'No hay una consulta en curso.'
                      : seccion === 'atendidos'
                        ? 'Todavía no se finalizó ninguna atención hoy.'
                        : 'No hay inscripciones canceladas para este día.'
              }
            />
          </div>
        </Card>
        <HistorialAtendidosPorJornada perfil="MEDICO" />
      </div>
    </DashboardLayout>
  )
}
