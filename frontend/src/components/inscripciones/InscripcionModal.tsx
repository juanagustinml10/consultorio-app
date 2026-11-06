import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Search,
  UserPlus,
  X,
} from 'lucide-react'
import { FormularioPaciente } from '@/components/pacientes/FormularioPaciente'
import { mensajeDeError } from '@/pages/pacientes/errores'
import {
  crearInscripcion,
  crearPaciente,
  getPacientes,
  type PacienteApi,
  type PayloadPaciente,
  type TurnoApi,
} from '@/lib/api'

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

const CLASE_INPUT =
  'mt-1.5 w-full rounded-xl border border-primary-100 bg-slate-50 px-3.5 py-2.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200'

interface InscripcionModalProps {
  abierto: boolean
  fechaInicial?: string
  onCerrar: () => void
  onInscripto?: (turno: TurnoApi) => void
}

export function InscripcionModal({ abierto, fechaInicial, onCerrar, onInscripto }: InscripcionModalProps) {
  const submitLock = useRef(false)
  const [fecha, setFecha] = useState(fechaInicial ?? hoyLocal())
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<PacienteApi[]>([])
  const [buscando, setBuscando] = useState(false)
  const [seleccionado, setSeleccionado] = useState<PacienteApi | null>(null)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [modoNuevo, setModoNuevo] = useState(false)
  const [turnoInscripto, setTurnoInscripto] = useState<TurnoApi | null>(null)

  useEffect(() => {
    if (!abierto) return
    setFecha(fechaInicial ?? hoyLocal())
    setBusqueda('')
    setResultados([])
    setBuscando(false)
    setSeleccionado(null)
    setMotivo('')
    setError(null)
    setAviso(null)
    setGuardando(false)
    submitLock.current = false
    setModoNuevo(false)
    setTurnoInscripto(null)
  }, [abierto, fechaInicial])

  useEffect(() => {
    if (!abierto) return
    const alEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alEscape)
      document.body.style.overflow = ''
    }
  }, [abierto, onCerrar])

  useEffect(() => {
    if (!abierto || modoNuevo) return
    const termino = busqueda.trim()
    if (termino.length < 2) {
      setResultados([])
      setBuscando(false)
      return
    }
    let cancelado = false
    setBuscando(true)
    const timer = window.setTimeout(() => {
      getPacientes(termino, 1, 8)
        .then((data) => {
          if (cancelado) return
          setResultados(data.items)
          setError(null)
        })
        .catch(() => {
          if (!cancelado) setError('No se pudo buscar el paciente. Intentá nuevamente.')
        })
        .finally(() => {
          if (!cancelado) setBuscando(false)
        })
    }, 250)
    return () => {
      cancelado = true
      window.clearTimeout(timer)
    }
  }, [abierto, busqueda, modoNuevo])

  if (!abierto) return null

  function registrarPacienteNuevo(payload: PayloadPaciente) {
    if (submitLock.current) return
    submitLock.current = true
    setGuardando(true)
    setError(null)
    crearPaciente(payload)
      .then(({ paciente }) => {
        setSeleccionado(paciente)
        setModoNuevo(false)
        setBusqueda('')
        setAviso('Paciente registrado y seleccionado. Confirmá la inscripción para asignarle su número.')
      })
      .catch((e) => setError(mensajeDeError(e, 'No se pudo registrar el paciente.')))
      .finally(() => {
        submitLock.current = false
        setGuardando(false)
      })
  }

  function confirmarInscripcion() {
    if (submitLock.current) return
    if (!seleccionado) {
      setError('Seleccioná un paciente para continuar.')
      return
    }
    submitLock.current = true
    setGuardando(true)
    setError(null)
    crearInscripcion({
      pacienteId: seleccionado.id,
      fechaAtencion: fecha,
      motivo: motivo.trim() || null,
    })
      .then(({ turno, numeroAsignado }) => {
        const conNumero = { ...turno, numeroOrdenDia: numeroAsignado ?? turno.numeroOrdenDia }
        setTurnoInscripto(conNumero)
        onInscripto?.(conNumero)
      })
      .catch((e) => setError(mensajeDeError(e, 'No se pudo inscribir al paciente.')))
      .finally(() => {
        submitLock.current = false
        setGuardando(false)
      })
  }

  function inscribirOtro() {
    setTurnoInscripto(null)
    setSeleccionado(null)
    setBusqueda('')
    setResultados([])
    setMotivo('')
    setError(null)
    setAviso(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-primary-950/55 p-2 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-inscripcion"
        className="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-primary-100 px-4 py-3 sm:px-5">
          <div>
            <h2 id="titulo-inscripcion" className="flex items-center gap-2 text-base font-bold text-primary-950 sm:text-lg">
              {modoNuevo ? <UserPlus className="h-5 w-5 text-primary-600" aria-hidden="true" /> : <CalendarDays className="h-5 w-5 text-primary-600" aria-hidden="true" />}
              {turnoInscripto ? 'Inscripción confirmada' : modoNuevo ? 'Registrar paciente nuevo' : 'Inscribir paciente'}
            </h2>
            {!turnoInscripto && !modoNuevo && (
              <p className="mt-1 text-sm text-slate-500">
                Elegí el día, buscá al paciente y confirmá. El número se asigna automáticamente.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {turnoInscripto ? (
          <div className="min-h-0 overflow-y-auto px-5 py-8 text-center sm:px-8">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-500">Número de atención asignado</p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums text-primary-950">
              {turnoInscripto.numeroOrdenDia ?? '—'}
            </p>
            <p className="mt-4 text-base font-bold text-primary-900">
              {turnoInscripto.paciente.apellido}, {turnoInscripto.paciente.nombre}
            </p>
            <p className="mt-1 text-sm capitalize text-slate-500">{fechaLinda(turnoInscripto.fechaAtencion)}</p>
            <p className="mx-auto mt-4 max-w-md rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-900">
              El paciente quedó <strong>en espera</strong>. El número no se reutiliza aunque la inscripción se cancele.
            </p>
            <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
              <button
                type="button"
                onClick={inscribirOtro}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-800 transition hover:bg-primary-50"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Inscribir otro paciente
              </button>
              <button
                type="button"
                onClick={onCerrar}
                className="rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 ${modoNuevo ? 'space-y-3 py-3' : 'space-y-4 py-5'}`}>
            <div className={modoNuevo ? 'flex flex-wrap items-center justify-between gap-2 rounded-lg bg-primary-50 px-3 py-2' : ''}>
              <label htmlFor="inscripcionFecha" className="text-sm font-semibold text-primary-900">
                Día de atención <span className="text-rose-500">*</span>
              </label>
              <input
                id="inscripcionFecha"
                type="date"
                required
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className={modoNuevo ? 'rounded-lg border border-primary-100 bg-white px-2.5 py-1.5 text-sm text-primary-950 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-200' : CLASE_INPUT}
              />
              <p className={`${modoNuevo ? 'w-full text-right' : 'mt-1.5'} text-xs capitalize text-slate-500`}>{fechaLinda(fecha)}</p>
            </div>

            {modoNuevo ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">Completá los datos para registrarlo e inscribirlo.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setModoNuevo(false)
                      setError(null)
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Volver a buscar
                  </button>
                </div>
                <FormularioPaciente
                  modo="crear"
                  compact
                  guardando={guardando}
                  errorApi={error}
                  volverA="#"
                  onCancelar={() => {
                    setModoNuevo(false)
                    setError(null)
                  }}
                  onSubmit={registrarPacienteNuevo}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="inscripcionBusqueda" className="text-sm font-semibold text-primary-900">
                  Paciente <span className="text-rose-500">*</span>
                </label>
                {seleccionado ? (
                  <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-primary-950">
                        {seleccionado.apellido}, {seleccionado.nombre}
                      </span>
                      <span className="block text-xs text-slate-500">DNI {seleccionado.dni}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSeleccionado(null)
                        setBusqueda('')
                        setResultados([])
                      }}
                      className="text-xs font-semibold text-primary-700 hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative mt-1.5">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        id="inscripcionBusqueda"
                        type="search"
                        autoComplete="off"
                        value={busqueda}
                        onChange={(event) => setBusqueda(event.target.value)}
                        placeholder="Buscar por nombre, apellido o DNI"
                        className="w-full rounded-xl border border-primary-100 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
                      />
                    </div>
                    {buscando && <p className="mt-2 text-xs text-slate-500">Buscando paciente…</p>}
                    {resultados.length > 0 && (
                      <ul className="mt-2 max-h-52 divide-y divide-primary-100 overflow-y-auto rounded-xl border border-primary-100">
                        {resultados.map((paciente) => (
                          <li key={paciente.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSeleccionado(paciente)
                                setBusqueda('')
                                setResultados([])
                                setAviso(null)
                              }}
                              className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition hover:bg-primary-50"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-primary-900">
                                  {paciente.apellido}, {paciente.nombre}
                                </span>
                                <span className="block text-xs text-slate-500">
                                  DNI {paciente.dni}
                                  {paciente.obraSocial ? ` · ${paciente.obraSocial}` : ''}
                                </span>
                              </span>
                              <span className="text-xs font-semibold text-primary-700">Seleccionar</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {busqueda.trim().length >= 2 && !buscando && resultados.length === 0 && (
                      <div className="mt-2 rounded-xl border border-primary-100 bg-primary-50/60 p-3">
                        <p className="text-sm text-primary-900">No encontramos coincidencias.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setModoNuevo(true)
                            setError(null)
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-800"
                        >
                          <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                          Registrar paciente nuevo
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!modoNuevo && (
              <div>
                <label htmlFor="inscripcionMotivo" className="text-sm font-semibold text-primary-900">
                  Motivo de consulta <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <input
                  id="inscripcionMotivo"
                  type="text"
                  maxLength={300}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Control, consulta, resultados…"
                  className={CLASE_INPUT}
                />
              </div>
            )}

            {aviso && (
              <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {aviso}
              </p>
            )}
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            {!modoNuevo && (
              <div className="flex flex-col-reverse justify-end gap-2 border-t border-primary-100 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={onCerrar}
                  className="rounded-xl border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-800 transition hover:bg-primary-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarInscripcion}
                  disabled={!seleccionado || guardando || !fecha}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-50"
                >
                  {guardando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  Confirmar inscripción
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
