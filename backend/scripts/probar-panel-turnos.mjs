import assert from 'node:assert/strict'
import test from 'node:test'
import { resumirTurnosMedico } from '../../frontend/src/pages/medico/resumenTurnos.ts'

const ahora = new Date('2026-11-04T17:37:00').getTime()

function turno(id, estado, fechaHora, horaLlegada, numeroOrdenDia) {
  return {
    id,
    paciente: { id: `paciente-${id}`, nombre: 'Paciente', apellido: id, dni: id },
    fechaAtencion: fechaHora.slice(0, 10),
    fechaHora,
    duracionMin: 30,
    motivo: 'Prueba',
    estado,
    ...(horaLlegada && { horaLlegada }),
    ...(numeroOrdenDia !== undefined && { numeroOrdenDia }),
  }
}

test('la cola del panel incluye espera diaria y llegadas espontáneas sin duplicar, y excluye atendidos/cancelados', () => {
  const esperaDiaria = turno('espera-diaria', 'LLEGO', '2026-11-04T10:00', '2026-11-04T17:00', 2)
  const atencionActiva = turno('atencion-activa', 'EN_ATENCION', '2026-11-04T11:00', '2026-11-04T17:10', 1)
  const llegadaEspontanea = turno('sin-turno', 'LLEGO', '2026-11-05T08:00', '2026-11-04T17:20', 3)
  const turnosHoy = [
    esperaDiaria,
    atencionActiva,
    turno('atendido', 'ATENDIDO', '2026-11-04T12:00'),
    turno('cancelado', 'CANCELADO', '2026-11-04T13:00'),
  ]

  const resumen = resumirTurnosMedico(turnosHoy, [esperaDiaria, atencionActiva, llegadaEspontanea], ahora)

  assert.deepEqual(resumen.enEspera.map((item) => item.id), ['espera-diaria', 'sin-turno'])
  assert.deepEqual(resumen.enAtencion.map((item) => item.id), ['atencion-activa'])
  assert.equal(resumen.enEspera.length, 2)
  assert.equal(new Set(resumen.colaActual.map((item) => item.id)).size, resumen.colaActual.length)
  assert.deepEqual(resumen.colaActual.map((item) => item.numeroOrdenDia), [1, 2, 3])
  assert.deepEqual(resumen.atendidos.map((item) => item.id), ['atendido'])
  const trasRecargar = resumirTurnosMedico(turnosHoy, [esperaDiaria, atencionActiva, llegadaEspontanea], ahora)
  assert.deepEqual(
    trasRecargar.colaActual.map((item) => [item.id, item.numeroOrdenDia]),
    resumen.colaActual.map((item) => [item.id, item.numeroOrdenDia]),
  )
})

test('los próximos pacientes conservan su estado de espera y excluyen estados terminales', () => {
  const turnosHoy = [
    turno('espera-dia', 'LLEGO', '2026-11-04T00:00'),
    turno('futuro-espera', 'LLEGO', '2026-11-05T00:00', '2026-11-04T17:30'),
    turno('futuro-atencion', 'EN_ATENCION', '2026-11-05T00:00', '2026-11-04T17:30'),
    turno('futuro-atendido', 'ATENDIDO', '2026-11-05T00:00'),
    turno('futuro-ausente', 'AUSENTE', '2026-11-05T00:00'),
    turno('futuro-cancelado', 'CANCELADO', '2026-11-05T00:00'),
  ]

  const resumen = resumirTurnosMedico(turnosHoy, [], ahora)

  assert.deepEqual(resumen.enEspera.map((item) => item.id), ['espera-dia', 'futuro-espera'])
  assert.deepEqual(resumen.proximos.map((item) => item.id), [
    'futuro-espera',
    'futuro-atencion',
  ])
})
