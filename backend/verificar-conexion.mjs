import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.usuario.count();
    console.log('Usuarios:', users);

    const pacientes = await prisma.paciente.count();
    console.log('Pacientes:', pacientes);

    const turnos = await prisma.turno.count();
    console.log('Turnos:', turnos);

    console.log('OK - Conexión a Neon funcionando');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
