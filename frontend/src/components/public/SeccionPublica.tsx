import type { ReactNode } from 'react'

interface SeccionPublicaProps {
  id: string
  titulo?: string
  subtitulo?: string
  children: ReactNode
  className?: string
  alternada?: boolean
}

/** Contenedor de sección de la página pública (gris alternado para separar). */
export function SeccionPublica({
  id,
  titulo,
  subtitulo,
  children,
  className = '',
  alternada = false,
}: SeccionPublicaProps) {
  return (
    <section id={id} className={`${alternada ? 'bg-slate-50' : 'bg-white'} ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {(titulo || subtitulo) && (
          <div className="mb-8 max-w-2xl">
            {titulo && (
              <h2 className="text-xl font-bold tracking-tight text-primary-900 sm:text-2xl md:text-3xl">
                {titulo}
              </h2>
            )}
            {subtitulo && <p className="mt-2 text-sm text-slate-500 sm:text-base">{subtitulo}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
