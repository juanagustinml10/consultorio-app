import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HeartPulse, Menu, MessageCircle, X } from 'lucide-react'
import { contacto } from '@/data/sitio'

const LINKS = [
  { href: '#sobre', label: 'Perfil' },
  { href: '#horarios', label: 'Horarios' },
  { href: '#obras-sociales', label: 'Obras sociales' },
  { href: '#ubicacion', label: 'Ubicación' },
  { href: '#faq', label: 'Preguntas' },
  { href: '#contacto', label: 'Contacto' },
]

export function SiteHeader() {
  const [abierto, setAbierto] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-primary-100/70 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <a href="#sobre" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-900">
              <HeartPulse className="h-5 w-5 text-accent-300" aria-hidden="true" />
            </span>
            <span className="truncate text-sm font-bold text-primary-900 sm:text-base">
              Dr. Gustavo Puertas
              <span className="block text-[11px] font-medium text-slate-500 sm:text-xs">
                Consultorio médico
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-primary-50 hover:text-primary-900"
              >
                {l.label}
              </a>
            ))}
            <a
              href={contacto.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center gap-1.5 rounded-xl bg-primary-900 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-primary-800"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          </nav>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-primary-900 transition hover:bg-primary-50 lg:hidden"
            aria-expanded={abierto}
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {abierto && (
        <div className="border-t border-primary-100 bg-white lg:hidden">
          <nav className="mx-auto max-w-6xl px-4 pb-4" aria-label="Navegación móvil">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setAbierto(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-900"
              >
                {l.label}
              </a>
            ))}
            <a
              href={contacto.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setAbierto(false)}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-primary-900 px-4 py-3 text-sm font-semibold text-white"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
            <Link
              to="/login"
              onClick={() => setAbierto(false)}
              className="mt-2 block rounded-xl border border-primary-200 px-4 py-3 text-center text-sm font-semibold text-primary-800"
            >
              Acceso al sistema
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
