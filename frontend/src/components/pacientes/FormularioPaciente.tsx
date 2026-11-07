import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  getObrasSociales,
  type ObraSocialApi,
  type PacienteApi,
  type PayloadPaciente,
} from '@/lib/api'

const esquema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80, 'Máximo 80 caracteres'),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(80, 'Máximo 80 caracteres'),
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos'),
  fechaNacimiento: z.string().optional(),
  sexo: z.string().optional(),
  telefono: z
    .string()
    .trim()
    .max(30, 'Máximo 30 caracteres')
    .optional(),
  email: z.union([z.literal(''), z.string().trim().email('Correo inválido').max(120)]),
  direccion: z.string().trim().max(200, 'Máximo 200 caracteres').optional(),
  obraSocialId: z.string().optional(),
  numeroAfiliado: z.string().trim().max(40, 'Máximo 40 caracteres').optional(),
  notas: z.string().trim().max(500, 'Máximo 500 caracteres').optional(),
})

export type DatosPacienteForm = z.infer<typeof esquema>

const CLASE_INPUT =
  'mt-1.5 w-full rounded-xl border border-primary-100 bg-slate-50 px-3.5 py-2.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200'

function ErrorDeCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null
  return <p className="mt-1.5 text-xs text-rose-600">{mensaje}</p>
}

interface FormularioPacienteProps {
  modo: 'crear' | 'editar'
  /** Variante compacta para el alta incrustada en el diálogo de inscripción. */
  compact?: boolean
  valoresIniciales?: PacienteApi
  guardando: boolean
  errorApi: string | null
  /** Destino del link de cancelar (vuelve al origen correspondiente). */
  volverA: string
  /** Callback opcional al cancelar (p. ej. cerrar el modo edición en la ficha). */
  onCancelar?: () => void
  onSubmit: (payload: PayloadPaciente) => void
}

export function FormularioPaciente({
  modo,
  compact = false,
  valoresIniciales,
  guardando,
  errorApi,
  volverA,
  onCancelar,
  onSubmit,
}: FormularioPacienteProps) {
  const [obras, setObras] = useState<ObraSocialApi[]>([])
  const [obrasError, setObrasError] = useState(false)

  // Obras sociales reales de la base de datos (endpoint /obras-sociales).
  useEffect(() => {
    let cancelado = false
    getObrasSociales()
      .then((data) => !cancelado && setObras(data.items))
      .catch(() => !cancelado && setObrasError(true))
    return () => {
      cancelado = true
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosPacienteForm>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: valoresIniciales?.nombre ?? '',
      apellido: valoresIniciales?.apellido ?? '',
      dni: valoresIniciales?.dni ?? '',
      fechaNacimiento: valoresIniciales?.fechaNacimiento ?? '',
      sexo: valoresIniciales?.sexo ?? '',
      telefono: valoresIniciales?.telefono ?? '',
      email: valoresIniciales?.email ?? '',
      direccion: valoresIniciales?.direccion ?? '',
      obraSocialId: valoresIniciales?.obraSocialId ?? '',
      numeroAfiliado: valoresIniciales?.numeroAfiliado ?? '',
      notas: valoresIniciales?.notas ?? '',
    },
  })

  const enviar = handleSubmit((datos: DatosPacienteForm) => {
    // Vacío → null: la API distingue "sin dato" (admite limpiar campos al editar).
    const payload: PayloadPaciente = {
      nombre: datos.nombre,
      apellido: datos.apellido,
      dni: datos.dni,
      fechaNacimiento: datos.fechaNacimiento ? datos.fechaNacimiento : null,
      sexo: datos.sexo ? (datos.sexo as PayloadPaciente['sexo']) : null,
      telefono: datos.telefono ? datos.telefono : null,
      email: datos.email ? datos.email : null,
      direccion: datos.direccion ? datos.direccion : null,
      obraSocialId: datos.obraSocialId ? datos.obraSocialId : null,
      numeroAfiliado: datos.numeroAfiliado ? datos.numeroAfiliado : null,
      notas: datos.notas ? datos.notas : null,
    }
    onSubmit(payload)
  })

  const ocupando = guardando || isSubmitting
  const claseInput = compact
    ? 'mt-1 w-full rounded-lg border border-primary-100 bg-slate-50 px-3 py-2 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200'
    : CLASE_INPUT
  const claseGrid = compact
    ? 'mt-2 grid gap-3 sm:grid-cols-2'
    : 'mt-3 grid gap-4 sm:grid-cols-2'

  return (
    <form onSubmit={enviar} noValidate className={`grid ${compact ? 'gap-3' : 'gap-5'}`}>
      {errorApi && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorApi}</span>
        </div>
      )}

      {/* Datos personales */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">
          Datos personales
        </h3>
        <div className={claseGrid}>
          <div>
            <label htmlFor="nombre" className="text-sm font-medium text-primary-900">
              Nombre <span className="text-rose-500">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              autoComplete="given-name"
              placeholder="Nombre"
              className={claseInput}
              {...register('nombre')}
              aria-invalid={!!errors.nombre}
            />
            <ErrorDeCampo mensaje={errors.nombre?.message} />
          </div>
          <div>
            <label htmlFor="apellido" className="text-sm font-medium text-primary-900">
              Apellido <span className="text-rose-500">*</span>
            </label>
            <input
              id="apellido"
              type="text"
              autoComplete="family-name"
              placeholder="Apellido"
              className={claseInput}
              {...register('apellido')}
              aria-invalid={!!errors.apellido}
            />
            <ErrorDeCampo mensaje={errors.apellido?.message} />
          </div>
          <div>
            <label htmlFor="dni" className="text-sm font-medium text-primary-900">
              DNI <span className="text-rose-500">*</span>
            </label>
            <input
              id="dni"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="7 u 8 dígitos"
              className={`${claseInput} numeros-tabulares`}
              {...register('dni')}
              aria-invalid={!!errors.dni}
            />
            <ErrorDeCampo mensaje={errors.dni?.message} />
          </div>
          <div>
            <label htmlFor="fechaNacimiento" className="text-sm font-medium text-primary-900">
              Fecha de nacimiento
            </label>
            <input
              id="fechaNacimiento"
              type="date"
              className={`${claseInput} numeros-tabulares`}
              {...register('fechaNacimiento')}
            />
          </div>
          <div>
            <label htmlFor="sexo" className="text-sm font-medium text-primary-900">
              Sexo
            </label>
            <select id="sexo" className={claseInput} {...register('sexo')}>
              <option value="">Sin especificar</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">Contacto</h3>
        <div className={claseGrid}>
          <div>
            <label htmlFor="telefono" className="text-sm font-medium text-primary-900">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              autoComplete="tel"
              placeholder="11 0000-0000"
              className={`${claseInput} numeros-tabulares`}
              {...register('telefono')}
              aria-invalid={!!errors.telefono}
            />
            <ErrorDeCampo mensaje={errors.telefono?.message} />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-primary-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@ejemplo.com"
              className={claseInput}
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            <ErrorDeCampo mensaje={errors.email?.message} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="direccion" className="text-sm font-medium text-primary-900">
              Domicilio
            </label>
            <input
              id="direccion"
              type="text"
              autoComplete="street-address"
              placeholder="Calle, número, localidad"
              className={claseInput}
              {...register('direccion')}
              aria-invalid={!!errors.direccion}
            />
            <ErrorDeCampo mensaje={errors.direccion?.message} />
          </div>
        </div>
      </div>

      {/* Cobertura */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-primary-700">Cobertura</h3>
        <div className={claseGrid}>
          <div className="sm:col-span-2">
            <label htmlFor="obraSocial" className="text-sm font-medium text-primary-900">
              Obra social / prepaga
            </label>
            <select id="obraSocial" className={claseInput} {...register('obraSocialId')}>
              <option value="">Sin cobertura</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
            {obrasError && (
              <p className="mt-1.5 text-xs text-amber-600">
                No se pudo cargar el listado de obras sociales.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="numeroAfiliado" className="text-sm font-medium text-primary-900">
              Número de afiliado
            </label>
            <input
              id="numeroAfiliado"
              type="text"
              placeholder="Solo si tiene cobertura"
              className={`${claseInput} numeros-tabulares`}
              {...register('numeroAfiliado')}
              aria-invalid={!!errors.numeroAfiliado}
            />
            <ErrorDeCampo mensaje={errors.numeroAfiliado?.message} />
          </div>
        </div>
      </div>

      {/* Observaciones administrativas */}
      <div>
        <label htmlFor="notas" className="text-sm font-medium text-primary-900">
          Observaciones administrativas
        </label>
        <textarea
          id="notas"
          rows={compact ? 2 : 3}
          placeholder="Detalles administrativos, autorizaciones, preferencias de contacto…"
          className={`${claseInput} resize-none`}
          {...register('notas')}
          aria-invalid={!!errors.notas}
        />
        <ErrorDeCampo mensaje={errors.notas?.message} />
      </div>

      <div className={`flex flex-col-reverse sm:flex-row sm:justify-end ${compact ? 'gap-2' : 'gap-3'}`}>
        {onCancelar ? (
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupando}
            className="inline-flex items-center justify-center rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-800 transition hover:bg-primary-50"
          >
            Cancelar
          </button>
        ) : (
          <Link
            to={volverA}
            className="inline-flex items-center justify-center rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary-800 transition hover:bg-primary-50"
          >
            Cancelar
          </Link>
        )}
        <button
          type="submit"
          disabled={ocupando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-800 disabled:opacity-60"
        >
          {ocupando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {modo === 'crear' ? 'Registrar paciente' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
