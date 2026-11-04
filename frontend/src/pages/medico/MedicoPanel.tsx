import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  CalendarClock,
  ClipboardList,
  FolderOpen,
  LayoutGrid,
  Users,
} from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { StatCard, AccesoRapido } from '@/components/dashboard/StatCard'
import {
  ActividadReciente,
  AtencionActual,
  ListaEnEspera,
  ProximosTurnos,
} from '@/components/dashboard/Listas'
import { actividadDemo, turnosDemo } from '@/data/mock'
import type { Turno } from '@/types/domain'

const SEMANAL = [
  { dia: 'Lun', turnos: 9 },
  { dia: 'Mar', turnos: 7 },
  { dia: 'Mié', turnos: 10 },
  { dia: 'Jue', turnos: 8 },
  { dia: 'Vie', turnos: 6 },
  { dia: 'Sáb', turnos: 2 },
]

export default function MedicoPanel() {
  const enEspera = turnosDemo.filter((t) => t.estado === 'LLEGO')
  const enAtencion = turnosDemo.find((t) => t.estado === 'EN_ATENCION')
  const atendidos = turnosDemo.filter((t) => t.estado === 'ATENDIDO')
  const proximos = turnosDemo
    .filter((t) => t.estado === 'PROGRAMADO')
    .sort((a: Turno, b: Turno) => a.fechaHora.localeCompare(b.fechaHora))

  return (
    <DashboardLayout rol="MEDICO" usuarioLbl="Laura Pérez (sesión de ejemplo)">
      <div className="space-y-5">
        {/* Resumen rápido */}
        <section aria-label="Resumen del día">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-primary-900">Resumen de hoy</h2>
            <span className="text-xs text-slate-400">Datos de ejemplo — sin conexión a la base</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              titulo="Turnos agendados hoy"
              valor={turnosDemo.length}
              detalle="duración estándar 30 min"
              icono={<CalendarClock className="h-4.5 w-4.5" aria-hidden="true" />}
              tono="azul"
            />
            <StatCard
              titulo="Atendidos"
              valor={atendidos.length}
              detalle="consultas finalizadas"
              icono={<ClipboardList className="h-4.5 w-4.5" aria-hidden="true" />}
              tono="verde"
            />
            <StatCard
              titulo="En espera"
              valor={enEspera.length}
              detalle="en sala de espera"
              icono={<Users className="h-4.5 w-4.5" aria-hidden="true" />}
              tono="celeste"
            />
            <StatCard
              titulo="Programados"
              valor={proximos.length}
              detalle="resto del día"
              icono={<Activity className="h-4.5 w-4.5" aria-hidden="true" />}
            />
          </div>
        </section>

        {/* Cola de pacientes */}
        <section className="grid gap-5 xl:grid-cols-3" aria-label="Cola de atención">
          <div className="space-y-4 xl:col-span-2">
            <AtencionActual turno={enAtencion} />
            <div>
              <h2 className="mb-2.5 text-sm font-semibold text-primary-900">
                Pacientes en espera ({enEspera.length})
              </h2>
              <ListaEnEspera turnos={enEspera} />
            </div>
            <div>
              <h2 className="mb-2.5 text-sm font-semibold text-primary-900">Próximos turnos</h2>
              <ProximosTurnos turnos={proximos} />
            </div>
          </div>

          {/* Columna lateral */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-card sm:p-5">
              <h2 className="text-sm font-semibold text-primary-900">Accesos rápidos</h2>
              <div className="mt-3.5 space-y-3">
                <AccesoRapido
                  to="/medico/pacientes"
                  titulo="Pacientes"
                  descripcion="Buscar y ver fichas"
                  icono={<Users className="h-5 w-5" aria-hidden="true" />}
                />
                <AccesoRapido
                  pendiente
                  titulo="Historias clínicas"
                  descripcion="Se habilitan con la base de datos"
                  icono={<FolderOpen className="h-5 w-5" aria-hidden="true" />}
                />
                <AccesoRapido
                  pendiente
                  titulo="Editar agenda"
                  descripcion="Gestión de turnos en etapa 2"
                  icono={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-primary-100 bg-white px-4 pb-4 pt-5 shadow-card sm:px-5">
              <h2 className="text-sm font-semibold text-primary-900">Turnos por día (semana de ejemplo)</h2>
              <div className="mt-4 h-36 sm:h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SEMANAL} margin={{ top: 4, right: 0, left: -22, bottom: -2 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(14, 165, 233, 0.08)' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #d9e6f6',
                        fontSize: '12px',
                        padding: '6px 10px',
                      }}
                    />
                    <Bar dataKey="turnos" fill="#2a6bb8" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold text-primary-900">
                <LayoutGrid className="h-4 w-4 text-primary-400" aria-hidden="true" />
                Actividad reciente
              </h2>
              <ActividadReciente items={actividadDemo} />
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
