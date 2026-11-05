import 'dotenv/config'
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import { PrismaClient } from '../src/generated/prisma/index.js'
import { hash } from '@node-rs/argon2'

const baseUrl = new URL(process.env.DATABASE_URL ?? '')
if (baseUrl.protocol !== 'postgresql:' || baseUrl.pathname !== '/consultorio_db') {
  throw new Error('El DATABASE_URL configurado no apunta exactamente a consultorio_db; se cancela la prueba.')
}

const dbName = `consultorio_medico_test_${randomBytes(6).toString('hex')}`
const testUrl = new URL(baseUrl)
testUrl.pathname = `/${dbName}`
let admin
let db
let api
let vite
let edge
let perfilEdge
let viteConfigTemp
let baseCreada = false

async function puertoLibre() {
  const listener = createServer()
  listener.listen(0, '127.0.0.1')
  await once(listener, 'listening')
  const port = listener.address().port
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()))
  return port
}

async function esperarFrontend(url, proceso) {
  const limite = Date.now() + 20_000
  while (Date.now() < limite) {
    if (proceso.exitCode !== null) throw new Error('El servidor frontend temporal terminó antes de iniciar.')
    try { if ((await fetch(url)).ok) return } catch { /* espera al siguiente intento */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('El frontend temporal no inició dentro del tiempo esperado.')
}

async function pruebaVisual(apiPort, pacienteId, fechaA, fechaB, pacienteA, pacienteB, pacienteSecretariaId, turnoAtencionId, pacienteAtencionId, atendidoAyer, atendidoAnterior) {
  const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  if (!existsSync(edgePath)) {
    console.log('VISUAL: Microsoft Edge no disponible; se omite navegador.')
    return
  }
  const frontPort = await puertoLibre()
  const debugPort = await puertoLibre()
  viteConfigTemp = join(process.cwd(), '..', 'frontend', `.vite.config.medico-test-${process.pid}.mjs`)
  writeFileSync(viteConfigTemp, `
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    import tailwindcss from '@tailwindcss/vite'
    import path from 'node:path'
    export default defineConfig({
      plugins: [react(), tailwindcss()],
      resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
      server: { proxy: { '/api': 'http://127.0.0.1:${apiPort}' } },
    })
  `)
  vite = spawn(process.execPath, [
    '../frontend/node_modules/vite/bin/vite.js', '--config', viteConfigTemp, '--host', '127.0.0.1', '--port', String(frontPort), '--strictPort',
  ], { cwd: join(process.cwd(), '..', 'frontend'), stdio: 'ignore', windowsHide: true })
  const frontUrl = `http://127.0.0.1:${frontPort}`
  await esperarFrontend(frontUrl, vite)

  perfilEdge = mkdtempSync(join(tmpdir(), 'consultorio-edge-test-'))
  edge = spawn(edgePath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-allow-origins=*', `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${perfilEdge}`, 'about:blank',
  ], { stdio: 'ignore', windowsHide: true })

  let targets = []
  const limite = Date.now() + 15_000
  while (Date.now() < limite) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
      targets = await response.json()
      if (targets.some((target) => target.type === 'page')) break
    } catch { /* Edge está iniciando */ }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  const target = targets.find((item) => item.type === 'page')
  if (!target?.webSocketDebuggerUrl) throw new Error('Edge inició, pero no expuso un objetivo CDP para la prueba visual.')

  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let nextId = 0
  const pendientes = new Map()
  const incidenciasNavegador = []
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pendientes.has(message.id)) {
      const pending = pendientes.get(message.id)
      pendientes.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    } else if (message.method === 'Runtime.exceptionThrown' ||
      (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error')) {
      incidenciasNavegador.push('console/exception')
    } else if (message.method === 'Network.responseReceived' &&
      message.params.response.url.includes('/api/v1/') && message.params.response.status >= 400) {
      incidenciasNavegador.push(`API ${message.params.response.status}`)
    }
  })
  const comando = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId
    pendientes.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
    setTimeout(() => {
      if (pendientes.delete(id)) reject(new Error(`Timeout de navegador en ${method}`))
    }, 10_000)
  })
  const evaluar = async (expression) => {
    const result = await comando('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(`Falló una interacción del navegador: ${result.exceptionDetails.text}`)
    return result.result?.value
  }
  const navegar = async (url) => {
    await comando('Page.navigate', { url })
    await new Promise((resolve) => setTimeout(resolve, 700))
  }
  await comando('Page.enable')
  await comando('Runtime.enable')
  await comando('Network.enable')
  await comando('Log.enable')
  await comando('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await navegar(`${frontUrl}/login`)
  const esperaFormularioLogin = Date.now() + 10_000
  while (Date.now() < esperaFormularioLogin && !await evaluar(`Boolean(document.querySelector('#email') && document.querySelector('#contrasena'))`)) {
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  comprobar(await evaluar(`Boolean(document.querySelector('#email') && document.querySelector('#contrasena'))`), 'formulario de login del navegador está listo')
  await evaluar(`(() => {
    const set = (selector, value) => { const el = document.querySelector(selector); const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    set('#email', 'medico.prueba@example.invalid'); set('#contrasena', 'Prueba-Temporal-2026!'); document.querySelector('form').requestSubmit(); return true;
  })()`)
  const loginLimite = Date.now() + 10_000
  while (Date.now() < loginLimite && await evaluar('location.pathname') !== '/medico') await new Promise((resolve) => setTimeout(resolve, 200))
  comprobar(await evaluar('location.pathname') === '/medico', 'login del formulario web abre el dashboard médico')
  incidenciasNavegador.length = 0 // /auth/me sin cookie antes del login responde 401 por diseño.

  const paginas = [
    ['dashboard', '/medico'],
    ['pacientes', '/medico/pacientes'],
    ['ficha', `/medico/pacientes/${pacienteId}`],
    ['historia', `/medico/pacientes/${pacienteId}/historia`],
    ['estadisticas', '/medico/estadisticas'],
    ['atencion-integrada', `/medico/pacientes/${pacienteAtencionId}/historia?turnoId=${encodeURIComponent(turnoAtencionId)}`],
  ]
  const salida = join(tmpdir(), 'consultorio-medico-review')
  mkdirSync(salida, { recursive: true })
  const medidas = []
  for (const [nombre, path] of paginas) {
    for (const viewport of [
      { width: 390, height: 844, mobile: true },
      { width: 768, height: 1024, mobile: true },
      { width: 1440, height: 900, mobile: false },
    ]) {
      await comando('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 })
      await navegar(`${frontUrl}${path}`)
      const state = await evaluar(`({width: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, title: document.querySelector('main h1, main h2')?.innerText ?? document.title})`)
      const file = join(salida, `${nombre}-${viewport.width}.png`)
      const screenshot = await comando('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
      writeFileSync(file, Buffer.from(screenshot.data, 'base64'))
      medidas.push({ page: nombre, ...state, screenshot: file })
    }
  }
  await navegar(`${frontUrl}/medico`)
  const selectorFecha = await evaluar(`Boolean(document.querySelector('input[type="date"]'))`)
  comprobar(selectorFecha, 'dashboard médico muestra un selector de fecha')
  const cambiarFecha = async (fecha) => evaluar(`(() => { const e = document.querySelector('input[type="date"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, ${JSON.stringify(fecha)}); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`)
  await cambiarFecha(fechaB)
  await new Promise((resolve) => setTimeout(resolve, 500))
  let contenido = await evaluar('document.body.innerText')
  comprobar(contenido.includes(pacienteB) && !contenido.includes(pacienteA), 'selector cambia a la fecha B sin mezclar pacientes de la fecha A')
  await cambiarFecha(fechaA)
  await new Promise((resolve) => setTimeout(resolve, 500))
  contenido = await evaluar('document.body.innerText')
  comprobar(contenido.includes(pacienteA) && !contenido.includes(pacienteB), 'selector restaura la fecha A y excluye pacientes de la fecha B')

  await comando('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  const abrirHistorial = await evaluar(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.includes('Historial de atendidos por jornada')); if (!b) return false; b.click(); return true; })()`)
  comprobar(abrirHistorial, 'dashboard ofrece historial de atendidos agrupado por jornada')
  await new Promise((resolve) => setTimeout(resolve, 700))
  let historialAtendidos = await evaluar('document.body.innerText')
  comprobar(historialAtendidos.toUpperCase().includes('HOY') && historialAtendidos.toUpperCase().includes('AYER') && historialAtendidos.includes(atendidoAyer) && historialAtendidos.includes(atendidoAnterior), 'historial separa hoy, ayer y jornadas anteriores con sus pacientes')
  for (const viewport of [
    { width: 390, height: 844, mobile: true },
    { width: 768, height: 1024, mobile: true },
    { width: 1440, height: 900, mobile: false },
  ]) {
    await comando('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 })
    await evaluar(`document.querySelector('[aria-label="Historial de pacientes atendidos por jornada"]')?.scrollIntoView({ block: 'start', behavior: 'instant' })`)
    await new Promise((resolve) => setTimeout(resolve, 200))
    const estado = await evaluar(`({width: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth})`)
    comprobar(Math.max(estado.documentWidth, estado.bodyWidth) <= estado.width, `historial por jornada sin desbordamiento horizontal a ${viewport.width}px`)
    const captura = await comando('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    writeFileSync(join(tmpdir(), 'consultorio-medico-review', `atendidos-jornadas-${viewport.width}.png`), Buffer.from(captura.data, 'base64'))
  }

  await comando('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await navegar(`${frontUrl}/medico/pacientes/${pacienteId}/historia`)
  const abierta = await evaluar(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.includes('Nueva consulta')); if (!b) return false; b.click(); return true; })()`)
  comprobar(abierta, 'historia clínica ofrece abrir el formulario de consulta')
  await new Promise((resolve) => setTimeout(resolve, 250))
  const dialogo = await evaluar(`Boolean(document.querySelector('input#consultaDiagnostico'))`)
  comprobar(dialogo, 'formulario de registro clínico se muestra en celular')
  const cabeceraVisible = await evaluar(`document.querySelector('.fixed.inset-0.z-50 h3')?.getBoundingClientRect().top >= 0`)
  comprobar(cabeceraVisible, 'modal clínico muestra su encabezado desde el inicio en celular')
  const accionAlcanzable = await evaluar(`(() => { const overlay = document.querySelector('.fixed.inset-0.z-50'); overlay.scrollTop = overlay.scrollHeight; const button = [...document.querySelectorAll('button[type="submit"]')].find(x => x.innerText.includes('Registrar consulta')); const rect = button?.getBoundingClientRect(); const visible = Boolean(rect && rect.top >= 0 && rect.bottom <= innerHeight); overlay.scrollTop = 0; return visible; })()`)
  comprobar(accionAlcanzable, 'acción para guardar la consulta se alcanza al recorrer el modal en celular')
  const formulario = join(tmpdir(), 'consultorio-medico-review', 'consulta-formulario-390.png')
  const imagenFormulario = await comando('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(formulario, Buffer.from(imagenFormulario.data, 'base64'))
  await evaluar(`(() => {
    const set = (selector, value) => { const el = document.querySelector(selector); const prototype = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; const d = Object.getOwnPropertyDescriptor(prototype, 'value').set; d.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    set('#consultaDiagnostico', 'Diagnóstico ficticio de doble envío');
    set('#consultaEvaluacion', 'Evolución ficticia de doble envío');
    set('#consultaTratamiento', 'Tratamiento ficticio de doble envío');
    const form = document.querySelector('#consultaDiagnostico').closest('form'); form.requestSubmit(); form.requestSubmit(); return true;
  })()`)
  await new Promise((resolve) => setTimeout(resolve, 900))
  const enviosConsulta = await evaluar(`performance.getEntriesByType('resource').filter(e => e.name.includes('/medical-records/${pacienteId}/consultations')).length`)
  comprobar(enviosConsulta === 1, 'dos envíos seguidos del formulario generan una única petición de creación')

  await navegar(`${frontUrl}/medico/pacientes/${pacienteAtencionId}/historia?turnoId=${encodeURIComponent(turnoAtencionId)}`)
  comprobar(await evaluar(`Boolean(document.querySelector('#consultaDiagnostico'))`), 'atención integrada abre formulario actual en la misma vista')
  await evaluar('window.scrollTo(0, document.body.scrollHeight)')
  const capturaConsultaIntegrada = await comando('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(join(tmpdir(), 'consultorio-medico-review', 'atencion-integrada-formulario-390.png'), Buffer.from(capturaConsultaIntegrada.data, 'base64'))
  await evaluar(`(() => {
    const set = (selector, value) => { const el = document.querySelector(selector); const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    set('#consultaDiagnostico', 'Diagnóstico ficticio atención integrada'); set('#consultaEvaluacion', 'Evolución ficticia atención integrada'); set('#consultaTratamiento', 'Tratamiento ficticio atención integrada'); return true;
  })()`)
  await comando('Network.setBlockedURLs', { urls: [`*medical-records/${pacienteAtencionId}/consultations*`] })
  await evaluar(`document.querySelector('#consultaDiagnostico').closest('form').requestSubmit()`)
  await new Promise((resolve) => setTimeout(resolve, 700))
  const conservaEntrada = await evaluar(`document.querySelector('#consultaDiagnostico')?.value === 'Diagnóstico ficticio atención integrada' && Boolean(document.querySelector('[role="alert"]'))`)
  comprobar(conservaEntrada, 'error de red conserva el contenido ingresado y muestra un error')
  await comando('Network.setBlockedURLs', { urls: [] })
  await evaluar(`document.querySelector('#consultaDiagnostico').closest('form').requestSubmit()`)
  const guardadoIntegradoLimite = Date.now() + 10_000
  while (Date.now() < guardadoIntegradoLimite && await evaluar(`Boolean(document.querySelector('#consultaDiagnostico'))`)) await new Promise((resolve) => setTimeout(resolve, 150))
  const estadoTrasGuardar = await evaluar(`fetch('/api/v1/appointments/${turnoAtencionId}').then(r => r.json()).then(x => x.turno.estado)`)
  comprobar(estadoTrasGuardar === 'EN_ATENCION' && await evaluar('location.pathname.includes("/historia")'), 'guardar consulta mantiene EN_ATENCION y permanece en la historia clínica')
  await evaluar(`(() => { window.confirm = () => true; const b = [...document.querySelectorAll('button')].find(x => x.innerText.includes('Finalizar atención')); if (!b) return false; b.click(); return true; })()`)
  const cierreVisualLimite = Date.now() + 10_000
  while (Date.now() < cierreVisualLimite && await evaluar('location.pathname') !== '/medico') await new Promise((resolve) => setTimeout(resolve, 150))
  const estadoFinalVisual = await evaluar(`fetch('/api/v1/appointments/${turnoAtencionId}').then(r => r.json()).then(x => x.turno.estado)`)
  comprobar(estadoFinalVisual === 'ATENDIDO' && await evaluar('location.pathname') === '/medico', 'finalización desde la misma vista actualiza estado y vuelve al listado')

  await evaluar(`fetch('/api/v1/auth/logout', { method: 'POST' })`)
  await navegar(`${frontUrl}/login`)
  await evaluar(`(() => {
    const set = (selector, value) => { const el = document.querySelector(selector); const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    set('#email', 'secretaria.prueba@example.invalid'); set('#contrasena', 'Prueba-Temporal-2026!'); document.querySelector('form').requestSubmit(); return true;
  })()`)
  const loginSecretariaLimite = Date.now() + 10_000
  while (Date.now() < loginSecretariaLimite && await evaluar('location.pathname') !== '/secretaria') await new Promise((resolve) => setTimeout(resolve, 200))
  comprobar(await evaluar('location.pathname') === '/secretaria', 'login del formulario web abre el dashboard de secretaría')
  incidenciasNavegador.length = 0
  const dashboardSecretaria = await evaluar('document.body.innerText')
  comprobar(dashboardSecretaria.includes('Hola, Noa') && dashboardSecretaria.includes('Inscriptos') && dashboardSecretaria.includes('Cancelados'), 'dashboard muestra usuario e indicadores diarios')
  await evaluar(`[...document.querySelectorAll('button')].find(x => x.innerText.includes('Historial de atendidos por jornada'))?.click()`)
  await new Promise((resolve) => setTimeout(resolve, 700))
  const historialSecretaria = await evaluar('document.body.innerText')
  comprobar(historialSecretaria.toUpperCase().includes('HOY') && historialSecretaria.toUpperCase().includes('AYER') && historialSecretaria.includes(atendidoAyer) && historialSecretaria.includes(atendidoAnterior), 'secretaría también consulta atendidos agrupados y etiquetados por jornada')
  await evaluar(`[...document.querySelectorAll('button')].find(x => x.innerText.includes('Historial de atendidos por jornada'))?.click()`)
  const cambiarFechaSecretaria = async (fecha) => evaluar(`(() => { const e = document.querySelector('input[type="date"]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(e, ${JSON.stringify(fecha)}); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`)
  await cambiarFechaSecretaria(fechaB)
  await new Promise((resolve) => setTimeout(resolve, 500))
  let contenidoSecretaria = await evaluar('document.body.innerText')
  comprobar(contenidoSecretaria.includes(pacienteB) && !contenidoSecretaria.includes(pacienteA), 'dashboard de secretaría cambia de fecha sin mezclar inscripciones')
  await cambiarFechaSecretaria(fechaA)
  await new Promise((resolve) => setTimeout(resolve, 500))
  contenidoSecretaria = await evaluar('document.body.innerText')
  comprobar(contenidoSecretaria.includes(pacienteA) && !contenidoSecretaria.includes(pacienteB), 'dashboard de secretaría restaura el listado de la fecha elegida')
  await evaluar(`(() => { const e = document.querySelector('select[aria-label="Filtrar por estado"]'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(e, 'EN_ESPERA'); e.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  contenidoSecretaria = await evaluar('document.body.innerText')
  comprobar(contenidoSecretaria.includes(pacienteA) && !contenidoSecretaria.includes('Ficticio, Paciente'), 'filtro de estado muestra únicamente pacientes en espera')
  await evaluar(`(() => { const e = document.querySelector('select[aria-label="Filtrar por estado"]'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(e, 'CANCELADO'); e.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  contenidoSecretaria = await evaluar('document.body.innerText')
  comprobar(contenidoSecretaria.includes('Inscripciones canceladas') && contenidoSecretaria.includes('Cancelado'), 'filtro de cancelados abre el registro separado de anulaciones')

  const paginasSecretaria = [
    ['secretaria-dashboard', '/secretaria'],
    ['secretaria-pacientes', '/secretaria/pacientes'],
    ['secretaria-ficha', `/secretaria/pacientes/${pacienteSecretariaId}`],
    ['secretaria-historia', `/secretaria/pacientes/${pacienteId}/historia`],
    ['secretaria-estadisticas', '/secretaria/estadisticas'],
  ]
  const salidaSecretaria = join(tmpdir(), 'consultorio-secretaria-review')
  mkdirSync(salidaSecretaria, { recursive: true })
  const medidasSecretaria = []
  for (const [nombre, path] of paginasSecretaria) {
    for (const viewport of [
      { width: 390, height: 844, mobile: true },
      { width: 768, height: 1024, mobile: true },
      { width: 1440, height: 900, mobile: false },
    ]) {
      await comando('Emulation.setDeviceMetricsOverride', { ...viewport, deviceScaleFactor: 1 })
      await navegar(`${frontUrl}${path}`)
      if (nombre === 'secretaria-ficha') {
        const historialInscripciones = await evaluar('document.body.innerText')
        const verificacionInscripcion = [historialInscripciones.includes('INSCRIPCIONES ANTERIORES'), historialInscripciones.includes('CANCELADO'), historialInscripciones.includes('Motivo ficticio de prueba'), historialInscripciones.includes('No se pudieron cargar')]
        comprobar(verificacionInscripcion[1] && verificacionInscripcion[2], `ficha administrativa muestra inscripciones previas y motivo de cancelación (${verificacionInscripcion.join(',')})`)
      }
      const state = await evaluar(`({width: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, title: document.querySelector('main h1, main h2')?.innerText ?? document.title})`)
      const screenshot = await comando('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
      writeFileSync(join(salidaSecretaria, `${nombre}-${viewport.width}.png`), Buffer.from(screenshot.data, 'base64'))
      medidasSecretaria.push({ page: nombre, ...state })
    }
  }
  await comando('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await navegar(`${frontUrl}/secretaria`)
  await evaluar(`(() => { const e = document.querySelector('select[aria-label="Filtrar por estado"]'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; set.call(e, 'TODOS'); e.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  const abrirInscripcion = await evaluar(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.innerText.includes('Inscribir paciente')); if (!b) return false; b.click(); return true; })()`)
  comprobar(abrirInscripcion, 'dashboard de secretaría abre el formulario real de inscripción')
  await new Promise((resolve) => setTimeout(resolve, 250))
  comprobar(await evaluar(`Boolean(document.querySelector('#inscripcionFecha') && document.querySelector('#inscripcionBusqueda'))`), 'modal de inscripción muestra fecha y búsqueda en celular')
  const modalInscripcionImg = await comando('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(join(salidaSecretaria, 'secretaria-inscripcion-390.png'), Buffer.from(modalInscripcionImg.data, 'base64'))
  const headerInscripcionVisible = await evaluar(`document.querySelector('#titulo-inscripcion')?.getBoundingClientRect().top >= 0`)
  comprobar(headerInscripcionVisible, 'encabezado del formulario de inscripción permanece visible al abrir en celular')
  await evaluar(`document.querySelector('[role="dialog"] button[aria-label="Cerrar"]')?.click()`)
  await new Promise((resolve) => setTimeout(resolve, 150))
  const abrirCancelacion = await evaluar(`(() => { const row = [...document.querySelectorAll('li')].find(x => x.innerText.includes('SecretariaFicticia')); const button = [...(row?.querySelectorAll('button') ?? [])].find(x => x.innerText.includes('Cancelar')); if (!button) return false; button.click(); return true; })()`)
  comprobar(abrirCancelacion, 'lista activa ofrece la acción de cancelar sin iniciar atención médica')
  comprobar(await evaluar(`Boolean(document.querySelector('#motivoCancelacion'))`), 'cancelación permite registrar motivo opcional')
  const modalCancelacionImg = await comando('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(join(salidaSecretaria, 'secretaria-cancelacion-390.png'), Buffer.from(modalCancelacionImg.data, 'base64'))
  await evaluar(`(() => { const e = document.querySelector('#motivoCancelacion'); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(e, 'Motivo ficticio desde interfaz'); e.dispatchEvent(new Event('input', { bubbles: true })); const b = [...document.querySelectorAll('button')].find(x => x.innerText.includes('Confirmar cancelación')); b.click(); b.click(); return true; })()`)
  await new Promise((resolve) => setTimeout(resolve, 700))
  const enviosCancelacion = await evaluar(`performance.getEntriesByType('resource').filter(e => e.name.includes('/appointments/') && e.name.includes('/cancelar')).length`)
  comprobar(enviosCancelacion === 1, 'doble confirmación desde el modal de cancelación genera un único envío')

  for (const item of medidasSecretaria) {
    comprobar(item.documentWidth <= item.width && item.bodyWidth <= item.width, `${item.page} sin desbordamiento horizontal a ${item.width}px`)
  }
  comprobar(incidenciasNavegador.length === 0, 'consola y API sin errores en pantallas de secretaría')
  console.log(`Capturas reales de Edge del perfil de secretaría: ${salidaSecretaria}`)

  for (const item of medidas) {
    comprobar(item.documentWidth <= item.width && item.bodyWidth <= item.width, `${item.page} sin desbordamiento horizontal a ${item.width}px`)
  }
  comprobar(incidenciasNavegador.length === 0, 'consola del navegador y respuestas de API sin errores en las vistas revisadas')
  console.log(`Capturas reales de Edge (dashboard, pacientes, ficha, historia, estadísticas × 3 y formulario): ${salida}`)
  socket.close()
}

function comprobar(condicion, mensaje) {
  if (!condicion) throw new Error(`FALLO: ${mensaje}`)
  console.log(`OK: ${mensaje}`)
}

async function esperarApi(url, proceso) {
  const limite = Date.now() + 20_000
  while (Date.now() < limite) {
    if (proceso.exitCode !== null) throw new Error(`La API terminó antes de iniciar (código ${proceso.exitCode}).`)
    try {
      const respuesta = await fetch(`${url}/health`)
      if (respuesta.ok) return
    } catch { /* espera al siguiente intento */ }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('La API de pruebas no inició dentro del tiempo esperado.')
}

function clienteSesion(base, cookie) {
  return async (path, options = {}) => {
    const headers = { ...(options.body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...options.headers }
    const response = await fetch(`${base}/api/v1${path}`, {
      ...options,
      headers,
      ...(options.body && typeof options.body !== 'string' ? { body: JSON.stringify(options.body) } : {}),
    })
    const body = await response.json().catch(() => null)
    return { status: response.status, body, response }
  }
}

async function iniciarSesion(base, email) {
  const response = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, contrasena: 'Prueba-Temporal-2026!' }),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`No se pudo iniciar sesión de prueba: HTTP ${response.status}`)
  const cookies = response.headers.getSetCookie?.() ?? []
  const session = cookies.find((value) => value.startsWith('consultorio_sesion='))?.split(';')[0]
  if (!session) throw new Error('El login de prueba no devolvió la cookie de sesión esperada.')
  return { body, request: clienteSesion(base, session), cookie: session }
}

try {
  admin = new PrismaClient({ datasources: { db: { url: baseUrl.toString() } } })
  const estado = await admin.$queryRaw`SELECT current_database() AS db, current_user AS role, r.rolcreatedb AS can_create_database FROM pg_roles r WHERE r.rolname = current_user`
  if (estado[0]?.db !== 'consultorio_db' || estado[0]?.can_create_database !== true) {
    throw new Error('La conexión no confirmó consultorio_db y privilegio para crear una base aislada.')
  }
  await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`)
  baseCreada = true
  console.log(`Base temporal creada: ${dbName}`)

  const migracion = spawnSync(process.execPath, [
    'node_modules/prisma/build/index.js', 'db', 'push', '--schema', 'prisma/schema.prisma', '--skip-generate',
  ], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: testUrl.toString() }, encoding: 'utf8' })
  if (migracion.status !== 0) throw new Error(`No se pudo preparar el esquema aislado: ${migracion.stderr || migracion.stdout}`)
  console.log('Esquema preparado en la base temporal con prisma db push; no se ejecutaron migraciones.')

  db = new PrismaClient({ datasources: { db: { url: testUrl.toString() } } })
  const [medicoHash, secretariaHash] = await Promise.all([
    hash('Prueba-Temporal-2026!'), hash('Prueba-Temporal-2026!'),
  ])
  await db.usuario.createMany({ data: [
    { email: 'medico.prueba@example.invalid', nombre: 'Ada', apellido: 'Prueba', rol: 'MEDICO', contrasenaHash: medicoHash },
    { email: 'secretaria.prueba@example.invalid', nombre: 'Noa', apellido: 'Prueba', rol: 'SECRETARIA', contrasenaHash: secretariaHash },
  ] })

  const port = await puertoLibre()
  api = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: testUrl.toString(), PORT: String(port), NODE_ENV: 'test', CORS_ORIGIN: 'http://localhost:5173' },
    stdio: 'ignore',
    windowsHide: true,
  })
  const base = `http://127.0.0.1:${port}`
  await esperarApi(base, api)

  const anonimo = clienteSesion(base)
  const sinPaciente = await anonimo('/patients')
  comprobar(sinPaciente.status === 401, 'API de pacientes rechaza solicitudes sin sesión')
  const sinHistoria = await anonimo('/medical-records/paciente-ficticio')
  comprobar(sinHistoria.status === 401, 'API clínica rechaza solicitudes sin sesión')
  const sinTurnos = await anonimo('/appointments')
  comprobar(sinTurnos.status === 401, 'API de inscripciones rechaza solicitudes sin sesión')
  const sinEstadisticas = await anonimo('/estadisticas')
  comprobar(sinEstadisticas.status === 401, 'API de estadísticas rechaza solicitudes sin sesión')

  const { body: identidad, request: medico } = await iniciarSesion(base, 'medico.prueba@example.invalid')
  comprobar(identidad.usuario.nombre === 'Ada' && identidad.usuario.rol === 'MEDICO', 'login devuelve la identidad ficticia del médico')
  const me = await medico('/auth/me')
  comprobar(me.status === 200 && me.body.usuario.apellido === 'Prueba', 'sesión del médico permanece activa')
  const { body: identidadSecretaria, request: secretaria, cookie: cookieSecretaria } = await iniciarSesion(base, 'secretaria.prueba@example.invalid')
  comprobar(identidadSecretaria.usuario.nombre === 'Noa' && identidadSecretaria.usuario.rol === 'SECRETARIA', 'login devuelve la identidad ficticia de secretaría')

  const hoy = new Date()
  const dia = (offset) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const fechaA = dia(0)
  const fechaB = dia(1)

  const crearPaciente = async (dni, nombre) => {
    const response = await medico('/patients', { method: 'POST', body: { dni, nombre, apellido: 'Ficticio' } })
    if (response.status !== 201) throw new Error(`No se pudo crear un paciente ficticio: HTTP ${response.status}`)
    return response.body.paciente
  }
  const p1 = await crearPaciente('70000001', 'Paciente')
  const p2 = await crearPaciente('70000002', 'Segundo')
  const p3 = await crearPaciente('70000003', 'OtraFecha')
  const p4 = await crearPaciente('70000004', 'Cancelado')
  comprobar(true, 'API creó cuatro pacientes con identidad ficticia en la base temporal')

  const inscribir = async (paciente, fechaAtencion) => secretaria('/appointments', {
    method: 'POST', body: { pacienteId: paciente.id, fechaAtencion },
  })
  const t1 = await inscribir(p1, fechaA)
  const t2 = await inscribir(p2, fechaA)
  const t3 = await inscribir(p3, fechaB)
  const t4 = await inscribir(p4, fechaA)
  comprobar(t1.status === 201 && t1.body.numeroAsignado === 1 && t2.status === 201 && t2.body.numeroAsignado === 2, 'números diarios se asignan y persisten en orden 1, 2')
  comprobar(t3.status === 201 && t3.body.numeroAsignado === 1, 'la numeración empieza en 1 para otra fecha')
  comprobar(t4.status === 201 && t4.body.numeroAsignado === 3, 'el siguiente paciente conserva el número 3 en la fecha A')
  const cancelar = await secretaria(`/appointments/${t4.body.turno.id}/cancelar`, { method: 'POST', body: { motivoCancelacion: 'Prueba ficticia' } })
  comprobar(cancelar.status === 200 && cancelar.body.turno.estado === 'CANCELADO', 'secretaría cancela la inscripción ficticia sin alterar su número')
  const duplicada = await inscribir(p1, fechaA)
  comprobar(duplicada.status === 409, 'backend rechaza una segunda inscripción activa del paciente en la misma fecha')

  const fechaAyer = dia(-1)
  const fechaAnterior = dia(-3)
  const ayerPacientes = await Promise.all([
    crearPaciente('70000006', 'AyerUno'), crearPaciente('70000007', 'AyerDos'), crearPaciente('70000008', 'AtendidoAyer'),
  ])
  const ayerTurnos = []
  for (const paciente of ayerPacientes) ayerTurnos.push(await inscribir(paciente, fechaAyer))
  comprobar(ayerTurnos.every((r) => r.status === 201) && ayerTurnos.map((r) => r.body.numeroAsignado).join(',') === '1,2,3', 'la jornada de ayer asigna los números 1, 2 y 3 de forma independiente')
  const inscripcionNumeroDosAyer = ayerTurnos.find((r) => r.body.numeroAsignado === 2)
  const cancelacionAyer = await secretaria(`/appointments/${inscripcionNumeroDosAyer.body.turno.id}/cancelar`, { method: 'POST', body: { motivoCancelacion: 'Cancelación ficticia de ayer' } })
  const ayerCuarto = await inscribir(await crearPaciente('70000009', 'AyerCuatro'), fechaAyer)
  comprobar(cancelacionAyer.status === 200 && cancelacionAyer.body.turno.numeroOrdenDia === 2 && ayerCuarto.body.numeroAsignado === 4, 'cancelar ayer conserva el número y el siguiente recibe 4')
  const anteriorPacientes = await Promise.all([
    crearPaciente('70000010', 'AnteriorUno'), crearPaciente('70000011', 'AnteriorDos'), crearPaciente('70000012', 'AtendidoAnterior'),
  ])
  const anteriorTurnos = []
  for (const paciente of anteriorPacientes) anteriorTurnos.push(await inscribir(paciente, fechaAnterior))
  comprobar(anteriorTurnos.every((r) => r.status === 201) && anteriorTurnos.map((r) => r.body.numeroAsignado).join(',') === '1,2,3', 'una fecha anterior nueva también comienza en 1 y conserva el orden')
  const anteriorPersistido = await secretaria(`/appointments?fecha=${fechaAnterior}&incluirCancelados=1`)
  comprobar(anteriorPersistido.body.items.map((r) => r.numeroOrdenDia).join(',') === '1,2,3', 'consultar una fecha histórica conserva los números guardados')

  const fechaConcurrente = dia(-5)
  const concurrentes = await Promise.all(Array.from({ length: 8 }, async (_, i) => {
    const paciente = await crearPaciente(String(70000013 + i).padStart(8, '0'), `Concurrencia${i + 1}`)
    return inscribir(paciente, fechaConcurrente)
  }))
  const numerosConcurrentes = concurrentes.map((r) => r.body.numeroAsignado).sort((a, b) => a - b)
  comprobar(concurrentes.every((r) => r.status === 201) && numerosConcurrentes.join(',') === '1,2,3,4,5,6,7,8', 'inscripciones simultáneas reciben números únicos y correlativos en PostgreSQL')

  const diaA = await medico(`/appointments?fecha=${fechaA}&incluirCancelados=1`)
  const diaB = await medico(`/appointments?fecha=${fechaB}&incluirCancelados=1`)
  comprobar(diaA.status === 200 && diaA.body.items.length === 3 && diaA.body.items.map((t) => t.numeroOrdenDia).join(',') === '1,2,3', 'listado diario contiene únicamente la fecha A y respeta el orden numérico')
  comprobar(diaB.status === 200 && diaB.body.items.length === 1 && diaB.body.items[0].paciente.id === p3.id, 'listado diario no mezcla pacientes de la fecha B')
  const busqueda = await medico('/patients?q=70000001')
  comprobar(busqueda.status === 200 && busqueda.body.items.some((p) => p.id === p1.id), 'búsqueda general encuentra paciente por DNI')

  const transicionDesdeEspera = await medico(`/appointments/${t1.body.turno.id}/estado`, { method: 'PATCH', body: { estado: 'ATENDIDO' } })
  comprobar(transicionDesdeEspera.status === 409, 'backend rechaza finalizar una atención que aún está EN ESPERA')
  const inicio = await medico(`/appointments/${t1.body.turno.id}/estado`, { method: 'PATCH', body: { estado: 'EN_ATENCION' } })
  comprobar(inicio.status === 200 && inicio.body.turno.estado === 'EN_ATENCION', 'médico inicia la atención y el estado pasa a EN_ATENCION')
  const finalizarSinConsulta = await medico(`/appointments/${t1.body.turno.id}/estado`, { method: 'PATCH', body: { estado: 'ATENDIDO' } })
  comprobar(finalizarSinConsulta.status === 409 && finalizarSinConsulta.body.error.includes('consulta clínica'), 'backend impide finalizar sin consulta guardada')
  const iniciarDosVeces = await medico(`/appointments/${t1.body.turno.id}/estado`, { method: 'PATCH', body: { estado: 'EN_ATENCION' } })
  comprobar(iniciarDosVeces.status === 409, 'backend rechaza iniciar dos veces la misma atención')

  const fechaConsulta = `${fechaA}T12:00:00`
  const consultaResponse = await medico(`/medical-records/${p1.id}/consultations`, {
    method: 'POST', body: {
      turnoId: t1.body.turno.id,
      fecha: fechaConsulta,
      motivoConsulta: 'Control ficticio',
      diagnostico: 'Diagnóstico ficticio inicial',
      evaluacion: 'Evolución ficticia inicial',
      tratamiento: 'Tratamiento ficticio inicial',
    },
  })
  comprobar(consultaResponse.status === 201, 'médico registra diagnóstico, evolución y tratamiento')
  const consultaId = consultaResponse.body.consulta.id
  const atencionTrasGuardar = await medico(`/appointments/${t1.body.turno.id}`)
  comprobar(atencionTrasGuardar.status === 200 && atencionTrasGuardar.body.turno.estado === 'EN_ATENCION', 'guardar consulta no finaliza automáticamente la atención')
  const consultaDuplicada = await medico(`/medical-records/${p1.id}/consultations`, {
    method: 'POST', body: { turnoId: t1.body.turno.id, fecha: fechaConsulta, diagnostico: 'Duplicado ficticio' },
  })
  comprobar(consultaDuplicada.status === 409, 'backend impide duplicar la consulta de una misma atención')
  const finalizar = await medico(`/appointments/${t1.body.turno.id}/estado`, { method: 'PATCH', body: { estado: 'ATENDIDO' } })
  comprobar(finalizar.status === 200 && finalizar.body.turno.estado === 'ATENDIDO', 'atención finaliza en ATENDIDO después de guardar la consulta')
  const segundaFinalizacion = await medico(`/appointments/${t1.body.turno.id}/estado`, { method: 'PATCH', body: { estado: 'ATENDIDO' } })
  comprobar(segundaFinalizacion.status === 409, 'backend rechaza finalizar nuevamente una atención terminada')

  const atenderPacienteFicticio = async (turno, pacienteId, diaAtencion, etiqueta) => {
    const inicioAtencion = await medico(`/appointments/${turno.id}/estado`, { method: 'PATCH', body: { estado: 'EN_ATENCION' } })
    if (inicioAtencion.status !== 200) throw new Error(`No se pudo iniciar la atención de prueba ${etiqueta}.`)
    const consultaDia = await medico(`/medical-records/${pacienteId}/consultations`, {
      method: 'POST', body: {
        turnoId: turno.id, fecha: `${diaAtencion}T12:00:00`,
        diagnostico: `Diagnóstico ficticio ${etiqueta}`, evaluacion: `Evolución ficticia ${etiqueta}`,
      },
    })
    if (consultaDia.status !== 201) throw new Error(`No se pudo guardar la consulta ficticia ${etiqueta}.`)
    return medico(`/appointments/${turno.id}/estado`, { method: 'PATCH', body: { estado: 'ATENDIDO' } })
  }
  const atendidoAyerResponse = await atenderPacienteFicticio(ayerTurnos[2].body.turno, ayerPacientes[2].id, fechaAyer, 'de ayer')
  const atendidoAnteriorResponse = await atenderPacienteFicticio(anteriorTurnos[2].body.turno, anteriorPacientes[2].id, fechaAnterior, 'anterior')
  comprobar(atendidoAyerResponse.status === 200 && atendidoAyerResponse.body.turno.estado === 'ATENDIDO' && atendidoAyerResponse.body.turno.horaFin, 'registro atendido de ayer conserva fecha, número y hora de finalización')
  comprobar(atendidoAnteriorResponse.status === 200 && atendidoAnteriorResponse.body.turno.estado === 'ATENDIDO', 'registro de una jornada anterior permanece en su propio día')
  const historialApi = await medico(`/appointments?desde=${fechaAnterior}&hasta=${fechaA}&estado=ATENDIDO`)
  comprobar(historialApi.status === 200 && historialApi.body.items.length === 3 && new Set(historialApi.body.items.map((item) => item.fechaAtencion)).size === 3, 'consulta histórica de atendidos devuelve jornadas separadas y totales independientes')

  const historia = await medico(`/medical-records/${p1.id}`)
  comprobar(historia.status === 200 && historia.body.historia.consultas.length === 1 && historia.body.historia.consultas[0].diagnostico === 'Diagnóstico ficticio inicial', 'historia devuelve la consulta original')
  const edicion = await medico(`/medical-records/consultations/${consultaId}`, {
    method: 'PUT', body: { diagnostico: 'Diagnóstico ficticio corregido' },
  })
  comprobar(edicion.status === 200 && edicion.body.consulta.version === 2 && edicion.body.consulta.versiones.length === 1, 'edición conserva una versión anterior de la consulta')
  comprobar(edicion.body.consulta.versiones[0].datos.diagnostico === 'Diagnóstico ficticio inicial', 'versión anterior conserva el diagnóstico previo')
  const auditoria = await db.auditLog.findMany({ where: { registroId: consultaId }, orderBy: { creadoEn: 'asc' } })
  comprobar(auditoria.length >= 2 && auditoria.every((a) => a.usuarioId === identidad.usuario.id && a.creadoEn instanceof Date), 'auditoría identifica al usuario médico y la fecha de creación/modificación')

  const estadoFinalA = await medico(`/appointments?fecha=${fechaA}&estado=ATENDIDO`)
  const esperaA = await medico(`/appointments?fecha=${fechaA}&estado=EN_ESPERA`)
  const canceladosA = await medico(`/appointments?fecha=${fechaA}&estado=CANCELADO`)
  comprobar(estadoFinalA.status === 200 && estadoFinalA.body.items.length === 1 && esperaA.body.items.length === 1 && canceladosA.body.items.length === 1, 'filtros por estado reflejan atención, espera y cancelación')
  const hoyDashboard = await medico(`/appointments?fecha=${fechaA}&incluirCancelados=1`)
  comprobar(hoyDashboard.body.total === 3 && hoyDashboard.body.items.filter((t) => t.estado === 'ATENDIDO').length === 1 && hoyDashboard.body.items.filter((t) => t.estado === 'CANCELADO').length === 1, 'datos reales devueltos permiten indicadores diarios consistentes')

  const pacienteSecretaria = await secretaria('/patients', { method: 'POST', body: { dni: '70000005', nombre: 'Alta', apellido: 'SecretariaFicticia' } })
  comprobar(pacienteSecretaria.status === 201, 'secretaría puede registrar un paciente ficticio desde su permiso existente')
  const busquedaSecretaria = await secretaria('/patients?q=SecretariaFicticia')
  comprobar(busquedaSecretaria.status === 200 && busquedaSecretaria.body.items.some((p) => p.id === pacienteSecretaria.body.paciente.id), 'búsqueda de secretaría encuentra pacientes por apellido')
  const inscripcionSecretaria = await secretaria('/appointments', { method: 'POST', body: { pacienteId: pacienteSecretaria.body.paciente.id, fechaAtencion: fechaA } })
  comprobar(inscripcionSecretaria.status === 201 && inscripcionSecretaria.body.numeroAsignado === 4, 'alta e inscripción desde secretaría asigna el siguiente número persistido')
  const cancelarUnaVez = await secretaria(`/appointments/${inscripcionSecretaria.body.turno.id}/cancelar`, { method: 'POST', body: { motivoCancelacion: 'Motivo ficticio de prueba' } })
  comprobar(cancelarUnaVez.status === 200 && cancelarUnaVez.body.turno.numeroOrdenDia === 4 && cancelarUnaVez.body.turno.cancelacion.usuario.includes('Noa'), 'cancelación conserva número y registra responsable')
  const canceladosSecretaria = await secretaria(`/appointments?fecha=${fechaA}&cancelados=1`)
  comprobar(canceladosSecretaria.status === 200 && canceladosSecretaria.body.items.some((t) => t.id === inscripcionSecretaria.body.turno.id), 'secretaría puede consultar inscripciones canceladas')
  const cancelarDosVeces = await secretaria(`/appointments/${inscripcionSecretaria.body.turno.id}/cancelar`, { method: 'POST', body: {} })
  comprobar(cancelarDosVeces.status === 409, 'backend rechaza la cancelación repetida')
  const reinscripcionSecretaria = await secretaria('/appointments', { method: 'POST', body: { pacienteId: pacienteSecretaria.body.paciente.id, fechaAtencion: fechaA } })
  comprobar(reinscripcionSecretaria.status === 201 && reinscripcionSecretaria.body.numeroAsignado === 5, 'una inscripción posterior recibe un número nuevo sin reutilizar el cancelado')
  comprobar(await db.paciente.count({ where: { id: pacienteSecretaria.body.paciente.id } }) === 1, 'cancelar inscripción conserva el paciente en PostgreSQL')
  const secretariaTransicion = await secretaria(`/appointments/${t2.body.turno.id}/estado`, { method: 'PATCH', body: { estado: 'EN_ATENCION' } })
  comprobar(secretariaTransicion.status === 403, 'backend impide a secretaría iniciar atenciones médicas')
  const medicoInscripcion = await medico('/appointments', { method: 'POST', body: { pacienteId: p2.id, fechaAtencion: fechaB } })
  comprobar(medicoInscripcion.status === 403, 'backend impide al médico ejecutar la inscripción administrativa')

  const historiaSecretaria = await secretaria(`/medical-records/${p1.id}`)
  comprobar(historiaSecretaria.status === 200 && historiaSecretaria.body.historia.consultas.length === 1, 'secretaría consulta la historia clínica completa autorizada')
  const edicionSecretaria = await secretaria(`/medical-records/consultations/${consultaId}`, { method: 'PUT', body: { evaluacion: 'Evolución ficticia editada por secretaría' } })
  comprobar(edicionSecretaria.status === 200 && edicionSecretaria.body.consulta.version === 3 && edicionSecretaria.body.consulta.versiones.length === 2, 'edición clínica autorizada desde secretaría conserva las versiones anteriores')
  const auditoriaSecretaria = await db.auditLog.findMany({ where: { registroId: consultaId, usuarioId: identidadSecretaria.usuario.id } })
  comprobar(auditoriaSecretaria.length >= 1 && auditoriaSecretaria[0].creadoEn instanceof Date, 'auditoría identifica usuario y fecha de la modificación de secretaría')

  const estadisticas = await secretaria(`/estadisticas?desde=${fechaA}&hasta=${fechaA}`)
  comprobar(estadisticas.status === 200 && estadisticas.body.resumen.totalInscripciones === 5 && estadisticas.body.resumen.atendidos === 1 && estadisticas.body.resumen.cancelados === 2 && estadisticas.body.resumen.enEspera === 2, 'estadísticas coinciden con inscripciones, estados y cancelaciones persistidos')
  const respuestaPdf = await fetch(`${base}/api/v1/estadisticas/informe.pdf?desde=${fechaA}&hasta=${fechaA}`, { headers: { cookie: cookieSecretaria } })
  const pdf = Buffer.from(await respuestaPdf.arrayBuffer())
  comprobar(respuestaPdf.status === 200 && respuestaPdf.headers.get('content-type')?.includes('application/pdf') && pdf.subarray(0, 4).toString() === '%PDF', 'secretaría descarga un informe PDF estadístico válido')
  comprobar(!pdf.toString('latin1').includes('700000') && !pdf.toString('latin1').includes('SecretariaFicticia'), 'PDF estadístico no contiene DNI ni nombres ficticios de pacientes')

  const inicioVisual = await medico(`/appointments/${t2.body.turno.id}/estado`, { method: 'PATCH', body: { estado: 'EN_ATENCION' } })
  comprobar(inicioVisual.status === 200, 'segunda atención ficticia queda disponible para el recorrido integrado del navegador')
  const finalizarSinConsultaPropia = await medico(`/appointments/${t2.body.turno.id}/estado`, { method: 'PATCH', body: { estado: 'ATENDIDO' } })
  comprobar(finalizarSinConsultaPropia.status === 409, 'otra consulta del paciente en la fecha no habilita finalizar esta atención sin vínculo propio')
  await pruebaVisual(port, p1.id, fechaA, fechaB, pacienteSecretaria.body.paciente.nombre, p3.nombre, pacienteSecretaria.body.paciente.id, t2.body.turno.id, p2.id, ayerPacientes[2].nombre, anteriorPacientes[2].nombre)

  console.log(`RESULTADO: pruebas funcionales y visuales completas en ${dbName}`)
} finally {
  for (const proceso of [vite, edge, api]) {
    if (proceso && proceso.exitCode === null) {
      proceso.kill()
      await Promise.race([once(proceso, 'exit').catch(() => undefined), new Promise((resolve) => setTimeout(resolve, 1500))])
    }
  }
  if (perfilEdge && perfilEdge.startsWith(join(tmpdir(), 'consultorio-edge-test-'))) rmSync(perfilEdge, { recursive: true, force: true })
  if (viteConfigTemp?.startsWith(join(process.cwd(), '..', 'frontend', '.vite.config.medico-test-'))) rmSync(viteConfigTemp, { force: true })
  if (db) await db.$disconnect().catch(() => undefined)
  if (admin) {
    if (baseCreada) {
      await admin.$queryRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${dbName} AND pid <> pg_backend_pid()`
      const existe = await admin.$queryRaw`SELECT 1 FROM pg_database WHERE datname = ${dbName}`
      if (existe.length) await admin.$executeRawUnsafe(`DROP DATABASE "${dbName}"`)
    }
    await admin.$disconnect()
    console.log(`Base temporal eliminada: ${dbName}`)
  }
}
