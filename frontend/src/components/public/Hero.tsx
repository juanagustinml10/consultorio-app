import { CalendarCheck, Clock3, MapPin, Phone, Stethoscope } from 'lucide-react'
import { consultorio, contacto, perfilMedico } from '@/data/sitio'

/** Botón flotante de WhatsApp del consultorio. */
export function FloatingWhatsApp() {
  return (
    <a
      href={contacto.whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Contacto por WhatsApp"
      className="fixed right-4 bottom-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-600 sm:right-6 sm:bottom-6 sm:h-12 sm:w-auto sm:px-4"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.1 13.9c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-2.6-.9-4.3-3.5-4.4-3.7-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2 .2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.6.7 2 .8 2.1.1.2.1.3 0 .5-.1.2-.2.4-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.1 0 .7-.2.9Z" />
      </svg>
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  )
}

/** Línea electrocardiográfica decorativa del panel visual. */
function LineaEcg() {
  return (
    <svg
      viewBox="0 0 320 80"
      fill="none"
      preserveAspectRatio="none"
      className="absolute inset-x-0 top-1/2 h-20 w-full -translate-y-1/2 text-accent-400/50"
      aria-hidden="true"
    >
      <polyline
        points="0 40 90 40 108 40 118 12 130 66 142 40 190 40 206 40 216 20 228 58 240 40 320 40"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Portada principal del consultorio. */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary-950 text-white">
      {/* Capas decorativas: rejilla + halos de luz suaves */}
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-28 left-1/2 h-72 w-3/4 -translate-x-1/2 rounded-full bg-accent-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:pb-20 lg:pt-24">
        {/* Columna de texto (primera en móvil) */}
        <div className="min-w-0">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-medium text-accent-200 backdrop-blur sm:text-xs">
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Atención por orden de inscripción
          </p>

          <h1 className="mt-4 text-4xl font-extrabold leading-[1.06] tracking-tight text-balance sm:mt-5 sm:text-5xl lg:text-6xl">
            {perfilMedico.nombre}
          </h1>
          <p className="mt-2.5 text-base font-semibold text-accent-300 sm:mt-3 sm:text-lg">
            Medicina clínica
          </p>

          <p className="mt-4 text-sm leading-relaxed text-primary-100/85 sm:mt-5 sm:text-lg">
            {perfilMedico.descripcion}
          </p>

          {/* Recuadro: horario y ubicación */}
          <div className="mt-6 flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:w-fit sm:min-w-md sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <Clock3 className="h-4.5 w-4.5 text-accent-300" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm text-primary-100/90 sm:text-base">
                <strong className="font-semibold text-white">Lunes a Jueves</strong>
                <span className="mx-1.5 text-white/40">·</span>
                <span className="numeros-tabulares">desde las 17:00</span>
              </span>
            </div>
            <div className="h-px bg-white/10" aria-hidden="true" />
            <a
              href={consultorio.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <MapPin className="h-4.5 w-4.5 text-accent-300" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm text-primary-100/90 sm:text-base">
                <strong className="font-semibold text-white">Aguilares, Tucumán</strong>
                <span className="mx-1.5 text-white/40">·</span>
                <span className="font-medium text-accent-200 underline underline-offset-4 transition group-hover:text-accent-100">
                  Ver en Google Maps
                </span>
              </span>
            </a>
          </div>

          {/* Acciones: a ancho completo en móvil, cómodas al pulgar */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#contacto"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-primary-950 shadow-lg shadow-accent-500/10 transition hover:-translate-y-0.5 hover:bg-accent-100 sm:w-auto"
            >
              <CalendarCheck className="h-4.5 w-4.5" aria-hidden="true" />
              Solicitar atención
            </a>
            <a
              href={contacto.telUrl}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto"
            >
              <Phone className="h-4.5 w-4.5" aria-hidden="true" />
              <span className="numeros-tabulares">{contacto.telefonoVisible}</span>
            </a>
          </div>
        </div>

        {/* Panel visual: sobrio, con glifo médico y línea ECG */}
        <div className="relative mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-none">
          <div
            className="absolute -inset-4 rounded-[2.5rem] bg-accent-400/10 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary-900/80 to-primary-950 shadow-2xl shadow-black/30 sm:aspect-[16/10] lg:aspect-[4/3]">
            <div className="hero-grid absolute inset-0" aria-hidden="true" />
            <div
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-400/15 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-primary-500/25 blur-3xl"
              aria-hidden="true"
            />
            <LineaEcg />
            <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur sm:h-24 sm:w-24">
              <Stethoscope className="h-9 w-9 text-accent-200 sm:h-11 sm:w-11" aria-hidden="true" />
            </span>
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
