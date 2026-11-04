import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  ClipboardList,
  DoorOpen,
  Search,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { StatCard } from '@/components/dashboard/StatCard'
import { AgendaDelDia, horaDe, nombreCompleto } from '@/components/dashboard/Listas'
import { pacientesDemo, turnosDemo } from '@/data/mock'
import type { Paciente } from '@/types/domain'

export default function SecretariaPanel() {
  const consultas = turnosDemo.filter((t) => t.estado === 'PROGRAMADO')
  const llegaron = turnosDemo.filter((t) => t.estado === 'LLEGO' || t.estado === 'EN_ATENCION')
  const esperan = turnosDemo.filter((t) => t.estado === 'LLEGO')
  const atendidos = turnosDemo.filter((t) => t.estado === 'ATENDIDO')

  const [q, setQ] = useState('')
  const resultados = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    return pacientesDemo.filter((p: Paciente) =>
      `${p.nombre} ${p.apellido} ${p.dni}`.toLowerCase().includes(term),
    )
  }, [q])

  const agendaHoy = [...turnosDemo].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))

  return (
    <DashboardLayout rol="SECRETARIA" usuarioLbl="Secretaría (sesión de ejemplo)">
      <div className="space-y-5">
        {/* Resumen del día */}
        <section aria-label="Resumen del día">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-primary-900">Resumen de hoy</h2>
            <span className="text-xs text-slate-400">Datos de ejemplo — sin conexión a la base</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              titulo="Turnos programados"
              valor={consultas.length}
              detalle="aún no llegaron"
              icono={<CalendarClock className="h-4.5 w-4.5" aria-hidden="true" />}
            />
            <StatCard
              titulo="Ya llegaron"
              valor={llegaron.length}
              detalle="presentes en consultorio"
              icono={<DoorOpen className="h-4.5 w-4.5" aria-hidden="true" />}
              tono="verde"
            />
            <StatCard
              titulo="En espera"
              valor={esperan.length}
              detalle="sala de espera"
              icono={<UsersRound className="h-4.5 w-4.5" aria-hidden="true" />}
              tono="celeste"
            />
            <StatCard
              titulo="Atendidos"
              valor={atendidos.length}
              detalle="finalizados hoy"
              icono={<ClipboardList className="h-4.5 w-4.5" aria-hidden="true" />}
              tono="azul"
            />
          </div>
        </section>

        {/* Acciones rápidas de recepción */}
        <section className="grid gap-4 sm:grid-cols-2" aria-label="Acciones de recepción">
          <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-primary-900">
              <Search className="h-4 w-4 text-primary-400" aria-hidden="true" />
              Buscar paciente
            </h2>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre, apellido o DNI…"
              className="mt-3 w-full rounded-xl border border-primary-100 bg-slate-50 px-3.5 py-2.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
              aria-label="Buscar paciente por nombre, apellido o DNI"
            />
            <div className="mt-3 min-h-10">
              {q && resultados.length === 0 && (
                <p className="px-1 text-xs text-slate-400">Sin coincidencias en los datos de ejemplo.</p>
              )}
              <ul className="space-y-2">
                {resultados.slice(0, 3).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-primary-50/70 px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-primary-900">
                        {nombreCompleto(p)}
                      </span>
                      <span className="block text-xs text-slate-500">
                        DNI {p.dni} · {p.obraSocial ?? 'sin cobertura'}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      ejemplo
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-card sm:p-5">
            <h2 className="text-sm font-semibold text-primary-900">Nuevos pacientes</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
              Registro disponible al conectar la base de datos (etapa 2). La misma pantalla servirá para
              gestionar los pacientes existentes.
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <span
                aria-disabled="true"
                className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-primary-950 px-4 py-2.5 text-sm font-semibold text-white opacity-60"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Registrar paciente
              </span>
              <span
                aria-disabled="true"
                className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-800 opacity-60"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Listado completo
              </span>
            </div>
          </div>
        </section>

        {/* Agenda + llegadas */}
        <section className="grid gap-5 xl:grid-cols-3" aria-label="Agenda y llegadas">
          <div className="xl:col-span-2">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-primary-900">Agenda del consultorio</h2>
              <Link to="/secretaria/agenda" className="text-xs font-medium text-primary-700 hover:underline">
                Ver semana completa
              </Link>
            </div>
            <AgendaDelDia turnos={agendaHoy} />
          </div>
          <div>
            <h2 className="mb-2.5 text-sm font-semibold text-primary-900">Llegadas pendientes de confirmar</h2>
            <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-card sm:p-5">
              <p className="text-xs leading-relaxed text-slate-500">
                Al conectar la base (etapa 2) el botón “Registrar llegada” de la agenda guardará la hora en
                PostgreSQL y sumará al paciente a la cola en tiempo real. Las horas muestran{' '}
                <span className="font-medium text-primary-900">hora de llegada</span> ya registrada.
              </p>
              <ul className="mt-3 space-y-2">
                {turnosDemo
                  .filter((t) => t.estado === 'LLEGO' && t.horaLlegada)
                  .map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-medium text-primary-900">
                        {nombreCompleto(t.paciente)}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{horaDe(t.horaLlegada!)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
