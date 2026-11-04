import { Building2, Mail, MapPin, Phone } from 'lucide-react'
import {
  datosDemo,
  formacionAcademica,
  horariosAtencion,
  obrasSociales,
  servicios,
} from '@/data/mock'
import { SeccionPublica } from './SeccionPublica'

export function SeccionFormacion() {
  return (
    <SeccionPublica
      id="formacion"
      titulo="Formación y experiencia"
      subtitulo="Trayectoria académica y profesional (datos de ejemplo)."
      alternada
    >
      <ol className="relative ml-3 space-y-6 border-l border-primary-100">
        {formacionAcademica.map((f) => (
          <li key={f.titulo} className="pl-6">
            <span className="absolute -left-[9px] mt-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-primary-300 bg-white">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-600" aria-hidden="true" />
            </span>
            <div className="rounded-2xl border border-primary-100 bg-white p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-primary-900 sm:text-base">{f.titulo}</h3>
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                  {f.periodo}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{f.instituto}</p>
              {f.detalle && <p className="mt-1.5 text-sm text-slate-600">{f.detalle}</p>}
            </div>
          </li>
        ))}
      </ol>
    </SeccionPublica>
  )
}

const ICONOS = {
  stethoscope: StethoscopeIcon,
  clipboard: ClipboardIcon,
  heart: HeartIcon,
  syringe: SyringeIcon,
} as const

function StethoscopeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M11 2v2" />
      <path d="M5 2v2" />
      <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
      <path d="M8 15a6 6 0 0 0 12 0v-3" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  )
}
function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M12 13 10 11" />
      <path d="M12 13V8" />
    </svg>
  )
}
function SyringeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="m18 2 4 4" />
      <path d="m17 7 3-3" />
      <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
      <path d="m9 11 4 4" />
      <path d="m5 19-3 3" />
      <path d="m14 4 6 6" />
    </svg>
  )
}

export function SeccionServicios() {
  return (
    <SeccionPublica
      id="servicios"
      titulo="Especialidades y servicios"
      subtitulo="La atención del consultorio se organiza en estas áreas (ejemplo)."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {servicios.map((s) => {
          const Icono = ICONOS[s.icono]
          return (
            <div
              key={s.titulo}
              className="rounded-2xl border border-primary-100 bg-white p-5 shadow-card transition hover:shadow-card-hover"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-primary-700">
                <Icono />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-primary-900 sm:text-base">{s.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.descripcion}</p>
            </div>
          )
        })}
      </div>
    </SeccionPublica>
  )
}

export function SeccionHorarios() {
  return (
    <SeccionPublica
      id="horarios"
      titulo="Horarios de atención"
      subtitulo="Días y franjas horarias vigentes (ejemplo)."
      alternada
    >
      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card">
        <ul className="divide-y divide-primary-100/80">
          {horariosAtencion.map((h) => (
            <li key={h.dias} className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="text-sm font-medium text-primary-900 sm:text-base">{h.dias}</span>
              <span
                className={`text-sm sm:text-base ${
                  h.franja === 'Sin atención' ? 'text-slate-400' : 'font-semibold text-accent-600'
                }`}
              >
                {h.franja}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SeccionPublica>
  )
}

export function SeccionObrasSociales() {
  return (
    <SeccionPublica
      id="obras-sociales"
      titulo="Obras sociales y prepagas"
      subtitulo="Coberturas aceptadas en el consultorio (ejemplo)."
    >
      <div className="flex flex-wrap gap-2.5">
        {obrasSociales.map((o) => (
          <span
            key={o}
            className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-800"
          >
            <Building2 className="h-4 w-4 text-primary-400" aria-hidden="true" />
            {o}
          </span>
        ))}
      </div>
    </SeccionPublica>
  )
}

export function SeccionUbicacion() {
  return (
    <SeccionPublica
      id="ubicacion"
      titulo="Ubicación del consultorio"
      subtitulo="Dirección de ejemplo, reemplazable desde el panel de administración."
      alternada
    >
      <div className="grid gap-6 md:grid-cols-5">
        <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card md:col-span-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-primary-700">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-primary-900">{datosDemo.consultorio.direccion}</h3>
          <p className="mt-1 text-sm text-slate-500">{datosDemo.consultorio.ciudad}</p>
          <a
            href={datosDemo.consultorio.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Abrir en Google Maps
          </a>
        </div>
        <div className="md:col-span-3">
          <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-primary-100 bg-accent-50/60 shadow-card">
            <div className="px-8 text-center">
              <MapPin className="mx-auto h-8 w-8 text-primary-300" aria-hidden="true" />
              <p className="mt-3 text-sm text-slate-500">
                mapa interactivo — se integrará con la dirección real en la etapa de administración
              </p>
            </div>
          </div>
        </div>
      </div>
    </SeccionPublica>
  )
}

export function SeccionContacto() {
  return (
    <SeccionPublica id="contacto" titulo="Contacto" subtitulo="Canales para solicitar turnos (datos de ejemplo).">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href={datosDemo.whatsapp}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-card transition hover:shadow-card-hover"
        >
          <p className="text-sm font-semibold text-emerald-700">WhatsApp</p>
          <p className="mt-1 text-lg font-semibold text-emerald-700">{datosDemo.contacto.telefono}</p>
          <p className="mt-1 text-xs text-emerald-600/80">número de ejemplo</p>
        </a>
        <a
          href={`tel:${datosDemo.contacto.telefono.replace(/[^+\d]/g, '')}`}
          className="rounded-2xl border border-primary-100 bg-white p-5 shadow-card transition hover:shadow-card-hover"
        >
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <Phone className="h-4 w-4" aria-hidden="true" /> Teléfono
          </p>
          <p className="mt-1 text-lg font-semibold text-primary-900">{datosDemo.contacto.telefono}</p>
          <p className="mt-1 text-xs text-slate-400">durante horarios de atención</p>
        </a>
        <a
          href={`mailto:${datosDemo.contacto.email}`}
          className="rounded-2xl border border-primary-100 bg-white p-5 shadow-card transition hover:shadow-card-hover"
        >
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <Mail className="h-4 w-4" aria-hidden="true" /> Correo
          </p>
          <p className="mt-1 break-all text-lg font-semibold text-primary-900">{datosDemo.contacto.email}</p>
          <p className="mt-1 text-xs text-slate-400">respuesta en 24 h</p>
        </a>
      </div>
    </SeccionPublica>
  )
}
