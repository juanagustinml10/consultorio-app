import { ApiError } from '@/lib/api'

/**
 * Mensaje amigable para errores de la API (incluye detalle por campo
 * cuando la validación del backend rechaza los datos).
 */
export function mensajeDeError(e: unknown, porDefecto: string): string {
  if (e instanceof ApiError) {
    if (e.detalles?.length) {
      const lista = e.detalles.map((d) => `${d.campo}: ${d.mensaje}`).join(' · ')
      return `${e.message} — ${lista}`
    }
    return e.message
  }
  if (e instanceof Error && e.message) return e.message
  return porDefecto
}
