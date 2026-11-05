import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useAuth } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import {
  crearPaciente,
  type PayloadPaciente,
} from '@/lib/api'
import { FormularioPaciente } from '@/components/pacientes/FormularioPaciente'
import { mensajeDeError } from './errores'
import type { Rol } from '@/types/domain'

/** Registro de paciente nuevo (roles MEDICO y SECRETARIA). */
export default function RegistrarPacientePage() {
  const { usuario } = useAuth()
  const rol: Rol = usuario?.rol === 'MEDICO' ? 'MEDICO' : 'SECRETARIA'
  const base = rol === 'MEDICO' ? '/medico/pacientes' : '/secretaria/pacientes'
  const navigate = useNavigate()
  const volverA = base

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function guardar(payload: PayloadPaciente) {
    setGuardando(true)
    setError(null)
    crearPaciente(payload)
      .then(({ paciente }) => {
        navigate(`${base}/${paciente.id}?nuevo=1`, { replace: true })
      })
      .catch((e) => {
        setError(mensajeDeError(e, 'No se pudo registrar el paciente.'))
        setGuardando(false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
  }

  return (
    <DashboardLayout rol={rol}>
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-primary-900 sm:text-lg">
              <UserPlus className="h-4.5 w-4.5 text-primary-500" aria-hidden="true" />
              Registrar paciente
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:hidden">Nuevo paciente</p>
            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              Los campos con <span className="text-rose-500">*</span> son obligatorios. El DNI no puede
              repetirse entre pacientes.
            </p>
          </div>
        </div>

        <Card className="px-4 py-5 sm:px-6 sm:py-6">
          <FormularioPaciente
            modo="crear"
            guardando={guardando}
            errorApi={error}
            volverA={volverA}
            onSubmit={guardar}
          />
        </Card>
      </div>
    </DashboardLayout>
  )
}
