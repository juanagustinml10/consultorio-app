import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseMedical,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Pencil,
  ShieldCheck,
} from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import {
  editarPaciente,
  getPaciente as obtenerPaciente,
  getInscripciones,
  type PacienteApi,
  type PayloadPaciente,
  type TurnoApi,
} from '@/lib/api'
import { FormularioPaciente } from '@/components/pacientes/FormularioPaciente'
import { mensajeDeError } from './errores'
import type { Rol } from '@/types/domain'

const ETIQUETAS_SEXO: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
}

function fechaLinda(iso?: string): string | undefined {
  if (!iso) return undefined
  const d = new Date(`${iso}T00:00`)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const CLASE_DATO = 'text-sm font-medium text-primary-900 break-words'
const CLASE_VACIO = 'text-sm text-slate-400 italic'

/** Ficha individual (roles MEDICO y SECRETARIA): consulta y edición con PUT real. */
export default function FichaPacientePage() {
  const { usuario } = useAuth()
  const rol: Rol = usuario?.rol === 'MEDICO' ? 'MEDICO' : 'SECRETARIA'
  const base = rol === 'MEDICO' ? '/medico/pacientes' : '/secretaria/pacientes'

  const { pacienteId } = useParams<{ pacienteId: string }>()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState<PacienteApi | null>(null)
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [avisoOk, setAvisoOk] = useState<string | null>(null)
  const [inscripciones, setInscripciones] = useState<TurnoApi[]>([])
  const [cargandoInscripciones, setCargandoInscripciones] = useState(false)
  const [errorInscripciones, setErrorInscripciones] = useState<string | null>(null)

  // "?nuevo=1" tras registrar: confirma la creación en la ficha.
  useEffect(() => {
    if (window.location.search.includes('nuevo=1')) {
      setAvisoOk('Paciente registrado correctamente.')
      navigate(`${base}/${pacienteId}`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!pacienteId) return
    let cancelado = false
    setCargando(true)
    setErrorCarga(null)
    obtenerPaciente(pacienteId)
      .then((data) => !cancelado && setPaciente(data.paciente))
      .catch(() => !cancelado && setErrorCarga('No se pudo cargar la ficha del paciente.'))
      .finally(() => !cancelado && setCargando(false))
    return () => {
      cancelado = true
    }
  }, [pacienteId])

  useEffect(() => {
    if (rol !== 'SECRETARIA' || !pacienteId) return
    let cancelado = false
    setCargandoInscripciones(true)
    setErrorInscripciones(null)
    getInscripciones({ desde: '0001-01-01', hasta: '9999-12-31', pacienteId, incluirCancelados: true })
      .then(({ items }) => !cancelado && setInscripciones(items))
      .catch(() => !cancelado && setErrorInscripciones('No se pudieron cargar las inscripciones anteriores.'))
      .finally(() => !cancelado && setCargandoInscripciones(false))
    return () => { cancelado = true }
  }, [rol, pacienteId])

  function guardar(payload: PayloadPaciente) {
    if (!paciente) return
    setGuardando(true)
    setErrorForm(null)
    editarPaciente(paciente.id, payload)
      .then((data) => {
        setPaciente(data.paciente)
        setEditando(false)
        setGuardando(false)
        setAvisoOk('Cambios guardados correctamente.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        window.setTimeout(() => setAvisoOk(null), 4000)
      })
      .catch((e) => {
        setErrorForm(mensajeDeError(e, 'No se pudo guardar los cambios.'))
        setGuardando(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
  }

  return (
    <DashboardLayout rol={rol}>
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          to={base}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition hover:underline underline-offset-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al listado
        </Link>

        {avisoOk && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {avisoOk}
          </div>
        )}

        {cargando && (
          <Card className="flex items-center justify-center px-5 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-900" aria-hidden="true" />
          </Card>
        )}

        {!cargando && errorCarga && (
          <Card className="px-5 py-8 text-center">
            <p className="text-sm text-rose-600">{errorCarga}</p>
            <button
              type="button"
              onClick={() => navigate(0)}
              className="mt-3 rounded-xl bg-primary-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-800"
            >
              Reintentar
            </button>
          </Card>
        )}

        {!cargando && !errorCarga && paciente && (
          <>
            {/* Encabezado de la ficha */}
            <Card className="px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-base font-bold text-primary-800">
                    {paciente.nombre[0]?.toUpperCase()}
                    {paciente.apellido[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-primary-900 sm:text-xl">
                      {paciente.apellido}, {paciente.nombre}
                    </h2>
                    <p className="numeros-tabulares text-sm text-slate-500">
                      DNI {paciente.dni}
                      {paciente.obraSocial && ` · ${paciente.obraSocial}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {!editando && (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorForm(null)
                        setEditando(true)
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-800 shadow-card transition hover:bg-primary-50"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Editar datos
                    </button>
                  )}
                  <Link
                    to={`${base}/${paciente.id}/historia`}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-800 shadow-card transition hover:bg-primary-50"
                  >
                    <ClipboardList className="h-4 w-4" aria-hidden="true" />
                    Historia clínica
                  </Link>
                </div>
              </div>
              {paciente.creadoEn && (
                <p className="mt-3 text-xs text-slate-400">
                  Registrado el {fechaLinda(paciente.creadoEn)}
                </p>
              )}
            </Card>

            {editando ? (
              <Card className="px-4 py-5 sm:px-6 sm:py-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-primary-900">Editar datos del paciente</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(false)
                      setErrorForm(null)
                    }}
                    className="text-xs font-semibold text-primary-700 hover:underline"
                  >
                    Volver a la ficha
                  </button>
                </div>
                <FormularioPaciente
                  modo="editar"
                  valoresIniciales={paciente}
                  guardando={guardando}
                  errorApi={errorForm}
                  volverA={base}
                  onCancelar={() => {
                    setEditando(false)
                    setErrorForm(null)
                  }}
                  onSubmit={guardar}
                />
              </Card>
            ) : (
              <>
                {/* Vista de datos */}
                <section className="grid gap-5 md:grid-cols-2">
                  <Card className="px-5 py-4 sm:px-6">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Datos personales
                    </h3>
                    <dl className="mt-3 space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-xs text-slate-400">Nombre completo</dt>
                        <dd className={`${CLASE_DATO} col-span-2`}>
                          {paciente.nombre} {paciente.apellido}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-xs text-slate-400">DNI</dt>
                        <dd className={`${CLASE_DATO} numeros-tabulares col-span-2`}>{paciente.dni}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-xs text-slate-400">Nacimiento</dt>
                        <dd className={`${CLASE_DATO} numeros-tabulares col-span-2`}>
                          {paciente.fechaNacimiento
                            ? fechaLinda(paciente.fechaNacimiento)
                            : 'Sin dato'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-xs text-slate-400">Sexo</dt>
                        <dd className={`${CLASE_DATO} col-span-2`}>
                          {paciente.sexo ? ETIQUETAS_SEXO[paciente.sexo] : 'Sin especificar'}
                        </dd>
                      </div>
                    </dl>
                  </Card>

                  <Card className="px-5 py-4 sm:px-6">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Cobertura
                    </h3>
                    <dl className="mt-3 space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-xs text-slate-400">Obra social</dt>
                        <dd className={`${CLASE_DATO} col-span-2`}>
                          {paciente.obraSocial ?? 'Sin cobertura'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-xs text-slate-400">N° de afiliado</dt>
                        <dd className={`${CLASE_DATO} numeros-tabulares col-span-2`}>
                          {paciente.numeroAfiliado ?? '—'}
                        </dd>
                      </div>
                    </dl>

                    <h3 className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
                      <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                      Contacto
                    </h3>
                    <dl className="mt-3 space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-xs text-slate-400">Teléfono</dt>
                        <dd className={`${CLASE_DATO} numeros-tabulares col-span-2`}>
                          {paciente.telefono ?? '—'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-xs text-slate-400">Email</dt>
                        <dd className={`${CLASE_DATO} col-span-2 break-words`}>
                          {paciente.email ?? '—'}
                        </dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-xs text-slate-400">Domicilio</dt>
                        <dd className={`${CLASE_DATO} col-span-2`}>
                          {paciente.direccion ?? '—'}
                        </dd>
                      </div>
                    </dl>
                  </Card>
                </section>

                <Card className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
                      <BriefcaseMedical className="h-3.5 w-3.5" aria-hidden="true" />
                      Historia clínica y observaciones
                    </h3>
                    <Link
                      to={`${base}/${paciente.id}/historia`}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-3.5 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primary-800 sm:text-sm"
                    >
                      <ClipboardList className="h-4 w-4" aria-hidden="true" />
                      Ver historia clínica
                    </Link>
                  </div>
                  {paciente.notas ? (
                    <p className="mt-3 whitespace-pre-line text-sm text-primary-900">
                      {paciente.notas}
                    </p>
                  ) : (
                    <p className={CLASE_VACIO}>Sin observaciones administrativas registradas.</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary-50/70 p-4">
                    <div className="flex items-center gap-2.5">
                      <BriefcaseMedical className="h-5 w-5 text-primary-600" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold text-primary-950">
                          Registro de consultas y antecedentes clínicos
                        </p>
                        <p className="text-xs text-slate-500">
                          Consultá alergias, diagnósticos previos y registrá nuevas consultas médicas.
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`${base}/${paciente.id}/historia`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-800 transition hover:underline"
                    >
                      Abrir historia clínica &rarr;
                    </Link>
                  </div>
                </Card>
                {rol === 'SECRETARIA' && (
                  <Card className="px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">Inscripciones anteriores</h3>
                      {!cargandoInscripciones && <span className="text-xs text-slate-400">{inscripciones.length} registros</span>}
                    </div>
                    {cargandoInscripciones ? (
                      <p className="mt-3 text-sm text-slate-500">Cargando inscripciones…</p>
                    ) : errorInscripciones ? (
                      <p role="alert" className="mt-3 text-sm text-rose-700">{errorInscripciones}</p>
                    ) : inscripciones.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-400">Este paciente todavía no tiene inscripciones.</p>
                    ) : (
                      <ol className="mt-3 divide-y divide-primary-100">
                        {inscripciones.map((turno) => (
                          <li key={turno.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-primary-900">
                                {fechaLinda(turno.fechaAtencion.slice(0, 10))} · N.º {turno.numeroOrdenDia ?? '—'}
                              </span>
                              <span className="block text-xs text-slate-500">{turno.motivo || 'Sin motivo registrado'}</span>
                              {turno.cancelacion?.motivo && <span className="block text-xs text-rose-700">Motivo de cancelación: {turno.cancelacion.motivo}</span>}
                              {turno.cancelacion?.usuario && <span className="block text-xs text-slate-400">Canceló {turno.cancelacion.usuario}{turno.cancelacion.fecha ? ` · ${new Date(turno.cancelacion.fecha).toLocaleString('es-AR')}` : ''}</span>}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${turno.estado === 'CANCELADO' ? 'bg-rose-50 text-rose-700' : 'bg-primary-50 text-primary-800'}`}>
                              {turno.estado.replace('_', ' ')}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
