import { Clock3, CreditCard, MapPin, MessageCircle, Phone } from 'lucide-react'
import { consultorio, contacto, horariosAtencion } from '@/data/sitio'
import { SeccionPublica } from './SeccionPublica'

export function SeccionObrasSociales() {
  return (
    <SeccionPublica
      id="obras-sociales"
      titulo="Obras sociales y prepagas"
      subtitulo="Obras sociales aceptadas en el consultorio."
    >
      {/* Recuadro: todas las obras sociales */}
      <div className="mt-6 flex w-full items-center justify-center rounded-xl border border-accent-200/50 bg-accent-50/10 p-4 sm:mt-8 sm:p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
          <CreditCard className="h-4 w-4" aria-hidden="true" />
        </div>
        <span className="ml-3 text-base font-semibold text-primary-900 sm:ml-4 sm:text-lg">
          Se reciben todas las obras sociales
        </span>
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
    </SeccionPublica>
  )
}
