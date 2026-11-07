// Vercel invoca Express para todas las rutas /api/*.
// La app conserva sus rutas completas (/api/v1/...) y usa la misma instancia
// de Prisma durante las invocaciones calientes de la Function.
import app from '../backend/src/app'

export default app
