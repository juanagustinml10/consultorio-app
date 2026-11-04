import { MapPin, Megaphone, MessagesSquare } from 'lucide-react'
import { datosDemo, perfilMedico } from '@/data/mock'

/** Botón flotante de WhatsApp con número de ejemplo. */
export function FloatingWhatsApp() {
  return (
    <a
      href={datosDemo.whatsapp}
      target="_blank"
      rel="noreferrer"
      className="fixed right-4 bottom-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white shadow-card-hover transition hover:bg-emerald-600 sm:right-6 sm:bottom-6"
    >
      <MessagesSquare className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  )
}

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-primary-950 via-primary-900 to-primary-800 text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-accent-200">
              atención por turnos
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              {perfilMedico.nombre}
            </h1>
            <p className="mt-2 text-lg font-semibold text-accent-300 sm:text-xl">
              {perfilMedico.especialidad}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-accent-100/90 sm:text-base">
              {perfilMedico.descripcion}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={datosDemo.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary-950 transition hover:bg-accent-100"
              >
                Solicitar turno
              </a>
              <a
                href="#horarios"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver horarios
              </a>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-accent-200/80">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {datosDemo.consultorio.direccion}
            </p>
          </div>

          <div className="mx-auto w-full max-w-xs md:max-w-sm">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-card-hover">
              <div
                className="flex aspect-4/5 items-center justify-center bg-gradient-to-br from-primary-950 to-primary-700"
                aria-hidden="true"
              >
                <span className="text-7xl font-extrabold text-accent-200 sm:text-8xl">LP</span>
              </div>
              <div className="border-t border-white/10 px-5 py-4 text-xs text-accent-100/80">
                Fotografía provisoria — se reemplazará por la real al administrar el sitio.
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-accent-200/70 sm:hidden">Datos de ejemplo</p>
            <p className="mt-1 hidden justify-center text-xs text-accent-200/70 sm:flex">
              Datos de ejemplo sin información real del profesional
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AvisoImportante() {
  // En la etapa 2 los avisos se obtienen de la API (tabla Aviso).
  const avisos = [
    {
      id: 'ejemplo-1',
      titulo: 'Atención suspendida por vacaciones',
      mensaje:
        'Del 10 al 24 de enero no habrá atención. Los turnos se reprograman por WhatsApp. (aviso de ejemplo)',
    },
  ]
  if (avisos.length === 0) return null

  return (
    <div id="avisos" className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-card sm:p-5">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Megaphone className="h-4 w-4 text-amber-600" aria-hidden="true" />
          </div>
          {avisos.map((a) => (
            <div key={a.id}>
              <h2 className="text-sm font-semibold text-amber-800">{a.titulo}</h2>
              <p className="mt-0.5 text-sm text-amber-800/90">{a.mensaje}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
