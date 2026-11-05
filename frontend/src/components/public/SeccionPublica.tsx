import type { ReactNode } from 'react'

interface SeccionPublicaProps {
  id: string
  titulo?: string
  subtitulo?: string
  children: ReactNode
  className?: string
  alternada?: boolean
}

/** Contenedor de sección de la página pública (fondo alternado bien diferenciado). */
export function SeccionPublica({
  id,
  titulo,
  subtitulo,
  children,
  className = '',
  alternada = false,
}: SeccionPublicaProps) {
  return (
    <section id={id} className={`${alternada ? 'bg-primary-50/60' : 'bg-white'} ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {(titulo || subtitulo) && (
          <div className="mb-10 max-w-2xl">
            <span
              className="mb-4 block h-1 w-12 rounded-full bg-gradient-to-r from-primary-600 to-accent-400"
              aria-hidden="true"
            />
            {titulo && (
              <h2 className="text-2xl font-bold tracking-tight text-primary-900 sm:text-3xl md:text-4xl">
                {titulo}
              </h2>
            )}
            {subtitulo && <p className="mt-3 text-sm text-slate-500 sm:text-base">{subtitulo}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
