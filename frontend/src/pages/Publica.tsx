import { Hero } from '@/components/public/Hero'
import { SiteHeader } from '@/components/public/SiteHeader'
import {
  SeccionContacto,
  SeccionHorarios,
  SeccionObrasSociales,
  SeccionUbicacion,
} from '@/components/public/Secciones'
import { SeccionFAQ, SiteFooter } from '@/components/public/FAQFooter'
import { FloatingWhatsApp } from '@/components/public/Hero'
import { SeccionPublica } from '@/components/public/SeccionPublica'
import { perfilMedico } from '@/data/sitio'

/** Sobre el consultorio: descripción institucional breve, sin repetir datos de otras secciones. */
function SeccionSobre() {
  return (
    <SeccionPublica
      id="sobre"
      titulo={`Sobre ${perfilMedico.nombre}`}
      subtitulo="Consultorio médico de consulta privada por inscripción diaria."
    >
      <div className="grid gap-6 sm:grid-cols-2 items-start">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            {perfilMedico.descripcion}
          </p>
        </div>
        <div className="rounded-xl border border-primary-100 bg-white p-6 shadow-card flex flex-col items-center justify-center text-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <span className="text-xs font-bold">MP</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Matrícula profesional
            </p>
            <p className="text-xl font-bold text-primary-900 leading-none">
              {perfilMedico.matricula}
            </p>
          </div>
        </div>
      </div>
    </SeccionPublica>
  )
}

export default function PaginaPublica() {
  return (
    <div>
      <SiteHeader />
      <main>
        <Hero />
        <SeccionSobre />
        <SeccionHorarios />
        <SeccionObrasSociales />
        <SeccionUbicacion />
        <SeccionFAQ />
        <SeccionContacto />
      </main>
      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  )
}
