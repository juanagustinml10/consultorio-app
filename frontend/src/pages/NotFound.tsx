import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'

/** Página 404, también cubre rutas privadas inexistentes. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
          <Compass className="h-7 w-7 text-primary-500" aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm font-semibold text-primary-600">Error 404</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-primary-900 sm:text-2xl">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          La dirección que visitás no existe o fue cambiada.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-800"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          Ir al sitio del consultorio
        </Link>
      </div>
    </div>
  )
}
