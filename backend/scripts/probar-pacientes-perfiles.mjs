// Prueba de integración completa del flujo de pacientes para MÉDICO y SECRETARIA
const BASE = process.env.API_URL ?? 'http://127.0.0.1:3001'

async function cliente() {
  let cookie = ''

  async function req(metodo, ruta, body = null) {
    const res = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const set = res.headers.getSetCookie?.() ?? []
    for (const c of set) {
      const [par] = c.split(';')
      const nombre = par.split('=')[0]
      cookie = cookie
        .split('; ')
        .filter((p) => p && !p.startsWith(`${nombre}=`))
        .concat(par)
        .join('; ')
    }

    const json = await res.json().catch(() => null)
    return { status: res.status, json }
  }

  return { req, limpiarCookie: () => { cookie = '' } }
}

function verificar(titulo, ok, detalle = '') {
  if (ok) {
    console.log(`  ✓ PASS: ${titulo}`)
  } else {
    console.error(`  ✗ FAIL: ${titulo} ${detalle}`)
    process.exitCode = 1
  }
}

async function probarPerfil(rolNombre, email, pass) {
  console.log(`\n========================================`)
  console.log(` Probando perfil: ${rolNombre} (${email})`)
  console.log(`========================================`)

  const c = await cliente()

  // 1. Login
  const loginRes = await c.req('POST', '/api/v1/auth/login', { email, contrasena: pass })
  verificar(`Login de ${rolNombre}`, loginRes.status === 200 && loginRes.json?.usuario?.rol === rolNombre, `status=${loginRes.status}`)

  // 2. Obtener lista de obras sociales para asociar
  const obrasRes = await c.req('GET', '/api/v1/obras-sociales')
  verificar('Listar obras sociales', obrasRes.status === 200 && Array.isArray(obrasRes.json?.items))
  const obraId = obrasRes.json?.items?.[0]?.id

  // 3. Listar pacientes
  const listaRes = await c.req('GET', '/api/v1/patients?pagina=1&porPagina=5')
  verificar('Listar pacientes', listaRes.status === 200 && Array.isArray(listaRes.json?.items) && typeof listaRes.json?.total === 'number')

  // 4. Buscar pacientes por DNI o nombre
  const buscarRes = await c.req('GET', '/api/v1/patients?q=Ana')
  verificar('Buscar paciente por nombre ("Ana")', buscarRes.status === 200 && buscarRes.json?.items?.some(p => p.nombre.toLowerCase().includes('ana')))

  // 5. Registrar un nuevo paciente con datos personales y administrativos completos
  const randDni = `${Math.floor(10000000 + Math.random() * 89999999)}`
  const nuevoPaciente = {
    nombre: `Test${rolNombre}`,
    apellido: 'Integracion',
    dni: randDni,
    fechaNacimiento: '1992-08-24',
    sexo: 'FEMENINO',
    telefono: '11 4444-5555',
    email: `test.${rolNombre.toLowerCase()}@ejemplo.com`,
    direccion: 'Av. Corrientes 1234, CABA',
    obraSocialId: obraId,
    numeroAfiliado: 'AF-987654',
    notas: `Registrado por ${rolNombre} durante prueba técnica.`,
  }

  const crearRes = await c.req('POST', '/api/v1/patients', nuevoPaciente)
  verificar(
    `Registrar paciente (${rolNombre})`,
    crearRes.status === 201 && crearRes.json?.paciente?.dni === randDni && crearRes.json?.paciente?.fechaNacimiento === '1992-08-24',
    `status=${crearRes.status} err=${JSON.stringify(crearRes.json)}`
  )
  const pacienteId = crearRes.json?.paciente?.id

  // 6. Abrir la ficha del paciente
  const fichaRes = await c.req('GET', `/api/v1/patients/${pacienteId}`)
  verificar(
    `Abrir ficha del paciente (${rolNombre})`,
    fichaRes.status === 200 && fichaRes.json?.paciente?.id === pacienteId && fichaRes.json?.paciente?.notas?.includes(rolNombre),
    `status=${fichaRes.status}`
  )

  // 7. Modificar datos personales y administrativos mediante PUT /api/v1/patients/:id
  const datosModificados = {
    nombre: `Test${rolNombre}Edit`,
    apellido: 'IntegracionEdit',
    dni: randDni,
    fechaNacimiento: '1992-08-25',
    sexo: 'OTRO',
    telefono: '11 9999-8888',
    email: `test.${rolNombre.toLowerCase()}.edit@ejemplo.com`,
    direccion: 'Calle Falsa 123',
    obraSocialId: null, // Probar quitar cobertura
    numeroAfiliado: null,
    notas: `Observaciones modificadas por ${rolNombre}.`,
  }

  const editarRes = await c.req('PUT', `/api/v1/patients/${pacienteId}`, datosModificados)
  verificar(
    `Modificar paciente mediante PUT (${rolNombre})`,
    editarRes.status === 200 &&
      editarRes.json?.paciente?.nombre === `Test${rolNombre}Edit` &&
      editarRes.json?.paciente?.fechaNacimiento === '1992-08-25' &&
      editarRes.json?.paciente?.sexo === 'OTRO' &&
      editarRes.json?.paciente?.telefono === '11 9999-8888' &&
      editarRes.json?.paciente?.obraSocial === undefined,
    `status=${editarRes.status} res=${JSON.stringify(editarRes.json)}`
  )

  // 8. Confirmar que los cambios persisten re-leyendo la ficha
  const fichaPostUpdate = await c.req('GET', `/api/v1/patients/${pacienteId}`)
  verificar(
    `Persistencia de cambios en ficha (${rolNombre})`,
    fichaPostUpdate.status === 200 &&
      fichaPostUpdate.json?.paciente?.apellido === 'IntegracionEdit' &&
      fichaPostUpdate.json?.paciente?.notas === `Observaciones modificadas por ${rolNombre}.`,
    `status=${fichaPostUpdate.status}`
  )

  // 9. Logout
  const logoutRes = await c.req('POST', '/api/v1/auth/logout')
  verificar(`Logout de ${rolNombre}`, logoutRes.status === 200)
}

async function main() {
  try {
    await probarPerfil('MEDICO', 'medico@demo.com', 'demo1234')
    await probarPerfil('SECRETARIA', 'secretaria@demo.com', 'demo1234')
    console.log('\n========================================')
    console.log('✓ Todas las pruebas de perfil completadas con éxito')
    console.log('========================================\n')
  } catch (err) {
    console.error('Error durante la ejecución:', err)
    process.exit(1)
  }
}

main()
