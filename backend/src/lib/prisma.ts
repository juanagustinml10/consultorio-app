import { PrismaClient } from '@prisma/client'

// Cliente único de Prisma para toda la aplicación.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
})
