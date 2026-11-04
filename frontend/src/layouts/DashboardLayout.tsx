import { useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { HeartPulse, LogOut, Menu, X } from 'lucide-react'
import type { Rol } from '@/types/domain'

interface ItemNav {
  to: string
  label: string
  icono: ReactNode
  badge?: string
  fin?: boolean
}

const NAV_MEDICO: ItemNav[] = [
  { to: '/medico', label: 'Resumen del día', icono: <LayoutDashboardIcon />, fin: true },
  { to: '/medico/pacientes', label: 'Pacientes', icono: <UsersIcon /> },
  { to: '/medico/historias', label: 'Historias clínicas', icono: <FolderIcon />, badge: 'etapa 2' },
  { to: '/medico/agenda', label: 'Agenda', icono: <CalendarIcon />, badge: 'etapa 2' },
]

const NAV_SECRETARIA: ItemNav[] = [
  { to: '/secretaria', label: 'Resumen del día', icono: <LayoutDashboardIcon />, fin: true },
  { to: '/secretaria/llegadas', label: 'Registrar llegada', icono: <UsersIcon />, fin: true },
  { to: '/secretaria/agenda', label: 'Agenda', icono: <CalendarIcon />, badge: 'etapa 2' },
]

const NOMBRES_PANEL = {
  MEDICO: 'Panel del médico',
  SECRETARIA: 'Panel de recepción',
} as const

// Iconos trazados inline para no acoplar nombres de Lucide al layout
function LayoutDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

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
            : 'text-accent-100/80 hover:bg-white/10 hover:text-white'
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

interface DashboardLayoutProps {
  rol: Rol
  /** Nombre del usuario conectado (etapa 2: vendrá de la sesión) */
  usuarioLbl: string
  children: ReactNode
}

export function DashboardLayout({ rol, usuarioLbl, children }: DashboardLayoutProps) {
  const [drawer, setDrawer] = useState(false)
  const navigate = useNavigate()

  const nav = rol === 'MEDICO' ? NAV_MEDICO : NAV_SECRETARIA

  return (
    <div className="flex min-h-screen bg-slate-50">
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
        <div className="mt-auto border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
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
          <div className="absolute inset-0 bg-primary-950/40" onClick={() => setDrawer(false)} aria-hidden="true" />
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
              onClick={() => navigate('/login')}
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
        <header className="sticky top-0 z-30 border-b border-primary-100 bg-white/90 shadow-sm backdrop-blur">
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
                <span className="block text-xs text-slate-500">{rol === 'MEDICO' ? 'Médico' : 'Secretaría'}</span>
              </span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-900 text-xs font-bold text-white shadow-card transition hover:bg-primary-800"
                title="Cuenta (cerrar sesión)"
              >
                {usuarioLbl
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')}
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pt-6">{children}</main>
      </div>
    </div>
  )
}
