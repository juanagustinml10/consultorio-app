// Limitador de intentos de inicio de sesión en memoria.
// Alcance dev/single-instance; en producción con varias instancias conviene
// un límite compartido (p. ej. Redis).
const VENTANA_MS = 15 * 60 * 1000 // 15 minutos
const MAX_INTENTOS = 5 // max intentos por clave (ip + email)

interface Registro {
  intentos: number
  primerIntento: number
}

const intentos = new Map<string, Registro>()

export function claveDe(ip: string | undefined, email: string): string {
  return `${ip ?? 'sin-ip'}|${email.trim().toLowerCase()}`
}

/** true si se puede intentar iniciar sesión. */
export function puedeIntentar(clave: string): boolean {
  const r = intentos.get(clave)
  if (!r) return true
  if (Date.now() - r.primerIntento > VENTANA_MS) {
    intentos.delete(clave)
    return true
  }
  return r.intentos < MAX_INTENTOS
}

/** Registra un intento fallido. */
export function registrarFallo(clave: string): void {
  const r = intentos.get(clave)
  if (!r || Date.now() - r.primerIntento > VENTANA_MS) {
    intentos.set(clave, { intentos: 1, primerIntento: Date.now() })
    return
  }
  r.intentos += 1
}

/** Limpia el contador tras un inicio exitoso. */
export function limpiarIntentos(clave: string): void {
  intentos.delete(clave)
}
