import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { ListaInscripciones } from '@/components/inscripciones/ListaInscripciones'
import { HistorialAtendidosPorJornada } from '@/components/inscripciones/HistorialAtendidosPorJornada'
import { InscripcionModal } from '@/components/inscripciones/InscripcionModal'
import { ModalCancelacion } from '@/components/inscripciones/ModalCancelacion'
import { getInscripciones, getPacientes, type PacienteApi, type TurnoApi } from '@/lib/api'

type FiltroJornada = 'TODOS' | 'EN_ESPERA' | 'EN_ATENCION' | 'ATENDIDO' | 'CANCELADO'

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

export default function SecretariaPanel() {
  const { usuario } = useAuth()
  const [fecha, setFecha] = useState(hoyLocal)
  const [turnos, setTurnos] = useState<TurnoApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [refresco, setRefresco] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [verCancelados, setVerCancelados] = useState(false)
  const [modalInscripcion, setModalInscripcion] = useState(false)
  const [turnoACancelar, setTurnoACancelar] = useState<TurnoApi | null>(null)
  const [busquedaPaciente, setBusquedaPaciente] = useState('')
  const [resultadosPaciente, setResultadosPaciente] = useState<PacienteApi[]>([])
  const [buscandoPaciente, setBuscandoPaciente] = useState(false)
  const [errorBusquedaPaciente, setErrorBusquedaPaciente] = useState<string | null>(null)
  const [busquedaJornada, setBusquedaJornada] = useState('')
  const [filtroJornada, setFiltroJornada] = useState<FiltroJornada>('TODOS')

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    setTurnos([])
    getInscripciones({ fecha, incluirCancelados: true })
      .then(({ items }) => {
        if (!cancelado) setTurnos(items)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar las inscripciones del día.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [fecha, refresco])

  useEffect(() => {
    let cancelado = false
    const termino = busquedaPaciente.trim()
    if (termino.length < 2) {
      setResultadosPaciente([])
      setBuscandoPaciente(false)
      setErrorBusquedaPaciente(null)
      return
    }
    setErrorBusquedaPaciente(null)
    setBuscandoPaciente(true)
    const timer = window.setTimeout(() => {
      getPacientes(termino, 1, 5)
        .then((data) => {
          if (!cancelado) setResultadosPaciente(data.items)
        })
        .catch(() => {
          if (!cancelado) {
            setResultadosPaciente([])
            setErrorBusquedaPaciente('No se pudo completar la búsqueda. Intentá nuevamente.')
          }
        })
        .finally(() => {
          if (!cancelado) setBuscandoPaciente(false)
        })
    }, 250)
    return () => {
      cancelado = true
      window.clearTimeout(timer)
    }
  }, [busquedaPaciente])

  const activos = useMemo(() => turnos.filter((t) => t.estado !== 'CANCELADO'), [turnos])
  const cancelados = useMemo(() => turnos.filter((t) => t.estado === 'CANCELADO'), [turnos])
  const enEspera = activos.filter((t) => t.estado === 'EN_ESPERA')
  const enAtencion = activos.filter((t) => t.estado === 'EN_ATENCION')
  const atendidos = activos.filter((t) => t.estado === 'ATENDIDO')
  const terminoJornada = busquedaJornada.trim().toLocaleLowerCase('es-AR')
  const porTexto = turnos.filter((t) => {
    const coincideTexto = !terminoJornada || `${t.paciente.nombre} ${t.paciente.apellido} ${t.paciente.dni}`.toLocaleLowerCase('es-AR').includes(terminoJornada)
    const coincideEstado = filtroJornada === 'TODOS' || t.estado === filtroJornada
    return coincideTexto && coincideEstado
  })
  const mostrandoCancelados = verCancelados || filtroJornada === 'CANCELADO'
  const visibles = mostrandoCancelados ? porTexto.filter((t) => t.estado === 'CANCELADO') : porTexto.filter((t) => t.estado !== 'CANCELADO')

  function mostrarAviso(mensaje: string) {
    setAviso(mensaje)
    window.setTimeout(() => setAviso(null), 5000)
  }

  function alInscribir(turno: TurnoApi) {
    setRefresco((valor) => valor + 1)
    mostrarAviso(
      `Paciente inscripto con el número ${turno.numeroOrdenDia ?? '—'}. Quedó en espera.`,
    )
  }

  function alCancelar(turno: TurnoApi) {
    setTurnoACancelar(null)
    setRefresco((valor) => valor + 1)
    mostrarAviso(
      `Inscripción de ${turno.paciente.apellido}, ${turno.paciente.nombre} cancelada. El número ${turno.numeroOrdenDia ?? ''} no se reutiliza.`,
    )
  }

  return (
    <DashboardLayout rol="SECRETARIA">
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Jornada administrativa</p>
            <h1 className="mt-1 text-lg font-bold text-primary-950 sm:text-xl">Hola{usuario?.nombre ? `, ${usuario.nombre}` : ''}</h1>
            <p className="mt-0.5 text-sm capitalize text-slate-500">{fechaLinda(fecha)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRefresco((valor) => valor + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-800 transition hover:bg-primary-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Actualizar
            </button>
            <button
              type="button"
              onClick={() => setModalInscripcion(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-800"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              Inscribir paciente
            </button>
          </div>
        </div>

        {aviso && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {aviso}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}


        <Card className="flex flex-wrap items-end gap-3 p-4">
          <label htmlFor="fechaRecepcion" className="text-sm font-semibold text-primary-900">
            Día de atención
            <input
              id="fechaRecepcion"
              type="date"
              value={fecha}
              onChange={(event) => {
                setFecha(event.target.value)
                setTurnos([])
                setCargando(true)
                setVerCancelados(false)
                setFiltroJornada('TODOS')
              }}
              className="ml-2 rounded-xl border border-primary-100 bg-slate-50 px-3 py-2 text-sm text-primary-950 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
            />
          </label>
          <p className="text-xs text-slate-500">Los pacientes se atienden por orden de inscripción, sin horarios individuales.</p>
        </Card>

        <section aria-label="Resumen del día" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard titulo="Inscriptos" valor={turnos.length} detalle="total del día" icono={<CalendarDays className="h-4.5 w-4.5" aria-hidden="true" />} />
          <StatCard
            titulo="En espera"
            valor={enEspera.length}
            detalle="aguardando atención"
            icono={<Users className="h-4.5 w-4.5" aria-hidden="true" />}
            tono="celeste"
          />
          <StatCard
            titulo="En atención"
            valor={enAtencion.length}
            detalle="consulta en curso"
            icono={<Clock3 className="h-4.5 w-4.5" aria-hidden="true" />}
            tono="azul"
          />
          <StatCard
            titulo="Atendidos"
            valor={atendidos.length}
            detalle="finalizados"
            icono={<CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />}
            tono="verde"
          />
          <StatCard
            titulo="Cancelados"
            valor={cancelados.length}
            detalle="fuera de la lista activa"
            icono={<Filter className="h-4.5 w-4.5" aria-hidden="true" />}
          />
        </section>

        <section aria-label="Buscar paciente" className="max-w-2xl">
          <Card className="p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-primary-900">
              <Search className="h-4 w-4 text-primary-500" aria-hidden="true" />
              Buscar paciente
            </h2>
            <p className="mt-1 text-xs text-slate-500">Encontrá la ficha o la historia clínica por nombre o DNI.</p>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={busquedaPaciente}
                onChange={(event) => setBusquedaPaciente(event.target.value)}
                placeholder="Nombre, apellido o DNI"
                aria-label="Buscar paciente por nombre, apellido o DNI"
                className="w-full rounded-xl border border-primary-100 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
              />
            </div>
            {buscandoPaciente && <p className="mt-2 text-xs text-slate-500">Buscando…</p>}
            {resultadosPaciente.length > 0 && (
              <ul className="mt-2 divide-y divide-primary-100 overflow-hidden rounded-xl border border-primary-100">
                {resultadosPaciente.map((paciente) => (
                  <li key={paciente.id}>
                    <Link
                      to={`/secretaria/pacientes/${paciente.id}`}
                      className="flex items-center justify-between gap-2 px-3.5 py-2.5 transition hover:bg-primary-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-primary-900">
                          {paciente.apellido}, {paciente.nombre}
                        </span>
                        <span className="block text-xs text-slate-500">DNI {paciente.dni}</span>
                      </span>
                      <span className="text-xs font-semibold text-primary-700">Ver ficha</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {errorBusquedaPaciente && <p role="alert" className="mt-2 text-xs text-rose-700">{errorBusquedaPaciente}</p>}
            {busquedaPaciente.trim().length >= 2 && !buscandoPaciente && !errorBusquedaPaciente && resultadosPaciente.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Sin coincidencias. Podés{' '}
                <Link to="/secretaria/pacientes/nuevo" className="font-semibold text-primary-700 underline">
                  registrar un paciente nuevo
                </Link>
                .
              </p>
            )}
          </Card>

        </section>

        <section id="pacientes-del-dia" aria-label="Pacientes inscriptos">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-primary-900">
              {mostrandoCancelados ? 'Inscripciones canceladas' : 'Pacientes inscriptos'}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {activos.length} activos · {cancelados.length} cancelados
              </span>
              <button
                type="button"
                onClick={() => {
                  if (mostrandoCancelados) {
                    setVerCancelados(false)
                    setFiltroJornada('TODOS')
                  } else {
                    setVerCancelados(true)
                  }
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  mostrandoCancelados
                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : 'border-primary-200 bg-white text-primary-800 hover:bg-primary-50'
                }`}
              >
                {mostrandoCancelados ? 'Volver a activos' : `Ver cancelados (${cancelados.length})`}
              </button>
            </div>
          </div>

          <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input type="search" value={busquedaJornada} onChange={(event) => setBusquedaJornada(event.target.value)} placeholder="Filtrar por nombre, apellido o DNI" aria-label="Filtrar pacientes del día" className="min-w-0 rounded-xl border border-primary-100 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-200" />
            <select aria-label="Filtrar por estado" value={filtroJornada} onChange={(event) => setFiltroJornada(event.target.value as FiltroJornada)} className="rounded-xl border border-primary-100 bg-white px-3 py-2.5 text-sm text-primary-900">
              <option value="TODOS">Todos los estados</option><option value="EN_ESPERA">En espera</option><option value="EN_ATENCION">En atención</option><option value="ATENDIDO">Atendidos</option><option value="CANCELADO">Cancelados</option>
            </select>
          </div>

          {cargando ? (
            <Card className="flex justify-center p-12">
              <Loader2 className="h-7 w-7 animate-spin text-primary-800" aria-hidden="true" />
            </Card>
          ) : (
            <ListaInscripciones
              turnos={visibles}
              basePacientes="/secretaria/pacientes"
              perfil="SECRETARIA"
              onCancelar={(turno) => setTurnoACancelar(turno)}
              vacio={
                mostrandoCancelados
                  ? 'No hay inscripciones canceladas para este día.'
                  : 'Todavía no hay pacientes inscriptos para este día. Inscribí al primero con el botón superior.'
              }
            />
          )}
        </section>
        <HistorialAtendidosPorJornada perfil="SECRETARIA" />
      </div>

      <InscripcionModal
        abierto={modalInscripcion}
        fechaInicial={fecha}
        onCerrar={() => setModalInscripcion(false)}
        onInscripto={alInscribir}
      />
      <ModalCancelacion
        turno={turnoACancelar}
        onCerrar={() => setTurnoACancelar(null)}
        onCancelado={alCancelar}
      />
    </DashboardLayout>
  )
}
