import type { ReactNode } from 'react'

interface StatCardProps {
  titulo: string
  valor: number
  detalle?: string
  icono: ReactNode
  tono?: 'azul' | 'celeste' | 'verde' | 'gris'
}

export function StatCard({ titulo, valor, detalle, icono, tono = 'gris' }: StatCardProps) {
  const esAzul = tono === 'azul'
  const iconoClases =
    tono === 'azul'
      ? 'bg-white/15 text-accent-300'
      : tono === 'celeste'
        ? 'bg-accent-100 text-accent-600'
        : tono === 'verde'
          ? 'bg-emerald-100 text-emerald-600'
          : 'bg-primary-50 text-primary-700'

  return (
    <div
      className={`rounded-2xl border p-4 shadow-card sm:p-5 ${esAzul ? 'border-primary-950 bg-primary-950' : 'border-primary-100 bg-white'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`truncate text-xs font-medium ${
              tono === 'azul' ? 'text-white/60' : tono === 'verde' ? 'text-emerald-700/80' : 'text-slate-500'
            }`}
          >
            {titulo}
          </p>
          <p
            className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
              tono === 'azul' ? 'text-white' : tono === 'verde' ? 'text-emerald-700' : 'text-primary-950'
            }`}
          >
            {valor}
          </p>
          {detalle && (
            <p className={`mt-0.5 truncate text-xs ${esAzul ? 'text-white/50' : 'text-slate-400'}`}>{detalle}</p>
          )}
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconoClases}`}>
          {icono}
        </span>
      </div>
    </div>
  )
}

/** Tarjeta de acceso rápido con destino real (o sección pendiente). */
interface AccesoRapidoProps {
  titulo: string
  descripcion: string
  icono: ReactNode
  to?: string
  pendiente?: boolean
}

export function AccesoRapido({ titulo, descripcion, icono, to, pendiente }: AccesoRapidoProps) {
  const contenido = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          pendiente ? 'bg-slate-100 text-slate-400' : 'bg-primary-50 text-primary-700'
        }`}
      >
        {icono}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold text-primary-900">
          {titulo}
          {pendiente && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              etapa 2
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{descripcion}</span>
      </span>
    </>
  )

  if (pendiente) {
    return (
      <div
        aria-disabled="true"
        className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-white p-4 shadow-card opacity-80 sm:p-5"
      >
        {contenido}
      </div>
    )
  }

  return (
    <a
      href={to}
      className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5"
    >
      {contenido}
    </a>
  )
}
