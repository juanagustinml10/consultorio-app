import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

interface ProtectedRouteProps {
  children: ReactNode
  /** Si se especifica, también valida el rol. */
  rol?: 'MEDICO' | 'SECRETARIA'
}

export function ProtectedRoute({ children, rol }: ProtectedRouteProps) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f8fd]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-900 border-t-transparent" />
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (rol && usuario.rol !== rol) {
    return <Navigate to={usuario.rol === 'MEDICO' ? '/medico' : '/secretaria'} replace />
  }

  return <>{children}</>
}