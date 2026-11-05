/**
 * Pruebas de integración de la API (etapa 2).
 * Uso: node scripts/probar-api.mjs  (con el backend corriendo en :3001)
 * Imprime PASS/FAIL por caso y un resumen final. Exit 1 si algún caso falla.
 */
import { createRequire } from 'node:module'
import 'dotenv/config'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../src/generated/prisma')
const prisma = new PrismaClient()

const BASE = process.env.API_URL ?? 'http://localhost:3001'

let cookies = '' // cookies de la sesión actual
let passed = 0
let failed = 0

function cookieHeaders() {
  return cookies ? { Cookie: cookies } : {}
}

function guardarCookies(res) {
  const set = res.headers.getSetCookie?.() ?? []
  for (const c of set) {
    const [par] = c.split(';')
    const nombre = par.split('=')[0]
    // Reemplaza la cookie de sesión y conserva las demás
    cookies = cookies
      .split('; ')
      .filter((p) => p && !p.startsWith(`${nombre}=`))
      .concat(par)
      .join('; ')
  }
}

async function req(metodo, path, { body, extraCookies = true } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(extraCookies ? cookieHeaders() : {}),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  })
  guardarCookies(res)
  let json = null
  try {
    json = await res.json()
  } catch {
    /* respuesta sin cuerpo */
  }
  return { status: res.status, json, headers: res.headers }
}

function verificar(nombre, condicion, detalle = '') {
  if (condicion) {
    passed++
    console.log(`  PASS  ${nombre}`)
  } else {
    failed++
    console.log(`  FAIL  ${nombre} ${detalle}`)
  }
}

async function main() {
  const uniq = String((Date.now() + Math.floor(Math.random() * 1_000_000)) % 1_000_000).padStart(6, '0')

  console.log('\n=== 1. Salud del servidor ===')
  {
    const { status, json } = await req('GET', '/health')
    verificar('GET /health → 200 con db conectada', status === 200 && json?.db === 'conectada', `status=${status} db=${json?.db}`)
  }

  console.log('\n=== 2. Protección de rutas (sin sesión) ===')
  {
    const { status } = await req('GET', '/api/v1/patients')
    verificar('GET /api/v1/patients sin cookies → 401', status === 401, `status=${status}`)
  }

  console.log('\n=== 3. Login inválido ===')
  {
    const a = await req('POST', '/api/v1/auth/login', {
      body: { email: 'medico@demo.com', contrasena: 'incorrecta1' },
      extraCookies: false,
    })
    verificar('contraseña incorrecta → 401', a.status === 401, `status=${a.status}`)

    const b = await req('POST', '/api/v1/auth/login', {
      body: { email: 'nadie@demo.com', contrasena: 'loquesea123' },
      extraCookies: false,
    })
    verificar('email inexistente → 401 (mismo mensaje)', b.status === 401, `status=${b.status}`)

    const c = await req('POST', '/api/v1/auth/login', {
      body: { email: 'medico@demo.com', contrasena: '123' },
      extraCookies: false,
    })
    verificar('contraseña 3 caracteres → 400 (validación Zod)', c.status === 400, `status=${c.status}`)
  }

  console.log('\n=== 4. Login exitoso (MÉDICO) + sesión ===')
  let idPacientePrueba
  {
    const { status, json, headers } = await req('POST', '/api/v1/auth/login', {
      body: { email: 'medico@demo.com', contrasena: 'demo1234' },
      extraCookies: false,
    })
    verificar('login médico → 200', status === 200 && json?.usuario?.rol === 'MEDICO', `status=${status}`)
    verificar('respuesta sin contrasenaHash', !('contrasenaHash' in (json?.usuario ?? {})))
    const setCookie = headers.getSetCookie()?.join(' ') ?? ''
    verificar('cookie HttpOnly emitida', /HttpOnly/i.test(setCookie), setCookie)

    const me = await req('GET', '/api/v1/auth/me')
    verificar('GET /auth/me con cookie → 200 y usuario', me.status === 200 && me.json?.usuario?.email === 'medico@demo.com', `status=${me.status}`)
  }

  console.log('\n=== 5. Pacientes: listar, crear, editar ===')
  {
    const lista = await req('GET', '/api/v1/patients?pagina=1&porPagina=5')
    verificar('GET /patients → 200 con paginación', lista.status === 200 && Array.isArray(lista.json?.items) && typeof lista.json?.total === 'number', `status=${lista.status}`)

    const busqueda = await req('GET', '/api/v1/patients?q=ana')
    verificar('GET /patients?q=ana filtra por nombre', busqueda.status === 200 && busqueda.json?.items?.length === 1 && busqueda.json.items[0].nombre === 'Ana', `status=${busqueda.status}`)

    const malo = await req('POST', '/api/v1/patients', { body: { nombre: 'X', apellido: 'Y', dni: '12' } })
    verificar('POST /patients DNI inválido → 400', malo.status === 400, `status=${malo.status}`)

    const crear = await req('POST', '/api/v1/patients', {
      body: { nombre: 'Prueba', apellido: 'Automática', dni: `60${uniq}`, telefono: '11 9000-0000', fechaNacimiento: '1985-04-12' },
    })
    verificar('POST /patients válido → 201', crear.status === 201 && !!crear.json?.paciente?.id && crear.json?.paciente?.fechaNacimiento === '1985-04-12', `status=${crear.status}`)
    idPacientePrueba = crear.json?.paciente?.id

    const dup = await req('POST', '/api/v1/patients', {
      body: { nombre: 'Prueba', apellido: 'Duplicada', dni: `60${uniq}` },
    })
    verificar('POST /patients DNI duplicado → 409', dup.status === 409, `status=${dup.status}`)

    const uno = await req('GET', `/api/v1/patients/${idPacientePrueba}`)
    verificar('GET /patients/:id → 200', uno.status === 200 && uno.json?.paciente?.apellido === 'Automática', `status=${uno.status}`)

    const cuatro04 = await req('GET', '/api/v1/patients/no-existe')
    verificar('GET /patients/:id inexistente → 404', cuatro04.status === 404, `status=${cuatro04.status}`)

    const editar = await req('PUT', `/api/v1/patients/${idPacientePrueba}`, {
      body: { telefono: '11 9000-0001', notas: 'editada por test', fechaNacimiento: '1985-04-13' },
    })
    verificar('PUT /patients/:id → 200 con datos nuevos', editar.status === 200 && editar.json?.paciente?.telefono === '11 9000-0001' && editar.json?.paciente?.fechaNacimiento === '1985-04-13', `status=${editar.status}`)
  }

  console.log('\n=== 6. Atención diaria: permisos, registro por fecha, reprogramación, llegada y cancelación ===')
  let idTurnoPrueba
  let idLlegadaSinTurno
  let fechaTurnoPrueba
  let idTurnoCancelado
  let idPacienteSinTurno
  let idTurnoCancelacionIniciada
  let fechaTurnoFuturo
  let numeroTurnoConCita
  let numeroSinTurno
  {
    const pad = (n) => String(n).padStart(2, '0')
    const hoyDate = new Date()
    const hoy = `${hoyDate.getFullYear()}-${pad(hoyDate.getMonth() + 1)}-${pad(hoyDate.getDate())}`
    const diaFuturo = new Date(hoyDate)
    diaFuturo.setDate(diaFuturo.getDate() + 2)
    const futuro = `${diaFuturo.getFullYear()}-${pad(diaFuturo.getMonth() + 1)}-${pad(diaFuturo.getDate())}`
    fechaTurnoFuturo = futuro

    const sinPermiso = await req('POST', '/api/v1/appointments', { body: {} })
    verificar('médico no puede crear turnos → 403', sinPermiso.status === 403, `status=${sinPermiso.status}`)

    await req('POST', '/api/v1/auth/logout')
    const loginSecretaria = await req('POST', '/api/v1/auth/login', {
      body: { email: 'secretaria@demo.com', contrasena: 'demo1234' },
      extraCookies: false,
    })
    verificar('secretaría inicia sesión para gestionar turnos', loginSecretaria.status === 200 && loginSecretaria.json?.usuario?.rol === 'SECRETARIA')

    const pacienteSinTurno = await req('POST', '/api/v1/patients', {
      body: { nombre: 'Ingreso', apellido: 'Espontáneo', dni: `70${uniq}`, telefono: '11 9000-0002' },
    })
    idPacienteSinTurno = pacienteSinTurno.json?.paciente?.id
    verificar('se registra paciente ficticio para probar llegada sin turno', pacienteSinTurno.status === 201 && !!idPacienteSinTurno)

    const crear = await req('POST', '/api/v1/appointments', {
      body: { pacienteId: idPacientePrueba, fechaAtencion: hoy, motivo: 'Registro ficticio por fecha' },
    })
    verificar(
      'POST /appointments asigna número persistente al registrar la fecha',
      crear.status === 201 &&
        !!crear.json?.turno?.id &&
        crear.json?.turno?.estado === 'LLEGO' &&
        crear.json?.turno?.fechaAtencion === hoy &&
        crear.json?.turno?.fechaOrdenAtencion === hoy &&
        Number.isInteger(crear.json?.turno?.numeroOrdenDia),
      `status=${crear.status}`,
    )
    idTurnoPrueba = crear.json?.turno?.id
    fechaTurnoPrueba = hoy
    const numeroInicial = crear.json?.turno?.numeroOrdenDia

    const dia = await req('GET', `/api/v1/appointments?desde=${hoy}T00:00&hasta=${hoy}T23:59`)
    verificar(
      'GET /appointments mantiene la orden persistente al recargar la agenda',
      dia.status === 200 &&
        dia.json?.items?.some((t) =>
          t.id === idTurnoPrueba &&
          t.estado === 'LLEGO' &&
          t.fechaAtencion === hoy &&
          t.fechaOrdenAtencion === hoy &&
          t.numeroOrdenDia === numeroInicial &&
          t.esSinTurno === false,
        ),
      `status=${dia.status}`,
    )

    const reprogramar = await req('PUT', `/api/v1/appointments/${idTurnoPrueba}`, {
      body: { fechaAtencion: futuro, motivo: 'Registro reprogramado de prueba' },
    })
    verificar(
      'PUT /appointments/:id reprograma y asigna orden para la nueva fecha',
      reprogramar.status === 200 &&
        reprogramar.json?.turno?.fechaAtencion === futuro &&
        reprogramar.json?.turno?.fechaOrdenAtencion === futuro &&
        Number.isInteger(reprogramar.json?.turno?.numeroOrdenDia),
      `status=${reprogramar.status}`,
    )
    const agendaFutura = await req('GET', `/api/v1/appointments?desde=${futuro}T00:00&hasta=${futuro}T23:59`)
    verificar('la consulta por otro día muestra la fecha reprogramada', agendaFutura.status === 200 && agendaFutura.json?.items?.some((t) => t.id === idTurnoPrueba && t.fechaAtencion === futuro))
    const volverHoy = await req('PUT', `/api/v1/appointments/${idTurnoPrueba}`, {
      body: { fechaAtencion: hoy },
    })
    verificar(
      'volver a la fecha original asigna un nuevo número sin reutilizar el anterior',
      volverHoy.status === 200 &&
        volverHoy.json?.turno?.fechaAtencion === hoy &&
        volverHoy.json?.turno?.fechaOrdenAtencion === hoy &&
        volverHoy.json?.turno?.numeroOrdenDia !== numeroInicial,
    )
    const numeroAntesDeLlegada = volverHoy.json?.turno?.numeroOrdenDia

    const simultaneos = await Promise.all([
      req('POST', '/api/v1/appointments', {
        body: { pacienteId: idPacientePrueba, fechaAtencion: futuro, motivo: 'Registro simultáneo ficticio A' },
      }),
      req('POST', '/api/v1/appointments', {
        body: { pacienteId: idPacienteSinTurno, fechaAtencion: futuro, motivo: 'Registro simultáneo ficticio B' },
      }),
    ])
    const ordenesSimultaneas = simultaneos.map((resultado) => resultado.json?.turno?.numeroOrdenDia)
    verificar(
      'dos registros simultáneos reciben órdenes distintas para el mismo día',
      simultaneos.every((resultado) => resultado.status === 201) &&
        ordenesSimultaneas.every(Number.isInteger) &&
        new Set(ordenesSimultaneas).size === 2,
    )
    idTurnoCancelacionIniciada = simultaneos[0]?.json?.turno?.id

    const estadoIncorrecto = await req('PUT', `/api/v1/appointments/${idTurnoPrueba}`, {
      body: { estado: 'EN_ATENCION' },
    })
    verificar('secretaría no puede iniciar la atención → 403', estadoIncorrecto.status === 403, `status=${estadoIncorrecto.status}`)

    const [llegada, sinTurno] = await Promise.all([
      req('POST', '/api/v1/appointments/walk-ins', {
        body: { pacienteId: idPacientePrueba, motivo: 'Llegada ficticia con registro' },
      }),
      req('POST', '/api/v1/appointments/walk-ins', {
        body: { pacienteId: idPacienteSinTurno, motivo: 'Llegada ficticia sin turno' },
      }),
    ])
    numeroTurnoConCita = llegada.json?.turno?.numeroOrdenDia
    verificar(
      'registrar llegada conserva el número asignado al crear el registro',
      llegada.status === 200 &&
        llegada.json?.turno?.estado === 'LLEGO' &&
        !!llegada.json?.turno?.horaLlegada &&
        llegada.json?.turno?.numeroOrdenDia === numeroAntesDeLlegada &&
        llegada.json?.turno?.fechaOrdenAtencion === hoy,
      `status=${llegada.status}`,
    )
    numeroSinTurno = sinTurno.json?.turno?.numeroOrdenDia
    verificar('POST /appointments/walk-ins asigna número diario → 201', sinTurno.status === 201 && sinTurno.json?.turno?.estado === 'LLEGO' && Number.isInteger(numeroSinTurno) && numeroSinTurno > 0 && numeroSinTurno !== numeroTurnoConCita, `status=${sinTurno.status}`)
    idLlegadaSinTurno = sinTurno.json?.turno?.id
    const fechaWalkIn = sinTurno.json?.turno?.fechaAtencion
    const agendaWalkIn = await req('GET', `/api/v1/appointments?desde=${fechaWalkIn}T00:00&hasta=${fechaWalkIn}T23:59`)
    verificar('la agenda identifica llegadas sin turno usando la auditoría existente', agendaWalkIn.status === 200 && agendaWalkIn.json?.items?.some((t) => t.id === idLlegadaSinTurno && t.esSinTurno === true), `status=${agendaWalkIn.status}`)
    verificar('la numeración del día incluye registros programados y pacientes sin turno', new Set([numeroTurnoConCita, numeroSinTurno]).size === 2)

    const cola = await req('GET', '/api/v1/appointments/waiting?hoy=1')
    verificar('GET /appointments/waiting incluye turnos y llegadas sin cita', cola.status === 200 && cola.json?.items?.some((t) => t.id === idTurnoPrueba && t.estado === 'LLEGO') && cola.json?.items?.some((t) => t.id === idLlegadaSinTurno && t.estado === 'LLEGO'), `status=${cola.status}`)
    verificar('GET /appointments/waiting excluye atendidos y cancelados', !cola.json?.items?.some((t) => ['ATENDIDO', 'CANCELADO'].includes(t.estado)))
    const jornada = await req('GET', '/api/v1/appointments/daily-flow')
    verificar('GET /appointments/daily-flow conserva números de ambos tipos de llegada', jornada.status === 200 && jornada.json?.items?.some((t) => t.id === idTurnoPrueba && t.numeroOrdenDia === numeroTurnoConCita) && jornada.json?.items?.some((t) => t.id === idLlegadaSinTurno && t.numeroOrdenDia === numeroSinTurno), `status=${jornada.status}`)

    const cancelar = await req('POST', '/api/v1/appointments', {
      body: { pacienteId: idPacientePrueba, fechaAtencion: futuro, motivo: 'Registro a cancelar' },
    })
    const cancelarId = cancelar.json?.turno?.id
    idTurnoCancelado = cancelarId
    const cancelarRes = await req('PUT', `/api/v1/appointments/${cancelarId}`, {
      body: { estado: 'CANCELADO', motivoCancelacion: 'No podrá asistir (prueba ficticia)' },
    })
    verificar(
      'secretaría puede cancelar un registro y conserva su número',
      cancelarRes.status === 200 &&
        cancelarRes.json?.turno?.estado === 'CANCELADO' &&
        cancelarRes.json?.turno?.numeroOrdenDia === cancelar.json?.turno?.numeroOrdenDia,
      `status=${cancelarRes.status}`,
    )
    const agendaConCancelado = await req('GET', `/api/v1/appointments?desde=${futuro}T00:00&hasta=${futuro}T23:59`)
    verificar('la agenda conserva el registro cancelado con su fecha', agendaConCancelado.status === 200 && agendaConCancelado.json?.items?.some((t) => t.id === idTurnoCancelado && t.estado === 'CANCELADO' && t.fechaAtencion === futuro))
    const futurosSinTerminales = agendaConCancelado.json?.items?.filter((t) =>
      t.fechaAtencion > hoy && !['ATENDIDO', 'AUSENTE', 'CANCELADO'].includes(t.estado),
    ) ?? []
    verificar('el registro cancelado no aparece entre los próximos pendientes', !futurosSinTerminales.some((t) => t.id === idTurnoCancelado))
    const registrosCancelados = await req('GET', `/api/v1/appointments?desde=${futuro}&hasta=${futuro}&estado=CANCELADO`)
    const canceladoConAuditoria = registrosCancelados.json?.items?.find((t) => t.id === idTurnoCancelado)
    verificar(
      'filtro de cancelados devuelve motivo, fecha y usuario desde la auditoría',
      registrosCancelados.status === 200 &&
        canceladoConAuditoria?.cancelacion?.motivo === 'No podrá asistir (prueba ficticia)' &&
        !!canceladoConAuditoria?.cancelacion?.fecha &&
        !!canceladoConAuditoria?.cancelacion?.usuario,
    )
    const pacienteConCancelacion = await req('GET', `/api/v1/patients/${idPacientePrueba}`)
    const historiaTrasCancelacion = await req('GET', `/api/v1/medical-records/${idPacientePrueba}`)
    verificar(
      'cancelar el registro conserva el paciente y su historia clínica',
      pacienteConCancelacion.status === 200 &&
        pacienteConCancelacion.json?.paciente?.id === idPacientePrueba &&
        historiaTrasCancelacion.status === 200 &&
      !!historiaTrasCancelacion.json?.historia?.id,
    )

    const noExiste = await req('PUT', '/api/v1/appointments/no-existe', { body: { estado: 'CANCELADO' } })
    verificar('PUT /appointments/:id inexistente → 404', noExiste.status === 404, `status=${noExiste.status}`)

    await req('POST', '/api/v1/auth/logout')
    const loginMedico = await req('POST', '/api/v1/auth/login', {
      body: { email: 'medico@demo.com', contrasena: 'demo1234' },
      extraCookies: false,
    })
    verificar('médico vuelve a iniciar sesión para atender la cola', loginMedico.status === 200 && loginMedico.json?.usuario?.rol === 'MEDICO')

    const colaDoctor = await req('GET', '/api/v1/appointments/waiting?hoy=1')
    verificar('médico consulta la cola de espera', colaDoctor.status === 200 && colaDoctor.json?.items?.some((t) => t.id === idTurnoPrueba), `status=${colaDoctor.status}`)
    const pacienteAnotadoPorMedico = await req('POST', '/api/v1/patients', {
      body: { nombre: 'Registro', apellido: 'Médico', dni: `80${uniq}` },
    })
    const llegadaPorMedico = await req('POST', '/api/v1/appointments/walk-ins', {
      body: { pacienteId: pacienteAnotadoPorMedico.json?.paciente?.id, motivo: 'Llegada registrada por médico (ficticia)' },
    })
    verificar(
      'médico puede anotar paciente que llega y agregarlo a la espera',
      pacienteAnotadoPorMedico.status === 201 &&
        llegadaPorMedico.status === 201 &&
        llegadaPorMedico.json?.turno?.estado === 'LLEGO' &&
        Number.isInteger(llegadaPorMedico.json?.turno?.numeroOrdenDia),
      `status=${llegadaPorMedico.status}`,
    )
  }

  console.log('\n=== 7. Historia clínica: antecedentes, consultas, versiones y auditoría (médico) ===')
  let idConsultaPrueba
  let idHistoriaPrueba
  {
    const iniciarSegundaAtencion = await req('PUT', `/api/v1/appointments/${idTurnoCancelacionIniciada}`, {
      body: { estado: 'EN_ATENCION' },
    })
    verificar('médico puede continuar otra atención para probar cancelación iniciada', iniciarSegundaAtencion.status === 200 && iniciarSegundaAtencion.json?.turno?.estado === 'EN_ATENCION')

    const iniciarAtencion = await req('PUT', `/api/v1/appointments/${idTurnoPrueba}`, {
      body: { estado: 'EN_ATENCION' },
    })
    verificar('médico inicia la atención → EN_ATENCION', iniciarAtencion.status === 200 && iniciarAtencion.json?.turno?.estado === 'EN_ATENCION', `status=${iniciarAtencion.status}`)

    const historia = await req('GET', `/api/v1/medical-records/${idPacientePrueba}`)
    verificar(
      'GET /medical-records/:patientId → historia con consultas vacías',
      historia.status === 200 && historia.json?.historia && Array.isArray(historia.json.historia.consultas) && historia.json.historia.consultas.length === 0,
      `status=${historia.status}`,
    )
    verificar('historia incluye antecedentes y versiones', 'antecedentesPersonales' in historia.json.historia && 'version' in historia.json.historia)
    idHistoriaPrueba = historia.json.historia.id

    const editarEncabezado = await req('PUT', `/api/v1/medical-records/${idPacientePrueba}`, {
      body: {
        antecedentesPersonales: 'Asma leve (dato ficticio de prueba)',
        antecedentesFamiliares: 'Sin antecedentes relevantes (dato ficticio)',
        alergias: 'Ninguna conocida (dato ficticio)',
        medicacionHabitual: 'Ninguna (dato ficticio)',
        observaciones: 'Control anual (dato ficticio)',
      },
    })
    verificar(
      'PUT /medical-records/:patientId actualiza antecedentes y alergias',
      editarEncabezado.status === 200 && editarEncabezado.json?.historia?.alergias === 'Ninguna conocida (dato ficticio)',
      `status=${editarEncabezado.status}`,
    )
    const encabezadoPersistido = await req('GET', `/api/v1/medical-records/${idPacientePrueba}`)
    verificar(
      'GET confirma persistencia de antecedentes y observaciones',
      encabezadoPersistido.json?.historia?.antecedentesPersonales === 'Asma leve (dato ficticio de prueba)' &&
        encabezadoPersistido.json?.historia?.observaciones === 'Control anual (dato ficticio)',
    )

    const crear = await req('POST', `/api/v1/medical-records/${idPacientePrueba}/consultations`, {
      body: {
        fecha: '2026-11-04T10:15:00',
        motivoConsulta: 'Motivo inicial de prueba',
        diagnostico: 'Diagnóstico v1',
        evaluacion: 'Evolución inicial',
        tratamiento: 'Tratamiento v1',
        indicaciones: 'Observaciones iniciales',
      },
    })
    verificar('POST consultations válido → 201 versión 1', crear.status === 201 && crear.json?.consulta?.version === 1, `status=${crear.status}`)
    idConsultaPrueba = crear.json?.consulta?.id

    const crearPacienteInexistente = await req('POST', `/api/v1/medical-records/no-existe/consultations`, {
      body: { diagnostico: 'x' },
    })
    verificar('POST consultations paciente inexistente → 404', crearPacienteInexistente.status === 404, `status=${crearPacienteInexistente.status}`)

    // Modificación: la versión 1 debe quedar conservada
    const editar = await req('PUT', `/api/v1/medical-records/consultations/${idConsultaPrueba}`, {
      body: { diagnostico: 'Diagnóstico v2 (corregido)', esCorreccion: true },
    })
    verificar(
      'PUT consultations/:id → versión 2 y flag de corrección',
      editar.status === 200 && editar.json?.consulta?.version === 2 && editar.json?.consulta?.esCorreccion === true,
      `status=${editar.status} version=${editar.json?.consulta?.version}`,
    )
    verificar('PUT devuelve versionAnterior=1', editar.json?.versionAnterior === 1)
    verificar(
      'snapshot conserva valores previos y documenta campos modificados',
      editar.json?.consulta?.versiones?.[0]?.datos?.diagnostico === 'Diagnóstico v1' &&
        editar.json?.consulta?.versiones?.[0]?.datos?.cambios?.some((c) => c.campo === 'diagnostico') &&
        !!editar.json?.consulta?.versiones?.[0]?.capturadoPor &&
        !!editar.json?.consulta?.versiones?.[0]?.capturadoEn,
    )

    const historia2 = await req('GET', `/api/v1/medical-records/${idPacientePrueba}`)
    const consulta = historia2.json?.historia?.consultas?.find((c) => c.id === idConsultaPrueba)
    verificar(
      'consultas con versiones previas conservadas (≥1 snapshot)',
      historia2.status === 200 && consulta?.version === 2 && consulta?.versiones?.length === 1 && consulta?.versiones?.[0]?.version === 1,
      `versiones=${JSON.stringify(consulta?.versiones)}`,
    )
    verificar('consulta corregida visible con diagnóstico v2', consulta?.diagnostico?.startsWith('Diagnóstico v2'))

    await req('POST', '/api/v1/auth/logout')
    const sesionSecretaria = await req('POST', '/api/v1/auth/login', {
      body: { email: 'secretaria@demo.com', contrasena: 'demo1234' },
      extraCookies: false,
    })
    verificar('secretaría puede registrar cancelación administrativa de atención iniciada', sesionSecretaria.status === 200)
    const sinConfirmacion = await req('PUT', `/api/v1/appointments/${idTurnoCancelacionIniciada}`, {
      body: { estado: 'CANCELADO', motivoCancelacion: 'Prueba de cancelación iniciada' },
    })
    verificar('backend exige confirmación explícita para cancelar atención iniciada', sinConfirmacion.status === 400)
    const cancelarAtencion = await req('PUT', `/api/v1/appointments/${idTurnoCancelacionIniciada}`, {
      body: {
        estado: 'CANCELADO',
        motivoCancelacion: 'Paciente se retira (prueba ficticia)',
        confirmarCancelacionAtencion: true,
      },
    })
    verificar('cancelar atención iniciada conserva la consulta clínica', cancelarAtencion.status === 200 && cancelarAtencion.json?.turno?.estado === 'CANCELADO')
    const colaTrasCancelarAtencion = await req('GET', `/api/v1/appointments/waiting?desde=${fechaTurnoFuturo}&hasta=${fechaTurnoFuturo}`)
    verificar(
      'atención cancelada sale de la sala de espera y de la cola activa',
      colaTrasCancelarAtencion.status === 200 &&
        !colaTrasCancelarAtencion.json?.items?.some((item) => item.id === idTurnoCancelacionIniciada),
    )
    const historiaTrasCancelarAtencion = await req('GET', `/api/v1/medical-records/${idPacientePrueba}`)
    verificar(
      'la consulta y sus versiones permanecen después de cancelar la atención iniciada',
      historiaTrasCancelarAtencion.status === 200 &&
        historiaTrasCancelarAtencion.json?.historia?.consultas?.some((item) => item.id === idConsultaPrueba && item.version === 2),
    )
    await req('POST', '/api/v1/auth/logout')
    const volverMedico = await req('POST', '/api/v1/auth/login', {
      body: { email: 'medico@demo.com', contrasena: 'demo1234' },
      extraCookies: false,
    })
    verificar('médico recupera sesión para finalizar la consulta principal', volverMedico.status === 200)

    const sinDatos = await req('PUT', `/api/v1/medical-records/consultations/${idConsultaPrueba}`, { body: {} })
    verificar('PUT consultations sin campos → 400', sinDatos.status === 400, `status=${sinDatos.status}`)

    const finalizarAtencion = await req('PUT', `/api/v1/appointments/${idTurnoPrueba}`, {
      body: { estado: 'ATENDIDO' },
    })
    verificar(
      'médico finaliza la atención → ATENDIDO y hora de cierre',
      finalizarAtencion.status === 200 &&
        finalizarAtencion.json?.turno?.estado === 'ATENDIDO' &&
        !!finalizarAtencion.json?.turno?.horaFin,
      `status=${finalizarAtencion.status}`,
    )
    const colaTrasFinalizar = await req('GET', '/api/v1/appointments/waiting?hoy=1')
    verificar('turno atendido sale de la sala de espera', colaTrasFinalizar.status === 200 && !colaTrasFinalizar.json?.items?.some((t) => t.id === idTurnoPrueba))
    const jornadaFinal = await req('GET', '/api/v1/appointments/daily-flow')
    verificar('la orden de atención no cambia al finalizar ni volver a consultar', jornadaFinal.json?.items?.find((t) => t.id === idTurnoPrueba)?.numeroOrdenDia === numeroTurnoConCita)
  }

  console.log('\n=== 8. SECRETARIA: acceso total a historias según lo acordado ===')
  {
    // Cerrar sesión del médico
    const salir = await req('POST', '/api/v1/auth/logout')
    verificar('logout médico → 200', salir.status === 200, `status=${salir.status}`)
    const me = await req('GET', '/api/v1/auth/me')
    verificar('GET /auth/me tras logout → 401', me.status === 401, `status=${me.status}`)

    const login = await req('POST', '/api/v1/auth/login', {
      body: { email: 'secretaria@demo.com', contrasena: 'demo1234' },
      extraCookies: false,
    })
    verificar('login secretaria → 200 rol SECRETARIA', login.status === 200 && login.json?.usuario?.rol === 'SECRETARIA', `status=${login.status}`)

    const leer = await req('GET', `/api/v1/medical-records/${idPacientePrueba}`)
    verificar('secretaria LEE historia clínica completa → 200', leer.status === 200 && leer.json?.historia?.consultas?.length === 1, `status=${leer.status}`)

    const crear = await req('POST', `/api/v1/medical-records/${idPacientePrueba}/consultations`, {
      body: { motivoConsulta: 'Consulta registrada por secretaría', indicaciones: 'Indicaciones de prueba' },
    })
    verificar('secretaria CREA consulta → 201', crear.status === 201, `status=${crear.status}`)

    const editar = await req('PUT', `/api/v1/medical-records/consultations/${idConsultaPrueba}`, {
      body: { tratamiento: 'Tratamiento actualizado por secretaría' },
    })
    verificar('secretaria MODIFICA consulta → 200 versión 3', editar.status === 200 && editar.json?.consulta?.version === 3, `status=${editar.status} version=${editar.json?.consulta?.version}`)
    const version3 = editar.json?.consulta?.versiones?.find((v) => v.version === 2)
    verificar(
      'snapshot de la secretaria registra el cambio de tratamiento',
      version3?.datos?.cambios?.some((c) => c.campo === 'tratamiento') &&
        !!version3?.capturadoPor &&
        !!version3?.capturadoEn,
    )
  }

  console.log('\n=== 9. Persistencia directa de auditoría en PostgreSQL ===')
  {
    const [auditoriaHistoria, auditoriasConsulta] = await Promise.all([
      prisma.auditLog.findFirst({
        where: { entidad: 'HistoriaClinica', registroId: idHistoriaPrueba, accion: 'ACTUALIZACION' },
        orderBy: { creadoEn: 'desc' },
      }),
      prisma.auditLog.findMany({
        where: { entidad: 'ConsultaClinica', registroId: idConsultaPrueba, accion: 'ACTUALIZACION' },
        orderBy: { creadoEn: 'asc' },
      }),
    ])
    verificar(
      'PostgreSQL conserva auditoría de antecedentes con usuario y diferencias',
      !!auditoriaHistoria?.usuarioId &&
        Array.isArray(auditoriaHistoria?.nuevo?.cambios) &&
        auditoriaHistoria.nuevo.cambios.some((c) => c.campo === 'alergias'),
    )
    verificar(
      'PostgreSQL conserva auditoría de las ediciones de consulta',
      auditoriasConsulta.length >= 2 &&
        !!auditoriasConsulta[0]?.usuarioId &&
        Array.isArray(auditoriasConsulta[0]?.nuevo?.cambios) &&
        auditoriasConsulta[0].nuevo.cambios.some((c) => c.campo === 'diagnostico'),
    )
    const [turnoPersistido, turnoCancelado, auditoriaTurno] = await Promise.all([
        prisma.turno.findUnique({ where: { id: idTurnoPrueba } }),
        prisma.turno.findUnique({ where: { id: idTurnoCancelado } }),
        prisma.auditLog.findMany({
          where: { entidad: 'Turno', registroId: idTurnoPrueba, accion: 'ACTUALIZACION' },
        }),
    ])
    verificar(
        'PostgreSQL conserva el turno atendido, su hora fin y estado final',
        turnoPersistido?.estado === 'ATENDIDO' &&
          !!turnoPersistido.horaFin &&
          turnoPersistido.fechaAtencion.toISOString().slice(0, 10) === fechaTurnoPrueba,
    )
    verificar('PostgreSQL conserva cancelación y auditoría del turno', turnoCancelado?.estado === 'CANCELADO' && auditoriaTurno.length >= 3)
    const llegadaPersistida = await prisma.turno.findUnique({ where: { id: idLlegadaSinTurno } })
    verificar('PostgreSQL conserva la llegada sin turno en estado EN_ESPERA', llegadaPersistida?.estado === 'EN_ESPERA' && !!llegadaPersistida.horaLlegada)
    verificar(
      'PostgreSQL conserva órdenes diarias distintas y fecha en las llegadas concurrentes',
      !!turnoPersistido?.fechaOrdenAtencion &&
        Number.isInteger(turnoPersistido.numeroOrdenDia) &&
      !!llegadaPersistida?.fechaOrdenAtencion &&
      Number.isInteger(llegadaPersistida.numeroOrdenDia) &&
      new Set([turnoPersistido.numeroOrdenDia, llegadaPersistida.numeroOrdenDia]).size === 2,
    )
  }

  console.log('\n=== 10. Limitador de intentos (usuario existente, al final para no bloquear los demás) ===')
  {
    // 6 intentos seguidos con contraseña incorrecta sobre el médico:
    // del 1º al 5º → 401; el 6º → 429 (bloqueo de 15 minutos).
    let ultimo
    for (let i = 0; i < 6; i++) {
      ultimo = await req('POST', '/api/v1/auth/login', {
        body: { email: 'medico@demo.com', contrasena: `falla${i}-${Date.now()}` },
        extraCookies: false,
      })
    }
    verificar('6º intento seguido → 429 (limitador activo)', ultimo.status === 429, `status=${ultimo.status}`)

    // Resetea el limitador en dev para permitir ejecuciones consecutivas del test suite
    await fetch(`${BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-reset-limiter': 'true' },
      body: JSON.stringify({ email: 'medico@demo.com', contrasena: 'demo1234' }),
    })
  }

  console.log('\n=== 11. Turno de sesión final: paciente inexistente etc. ===')
  {
    const mal = await req('POST', '/api/v1/appointments', { body: { pacienteId: 'inexistente', fechaHora: '2026-01-01T09:00:00' } })
    verificar('POST /appointments con paciente inexistente → 404', mal.status === 404, `status=${mal.status}`)
  }

  console.log(`\n===== RESULTADO: ${passed} PASS / ${failed} FAIL =====\n`)
  process.exit(failed === 0 ? 0 : 1)
}

main()
  .catch((e) => {
    console.error('Error ejecutando las pruebas:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
