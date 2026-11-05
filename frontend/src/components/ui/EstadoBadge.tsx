import type { EstadoTurno } from '@/types/domain'

const ESTADOS: Record<EstadoTurno, { etiqueta: string; clases: string; punto: string }> = {
  EN_ESPERA: {
    etiqueta: 'En espera',
    clases: 'bg-accent-100 text-accent-600',
    punto: 'bg-accent-500',
  },
  EN_ATENCION: {
    etiqueta: 'En atención',
    clases: 'bg-primary-700 text-white',
    punto: 'bg-white',
  },
  ATENDIDO: {
    etiqueta: 'Atendido',
    clases: 'bg-emerald-50 text-emerald-700',
    punto: 'bg-emerald-500',
  },
  CANCELADO: {
    etiqueta: 'Cancelado',
    clases: 'bg-rose-50 text-rose-600',
    punto: 'bg-rose-500',
  },
}

export function EstadoBadge({ estado, className = '' }: { estado: EstadoTurno; className?: string }) {
  const e = ESTADOS[estado]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${e.clases} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} aria-hidden="true" />
      {e.etiqueta}
    </span>
  )
}

export function etiquetaEstado(estado: EstadoTurno): string {
  return ESTADOS[estado].etiqueta
}
