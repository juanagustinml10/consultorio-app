import { Building2, Clock3, HeartPulse, Mail, MapPin, Phone, Stethoscope, Syringe, ClipboardList } from 'lucide-react'
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
      <ol className="relative ml-2 max-w-3xl space-y-5 border-l-2 border-primary-100">
        {formacionAcademica.map((f) => (
          <li key={f.titulo} className="relative pl-7">
            <span className="absolute top-6 -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary-200 bg-white shadow-card">
              <span className="h-2 w-2 rounded-full bg-primary-600" aria-hidden="true" />
            </span>
            <div className="rounded-2xl border border-primary-100 bg-white p-5 shadow-card transition hover:shadow-card-hover">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h3 className="text-sm font-semibold text-primary-900 sm:text-base">{f.titulo}</h3>
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700">
                  {f.periodo}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-slate-500">{f.instituto}</p>
              {f.detalle && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.detalle}</p>}
            </div>
          </li>
        ))}
      </ol>
    </SeccionPublica>
  )
}

const ICONOS = {
  stethoscope: Stethoscope,
  clipboard: ClipboardList,
  heart: HeartPulse,
  syringe: Syringe,
} as const

export function SeccionServicios() {
  return (
    <SeccionPublica
      id="servicios"
      titulo="Especialidades y servicios"
      subtitulo="La atención del consultorio se organiza en estas áreas (ejemplo)."
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {servicios.map((s) => {
          const Icono = ICONOS[s.icono]
          return (
            <div
              key={s.titulo}
              className="group rounded-2xl border border-primary-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-primary-700 transition group-hover:bg-primary-900 group-hover:text-accent-300">
                <Icono className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-sm font-semibold text-primary-900 sm:text-base">{s.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.descripcion}</p>
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
      <div className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card sm:max-w-2xl">
        <ul className="divide-y divide-primary-100/80">
          {horariosAtencion.map((h) => {
            const sinAtencion = h.franja === 'Sin atención'
            return (
              <li
                key={h.dias}
                className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${sinAtencion ? 'bg-slate-50/60' : ''}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    sinAtencion ? 'bg-slate-100 text-slate-400' : 'bg-accent-100 text-primary-700'
                  }`}
                >
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-primary-900 sm:text-base">
                  {h.dias}
                </span>
                <span
                  className={`numeros-tabulares text-sm sm:text-base ${
                    sinAtencion ? 'text-slate-400' : 'font-semibold text-accent-600'
                  }`}
                >
                  {h.franja}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="border-t border-primary-100/80 bg-primary-50/50 px-5 py-3 sm:px-6">
          <p className="text-xs text-slate-500">
            La recepción inscribe a los pacientes por orden de llegada; la atención sigue ese orden, sin horarios individuales (datos de ejemplo).
          </p>
        </div>
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {obrasSociales.map((o) => (
          <div
            key={o}
            className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-white px-4 py-3.5 shadow-card"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 text-sm font-medium text-primary-900">{o}</span>
          </div>
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
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-900 text-accent-300">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-5 text-base font-semibold text-primary-900">{datosDemo.consultorio.direccion}</h3>
          <p className="mt-1 text-sm text-slate-500">{datosDemo.consultorio.ciudad}</p>
          <a
            href={datosDemo.consultorio.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card-hover"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Abrir en Google Maps
          </a>
        </div>
        <div className="md:col-span-3">
          <div className="hero-grid flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-primary-100 bg-primary-50/70 shadow-card">
            <div className="relative px-8 text-center">
              <span className="absolute left-1/2 top-0 h-16 w-16 -translate-x-1/2 rounded-full bg-primary-200/30 blur-xl" aria-hidden="true" />
              <MapPin className="relative mx-auto h-9 w-9 text-primary-400" aria-hidden="true" />
              <p className="relative mt-3 text-sm text-slate-500">
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
          className="group rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-emerald-700/80">WhatsApp — vía más rápida</p>
          <p className="numeros-tabulares mt-1 text-lg font-bold text-emerald-800">{datosDemo.contacto.telefono}</p>
          <p className="mt-1 text-xs text-emerald-600/80">número de ejemplo</p>
        </a>
        <a
          href={`tel:${datosDemo.contacto.telefono.replace(/[^+\d]/g, '')}`}
          className="group rounded-2xl border border-primary-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-primary-700">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-500">Teléfono</p>
          <p className="numeros-tabulares mt-1 text-lg font-bold text-primary-900">{datosDemo.contacto.telefono}</p>
          <p className="mt-1 text-xs text-slate-400">durante horarios de atención</p>
        </a>
        <a
          href={`mailto:${datosDemo.contacto.email}`}
          className="group rounded-2xl border border-primary-100 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-primary-700">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm font-medium text-slate-500">Correo electrónico</p>
          <p className="mt-1 break-all text-lg font-bold text-primary-900">{datosDemo.contacto.email}</p>
          <p className="mt-1 text-xs text-slate-400">respuesta en 24 h</p>
        </a>
      </div>
    </SeccionPublica>
  )
}
