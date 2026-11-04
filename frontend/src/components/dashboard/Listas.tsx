import { useState } from 'react'
import type { Actividad, Turno } from '@/types/domain'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { Card } from '@/components/ui/Card'
import { Clipboard, Clock } from 'lucide-react'

/** Hora local amable a partir de un ISO (acepta "T09:30" local o UTC). */
export function horaDe(iso: string): string {
  const local = new Date(iso)
  return local.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export function nombreCompleto({ nombre, apellido }: { nombre: string; apellido?: string }) {
  return `${nombre} ${apellido ?? ''}`.trim()
}

// ---------- En espera ----------
export function ListaEnEspera({ turnos }: { turnos: Turno[] }) {
  if (turnos.length === 0) {
    return (
      <Card className="px-5 py-8 text-center">
        <p className="text-sm text-slate-500">No hay pacientes esperando en este momento.</p>
      </Card>
    )
  }
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-primary-100/70">
        {turnos.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-primary-800">
              {t.paciente.nombre[0]}
              {t.paciente.apellido[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-900">
                {nombreCompleto(t.paciente)}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  llegó {t.horaLlegada ? horaDe(t.horaLlegada) : '--:--'}
                </span>
                <span className="text-slate-300" aria-hidden="true">
                  ·
                </span>
                <span className="truncate">{t.motivo}</span>
              </p>
            </div>
            <EstadoBadge estado={t.estado} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ---------- En atención ----------
export function AtencionActual({ turno }: { turno: Turno | undefined }) {
  return (
    <Card
      className={turno ? 'border-primary-700 bg-primary-800 text-white shadow-card' : 'bg-slate-50'}
    >
      <div className="px-5 py-4">
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${turno ? 'text-accent-300' : 'text-slate-400'}`}
        >
          Paciente en atención
        </p>
        {turno ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-bold sm:text-lg">{nombreCompleto(turno.paciente)}</p>
              <p className="mt-0.5 text-sm text-white/70">
                {horaDe(turno.fechaHora)} — {turno.motivo}
              </p>
            </div>
            <EstadoBadge estado={turno.estado} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No hay paciente en consulta. Sala disponible.</p>
        )}
      </div>
    </Card>
  )
}

// ---------- Próximos turnos ----------
export function ProximosTurnos({ turnos }: { turnos: Turno[] }) {
  if (turnos.length === 0) {
    return (
      <Card className="px-5 py-8 text-center">
        <p className="text-sm text-slate-500">No hay más turnos para el resto del día.</p>
      </Card>
    )
  }
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-primary-100/70">
        {turnos.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-5 py-3">
            <span className="w-12 shrink-0 rounded-lg bg-primary-50 py-1 text-center text-xs font-bold text-primary-800 sm:text-sm">
              {horaDe(t.fechaHora)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary-900">{nombreCompleto(t.paciente)}</p>
              <p className="truncate text-xs text-slate-500">{t.motivo}</p>
            </div>
            <EstadoBadge estado={t.estado} />
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ---------- Actividad reciente ----------
const ICONO_TIPO = {
  turno: 'bg-primary-50 text-primary-700',
  paciente: 'bg-accent-100 text-accent-600',
  atencion: 'bg-emerald-50 text-emerald-600',
  aviso: 'bg-amber-50 text-amber-600',
} as const

export function ActividadReciente({ items }: { items: Actividad[] }) {
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-primary-100/70">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-3 px-5 py-3">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ICONO_TIPO[a.tipo]}`}>
              <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-primary-900">{a.descripcion}</p>
              <p className="mt-0.5 text-xs text-slate-400">{a.hora}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ---------- Agenda del día (secretaría) ----------
export function AgendaDelDia({ turnos }: { turnos: Turno[] }) {
  const [aviso, setAviso] = useState<string | null>(null)

  // PENDIENTE (etapa 2): PATCH /api/turnos/:id/estado mediante la API real.
  function registrarLlegada(turno: Turno) {
    setAviso(
      `Registro de ${nombreCompleto(turno.paciente)} disponible cuando se conecte la base de datos (etapa 2).`,
    )
    window.setTimeout(() => setAviso(null), 4000)
  }

  return (
    <div>
      <div aria-live="polite">
        {aviso && (
          <p className="mb-3 rounded-xl border border-accent-200 bg-accent-50 px-4 py-2.5 text-xs font-medium text-primary-800 sm:text-sm">
            {aviso}
          </p>
        )}
      </div>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-primary-100/70">
          {turnos.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <span className="w-12 shrink-0 rounded-lg bg-primary-50 py-1 text-center text-xs font-bold text-primary-800 sm:text-sm">
                {horaDe(t.fechaHora)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary-900">
                  {nombreCompleto(t.paciente)}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {t.motivo} · {t.paciente.obraSocial ?? 'sin cobertura'}
                </p>
              </div>
              <EstadoBadge estado={t.estado} />
              {t.estado === 'PROGRAMADO' && (
                <button
                  type="button"
                  onClick={() => registrarLlegada(t)}
                  className="rounded-xl border border-accent-300 bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-600 transition hover:bg-accent-100"
                >
                  Registrar llegada
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
