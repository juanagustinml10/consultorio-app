/**
 * Cliente HTTP para la API del backend.
 * ETAPA 2: descomentar el uso del token cuando exista autenticación.
 * En la etapa 1 ningún componente consume la API; esto queda preparado
 * para la integración con la base de datos.
 */

export const API_BASE = '/api'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      // Authorization: `Bearer ${token}`, // pendiente: autenticación (etapa 2)
      ...init?.headers,
    },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.error ?? `Error ${res.status}`)
  }
  return res.json() as Promise<T>
}
