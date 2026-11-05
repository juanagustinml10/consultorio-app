import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  History,
  Loader2,
  Pencil,
  Pill,
  Plus,
  ShieldAlert,
  Stethoscope,
  User,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import {
  crearConsulta,
  cambiarEstadoAtencion,
  editarConsulta,
  editarEncabezadoHistoria,
  getHistoriaClinica,
  getInscripcion,
  type TurnoApi,
  type ConsultaApi,
  type HistoriaClinicaApi,
  type PayloadConsulta,
  type PayloadEncabezadoHistoria,
} from '@/lib/api'
import { mensajeDeError } from '@/pages/pacientes/errores'
import type { Rol } from '@/types/domain'

function ahoraIsoLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function aDatetimeLocal(iso?: string | null): string {
  if (!iso) return ahoraIsoLocal()
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ahoraIsoLocal()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fechaHoraLinda(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const fecha = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return `${fecha} · ${hora} hs`
}

function fechaSolo(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const CLASE_INPUT =
  'mt-1.5 w-full rounded-xl border border-primary-100 bg-slate-50 px-3.5 py-2.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200'

export default function HistoriaClinicaPage() {
  const { usuario } = useAuth()
  const rol: Rol = usuario?.rol === 'MEDICO' ? 'MEDICO' : 'SECRETARIA'
  const base = rol === 'MEDICO' ? '/medico/pacientes' : '/secretaria/pacientes'

  const { pacienteId } = useParams<{ pacienteId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const turnoId = rol === 'MEDICO' ? searchParams.get('turnoId') : null
  const [turnoAtencion, setTurnoAtencion] = useState<TurnoApi | null>(null)
  const [idConsultaAtencion, setIdConsultaAtencion] = useState<string | null>(null)
  const [cargandoAtencion, setCargandoAtencion] = useState(false)
  const [errorAtencion, setErrorAtencion] = useState<string | null>(null)
  const [finalizando, setFinalizando] = useState(false)

  const [datosClinicos, setDatosClinicos] = useState<HistoriaClinicaApi | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [avisoOk, setAvisoOk] = useState<string | null>(null)

  // Estado para edición de antecedentes
  const [editandoAntecedentes, setEditandoAntecedentes] = useState(false)
  const [guardandoAntecedentes, setGuardandoAntecedentes] = useState(false)
  const [errorAntecedentes, setErrorAntecedentes] = useState<string | null>(null)
  const [formAntecedentes, setFormAntecedentes] = useState<PayloadEncabezadoHistoria>({})

  // Estado para formulario de consulta (nueva o edición)
  const [modalConsulta, setModalConsulta] = useState<{
    abierto: boolean
    modo: 'crear' | 'editar'
    consultaId?: string
    valores: {
      fecha: string
      motivoConsulta: string
      diagnostico: string
      evaluacion: string
      sintomas: string
      tratamiento: string
      indicaciones: string
      proximoControl: string
    }
  }>({
    abierto: false,
    modo: 'crear',
    valores: {
      fecha: ahoraIsoLocal(),
      motivoConsulta: '',
      diagnostico: '',
      evaluacion: '',
      sintomas: '',
      tratamiento: '',
      indicaciones: '',
      proximoControl: '',
    },
  })
  const [guardandoConsulta, setGuardandoConsulta] = useState(false)
  const envioConsultaEnCurso = useRef(false)
  const [errorConsulta, setErrorConsulta] = useState<string | null>(null)

  // Estado para historial de versiones expandido por consulta
  const [versionesExpandidas, setVersionesExpandidas] = useState<Record<string, boolean>>({})

  function cargarHistoria() {
    if (!pacienteId) return
    setCargando(true)
    setErrorCarga(null)
    getHistoriaClinica(pacienteId)
      .then((data) => {
        setDatosClinicos(data)
        setFormAntecedentes({
          antecedentesPersonales: data.historia.antecedentesPersonales ?? '',
          antecedentesFamiliares: data.historia.antecedentesFamiliares ?? '',
          alergias: data.historia.alergias ?? '',
          medicacionHabitual: data.historia.medicacionHabitual ?? '',
          observaciones: data.historia.observaciones ?? '',
        })
      })
      .catch((e) => setErrorCarga(mensajeDeError(e, 'No se pudo cargar la historia clínica.')))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargarHistoria()
    setTurnoAtencion(null)
    setIdConsultaAtencion(null)
    setErrorAtencion(null)
    if (!turnoId || !pacienteId) return
    let cancelado = false
    setCargandoAtencion(true)
    Promise.all([getInscripcion(turnoId), getHistoriaClinica(pacienteId)])
      .then(([atencion, historiaActual]) => {
        if (cancelado) return
        if (atencion.turno.paciente.id !== pacienteId || atencion.turno.estado !== 'EN_ATENCION') {
          throw new Error('La inscripción no corresponde a este paciente o ya no está en atención.')
        }
        setTurnoAtencion(atencion.turno)
        setIdConsultaAtencion(atencion.consulta?.id ?? null)
        setDatosClinicos(historiaActual)
        setFormAntecedentes({
          antecedentesPersonales: historiaActual.historia.antecedentesPersonales ?? '',
          antecedentesFamiliares: historiaActual.historia.antecedentesFamiliares ?? '',
          alergias: historiaActual.historia.alergias ?? '',
          medicacionHabitual: historiaActual.historia.medicacionHabitual ?? '',
          observaciones: historiaActual.historia.observaciones ?? '',
        })
        if (atencion.consulta) {
          const consulta = historiaActual.historia.consultas.find((item) => item.id === atencion.consulta?.id)
          if (consulta) abrirEditarConsulta(consulta)
        } else {
          abrirNuevaConsulta()
        }
      })
      .catch((error) => {
        if (!cancelado) setErrorAtencion(mensajeDeError(error, 'No se pudo abrir la atención.'))
      })
      .finally(() => { if (!cancelado) setCargandoAtencion(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { cancelado = true }
  }, [pacienteId, turnoId])

  function mostrarAviso(msg: string) {
    setAvisoOk(msg)
    window.setTimeout(() => setAvisoOk(null), 4000)
  }

  // Guardar modificación de antecedentes
  async function handleGuardarAntecedentes(e: React.FormEvent) {
    e.preventDefault()
    if (!pacienteId) return
    setGuardandoAntecedentes(true)
    setErrorAntecedentes(null)

    try {
      const res = await editarEncabezadoHistoria(pacienteId, {
        antecedentesPersonales: formAntecedentes.antecedentesPersonales || null,
        antecedentesFamiliares: formAntecedentes.antecedentesFamiliares || null,
        alergias: formAntecedentes.alergias || null,
        medicacionHabitual: formAntecedentes.medicacionHabitual || null,
        observaciones: formAntecedentes.observaciones || null,
      })
      setDatosClinicos((prev) =>
        prev
          ? {
              ...prev,
              historia: {
                ...prev.historia,
                ...res.historia,
              },
            }
          : null,
      )
      setEditandoAntecedentes(false)
      mostrarAviso('Antecedentes actualizados correctamente.')
    } catch (err) {
      setErrorAntecedentes(mensajeDeError(err, 'No se pudieron guardar los antecedentes.'))
    } finally {
      setGuardandoAntecedentes(false)
    }
  }

  // Abrir modal para nueva consulta
  function abrirNuevaConsulta() {
    setErrorConsulta(null)
    setModalConsulta({
      abierto: true,
      modo: 'crear',
      valores: {
        fecha: ahoraIsoLocal(),
        motivoConsulta: '',
        diagnostico: '',
        evaluacion: '',
        sintomas: '',
        tratamiento: '',
        indicaciones: '',
        proximoControl: '',
      },
    })
  }

  // Abrir modal para editar consulta
  function abrirEditarConsulta(c: ConsultaApi) {
    setErrorConsulta(null)
    setModalConsulta({
      abierto: true,
      modo: 'editar',
      consultaId: c.id,
      valores: {
        fecha: aDatetimeLocal(c.fecha),
        motivoConsulta: c.motivoConsulta ?? '',
        diagnostico: c.diagnostico ?? '',
        evaluacion: c.evaluacion ?? '',
        sintomas: c.sintomas ?? '',
        tratamiento: c.tratamiento ?? '',
        indicaciones: c.indicaciones ?? '',
        proximoControl: c.proximoControl ? c.proximoControl.slice(0, 10) : '',
      },
    })
  }

  // Guardar consulta (crear o editar)
  async function handleGuardarConsulta(e: React.FormEvent) {
    e.preventDefault()
    if (!pacienteId || envioConsultaEnCurso.current) return

    envioConsultaEnCurso.current = true
    setGuardandoConsulta(true)
    setErrorConsulta(null)

    const payload: PayloadConsulta = {
      fecha: modalConsulta.valores.fecha ? modalConsulta.valores.fecha : undefined,
      motivoConsulta: modalConsulta.valores.motivoConsulta.trim() || null,
      diagnostico: modalConsulta.valores.diagnostico.trim() || null,
      evaluacion: modalConsulta.valores.evaluacion.trim() || null,
      sintomas: modalConsulta.valores.sintomas.trim() || null,
      tratamiento: modalConsulta.valores.tratamiento.trim() || null,
      indicaciones: modalConsulta.valores.indicaciones.trim() || null,
      proximoControl: modalConsulta.valores.proximoControl
        ? `${modalConsulta.valores.proximoControl}T00:00:00`
        : null,
      esCorreccion: modalConsulta.modo === 'editar',
    }

    try {
      if (modalConsulta.modo === 'crear') {
        const { consulta } = await crearConsulta(pacienteId, payload, turnoId ?? undefined)
        if (turnoId) setIdConsultaAtencion(consulta.id)
        setDatosClinicos((prev) => {
          if (!prev) return null
          return {
            ...prev,
            historia: {
              ...prev.historia,
              consultas: [consulta, ...prev.historia.consultas],
            },
          }
        })
        mostrarAviso('Consulta médica registrada con éxito.')
      } else if (modalConsulta.consultaId) {
        const { consulta } = await editarConsulta(modalConsulta.consultaId, payload)
        setDatosClinicos((prev) => {
          if (!prev) return null
          return {
            ...prev,
            historia: {
              ...prev.historia,
              consultas: prev.historia.consultas.map((item) =>
                item.id === consulta.id ? consulta : item,
              ),
            },
          }
        })
        mostrarAviso('Consulta modificada correctamente. Se conservó la versión anterior.')
      }
      setModalConsulta((m) => ({ ...m, abierto: false }))
    } catch (err) {
      setErrorConsulta(mensajeDeError(err, 'No se pudo guardar la consulta.'))
    } finally {
      envioConsultaEnCurso.current = false
      setGuardandoConsulta(false)
    }
  }

  function toggleVersiones(consultaId: string) {
    setVersionesExpandidas((prev) => ({
      ...prev,
      [consultaId]: !prev[consultaId],
    }))
  }

  const paciente = datosClinicos?.paciente
  const historia = datosClinicos?.historia
  const consultas = historia?.consultas ?? []

  async function finalizarAtencion() {
    if (!turnoAtencion || finalizando) return
    const campos = modalConsulta.valores
    const hayCambiosSinGuardar = modalConsulta.abierto && (
      modalConsulta.modo === 'crear'
        ? Boolean(campos.motivoConsulta || campos.diagnostico || campos.evaluacion || campos.sintomas || campos.tratamiento || campos.indicaciones || campos.proximoControl)
        : Boolean(idConsultaAtencion && consultas.find((c) => c.id === idConsultaAtencion && (
            campos.motivoConsulta !== (c.motivoConsulta ?? '') || campos.diagnostico !== (c.diagnostico ?? '') ||
            campos.evaluacion !== (c.evaluacion ?? '') || campos.sintomas !== (c.sintomas ?? '') ||
            campos.tratamiento !== (c.tratamiento ?? '') || campos.indicaciones !== (c.indicaciones ?? '')
          )))
    )
    if (hayCambiosSinGuardar && !window.confirm('Hay cambios de consulta sin guardar. Si finalizás ahora, se descartarán. ¿Continuar?')) return
    if (!window.confirm('¿Confirmás finalizar la atención?')) return
    setFinalizando(true)
    setErrorAtencion(null)
    try {
      await cambiarEstadoAtencion(turnoAtencion.id, 'ATENDIDO')
      mostrarAviso('Atención finalizada correctamente.')
      navigate('/medico', { state: { aviso: 'Atención finalizada correctamente.' } })
    } catch (error) {
      setErrorAtencion(mensajeDeError(error, 'No se pudo finalizar la atención.'))
    } finally {
      setFinalizando(false)
    }
  }

  return (
    <DashboardLayout rol={rol}>
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Navegación y enlace de retorno */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`${base}/${pacienteId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 transition hover:underline underline-offset-4"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a la ficha del paciente
          </Link>
          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
            Historia Clínica Digital
          </span>
        </div>

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
          <Card className="flex items-center justify-center px-5 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-900" aria-hidden="true" />
          </Card>
        )}

        {!cargando && errorCarga && (
          <Card className="px-5 py-8 text-center">
            <p className="text-sm text-rose-600">{errorCarga}</p>
            <button
              type="button"
              onClick={cargarHistoria}
              className="mt-3 rounded-xl bg-primary-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-800"
            >
              Reintentar
            </button>
          </Card>
        )}

        {!cargando && !errorCarga && paciente && historia && (
          <>
            {turnoId && (
              <Card className="border-accent-200 bg-accent-50/60 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary-700">Atención actual</p>
                    {cargandoAtencion ? (
                      <p className="mt-1 text-sm text-slate-600">Cargando inscripción…</p>
                    ) : errorAtencion ? (
                      <p role="alert" className="mt-1 text-sm text-rose-700">{errorAtencion}</p>
                    ) : turnoAtencion ? (
                      <p className="mt-1 text-sm font-semibold text-primary-950">
                        N.º {turnoAtencion.numeroOrdenDia ?? '—'} · EN ATENCIÓN · Historia clínica y consulta en esta pantalla
                      </p>
                    ) : null}
                  </div>
                  {turnoAtencion && (
                    <button
                      type="button"
                      disabled={finalizando || !idConsultaAtencion}
                      onClick={() => void finalizarAtencion()}
                      title={!idConsultaAtencion ? 'Guardá la consulta antes de finalizar' : undefined}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {finalizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Finalizar atención
                    </button>
                  )}
                </div>
              </Card>
            )}
            {/* Encabezado del paciente */}
            <Card className="px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-base font-bold text-primary-800">
                    {paciente.nombre[0]?.toUpperCase()}
                    {paciente.apellido[0]?.toUpperCase()}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-primary-900 sm:text-xl">
                      {paciente.apellido}, {paciente.nombre}
                    </h2>
                    <p className="numeros-tabulares text-xs text-slate-500 sm:text-sm">
                      DNI {paciente.dni}
                      {paciente.obraSocial && ` · ${paciente.obraSocial}`}
                      {paciente.numeroAfiliado && ` (${paciente.numeroAfiliado})`}
                      {paciente.fechaNacimiento && ` · Nac. ${fechaSolo(paciente.fechaNacimiento)}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                      type="button"
                      onClick={() => {
                        const consultaGuardada = consultas.find((item) => item.id === idConsultaAtencion)
                        if (turnoId && !modalConsulta.abierto && modalConsulta.modo === 'editar' && modalConsulta.consultaId === idConsultaAtencion) {
                          setErrorConsulta(null)
                          setModalConsulta((actual) => ({ ...actual, abierto: true }))
                        }
                        else if (consultaGuardada) abrirEditarConsulta(consultaGuardada)
                        else if (turnoId) {
                          setErrorConsulta(null)
                          setModalConsulta((actual) => ({ ...actual, abierto: true }))
                        }
                        else abrirNuevaConsulta()
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-800"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      {turnoId ? (idConsultaAtencion ? 'Editar consulta actual' : 'Registrar consulta actual') : 'Nueva consulta'}
                  </button>
                </div>
              </div>
            </Card>

            {/* SECCIÓN 1: Antecedentes, Alergias y Datos Clínicos */}
            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-primary-100/70 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  <h3 className="text-base font-bold text-primary-900">
                    Antecedentes y Datos Clínicos de Base
                  </h3>
                  {historia.version > 1 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      v{historia.version}
                    </span>
                  )}
                </div>
                {!editandoAntecedentes && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorAntecedentes(null)
                      setFormAntecedentes({
                        antecedentesPersonales: historia.antecedentesPersonales ?? '',
                        antecedentesFamiliares: historia.antecedentesFamiliares ?? '',
                        alergias: historia.alergias ?? '',
                        medicacionHabitual: historia.medicacionHabitual ?? '',
                        observaciones: historia.observaciones ?? '',
                      })
                      setEditandoAntecedentes(true)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary-800 transition hover:bg-primary-50"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar antecedentes
                  </button>
                )}
              </div>

              {editandoAntecedentes ? (
                <form onSubmit={handleGuardarAntecedentes} className="space-y-4">
                  {errorAntecedentes && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {errorAntecedentes}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="alergias"
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-rose-700"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Alergias conocidas
                      </label>
                      <input
                        id="alergias"
                        type="text"
                        placeholder="Ej: Penicilina, AINEs, látex, mariscos…"
                        value={formAntecedentes.alergias ?? ''}
                        onChange={(e) =>
                          setFormAntecedentes((prev) => ({ ...prev, alergias: e.target.value }))
                        }
                        className={`${CLASE_INPUT} border-rose-200 bg-rose-50/40`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="antecedentesPersonales"
                        className="text-xs font-bold uppercase tracking-wide text-primary-800"
                      >
                        Antecedentes personales
                      </label>
                      <textarea
                        id="antecedentesPersonales"
                        rows={3}
                        placeholder="Patologías previas, cirugías, internaciones, hábitos…"
                        value={formAntecedentes.antecedentesPersonales ?? ''}
                        onChange={(e) =>
                          setFormAntecedentes((prev) => ({
                            ...prev,
                            antecedentesPersonales: e.target.value,
                          }))
                        }
                        className={CLASE_INPUT}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="antecedentesFamiliares"
                        className="text-xs font-bold uppercase tracking-wide text-primary-800"
                      >
                        Antecedentes familiares
                      </label>
                      <textarea
                        id="antecedentesFamiliares"
                        rows={3}
                        placeholder="Cardiopatías, diabetes, oncología, HTA en familiares de 1er grado…"
                        value={formAntecedentes.antecedentesFamiliares ?? ''}
                        onChange={(e) =>
                          setFormAntecedentes((prev) => ({
                            ...prev,
                            antecedentesFamiliares: e.target.value,
                          }))
                        }
                        className={CLASE_INPUT}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="medicacionHabitual"
                        className="text-xs font-bold uppercase tracking-wide text-primary-800"
                      >
                        Medicación habitual
                      </label>
                      <textarea
                        id="medicacionHabitual"
                        rows={3}
                        placeholder="Fármacos que consume regularmente con dosis y posología…"
                        value={formAntecedentes.medicacionHabitual ?? ''}
                        onChange={(e) =>
                          setFormAntecedentes((prev) => ({
                            ...prev,
                            medicacionHabitual: e.target.value,
                          }))
                        }
                        className={CLASE_INPUT}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="observacionesClinicas"
                        className="text-xs font-bold uppercase tracking-wide text-primary-800"
                      >
                        Observaciones clínicas generales
                      </label>
                      <textarea
                        id="observacionesClinicas"
                        rows={3}
                        placeholder="Otras notas clínicas o advertencias relevantes…"
                        value={formAntecedentes.observaciones ?? ''}
                        onChange={(e) =>
                          setFormAntecedentes((prev) => ({
                            ...prev,
                            observaciones: e.target.value,
                          }))
                        }
                        className={CLASE_INPUT}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      disabled={guardandoAntecedentes}
                      onClick={() => setEditandoAntecedentes(false)}
                      className="rounded-xl border border-primary-200 bg-white px-3.5 py-2 text-xs font-semibold text-primary-800 hover:bg-primary-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoAntecedentes}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
                    >
                      {guardandoAntecedentes && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Guardar antecedentes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Alergias con destaque visual prioritario */}
                  <div className="sm:col-span-2">
                    <div
                      className={`flex items-start gap-3 rounded-xl p-3.5 ${
                        historia.alergias
                          ? 'border border-rose-200 bg-rose-50 text-rose-900'
                          : 'border border-primary-100 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <AlertTriangle
                        className={`h-5 w-5 shrink-0 ${historia.alergias ? 'text-rose-600' : 'text-slate-400'}`}
                      />
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider">
                          Alergias
                        </span>
                        <p className="mt-0.5 text-sm font-medium">
                          {historia.alergias || 'Sin alergias conocidas registradas.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Antecedentes personales */}
                  <div className="rounded-xl border border-primary-100 bg-slate-50/60 p-3.5">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-primary-800">
                      Antecedentes personales
                    </span>
                    <p className="mt-1 text-sm text-primary-950 whitespace-pre-line">
                      {historia.antecedentesPersonales || (
                        <span className="text-slate-400 italic">No especificados</span>
                      )}
                    </p>
                  </div>

                  {/* Antecedentes familiares */}
                  <div className="rounded-xl border border-primary-100 bg-slate-50/60 p-3.5">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-primary-800">
                      Antecedentes familiares
                    </span>
                    <p className="mt-1 text-sm text-primary-950 whitespace-pre-line">
                      {historia.antecedentesFamiliares || (
                        <span className="text-slate-400 italic">No especificados</span>
                      )}
                    </p>
                  </div>

                  {/* Medicación habitual */}
                  <div className="rounded-xl border border-primary-100 bg-slate-50/60 p-3.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-800">
                      <Pill className="h-3.5 w-3.5 text-primary-600" />
                      Medicación habitual
                    </span>
                    <p className="mt-1 text-sm text-primary-950 whitespace-pre-line">
                      {historia.medicacionHabitual || (
                        <span className="text-slate-400 italic">Sin medicación declarada</span>
                      )}
                    </p>
                  </div>

                  {/* Observaciones generales */}
                  <div className="rounded-xl border border-primary-100 bg-slate-50/60 p-3.5">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-primary-800">
                      Observaciones clínicas
                    </span>
                    <p className="mt-1 text-sm text-primary-950 whitespace-pre-line">
                      {historia.observaciones || (
                        <span className="text-slate-400 italic">Sin observaciones</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* SECCIÓN 2: Historial de Consultas Médicas */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary-700" aria-hidden="true" />
                  <h3 className="text-base font-bold text-primary-900 sm:text-lg">
                    Consultas Médicas
                  </h3>
                  <span className="rounded-full bg-primary-900 px-2.5 py-0.5 text-xs font-bold text-white">
                    {consultas.length}
                  </span>
                </div>
                {!turnoId && (
                  <button
                    type="button"
                    onClick={abrirNuevaConsulta}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary-900 px-3.5 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primary-800 sm:text-sm"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Registrar consulta
                  </button>
                )}
              </div>

              {consultas.length === 0 ? (
                <Card className="px-6 py-12 text-center">
                  <Stethoscope className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-primary-900">
                    Todavía no hay consultas registradas para este paciente
                  </p>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Iniciá el historial haciendo clic en el botón “Registrar consulta”.
                  </p>
                  {!turnoId && (
                    <button
                      type="button"
                      onClick={abrirNuevaConsulta}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primary-800 sm:text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Registrar primera consulta
                    </button>
                  )}
                </Card>
              ) : (
                <div className="space-y-4">
                  {consultas.map((c) => {
                    const expandido = !!versionesExpandidas[c.id]
                    const tieneVersiones = (c.versiones && c.versiones.length > 0) || c.version > 1

                    return (
                      <Card key={c.id} className="overflow-hidden border-primary-100">
                        {/* Cabecera de la consulta */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100/70 bg-primary-50/40 px-5 py-3 sm:px-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-primary-950 sm:text-sm">
                              <Calendar className="h-4 w-4 text-primary-600" />
                              {fechaHoraLinda(c.fecha)}
                            </span>
                            {c.registradoPor && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <User className="h-3.5 w-3.5 text-slate-400" />
                                {c.registradoPor}
                              </span>
                            )}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              v{c.version}
                            </span>
                            {c.esCorreccion && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                Corregida
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {tieneVersiones && (
                              <button
                                type="button"
                                onClick={() => toggleVersiones(c.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-white px-2.5 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-50"
                                title="Ver historial de cambios y versiones anteriores"
                              >
                                <History className="h-3.5 w-3.5" />
                                {expandido ? 'Ocultar versiones' : `Versiones (${c.versiones?.length ?? (c.version - 1)})`}
                              </button>
                            )}
                            {(!turnoId || c.id === idConsultaAtencion) && (
                              <button
                                type="button"
                                onClick={() => abrirEditarConsulta(c)}
                                className="inline-flex items-center gap-1 rounded-lg bg-primary-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-primary-800"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Modificar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Cuerpo de la consulta */}
                        <div className="space-y-3.5 p-5 sm:p-6">
                          {/* Motivo de consulta */}
                          {c.motivoConsulta && (
                            <div>
                              <span className="block text-xs font-bold uppercase tracking-wider text-primary-800">
                                Motivo de consulta
                              </span>
                              <p className="mt-0.5 text-sm font-semibold text-primary-950">
                                {c.motivoConsulta}
                              </p>
                            </div>
                          )}

                          {/* Diagnóstico */}
                          {c.diagnostico && (
                            <div className="rounded-xl border border-primary-200/80 bg-primary-50/60 p-3.5">
                              <span className="block text-xs font-bold uppercase tracking-wider text-primary-900">
                                Diagnóstico
                              </span>
                              <p className="mt-1 text-sm font-semibold text-primary-950 whitespace-pre-line">
                                {c.diagnostico}
                              </p>
                            </div>
                          )}

                          {/* Evolución y Síntomas */}
                          {(c.evaluacion || c.sintomas) && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {c.evaluacion && (
                                <div>
                                  <span className="block text-xs font-bold uppercase tracking-wider text-primary-800">
                                    Evolución clínica
                                  </span>
                                  <p className="mt-1 text-sm text-primary-900 whitespace-pre-line">
                                    {c.evaluacion}
                                  </p>
                                </div>
                              )}
                              {c.sintomas && (
                                <div>
                                  <span className="block text-xs font-bold uppercase tracking-wider text-primary-800">
                                    Síntomas referidos
                                  </span>
                                  <p className="mt-1 text-sm text-primary-900 whitespace-pre-line">
                                    {c.sintomas}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tratamiento e Indicaciones */}
                          {(c.tratamiento || c.indicaciones) && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {c.tratamiento && (
                                <div>
                                  <span className="block text-xs font-bold uppercase tracking-wider text-primary-800">
                                    Tratamiento indicado
                                  </span>
                                  <p className="mt-1 text-sm text-primary-900 whitespace-pre-line">
                                    {c.tratamiento}
                                  </p>
                                </div>
                              )}
                              {c.indicaciones && (
                                <div>
                                  <span className="block text-xs font-bold uppercase tracking-wider text-primary-800">
                                    Indicaciones / Observaciones
                                  </span>
                                  <p className="mt-1 text-sm text-primary-900 whitespace-pre-line">
                                    {c.indicaciones}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Próximo control */}
                          {c.proximoControl && (
                            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                              <Clock className="h-3.5 w-3.5 text-primary-600" />
                              <span>Próximo control sugerido:</span>
                              <strong className="text-primary-900">{fechaSolo(c.proximoControl)}</strong>
                            </div>
                          )}
                        </div>

                        {/* Historial de versiones anteriores (si está expandido) */}
                        {expandido && (
                          <div className="border-t border-primary-100 bg-slate-50/80 p-5 sm:p-6">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-900">
                              <History className="h-4 w-4 text-primary-600" />
                              Historial de versiones anteriores (auditoría de cambios)
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Instantáneas previas conservadas antes de cada corrección o modificación.
                            </p>

                            <div className="mt-3.5 space-y-3">
                              {c.versiones && c.versiones.length > 0 ? (
                                c.versiones.map((v) => (
                                  <div
                                    key={v.id}
                                    className="rounded-xl border border-primary-200/70 bg-white p-3.5 shadow-sm"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                                        Versión {v.version} anterior
                                      </span>
                                      <span className="text-xs text-slate-500">
                                        Guardada el {fechaHoraLinda(v.capturadoEn)}
                                        {v.capturadoPor && ` por ${v.capturadoPor}`}
                                      </span>
                                    </div>
                                    <dl className="mt-2.5 grid gap-2 text-xs sm:grid-cols-2">
                                      {v.datos.fecha ? (
                                        <div>
                                          <dt className="font-semibold text-slate-500">Fecha y hora</dt>
                                          <dd className="text-primary-950 font-medium">
                                            {fechaHoraLinda(String(v.datos.fecha))}
                                          </dd>
                                        </div>
                                      ) : null}
                                      {v.datos.motivoConsulta ? (
                                        <div>
                                          <dt className="font-semibold text-slate-500">Motivo</dt>
                                          <dd className="text-primary-950 font-medium">
                                            {String(v.datos.motivoConsulta)}
                                          </dd>
                                        </div>
                                      ) : null}
                                      {v.datos.diagnostico ? (
                                        <div>
                                          <dt className="font-semibold text-slate-500">Diagnóstico</dt>
                                          <dd className="text-primary-950 font-medium">
                                            {String(v.datos.diagnostico)}
                                          </dd>
                                        </div>
                                      ) : null}
                                      {v.datos.tratamiento ? (
                                        <div>
                                          <dt className="font-semibold text-slate-500">Tratamiento</dt>
                                          <dd className="text-primary-950">
                                            {String(v.datos.tratamiento)}
                                          </dd>
                                        </div>
                                      ) : null}
                                      {v.datos.evaluacion ? (
                                        <div>
                                          <dt className="font-semibold text-slate-500">Evolución</dt>
                                          <dd className="text-primary-950">
                                            {String(v.datos.evaluacion)}
                                          </dd>
                                        </div>
                                      ) : null}
                                      {v.datos.indicaciones ? (
                                        <div>
                                          <dt className="font-semibold text-slate-500">Indicaciones</dt>
                                          <dd className="text-primary-950">
                                            {String(v.datos.indicaciones)}
                                          </dd>
                                        </div>
                                      ) : null}
                                      {v.datos.sintomas ? (
                                        <div>
                                          <dt className="font-semibold text-slate-500">Síntomas</dt>
                                          <dd className="text-primary-950">
                                            {String(v.datos.sintomas)}
                                          </dd>
                                        </div>
                                      ) : null}
                                      {v.datos.proximoControl ? (
                                        <div>
                                          <dt className="font-semibold text-slate-500">Próximo control</dt>
                                          <dd className="text-primary-950">
                                            {fechaSolo(String(v.datos.proximoControl))}
                                          </dd>
                                        </div>
                                      ) : null}
                                    </dl>
                                    {v.datos.cambios && v.datos.cambios.length > 0 && (
                                      <div className="mt-3 border-t border-slate-100 pt-2.5">
                                        <p className="text-xs font-semibold text-slate-600">Cambios realizados</p>
                                        <ul className="mt-1 space-y-1 text-xs text-slate-600">
                                          {v.datos.cambios.map((cambio) => (
                                            <li key={cambio.campo}>
                                              <span className="font-semibold">{cambio.etiqueta}:</span>{' '}
                                              {cambio.anterior ?? 'Sin dato'} → {cambio.nuevo ?? 'Sin dato'}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400">
                                  No hay snapshots anteriores registrados en el archivo.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal de Registro / Edición de Consulta */}
        {modalConsulta.abierto && (
          <div className={turnoId
            ? 'mx-auto mt-5 w-full max-w-5xl scroll-mt-5'
            : 'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary-950/50 p-4 backdrop-blur-sm sm:items-center'}>
            <div className={`my-2 w-full rounded-2xl border border-primary-100 bg-white p-5 shadow-card sm:p-7 ${turnoId ? '' : 'max-w-2xl shadow-xl sm:my-8'}`}>
              <div className="flex items-center justify-between border-b border-primary-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-primary-700" />
                  <h3 id="titulo-consulta" className="text-lg font-bold text-primary-900">
                    {turnoId
                      ? (modalConsulta.modo === 'crear' ? 'Consulta de esta atención' : 'Modificar consulta de esta atención')
                      : (modalConsulta.modo === 'crear' ? 'Registrar Nueva Consulta' : 'Modificar Consulta')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalConsulta((m) => ({ ...m, abierto: false }))}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label={turnoId ? 'Ocultar formulario' : 'Cerrar'}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modalConsulta.modo === 'editar' && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <History className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Conservación de historial:</strong> al guardar esta modificación, la versión previa quedará registrada íntegra para auditoría.
                  </span>
                </div>
              )}

              {errorConsulta && (
                <div role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorConsulta}</span>
                </div>
              )}

              <form onSubmit={handleGuardarConsulta} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="consultaFecha"
                      className="text-xs font-bold uppercase tracking-wide text-primary-800"
                    >
                      Fecha y hora
                    </label>
                    <input
                      id="consultaFecha"
                      type="datetime-local"
                      required
                      value={modalConsulta.valores.fecha}
                      onChange={(e) =>
                        setModalConsulta((m) => ({
                          ...m,
                          valores: { ...m.valores, fecha: e.target.value },
                        }))
                      }
                      className={CLASE_INPUT}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="consultaMotivo"
                      className="text-xs font-bold uppercase tracking-wide text-primary-800"
                    >
                      Motivo de consulta
                    </label>
                    <input
                      id="consultaMotivo"
                      type="text"
                      placeholder="Ej: Control de rutina, Fiebre y odinofagia…"
                      value={modalConsulta.valores.motivoConsulta}
                      onChange={(e) =>
                        setModalConsulta((m) => ({
                          ...m,
                          valores: { ...m.valores, motivoConsulta: e.target.value },
                        }))
                      }
                      className={CLASE_INPUT}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="consultaDiagnostico"
                    className="text-xs font-bold uppercase tracking-wide text-primary-800"
                  >
                    Diagnóstico
                  </label>
                  <input
                    id="consultaDiagnostico"
                    type="text"
                    placeholder="Ej: Faringitis aguda bacteriana, Hipertensión controlada…"
                    value={modalConsulta.valores.diagnostico}
                    onChange={(e) =>
                      setModalConsulta((m) => ({
                        ...m,
                        valores: { ...m.valores, diagnostico: e.target.value },
                      }))
                    }
                    className={CLASE_INPUT}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="consultaEvaluacion"
                      className="text-xs font-bold uppercase tracking-wide text-primary-800"
                    >
                      Evolución clínica
                    </label>
                    <textarea
                      id="consultaEvaluacion"
                      rows={3}
                      placeholder="Hallazgos del examen físico, evolución del cuadro…"
                      value={modalConsulta.valores.evaluacion}
                      onChange={(e) =>
                        setModalConsulta((m) => ({
                          ...m,
                          valores: { ...m.valores, evaluacion: e.target.value },
                        }))
                      }
                      className={CLASE_INPUT}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="consultaSintomas"
                      className="text-xs font-bold uppercase tracking-wide text-primary-800"
                    >
                      Síntomas referidos
                    </label>
                    <textarea
                      id="consultaSintomas"
                      rows={3}
                      placeholder="Signos, molestias y cronología relatados por el paciente…"
                      value={modalConsulta.valores.sintomas}
                      onChange={(e) =>
                        setModalConsulta((m) => ({
                          ...m,
                          valores: { ...m.valores, sintomas: e.target.value },
                        }))
                      }
                      className={CLASE_INPUT}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="consultaTratamiento"
                      className="text-xs font-bold uppercase tracking-wide text-primary-800"
                    >
                      Tratamiento indicado
                    </label>
                    <textarea
                      id="consultaTratamiento"
                      rows={3}
                      placeholder="Medicamentos, dosis, pautas farmacológicas…"
                      value={modalConsulta.valores.tratamiento}
                      onChange={(e) =>
                        setModalConsulta((m) => ({
                          ...m,
                          valores: { ...m.valores, tratamiento: e.target.value },
                        }))
                      }
                      className={CLASE_INPUT}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="consultaIndicaciones"
                      className="text-xs font-bold uppercase tracking-wide text-primary-800"
                    >
                      Indicaciones / Observaciones
                    </label>
                    <textarea
                      id="consultaIndicaciones"
                      rows={3}
                      placeholder="Pautas de alarma, reposo, estudios solicitados…"
                      value={modalConsulta.valores.indicaciones}
                      onChange={(e) =>
                        setModalConsulta((m) => ({
                          ...m,
                          valores: { ...m.valores, indicaciones: e.target.value },
                        }))
                      }
                      className={CLASE_INPUT}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="consultaProximoControl"
                    className="text-xs font-bold uppercase tracking-wide text-primary-800"
                  >
                    Próximo control sugerido (opcional)
                  </label>
                  <input
                    id="consultaProximoControl"
                    type="date"
                    value={modalConsulta.valores.proximoControl}
                    onChange={(e) =>
                      setModalConsulta((m) => ({
                        ...m,
                        valores: { ...m.valores, proximoControl: e.target.value },
                      }))
                    }
                    className={`${CLASE_INPUT} max-w-xs`}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-primary-100">
                  <button
                    type="button"
                    disabled={guardandoConsulta}
                    onClick={() => setModalConsulta((m) => ({ ...m, abierto: false }))}
                    className="rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-800 hover:bg-primary-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoConsulta}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60 shadow-card"
                  >
                    {guardandoConsulta && <Loader2 className="h-4 w-4 animate-spin" />}
                    {modalConsulta.modo === 'crear' ? 'Registrar consulta' : 'Guardar corrección'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
