import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, UserPlus, UserRound, Users } from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import { getPacientes, type PacienteApi } from '@/lib/api'
import type { Rol } from '@/types/domain'

const POR_PAGINA = 10

function iniciales({ nombre, apellido }: { nombre: string; apellido: string }) {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase()
}

function fechaLinda(iso?: string): string | undefined {
  if (!iso) return undefined
  const d = new Date(`${iso}T00:00`)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Página compartida de PACIENTES (roles MEDICO y SECRETARIA) con datos reales de la API. */
export default function PacientesPage() {
  const { usuario } = useAuth()
  const rol: Rol = usuario?.rol === 'MEDICO' ? 'MEDICO' : 'SECRETARIA'
  const base = rol === 'MEDICO' ? '/medico/pacientes' : '/secretaria/pacientes'
  const navigate = useNavigate()

  const [busqueda, setBusqueda] = useState('')
  const [consulta, setConsulta] = useState('') // valor debounced efectivo
  const [pagina, setPagina] = useState(1)
  const [refresco, setRefresco] = useState(0) // reintento manual tras un error
  const [pacientes, setPacientes] = useState<PacienteApi[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Búsqueda con reinicia a página 1 y debounce, para no golpear la API por cada tecla.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setConsulta(busqueda.trim())
      setPagina(1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [busqueda])

  useEffect(() => {
    let cancelado = false // evita flap de estado tras desmontar
    setCargando(true)
    setError(null)
    getPacientes(consulta || undefined, pagina, POR_PAGINA)
      .then((data) => {
        setPacientes(data.items)
        setTotal(data.total)
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo cargar el listado de pacientes.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [consulta, pagina, refresco])

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const hayFiltro = consulta.length > 0

  return (
    <DashboardLayout rol={rol}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-primary-900 sm:text-lg">
              <Users className="h-4.5 w-4.5 text-primary-500" aria-hidden="true" />
              Pacientes
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:hidden">Registro de pacientes</p>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              {total === 1 ? '1 paciente registrado' : `${total} pacientes registrados`}
              {hayFiltro && ' (resultados de la búsqueda)'}
            </p>
          </div>
          <Link
            to={`${base}/nuevo`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-900 px-3.5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-800"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Registrar paciente
          </Link>
        </div>

        {/* Búsqueda */}
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
              placeholder="Buscar por nombre, apellido o DNI…"
              className="w-full rounded-xl border border-primary-100 bg-slate-50 py-2.5 pl-10 pr-3.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
              aria-label="Buscar paciente por nombre, apellido o DNI"
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
            <button
              type="button"
              onClick={() => setRefresco((r) => r + 1)}
              className="mt-3 rounded-xl bg-primary-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-800"
            >
              Reintentar
            </button>
          </Card>
        )}

        {!cargando && !error && pacientes.length === 0 && (
          <Card className="px-6 py-12 text-center">
            <UserRound className="mx-auto h-7 w-7 text-slate-300" aria-hidden="true" />
            {hayFiltro ? (
              <>
                <p className="mt-3 text-sm font-semibold text-primary-900">
                  Sin coincidencias para “{consulta}”
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Probá con otro nombre, apellido o DNI.
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm font-semibold text-primary-900">
                  Todavía no hay pacientes registrados
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Registrá el primero con el botón “Registrar paciente”.
                </p>
              </>
            )}
          </Card>
        )}

        {!cargando && !error && pacientes.length > 0 && (
          <>
            {/* Móvil: tarjetas */}
            <div className="grid gap-3 sm:hidden" role="list" aria-label="Pacientes">
              {pacientes.map((paciente) => (
                <button
                  type="button"
                  role="listitem"
                  key={paciente.id}
                  onClick={() => navigate(`${base}/${paciente.id}`)}
                  className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-white px-4 py-3.5 text-left shadow-card transition active:bg-primary-50/60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-primary-800">
                    {iniciales(paciente)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-primary-900">
                      {paciente.apellido}, {paciente.nombre}
                    </span>
                    <span className="numeros-tabulares block truncate text-xs text-slate-500">
                      DNI {paciente.dni} · {paciente.obraSocial ?? 'sin cobertura'}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              ))}
            </div>

            {/* Escritorio: tabla */}
            <Card className="hidden overflow-hidden sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-primary-100 bg-primary-50/60 text-xs uppercase tracking-wide text-primary-700">
                    <th scope="col" className="px-5 py-3 font-semibold">
                      Paciente
                    </th>
                    <th scope="col" className="px-3 py-3 font-semibold">
                      DNI
                    </th>
                    <th scope="col" className="hidden px-3 py-3 font-semibold xl:table-cell">
                      Teléfono
                    </th>
                    <th scope="col" className="hidden px-3 py-3 font-semibold lg:table-cell">
                      Obra social / afiliado
                    </th>
                    <th scope="col" className="w-10 px-3 py-3">
                      <span className="sr-only">Abrir ficha</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100/70">
                  {pacientes.map((paciente) => (
                    <tr
                      key={paciente.id}
                      className="cursor-pointer transition hover:bg-primary-50/40"
                      onClick={() => navigate(`${base}/${paciente.id}`)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-primary-800">
                            {iniciales(paciente)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-primary-900">
                              {paciente.apellido}, {paciente.nombre}
                            </p>
                            {paciente.fechaNacimiento && (
                              <p className="numeros-tabulares text-xs text-slate-400">
                                nac. {fechaLinda(paciente.fechaNacimiento)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="numeros-tabulares px-3 py-3 text-slate-600">
                        {paciente.dni}
                      </td>
                      <td className="numeros-tabulares hidden px-3 py-3 text-slate-600 xl:table-cell">
                        {paciente.telefono ?? '—'}
                      </td>
                      <td className="hidden px-3 py-3 lg:table-cell">
                        <p className="truncate text-primary-900">{paciente.obraSocial ?? 'Sin cobertura'}</p>
                        {paciente.numeroAfiliado && (
                          <p className="numeros-tabulares truncate text-xs text-slate-400">
                            afiliado {paciente.numeroAfiliado}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Paginación */}
            {paginas > 1 && (
              <nav
                className="flex items-center justify-center gap-3"
                aria-label="Páginas de pacientes"
              >
                <button
                  type="button"
                  disabled={pagina <= 1 || cargando}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-200 bg-white text-primary-800 transition hover:bg-primary-50 disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="numeros-tabulares text-sm text-slate-600">
                  Página {pagina} de {paginas}
                </span>
                <button
                  type="button"
                  disabled={pagina >= paginas || cargando}
                  onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary-200 bg-white text-primary-800 transition hover:bg-primary-50 disabled:opacity-40"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
