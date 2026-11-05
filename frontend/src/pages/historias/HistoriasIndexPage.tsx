import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList, FolderClosed, Search, UserRound } from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import { getPacientes, type PacienteApi } from '@/lib/api'
import type { Rol } from '@/types/domain'

function iniciales({ nombre, apellido }: { nombre: string; apellido: string }) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase()
}

export default function HistoriasIndexPage() {
  const { usuario } = useAuth()
  const rol: Rol = usuario?.rol === 'MEDICO' ? 'MEDICO' : 'SECRETARIA'
  const base = rol === 'MEDICO' ? '/medico/pacientes' : '/secretaria/pacientes'
  const navigate = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [consulta, setConsulta] = useState('')
  const [pacientes, setPacientes] = useState<PacienteApi[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setConsulta(busqueda.trim())
    }, 300)
    return () => window.clearTimeout(t)
  }, [busqueda])

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    getPacientes(consulta || undefined, 1, 20)
      .then((data) => {
        if (!cancelado) setPacientes(data.items)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo cargar el listado para historias clínicas.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [consulta])

  return (
    <DashboardLayout rol={rol}>
      <div className="space-y-5">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-primary-900 sm:text-lg">
            <FolderClosed className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Historias Clínicas
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Seleccioná un paciente para consultar o registrar antecedentes, alergias y consultas médicas.
          </p>
        </div>

        {/* Buscador */}
        <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-card sm:p-5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar paciente por nombre, apellido o DNI para abrir su historia clínica…"
              className="w-full rounded-xl border border-primary-100 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
              aria-label="Buscar paciente"
            />
          </div>
        </div>

        {cargando && (
          <Card className="flex items-center justify-center px-5 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-900 border-t-transparent" />
          </Card>
        )}

        {!cargando && error && (
          <Card className="px-5 py-8 text-center">
            <p className="text-sm text-rose-600">{error}</p>
          </Card>
        )}

        {!cargando && !error && pacientes.length === 0 && (
          <Card className="px-6 py-12 text-center">
            <UserRound className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-primary-900">
              {consulta ? `Sin resultados para “${consulta}”` : 'No hay pacientes registrados'}
            </p>
          </Card>
        )}

        {!cargando && !error && pacientes.length > 0 && (
          <div className="space-y-3">
            {pacientes.map((p) => (
              <Card
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4 transition hover:border-primary-300 sm:px-6"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-sm font-bold text-primary-800">
                    {iniciales(p)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-primary-950 sm:text-base">
                      {p.apellido}, {p.nombre}
                    </p>
                    <p className="numeros-tabulares text-xs text-slate-500">
                      DNI {p.dni} · {p.obraSocial ?? 'Sin cobertura'}
                      {p.numeroAfiliado && ` · Afiliado: ${p.numeroAfiliado}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    to={`${base}/${p.id}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-800 transition hover:bg-primary-50 sm:text-sm"
                  >
                    Ver ficha
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate(`${base}/${p.id}/historia`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-3.5 py-2 text-xs font-semibold text-white shadow-card transition hover:bg-primary-800 sm:text-sm"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Abrir historia clínica
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
