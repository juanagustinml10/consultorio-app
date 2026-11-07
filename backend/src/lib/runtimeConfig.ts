/** Runtime bindings for Workers, with process.env fallback for local Node. */
export interface RuntimeConfig {
  DATABASE_URL?: string
  DIRECT_URL?: string
  CORS_ORIGIN?: string
  LOGIN_RATE_LIMIT_SECRET?: string
  SESION_HORAS?: string
  COOKIE_SAMESITE?: string
  NODE_ENV?: string
  VERCEL?: string
  CLOUDFLARE_WORKERS?: string
}

let bindings: RuntimeConfig = {}

export function configurarEntorno(bindingsActuales?: RuntimeConfig): void {
  bindings = bindingsActuales ?? {}
}

export function valorEntorno(clave: keyof RuntimeConfig): string | undefined {
  return bindings[clave] ?? process.env[clave]
}

export function esCloudflareWorkers(): boolean {
  return valorEntorno('CLOUDFLARE_WORKERS') === '1' ||
    (typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers')
}
