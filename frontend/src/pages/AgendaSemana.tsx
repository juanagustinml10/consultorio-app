import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { horaDe, nombreCompleto } from '@/components/dashboard/Listas'
import { turnosProximosDias } from '@/data/mock'
import type { Rol } from '@/types/domain'

/** Agenda semanal visual (datos de ejemplo). La edición completa queda para la etapa 2. */
export default function AgendaSemana() {
  // En una navegación real el rol vendría de la sesión. Para la demo se toma de la ruta.
  const esMedico = window.location.pathname.startsWith('/medico')
  const rol: Rol = esMedico ? 'MEDICO' : 'SECRETARIA'
  const volverA = esMedico ? '/medico' : '/secretaria'

  const grupos = turnosProximosDias
    .map((t) => ({
      fecha: new Date(t.fechaHora),
      turno: t,
    }))
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .reduce<Record<string, typeof turnosProximosDias>>((acc, { fecha, turno }) => {
      const clave = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      acc[clave] = [...(acc[clave] ?? []), turno]
      return acc
    }, {})

  return (
    <DashboardLayout rol={rol} usuarioLbl={esMedico ? 'Laura Pérez (sesión de ejemplo)' : 'Secretaría (sesión de ejemplo)'}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-primary-900 sm:text-base">
              <CalendarDays className="h-4.5 w-4.5 text-primary-500" aria-hidden="true" />
              Agenda semanal
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:hidden">Turnos de ejemplo</p>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              Vista visual con turnos de ejemplo (etapa futura: crear, mover y cancelar turnos desde aquí).
            </p>
          </div>
          <Link
            to={volverA}
            className="rounded-xl border border-primary-200 bg-white px-3.5 py-2 text-xs font-semibold text-primary-800 shadow-card transition hover:bg-primary-50"
          >
            Volver al resumen
          </Link>
        </div>

        <div className="space-y-5">
          {Object.entries(grupos).map(([dia, turnos]) => (
            <div key={dia}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-700 sm:text-sm">
                {dia} (ejemplo)
              </h3>
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
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}
          {turnosProximosDias.length === 0 && (
            <Card className="px-5 py-8 text-center">
              <p className="text-sm text-slate-500">No hay turnos próximos cargados de ejemplo.</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
