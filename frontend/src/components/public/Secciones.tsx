import { Clock3, CreditCard, MapPin, MessageCircle, Phone } from 'lucide-react'
import { consultorio, contacto, horariosAtencion } from '@/data/sitio'
import { SeccionPublica } from './SeccionPublica'

export function SeccionObrasSociales() {
  return (
    <SeccionPublica
      id="obras-sociales"
      titulo="Obras sociales y prepagas"
      subtitulo="Coberturas aceptadas en el consultorio."
    >
      {/* Recuadro destacado: todas las obras sociales */}
      <div className="relative rounded-3xl border border-accent-200 bg-accent-50 p-8 sm:p-10 shadow-sm overflow-hidden">
        {/* Banda decorativa superior */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-1 w-full sm:h-2 sm:w-full bg-accent-500 rounded-full sm:rounded-none sm:h-full sm:w-2" />

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 sm:items-start">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-100 text-accent-600 sm:h-16 sm:w-16">
            <CreditCard className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
          </div>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-primary-900 sm:text-2xl">Se reciben todas las obras sociales</h3>
            <p className="mt-1 text-sm text-primary-600/70 sm:mt-2 sm:text-base">
              Aceptamos las principales obras sociales y prepagas del país. Consultanos por tu cobertura.
            </p>
          </div>
        </div>
      </div>
    </SeccionPublica>
  )
}

export function SeccionHorarios() {
  return (
    <SeccionPublica
      id="horarios"
      titulo="Horarios de atención"
      subtitulo="Días y horario vigente del consultorio."
      alternada
    >
      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card sm:max-w-2xl">
        <ul className="divide-y divide-primary-100/80">
          {horariosAtencion.map((h) => (
            <li key={h.dias} className="flex items-center gap-4 px-5 py-4 sm:px-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-primary-700">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-primary-900 sm:text-base">{h.dias}</span>
              <span className="numeros-tabulares text-sm font-semibold text-accent-600 sm:text-base">
                {h.franja}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-primary-100/80 bg-primary-50/50 px-5 py-3 sm:px-6">
          <p className="text-xs text-slate-500">
            La recepción inscribe a los pacientes por orden de llegada; la atención sigue ese orden, sin horarios individuales.
          </p>
        </div>
      </div>
    </SeccionPublica>
  )
}

export function SeccionUbicacion() {
  return (
    <SeccionPublica
      id="ubicacion"
      titulo="Ubicación del consultorio"
      subtitulo="Cómo llegar hasta el consultorio."
    >
      <div className="grid gap-6 md:grid-cols-5">
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card md:col-span-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-900 text-accent-300">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-base font-semibold text-primary-900">{consultorio.direccion}</h3>
          <p className="mt-1 text-sm text-slate-500">{consultorio.ciudad}</p>
          <a
            href={consultorio.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card-hover"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Abrir en Google Maps
          </a>
        </div>
        <div className="md:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-primary-100 shadow-card">
            <iframe
              title="Ubicación del consultorio en Google Maps"
              src={consultorio.mapsEmbedUrl}
              className="h-64 w-full border-0 sm:h-80 md:h-full md:min-h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </SeccionPublica>
  )
}

export function SeccionContacto() {
  return (
    <SeccionPublica
      id="contacto"
      titulo="Contacto"
      subtitulo="Canales disponibles para comunicarse con el consultorio."
      alternada
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href={contacto.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-emerald-700/80">WhatsApp</p>
          <p className="numeros-tabulares mt-1 text-lg font-bold text-emerald-800">{contacto.telefonoVisible}</p>
          <p className="mt-1 text-xs text-emerald-600/80">abre una conversación por WhatsApp</p>
        </a>
        <a
          href={contacto.telUrl}
          className="group rounded-2xl border border-primary-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-primary-700">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-500">Teléfono</p>
          <p className="numeros-tabulares mt-1 text-lg font-bold text-primary-900">{contacto.telefonoVisible}</p>
          <p className="mt-1 text-xs text-slate-400">durante horarios de atención</p>
        </a>
        <a
          href={consultorio.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl border border-primary-100 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card-hover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-primary-700">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-500">Dirección</p>
          <p className="mt-1 text-base font-bold text-primary-900">{consultorio.direccion}</p>
          <p className="mt-1 text-xs text-slate-400">{consultorio.ciudad}</p>
        </a>
      </div>
    </SeccionPublica>
  )
}
