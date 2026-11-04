import {
  AvisoImportante,
  Hero,
} from '@/components/public/Hero'
import { SiteHeader } from '@/components/public/SiteHeader'
import {
  SeccionContacto,
  SeccionFormacion,
  SeccionHorarios,
  SeccionObrasSociales,
  SeccionServicios,
  SeccionUbicacion,
} from '@/components/public/Secciones'
import { SeccionFAQ, SiteFooter } from '@/components/public/FAQFooter'
import { FloatingWhatsApp } from '@/components/public/Hero'
import { SeccionPublica } from '@/components/public/SeccionPublica'
import { perfilMedico } from '@/data/mock'

/** Presentación breve del profesional (sección "perfil"). */
function SeccionPerfil() {
  return (
    <SeccionPublica
      id="perfil"
      titulo="Sobre la Dra. Laura Pérez"
      subtitulo="Presentación del profesional (datos de ejemplo)."
    >
      <div className="grid gap-6 rounded-2xl border border-primary-100 bg-white p-6 shadow-card sm:p-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{perfilMedico.descripcion}</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            La consulta combina la escucha atenta del relato del paciente con una revisación completa. Se
            entregan indicaciones claras y un plan de seguimiento acordado en cada visita.
          </p>
        </div>
        <dl className="space-y-3 rounded-xl bg-primary-50 p-5 text-sm">
          <div>
            <dt className="font-medium text-slate-500">Especialidad</dt>
            <dd className="mt-0.5 font-semibold text-primary-900">{perfilMedico.especialidad}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Matrícula</dt>
            <dd className="mt-0.5 font-semibold text-primary-900">{perfilMedico.matricula}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Modalidad</dt>
            <dd className="mt-0.5 font-semibold text-primary-900">Consultorio, por turnos</dd>
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
        <AvisoImportante />
        <SeccionPerfil />
        <SeccionFormacion />
        <SeccionServicios />
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
