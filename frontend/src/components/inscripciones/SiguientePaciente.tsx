import { Link } from 'react-router-dom'
import { Bell, ClipboardList, Clock3, Loader2, Play, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import type { TurnoApi } from '@/lib/api'

function numeroAtencion(numero?: number): string {
  return numero !== undefined ? `N.º ${String(numero).padStart(2, '0')}` : 'Sin número'
}

function tiempoEnEspera(creadoEn?: string): string | null {
  if (!creadoEn) return null
  const ingreso = new Date(creadoEn)
  if (Number.isNaN(ingreso.getTime())) return null
  const minutos = Math.max(0, Math.floor((Date.now() - ingreso.getTime()) / 60_000))
  if (minutos < 1) return 'Recién llegado/a'
  if (minutos < 60) return `Esperando hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return `Esperando hace ${horas} h${resto > 0 ? ` ${resto} min` : ''}`
}

interface SiguientePacienteProps {
  turno: TurnoApi | null
  totalEnEspera: number
  esHoy: boolean
  basePacientes: string
  procesandoId?: string | null
  onIniciar?: (turno: TurnoApi) => void
}

export function SiguientePaciente({
  turno,
  totalEnEspera,
  esHoy,
  basePacientes,
  procesandoId,
  onIniciar,
}: SiguientePacienteProps) {
  if (!turno) {
    return (
      <Card className="border-dashed p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Aviso previo</p>
            <p className="text-sm font-semibold text-primary-900">No hay pacientes en espera</p>
            <p className="text-xs text-slate-500">Cuando la secretaría inscriba al próximo paciente, aparecerá acá.</p>
          </div>
        </div>
      </Card>
    )
  }

  const ocupado = procesandoId === turno.id
  const espera = esHoy ? tiempoEnEspera(turno.creadoEn) : null

  return (
    <Card className="overflow-hidden border-accent-200">
      <div className="flex flex-col gap-4 border-l-4 border-accent-400 bg-accent-50/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="shrink-0 rounded-xl bg-primary-900 px-2.5 py-2 text-xs font-bold tabular-nums text-white"
            title="Número de atención del día"
          >
            {numeroAtencion(turno.numeroOrdenDia)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-accent-700">
                <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                Aviso previo · Siguiente paciente
              </p>
              {totalEnEspera > 1 && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  +{totalEnEspera - 1} en espera
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-base font-bold text-primary-950">
              {turno.paciente.apellido}, {turno.paciente.nombre}
            </p>
            <p className="truncate text-xs text-slate-500">
              DNI {turno.paciente.dni}
              {turno.paciente.obraSocial ? ` · ${turno.paciente.obraSocial}` : ''}
            </p>
            <p className="truncate text-xs text-slate-500">
              {turno.motivo ? `Motivo: ${turno.motivo}` : 'Sin motivo registrado'}
            </p>
            {espera && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent-700">
                <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                {espera}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Link
            to={`${basePacientes}/${turno.paciente.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-800 transition hover:bg-primary-50"
          >
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            Ficha
          </Link>
          <Link
            to={`${basePacientes}/${turno.paciente.id}/historia`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-800 transition hover:bg-primary-50"
          >
            <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
            Historia clínica
          </Link>
          {onIniciar && (
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
        </div>
      </div>
    </Card>
  )
}
