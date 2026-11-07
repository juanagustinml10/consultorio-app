import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { hashearContrasena } from '../src/lib/password'

// DATOS DE PRUEBA (ficticios): usuarios demo, pacientes y turnos de hoy.
// Los usuarios de prueba sirven para validar la autenticación real de la etapa 2.
// Se reutiliza el cliente de la app para que el seed también funcione con el
// adaptador de PostgreSQL (sin motor nativo de Prisma).

const CONTRASENA_DEMO = 'demo1234'

async function main() {
  // ----- Usuarios de prueba (argón2id) -----
  const hashMedico = await hashearContrasena(CONTRASENA_DEMO)
  const medico = await prisma.usuario.upsert({
    where: { email: 'medico@demo.com' },
    update: { contrasenaHash: hashMedico, nombre: 'Gustavo', apellido: 'Puertas', activo: true },
    create: {
      email: 'medico@demo.com',
      contrasenaHash: hashMedico,
      nombre: 'Gustavo',
      apellido: 'Puertas',
      rol: 'MEDICO',
    },
  })

  const hashSecretaria = await hashearContrasena(CONTRASENA_DEMO)
  await prisma.usuario.upsert({
    where: { email: 'secretaria@demo.com' },
    update: { contrasenaHash: hashSecretaria, nombre: 'Sofía', apellido: 'Gómez', activo: true },
    create: {
      email: 'secretaria@demo.com',
      contrasenaHash: hashSecretaria,
      nombre: 'Sofía',
      apellido: 'Gómez',
      rol: 'SECRETARIA',
    },
  })

  // ----- Obras sociales de ejemplo -----
  const obras = ['Obra Social Ejemplo A', 'Prepaga Ejemplo 2', 'Prepaga Ejemplo 3']
  const obrasCreadas: Record<string, string> = {}
  for (const nombre of obras) {
    const o = await prisma.obraSocial.upsert({ where: { nombre }, update: {}, create: { nombre } })
    obrasCreadas[nombre] = o.id
  }

  // ----- Pacientes de ejemplo (los mismos que el mock de la etapa 1) -----
  const pacientesDemo = [
    { dni: '12345678', nombre: 'Ana', apellido: 'García', telefono: '11 1000-0001', obra: 'Obra Social Ejemplo A', afiliado: 'OEA-000123' },
    { dni: '23456789', nombre: 'Carlos', apellido: 'Fernández', telefono: '11 1000-0002', obra: 'Prepaga Ejemplo 2', afiliado: 'PE2-000456' },
    { dni: '34567890', nombre: 'María', apellido: 'Rodríguez', telefono: '11 1000-0003', obra: 'Obra Social Ejemplo A', afiliado: 'OEA-000789' },
    { dni: '45678901', nombre: 'Julián', apellido: 'López', telefono: '11 1000-0004', obra: null, afiliado: null },
    { dni: '56789012', nombre: 'Lucía', apellido: 'Sánchez', telefono: '11 1000-0005', obra: 'Prepaga Ejemplo 3', afiliado: 'PE3-000321' },
  ]
  const pacientes: Record<string, string> = {}
  for (const p of pacientesDemo) {
    const registro = await prisma.paciente.upsert({
      where: { dni: p.dni },
      update: {},
      create: {
        nombre: p.nombre,
        apellido: p.apellido,
        dni: p.dni,
        telefono: p.telefono,
        obraSocialId: p.obra ? obrasCreadas[p.obra] : null,
        numeroAfiliado: p.afiliado,
        notas: 'Paciente de ejemplo creado por el seed (datos ficticios).',
      },
    })
    pacientes[p.dni] = registro.id

    // Historia clínica vacía para cada paciente de ejemplo
    await prisma.historiaClinica.upsert({
      where: { pacienteId: registro.id },
      update: {},
      create: { pacienteId: registro.id },
    })
  }

  // ----- Turnos de hoy (idénticos al demo visual, sin correr el día) -----
  const hoy = new Date()
  const esHoy = (h: number, m: number) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), h, m)
  const turnosDemo = [
    { dni: '12345678', h: 9, m: 0, motivo: 'Seguimiento de hipertensión', estado: 'ATENDIDO' as const, llegada: esHoy(8, 50) },
    { dni: '23456789', h: 9, m: 30, motivo: 'Dolor lumbar — revisación', estado: 'ATENDIDO' as const, llegada: esHoy(9, 20) },
    { dni: '34567890', h: 10, m: 0, motivo: 'Resultados de análisis', estado: 'EN_ATENCION' as const, llegada: esHoy(9, 45) },
    { dni: '45678901', h: 10, m: 30, motivo: 'Control de diabetes', estado: 'EN_ESPERA' as const, llegada: esHoy(10, 15) },
    { dni: '56789012', h: 11, m: 0, motivo: 'Dolor de garganta y cefalea', estado: 'EN_ESPERA' as const, llegada: esHoy(10, 38) },
  ]
  for (const t of turnosDemo) {
    const existe = await prisma.turno.findFirst({
      where: { pacienteId: pacientes[t.dni], fechaHora: esHoy(t.h, t.m) },
      select: { id: true },
    })
    if (!existe) {
      await prisma.turno.create({
        data: {
          pacienteId: pacientes[t.dni],
          fechaHora: esHoy(t.h, t.m),
          fechaAtencion: esHoy(t.h, t.m), // Requerido por la migración turnos_sin_horario
          duracionMin: 30,
          motivo: t.motivo,
          estado: t.estado,
          horaLlegada: t.llegada,
          registradoPorId: medico.id,
          notas: 'Turno de ejemplo (seed).',
        },
      })
    }
  }

  console.log('Seed OK:')
  console.log('  Medico:     medico@demo.com      / demo1234')
  console.log('  Secretaria: secretaria@demo.com  / demo1234')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
