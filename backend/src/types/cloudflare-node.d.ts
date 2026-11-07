/**
 * Tipos mínimos del módulo `cloudflare:node` del runtime de Workers.
 * El módulo lo provee workerd/Wrangler, no npm, por eso se declara acá.
 */
declare module 'cloudflare:node' {
  /** Deriva una solicitud Fetch al servidor node:http identificado por el puerto. */
  export function handleAsNodeRequest(port: number, request: Request): Promise<Response>

  export function httpServerHandler(server: unknown): {
    fetch(request: Request, env: unknown, ctx: unknown): Promise<Response>
  }
}
