import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Loader2, Play, UserRound, XCircle } from 'lucide-react'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { Card } from '@/components/ui/Card'
import type { TurnoApi } from '@/lib/api'

function nombreCompleto(paciente: TurnoApi['paciente']): string {
  return `${paciente.apellido}, ${paciente.nombre}`
}

function numeroAtencion(numero?: number): string {
  return numero !== undefined ? `N.º ${String(numero).padStart(2, '0')}` : 'Sin número'
}

interface ListaInscripcionesProps {
  turnos: TurnoApi[]
  basePacientes: string
  perfil: 'MEDICO' | 'SECRETARIA'
  procesandoId?: string | null
  onIniciar?: (turno: TurnoApi) => void
  onFinalizar?: (turno: TurnoApi) => void
  onCancelar?: (turno: TurnoApi) => void
  vacio?: string
}

export function ListaInscripciones({
  turnos,
  basePacientes,
  perfil,
  procesandoId,
  onIniciar,
  onFinalizar,
  onCancelar,
  vacio = 'No hay pacientes en esta sección.',
}: ListaInscripcionesProps) {
  if (turnos.length === 0) {
    return (
      <Card className="px-5 py-10 text-center">
        <UserRound className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
        <p className="mt-2 text-sm text-slate-500">{vacio}</p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-primary-100/70">
        {turnos.map((turno) => {
          const ocupado = procesandoId === turno.id
          const cancelado = turno.estado === 'CANCELADO'

          return (
            <li key={turno.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  className={`shrink-0 rounded-xl px-2.5 py-2 text-xs font-bold tabular-nums ${
                    cancelado ? 'bg-slate-100 text-slate-500' : 'bg-primary-900 text-white'
                  }`}
                  title="Número de atención del día"
                >
                  {numeroAtencion(turno.numeroOrdenDia)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-primary-950">{nombreCompleto(turno.paciente)}</p>
                  <p className="truncate text-xs text-slate-500">
                    DNI {turno.paciente.dni}
                    {turno.motivo ? ` · ${turno.motivo}` : ' · Sin motivo registrado'}
                  </p>
                  {turno.estado === 'ATENDIDO' && turno.horaFin && (
                    <p className="mt-1 text-xs text-slate-500">
                      Atención finalizada {new Date(turno.horaFin).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {cancelado && turno.cancelacion && (
                    <p className="mt-1 text-xs text-rose-700">
                      Cancelado
                      {turno.cancelacion.usuario ? ` por ${turno.cancelacion.usuario}` : ''}
                      {turno.cancelacion.motivo ? ` · ${turno.cancelacion.motivo}` : ''}
                    </p>
                  )}
                </div>
                <EstadoBadge estado={turno.estado} />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Link
                  to={`${basePacientes}/${turno.paciente.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 transition hover:bg-primary-50"
                >
                  <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                  Ficha
                </Link>
                <Link
                  to={`${basePacientes}/${turno.paciente.id}/historia${turno.estado === 'EN_ATENCION' && perfil === 'MEDICO' ? `?turnoId=${encodeURIComponent(turno.id)}` : ''}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 transition hover:bg-primary-50"
                >
                  <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
                  {turno.estado === 'EN_ATENCION' && perfil === 'MEDICO' ? 'Continuar atención' : 'Historia clínica'}
                </Link>

                {perfil === 'MEDICO' && turno.estado === 'EN_ESPERA' && onIniciar && (
                  <button
                    type="button"
                    disabled={procesandoId !== null}
                    onClick={() => onIniciar(turno)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-800 disabled:opacity-50"
                  >
                    {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Iniciar atención
                  </button>
                )}

                {perfil === 'MEDICO' && turno.estado === 'EN_ATENCION' && onFinalizar && (
                  <button
                    type="button"
                    disabled={procesandoId !== null}
                    onClick={() => onFinalizar(turno)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {ocupado ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Finalizar atención
                  </button>
                )}

                {perfil === 'SECRETARIA' &&
                  onCancelar &&
                  (turno.estado === 'EN_ESPERA' || turno.estado === 'EN_ATENCION') && (
                    <button
                      type="button"
                      onClick={() => onCancelar(turno)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      Cancelar
                    </button>
                  )}
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
