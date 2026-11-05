import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react'
import { cancelarInscripcion, type TurnoApi } from '@/lib/api'
import { mensajeDeError } from '@/pages/pacientes/errores'

const CLASE_INPUT =
  'mt-1.5 w-full rounded-xl border border-primary-100 bg-slate-50 px-3.5 py-2.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200'

interface ModalCancelacionProps {
  turno: TurnoApi | null
  onCerrar: () => void
  onCancelado: (turno: TurnoApi) => void
}

export function ModalCancelacion({ turno, onCerrar, onCancelado }: ModalCancelacionProps) {
  const submitLock = useRef(false)
  const [motivo, setMotivo] = useState('')
  const [confirmarAtencion, setConfirmarAtencion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!turno) return
    setMotivo('')
    setConfirmarAtencion(false)
    setGuardando(false)
    submitLock.current = false
    setError(null)
  }, [turno])

  useEffect(() => {
    if (!turno) return
    const alEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alEscape)
    return () => document.removeEventListener('keydown', alEscape)
  }, [turno, onCerrar])

  if (!turno) return null

  const turnoActual = turno
  const requiereConfirmacion = turnoActual.estado === 'EN_ATENCION'

  function confirmar() {
    if (submitLock.current) return
    if (requiereConfirmacion && !confirmarAtencion) return
    submitLock.current = true
    setGuardando(true)
    setError(null)
    cancelarInscripcion(turnoActual.id, {
      motivoCancelacion: motivo.trim() || null,
      ...(requiereConfirmacion && { confirmarAtencionIniciada: true }),
    })
      .then(({ turno: actualizado }) => onCancelado(actualizado))
      .catch((e) => setError(mensajeDeError(e, 'No se pudo cancelar la inscripción.')))
      .finally(() => {
        submitLock.current = false
        setGuardando(false)
      })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-primary-950/55 p-3 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cancelacion"
        className="my-6 w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-primary-100 px-5 py-4">
          <div>
            <h2 id="titulo-cancelacion" className="flex items-center gap-2 text-lg font-bold text-primary-950">
              <AlertTriangle className="h-5 w-5 text-rose-600" aria-hidden="true" />
              Cancelar inscripción
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              N.º {turno.numeroOrdenDia !== undefined ? String(turno.numeroOrdenDia).padStart(2, '0') : '—'} ·{' '}
              {turno.paciente.apellido}, {turno.paciente.nombre}
            </p>
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

        <div className="space-y-4 px-5 py-5">
          <p className="text-sm leading-relaxed text-slate-600">
            El paciente saldrá de las listas activas, pero <strong>no se eliminará</strong> de la base de datos.
            Su ficha y su historia clínica se conservan, y el número asignado no se reutiliza.
          </p>

          {requiereConfirmacion && (
            <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <input
                type="checkbox"
                checked={confirmarAtencion}
                onChange={(event) => setConfirmarAtencion(event.target.checked)}
                className="mt-0.5"
              />
              Confirmo que la atención ya iniciada será cancelada.
            </label>
          )}

          <div>
            <label htmlFor="motivoCancelacion" className="text-sm font-semibold text-primary-900">
              Motivo <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="motivoCancelacion"
              rows={3}
              maxLength={500}
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Motivo informado por el paciente, cambio de planes…"
              className={`${CLASE_INPUT} resize-none`}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-primary-100 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-xl border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-800 transition hover:bg-primary-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={guardando || (requiereConfirmacion && !confirmarAtencion)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50"
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              Confirmar cancelación
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
