import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, ChevronDown, HeartPulse, Lock, MessagesSquare } from 'lucide-react'
import { contacto, perfilMedico, preguntasFrecuentes } from '@/data/sitio'
import { SeccionPublica } from './SeccionPublica'

function FAQItem({ pregunta, respuesta }: { pregunta: string; respuesta: string }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <div
      className={`rounded-2xl border bg-white shadow-card transition ${
        abierto ? 'border-primary-300 shadow-card-hover' : 'border-primary-100'
      }`}
    >
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6"
      >
        <span className="text-sm font-semibold text-primary-900 sm:text-base">{pregunta}</span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
            abierto ? 'bg-primary-900 text-white' : 'bg-primary-50 text-primary-500'
          }`}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>
      {abierto && (
        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-500 sm:px-6">{respuesta}</p>
      )}
    </div>
  )
}

export function SeccionFAQ() {
  return (
    <SeccionPublica
      id="faq"
      titulo="Preguntas frecuentes"
      subtitulo="Respuestas a las consultas más habituales."
      alternada
    >
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          {preguntasFrecuentes
            .filter((_, i) => i % 2 === 0)
            .map((f) => (
              <FAQItem key={f.pregunta} pregunta={f.pregunta} respuesta={f.respuesta} />
            ))}
        </div>
        <div className="space-y-4">
          {preguntasFrecuentes
            .filter((_, i) => i % 2 === 1)
            .map((f) => (
              <FAQItem key={f.pregunta} pregunta={f.pregunta} respuesta={f.respuesta} />
            ))}
        </div>
      </div>
    </SeccionPublica>
  )
}

const ANIO = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-primary-950 text-white">
      <div className="hero-grid absolute inset-0" aria-hidden="true" />
      {/* Banda de contacto rápido */}
      <div className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary-900 to-primary-800 p-7 shadow-card-hover sm:flex-row sm:items-center sm:p-9">
          <span
            className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-accent-400/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">¿Necesitás comunicarte?</h2>
            <p className="mt-1.5 max-w-md text-sm text-accent-100/80">
              Escribinos por WhatsApp o inscribite en el consultorio cada tarde de lunes a viernes.
            </p>
          </div>
          <a
            href={contacto.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="relative inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary-950 transition hover:-translate-y-0.5 hover:bg-accent-100"
          >
            <MessagesSquare className="h-4.5 w-4.5" aria-hidden="true" />
            Escribir por WhatsApp
          </a>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <HeartPulse className="h-5 w-5 text-accent-300" aria-hidden="true" />
              </span>
              <span className="font-bold">{perfilMedico.nombre}</span>
            </div>
            <p className="mt-3 text-sm text-white/60">Consultorio médico</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/80">Contacto</h3>
            <ul className="mt-3.5 space-y-2 text-sm text-white/60">
              <li>
                <a href={contacto.telUrl} className="numeros-tabulares transition hover:text-accent-300">
                  {contacto.telefonoVisible}
                </a>
              </li>
              <li>
                <a
                  href={contacto.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-accent-300"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/80">Enlaces</h3>
            <ul className="mt-3.5 space-y-2.5 text-sm text-white/60">
              <li>
                <a href="#horarios" className="transition hover:text-accent-300">
                  Horarios de atención
                </a>
              </li>
              <li>
                <a href="#contacto" className="transition hover:text-accent-300">
                  Solicitar atención
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
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {ANIO} Consultorio {perfilMedico.nombre}. Todos los derechos reservados.</p>
          <p className="text-white/30">Designed by Agustin Molina</p>
          <p className="inline-flex items-center gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Atención de lunes a viernes desde las 17:00 hs.
          </p>
        </div>
      </div>
    </footer>
  )
}
