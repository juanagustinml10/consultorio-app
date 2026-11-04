import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Construction } from 'lucide-react'
import type { Rol } from '@/types/domain'
import { DashboardLayout } from '@/layouts/DashboardLayout'

interface Defaults {
  titulo: string
  rol: Rol
}

const RUTAS: Record<string, Defaults> = {
  '/medico/pacientes': { titulo: 'Pacientes', rol: 'MEDICO' },
  '/medico/historias': { titulo: 'Historias clínicas', rol: 'MEDICO' },
  '/medico/agenda': { titulo: 'Agenda del médico', rol: 'MEDICO' },
  '/secretaria/llegadas': { titulo: 'Registrar llegada', rol: 'SECRETARIA' },
  '/secretaria/agenda': { titulo: 'Agenda de la secretaría', rol: 'SECRETARIA' },
}

/** Página para secciones aún no implementadas (etapa 2). */
export default function PendientePage() {
  const { pathname } = useLocation()
  const defaults = RUTAS[pathname]
  const { titulo = 'Sección', rol = 'MEDICO' } = defaults ?? {}

  return (
    <DashboardLayout rol={rol} usuarioLbl={rol === 'MEDICO' ? 'Laura Pérez (sesión de ejemplo)' : 'Secretaría (sesión de ejemplo)'}>
      <div className="flex flex-col items-center rounded-2xl border border-primary-100 bg-white px-6 py-16 text-center shadow-card">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
          <Construction className="h-7 w-7 text-primary-500" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-lg font-bold text-primary-900 sm:text-xl">{titulo}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Esta sección se implementará en la etapa 2, cuando la interfaz se conecte con la API y la base de
          datos PostgreSQL. Por el momento no está disponible.
        </p>
        <Link
          to={rol === 'MEDICO' ? '/medico' : '/secretaria'}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al resumen
        </Link>
      </div>
    </DashboardLayout>
  )
}
