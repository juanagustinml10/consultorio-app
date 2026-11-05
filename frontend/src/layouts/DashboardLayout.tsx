import { useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, FolderClosed, HeartPulse, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { Rol } from '@/types/domain'

interface ItemNav {
  to: string
  label: string
  icono: ReactNode
  badge?: string
  fin?: boolean
}

const NAV_MEDICO: ItemNav[] = [
  { to: '/medico', label: 'Resumen del día', icono: <LayoutDashboard className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />, fin: true },
  { to: '/medico/pacientes', label: 'Pacientes', icono: <Users className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> },
  { to: '/medico/historias', label: 'Historias clínicas', icono: <FolderClosed className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> },
  { to: '/medico/estadisticas', label: 'Estadísticas e informes', icono: <BarChart3 className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> },
]

const NAV_SECRETARIA: ItemNav[] = [
  { to: '/secretaria', label: 'Jornada e inscripciones', icono: <LayoutDashboard className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />, fin: true },
  { to: '/secretaria/pacientes', label: 'Pacientes', icono: <Users className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> },
  { to: '/secretaria/historias', label: 'Historias clínicas', icono: <FolderClosed className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> },
  { to: '/secretaria/estadisticas', label: 'Estadísticas e informes', icono: <BarChart3 className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /> },
]

const NOMBRES_PANEL = {
  MEDICO: 'Panel del médico',
  SECRETARIA: 'Panel de recepción',
} as const

function NavItem({ item, onNavigate }: { item: ItemNav; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.fin}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-primary-800 text-white shadow-card'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <span className="flex items-center gap-3">
        {item.icono}
        {item.label}
      </span>
      {item.badge && (
        <span className="rounded-full bg-accent-400/20 px-2 py-0.5 text-[10px] font-semibold text-accent-300">
          {item.badge}
        </span>
      )}
    </NavLink>
  )
}

function inicialesDe(nombre: string): string {
  const partes = nombre.split(' ').filter((p) => p && !p.startsWith('(') && !p.startsWith('—'))
  return partes.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

interface DashboardLayoutProps {
  rol: Rol
  children: ReactNode
}

export function DashboardLayout({ rol, children }: DashboardLayoutProps) {
  const [drawer, setDrawer] = useState(false)
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  const usuarioLbl = usuario ? `${usuario.nombre} ${usuario.apellido}` : ''

  const nav = rol === 'MEDICO' ? NAV_MEDICO : NAV_SECRETARIA

  const cerrarSesion = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-[#f5f8fd]">
      {/* Sidebar (pantallas grandes) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-primary-950 p-4 lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-1.5 py-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-800">
            <HeartPulse className="h-5 w-5 text-accent-300" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold text-white">Consultorio</span>
        </Link>
        <p className="mt-1 px-2 text-[11px] font-medium text-white/40">{NOMBRES_PANEL[rol]}</p>
        <nav className="mt-5 space-y-1" aria-label={`Navegación ${NOMBRES_PANEL[rol]}`}>
          {nav.map((i) => (
            <NavItem key={i.to} item={i} />
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-700 text-[11px] font-bold text-white">
              {inicialesDe(usuarioLbl)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-white">{usuarioLbl}</span>
              <span className="block text-[10px] text-white/40">
                {rol === 'MEDICO' ? 'Médico' : 'Secretaría'}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Drawer móvil */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm" onClick={() => setDrawer(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-primary-950 p-4 shadow-card-hover">
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-800">
                  <HeartPulse className="h-5 w-5 text-accent-300" aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-white">Consultorio</span>
              </span>
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 px-2 text-[11px] font-medium text-white/40">{NOMBRES_PANEL[rol]}</p>
            <nav className="mt-5 flex-1 space-y-1" aria-label="Navegación móvil">
              {nav.map((i) => (
                <NavItem key={i.to} item={i} onNavigate={() => setDrawer(false)} />
              ))}
            </nav>
            <button
              type="button"
              onClick={cerrarSesion}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
              Cerrar sesión
            </button>
          </aside>
        </div>
      )}

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-primary-100/80 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-900 transition hover:bg-primary-50 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="min-w-0 truncate text-sm font-semibold text-primary-900 sm:text-base lg:text-lg">
              {NOMBRES_PANEL[rol]}
            </h1>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-semibold text-primary-900">{usuarioLbl}</span>
                <span className="block text-xs text-slate-400">
                  {rol === 'MEDICO' ? 'Médico' : 'Secretaría'}
                </span>
              </span>
              <button
                type="button"
                onClick={cerrarSesion}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-800 text-xs font-bold text-white shadow-card transition hover:bg-primary-700"
                title="Cuenta (cerrar sesión)"
              >
                {inicialesDe(usuarioLbl)}
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pt-6">{children}</main>
      </div>
    </div>
  )
}
