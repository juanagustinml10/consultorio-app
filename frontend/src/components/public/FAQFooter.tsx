import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus, ChevronDown, HeartPulse, Lock } from 'lucide-react'
import { datosDemo, perfilMedico, preguntasFrecuentes } from '@/data/mock'
import { SeccionPublica } from './SeccionPublica'

function FAQItem({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="rounded-2xl border border-primary-100 bg-white shadow-card">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-primary-900 sm:text-base">{pregunta}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-primary-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {abierto && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-500">{respuesta}</p>}
    </div>
  )
}

export function SeccionFAQ() {
  return (
    <SeccionPublica
      id="faq"
      titulo="Preguntas frecuentes"
      subtitulo="Respuestas a las consultas más habituales (contenido de ejemplo)."
      alternada
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {preguntasFrecuentes.map((f) => (
          <FAQItem key={f.pregunta} pregunta={f.pregunta} respuesta={f.respuesta} />
        ))}
      </div>
    </SeccionPublica>
  )
}

const ANIO = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="bg-primary-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <HeartPulse className="h-5 w-5 text-accent-300" aria-hidden="true" />
              </span>
              <span className="font-bold">{perfilMedico.nombre}</span>
            </div>
            <p className="mt-3 text-sm text-white/60">{perfilMedico.especialidad}</p>
            <p className="mt-1 text-xs text-white/40">Matrícula {perfilMedico.matricula}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/80">Contacto</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-white/60">
              <li>{datosDemo.contacto.telefono}</li>
              <li>{datosDemo.contacto.email}</li>
              <li>{datosDemo.consultorio.direccion}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/80">Enlaces</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              <li>
                <a href="#horarios" className="transition hover:text-accent-300">
                  Horarios de atención
                </a>
              </li>
              <li>
                <a href="#contacto" className="transition hover:text-accent-300">
                  Solicitar turno
                </a>
              </li>
              <li>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-white/50 transition hover:text-accent-300"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Acceso al sistema
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {ANIO} Consultorio Dra. Laura Pérez. Todos los derechos reservados. (sitio de ejemplo)</p>
          <p className="inline-flex items-center gap-1.5">
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Demostración: datos ficticios, sin información real del profesional.
          </p>
        </div>
      </div>
    </footer>
  )
}
