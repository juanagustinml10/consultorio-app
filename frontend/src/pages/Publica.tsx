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
import { consultorio, horariosAtencion, perfilMedico } from '@/data/sitio'

/** Presentación breve del profesional (sección "perfil"). */
function SeccionPerfil() {
  return (
    <SeccionPublica
      id="perfil"
      titulo={`Sobre ${perfilMedico.nombre}`}
      subtitulo="Consultorio médico de consulta privada por inscripción diaria."
    >
      <div className="grid gap-6 rounded-2xl border border-primary-100 bg-white p-6 shadow-card sm:p-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{perfilMedico.descripcion}</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            El consultorio funciona en {consultorio.direccionCompleta}. Cada tarde se recibe a los
            pacientes que se inscriben, respetando el orden de llegada del día.
          </p>
        </div>
        <dl className="space-y-3 rounded-xl bg-primary-50 p-5 text-sm">
          <div>
            <dt className="font-medium text-slate-500">Modalidad</dt>
            <dd className="mt-0.5 font-semibold text-primary-900">
              Consultorio — inscripción por orden de llegada
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Horario</dt>
            <dd className="mt-0.5 font-semibold text-primary-900">
              {horariosAtencion[0]?.dias}, {horariosAtencion[0]?.franja}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Ubicación</dt>
            <dd className="mt-0.5 font-semibold text-primary-900">{consultorio.ciudad}</dd>
          </div>
        </dl>
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
        <SeccionPerfil />
        <SeccionHorarios />
        <SeccionObrasSociales />
        <SeccionUbicacion />
        <SeccionContacto />
        <SeccionFAQ />
      </main>
      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  )
}
