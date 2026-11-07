/**
 * Cloudflare Pages Function — Proxy inverso de la API.
 *
 * Ruta del archivo: functions/api/[[path]].ts
 * Captura todas las solicitudes a /api/* de https://consultorio-app.pages.dev
 * y las reenvía al backend de Vercel.
 *
 * El backend de Vercel sigue siendo el único responsable de:
 * autenticación, sesiones, autorización, lógica de negocio y acceso a Neon.
 * Esta función NO contiene lógica de negocio.
 *
 * Seguridad:
 * - El host de destino está FIJO en este archivo. El cliente nunca puede
 *   elegir el destino (evita SSRF y open proxy).
 * - No se registran contraseñas, cookies ni tokens (solo método, ruta y
 *   código de estado).
 * - Las cabeceras Set-Cookie se reescriben como cookies de origen (pages.dev):
 *   sin Domain, con Path=/, Secure, HttpOnly y SameSite=Lax.
 */

const BACKEND_ORIGIN = 'https://consultorio-backend-eosin.vercel.app'

const METODOS_PERMITIDOS = new Set([
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
])

// Cabeceras de salto a salto (RFC 7230) y host que nunca se reenvían.
const CABECERAS_NO_REENVIAR = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'host',
])

interface ContextoPages {
  request: Request
  params: { [key: string]: string | string[] | undefined }
  env: Record<string, unknown>
  waitUntil: (promesa: Promise<unknown>) => void
}

function rutaValida(path: string): boolean {
  if (path.includes('..')) return false
  if (path.includes('://')) return false
  if (/[?#]/.test(path)) return false
  return true
}

/**
 * Reescribe una cabecera Set-Cookie del backend como cookie de origen
 * (consultorio-app.pages.dev).
 *
 * - Se elimina cualquier atributo Domain: una Domain=vercel.app impediría
 *   que el navegador almacene la cookie para pages.dev, sobre todo en iOS.
 * - Path=/ (toda la aplicación comparte el mismo origen).
 * - Secure y HttpOnly siempre presentes.
 * - SameSite=None se normaliza a Lax: como frontend y API comparten origen,
 *   no hace falta SameSite=None y Lax es más restrictivo (evita que la
 *   cookie se trate como de terceros en navegadores con restricciones como
 *   Safari en iOS).
 */
function normalizarSetCookie(cookie: string): string {
  const partes = cookie.split(';').map((parte) => parte.trim()).filter(Boolean)
  if (partes.length === 0) return cookie

  const resultado: string[] = [partes[0]] // name=value se conserva tal cual
  let tienePath = false
  let tieneSecure = false
  let tieneHttpOnly = false
  let mismoSitio: string | null = null

  for (const parte of partes.slice(1)) {
    const iguales = parte.indexOf('=')
    const nombre = iguales === -1 ? parte : parte.slice(0, iguales)
    const valor = iguales === -1 ? '' : parte.slice(iguales + 1)
    const lower = nombre.toLowerCase()

    if (lower === 'domain') continue // cookie de origen: sin Domain
    if (lower === 'path') { tienePath = true; resultado.push('Path=/'); continue }
    if (lower === 'secure') { tieneSecure = true; resultado.push('Secure'); continue }
    if (lower === 'httponly') { tieneHttpOnly = true; resultado.push('HttpOnly'); continue }
    if (lower === 'samesite') { mismoSitio = (valor ?? '').toLowerCase(); continue }
    resultado.push(parte)
  }

  if (!tienePath) resultado.push('Path=/')
  if (!tieneSecure) resultado.push('Secure')
  if (!tieneHttpOnly) resultado.push('HttpOnly')

  if (mismoSitio === 'none') mismoSitio = 'lax'
  const sitio = mismoSitio ?? 'lax'
  resultado.push(
    `SameSite=${sitio.charAt(0).toUpperCase()}${sitio.slice(1)}`,
  )

  return resultado.join('; ')
}

export default async function onRequest(
  contexto: ContextoPages,
): Promise<Response> {
  const { request } = contexto
  const path = (contexto.params?.path as string | undefined) ?? ''
  const urlOriginal = new URL(request.url)

  if (!METODOS_PERMITIDOS.has(request.method)) {
    console.log(
      `[proxy] método no permitido ${request.method} ${urlOriginal.pathname}`,
    )
    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      {
        status: 405,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          allow: 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
        },
      },
    )
  }

  if (!rutaValida(path)) {
    console.log(`[proxy] ruta no válida ${request.method} ${urlOriginal.pathname}`)
    return new Response(
      JSON.stringify({ error: 'Ruta no válida' }),
      {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      },
    )
  }

  // Destino fijo: misma ruta y query string en el backend de Vercel.
  // Nunca se construye a partir de datos proporcionados por el cliente.
  const destino = new URL(
    `${urlOriginal.pathname}${urlOriginal.search}`,
    BACKEND_ORIGIN,
  )

  // Cabeceras de la solicitud entrante, sin cabeceras de salto a salto ni host.
  const cabecerasDestino = new Headers()
  request.headers.forEach((valor, nombre) => {
    if (CABECERAS_NO_REENVIAR.has(nombre.toLowerCase())) return
    cabecerasDestino.set(nombre, valor)
  })

  // Cuerpo de la solicitud (POST, PUT, PATCH, DELETE). Se lee en un
  // ArrayBuffer para que el reenvío funcione igual en el runtime de
  // Cloudflare (workerd) y en entornos Node/undici. El backend limita el
  // cuerpo a 256 KB, por lo que el búfer en memoria es irrelevante.
  let cuerpo: ArrayBuffer | null = null
  if (
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    request.method !== 'OPTIONS'
  ) {
    cuerpo = await request.arrayBuffer()
  }

  const init: RequestInit = {
    method: request.method,
    headers: cabecerasDestino,
    redirect: 'manual', // se reenvían fielmente las respuestas 3xx del backend
  }
  if (cuerpo && cuerpo.byteLength > 0) {
    init.body = cuerpo
  }

  let respuestaBackend: Response
  try {
    respuestaBackend = await fetch(destino.toString(), init)
  } catch (error) {
    console.log(
      `[proxy] error alcanzando el backend ${request.method} ${urlOriginal.pathname}: ${
        error instanceof Error ? error.message : error
      }`,
    )
    return new Response(JSON.stringify({ error: 'No se pudo alcanzar el backend' }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  console.log(
    `[proxy] ${request.method} ${urlOriginal.pathname} -> ${respuestaBackend.status}`,
  )

  const cabecerasRespuesta = new Headers()
  respuestaBackend.headers.forEach((valor, nombre) => {
    if (CABECERAS_NO_REENVIAR.has(nombre.toLowerCase())) return
    if (nombre.toLowerCase() === 'set-cookie') return // se reconstruye abajo
    cabecerasRespuesta.set(nombre, valor)
  })

  if (typeof respuestaBackend.headers.getSetCookie === 'function') {
    // workerd (Cloudflare Pages) expone getSetCookie(): devuelve cada
    // Set-Cookie por separado, sin ambiguedad con comas dentro de los
    // valores (ej. Expires=Wed, 21 Oct 2015 07:28:00 GMT).
    for (const cookie of respuestaBackend.headers.getSetCookie()) {
      if (cookie) {
        cabecerasRespuesta.append('Set-Cookie', normalizarSetCookie(cookie))
      }
    }
  } else {
    // Fallback para runtimes sin getSetCookie(). headers.get('set-cookie')
    // une varios encabezados con ', ' y no permite separarlos de forma
    // confiable si un valor de cookie contiene comas. Se reenvía el valor
    // crudo sin reescribir (no ocurre en producción en Cloudflare Pages).
    const setCookieRaw = respuestaBackend.headers.get('set-cookie')
    if (setCookieRaw) {
      cabecerasRespuesta.append('Set-Cookie', setCookieRaw)
    }
  }

  return new Response(respuestaBackend.body, {
    status: respuestaBackend.status,
    statusText: respuestaBackend.statusText,
    headers: cabecerasRespuesta,
  })
}

export { normalizarSetCookie }
