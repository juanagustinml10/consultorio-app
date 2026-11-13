/**
 * Proxy inverso para el backend de Vercel desde Cloudflare Pages.
 *
 * Esta función actúa como intermediaria para que el frontend
 * (consultorio-app.pages.dev) y el backend (consultorio-backend-eosin.vercel.app)
 * compartan el mismo dominio. Las cookies de sesión se tratan como first-party,
 * evitando el bloqueo por navegadores como Safari o Chrome en iOS.
 */

const BACKEND_BASE_URL = 'https://consultorio-backend-eosin.vercel.app';

export const onRequest = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  // Solo rutea paths bajo /api/v1/
  if (!url.pathname.startsWith('/api/v1/')) {
    return new Response('Not found', { status: 404 });
  }

  const backendUrl = new URL(`${BACKEND_BASE_URL}${url.pathname}`);
  url.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  const headers = new Headers(request.headers);
  headers.set('host', new URL(BACKEND_BASE_URL).host);
  headers.delete('content-length');

  const backendRequest = new Request(backendUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
  });

  try {
    const backendResponse = await fetch(backendRequest);

    const responseHeaders = new Headers(backendResponse.headers);
    // Reenviar Set-Cookie tal como viene para mantener sesiones first-party
    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response('Proxy error', { status: 502 });
  }
};
