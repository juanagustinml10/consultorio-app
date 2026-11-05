import { CalendarCheck, Clock3, MapPin, Megaphone, MessagesSquare, ShieldCheck } from 'lucide-react'
import { datosDemo, horariosAtencion, obrasSociales, perfilMedico } from '@/data/mock'

/** Botón flotante de WhatsApp con número de ejemplo. */
export function FloatingWhatsApp() {
  return (
    <a
      href={datosDemo.whatsapp}
      target="_blank"
      rel="noreferrer"
      className="fixed right-4 bottom-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-600 sm:right-6 sm:bottom-6"
    >
      <MessagesSquare className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  )
}

export function Hero() {
  const franjas = horariosAtencion.filter((h) => h.franja !== 'Sin atención')

  return (
    <section className="relative overflow-hidden bg-primary-950 text-white">
      {/* Capas decorativas: rejilla + halos de luz */}
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-32 left-1/2 h-96 w-3/4 -translate-x-1/2 rounded-full bg-accent-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-primary-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Columna de texto */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-accent-200 backdrop-blur">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Atención por orden de inscripción — consultorio clínica general
            </p>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {perfilMedico.nombre}
            </h1>
            <p className="mt-3 bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
              {perfilMedico.especialidad}
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-100/85 sm:text-lg">
              {perfilMedico.descripcion}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={datosDemo.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-primary-950 shadow-lg shadow-accent-500/10 transition hover:-translate-y-0.5 hover:bg-accent-100"
              >
                <CalendarCheck className="h-4.5 w-4.5" aria-hidden="true" />
                Solicitar turno
              </a>
              <a
                href="#horarios"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Clock3 className="h-4.5 w-4.5" aria-hidden="true" />
                Ver horarios
              </a>
            </div>

            {/* Panel de confianza */}
            <div className="mt-9 max-w-xl rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur sm:p-5">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:divide-x sm:divide-white/10 sm:gap-0">
                <div className="flex items-start gap-3 sm:pr-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                    <Clock3 className="h-4.5 w-4.5 text-accent-300" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      Franjas de atención
                    </dt>
                    <dd className="numeros-tabulares mt-1 text-xs leading-snug font-semibold text-white">
                      {franjas.map((f) => f.franja).join(' · ')}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:px-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                    <ShieldCheck className="h-4.5 w-4.5 text-accent-300" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      Coberturas
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-white">
                      {obrasSociales.length} obras y prepagas
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:pl-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                    <MapPin className="h-4.5 w-4.5 text-accent-300" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      Ubicación
                    </dt>
                    <dd className="mt-1 truncate text-sm font-semibold text-white">
                      {datosDemo.consultorio.ciudad}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>

          {/* Columna de presentación */}
          <div className="relative mx-auto w-full max-w-xs md:max-w-sm">
            <div
              className="absolute -inset-6 rounded-[2.5rem] bg-accent-400/15 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur">
              <div
                className="hero-grid flex aspect-4/5 items-center justify-center bg-gradient-to-br from-primary-800/80 to-primary-950"
                aria-hidden="true"
              >
                <span className="text-8xl font-extrabold tracking-tight text-accent-200/90">LP</span>
              </div>
              <div className="border-t border-white/10 bg-white/5 px-5 py-4">
                <p className="text-sm font-semibold text-white">{perfilMedico.especialidad}</p>
                <p className="mt-0.5 text-xs text-accent-200/70">Matrícula {perfilMedico.matricula}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                  Fotografía provisoria — se reemplazará por la real al administrar el sitio.
                </p>
              </div>
            </div>

            {/* Tarjeta flotante: próxima atención */}
            <div className="absolute -left-4 top-10 hidden rounded-2xl border border-white/10 bg-primary-900/90 px-4 py-3 shadow-xl backdrop-blur sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-200/80">
                Próximos horarios de ejemplo
              </p>
              <p className="numeros-tabulares mt-1 text-sm font-bold text-white">
                09:00 · 16:00 · 09:00
              </p>
            </div>

            {/* Tarjeta flotante: turnos por WhatsApp */}
            <div className="absolute -right-3 bottom-24 hidden rounded-2xl border border-white/10 bg-white px-4 py-3 shadow-xl sm:block">
              <p className="flex items-center gap-1.5 text-xs font-bold text-primary-900">
                <MessagesSquare className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                Turnos por WhatsApp
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">(número de ejemplo)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Curva suave que conecta con la página */}
      <svg
        className="relative block w-full text-white"
        viewBox="0 0 1440 48"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 48h1440V0c-240 32-720 40-1440 12v36Z" fill="currentColor" />
      </svg>
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
        'Del 10 al 24 de enero no habrá atención. Consultá novedades por WhatsApp. (aviso de ejemplo)',
    },
  ]
  if (avisos.length === 0) return null

  return (
    <div id="avisos" className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
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
