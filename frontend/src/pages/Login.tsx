import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, HeartPulse, Info, Loader2 } from 'lucide-react'

const esquema = z.object({
  email: z
    .string()
    .min(1, 'Ingresá tu usuario o correo electrónico')
    .email('El formato del correo no es válido'),
  contrasena: z
    .string()
    .min(1, 'Ingresá tu contraseña')
    .min(6, 'La contraseña debe tener 6 caracteres o más'),
})

type Datos = z.infer<typeof esquema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [mostrar, setMostrar] = useState(false)
  const [aviso, setAviso] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { email: '', contrasena: '' },
  })

  const onSubmit = handleSubmit(async (_datos: Datos) => {
    // PENDIENTE (etapa 2): autenticar contra POST /api/auth/login y redirigir
    // a /medico o /secretaria según el rol que devuelva el backend.
    setAviso(true)
    await new Promise((r) => setTimeout(r, 400))
    setAviso(false)
  })

  void navigate // se usará al integrar el backend

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-900 shadow-card">
            <HeartPulse className="h-7 w-7 text-accent-300" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-primary-900 sm:text-2xl">
            Consultorio Médico
          </h1>
          <p className="mt-1 text-sm text-slate-500">Ingresá tus credenciales para continuar</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card sm:p-8"
          noValidate
        >
          {aviso && (
            <div
              role="status"
              className="mb-5 flex gap-2.5 rounded-xl border border-accent-200 bg-accent-50 p-3.5 text-xs text-primary-800 sm:text-sm"
            >
              <Info className="h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
              <span>
                Autenticación pendiente: se conectará con la API en la etapa 2. Por ahora la validación es
                visual.
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-primary-900">
                Usuario o correo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="nombre@ejemplo.com"
                className="mt-1.5 w-full rounded-xl border border-primary-100 bg-slate-50 px-3.5 py-2.5 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="contrasena" className="text-sm font-medium text-primary-900">
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <input
                  id="contrasena"
                  type={mostrar ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-primary-100 bg-slate-50 py-2.5 pl-3.5 pr-11 text-sm text-primary-950 outline-none transition placeholder:text-slate-400 focus:border-accent-400 focus:ring-2 focus:ring-accent-200"
                  {...register('contrasena')}
                  aria-invalid={!!errors.contrasena}
                />
                <button
                  type="button"
                  onClick={() => setMostrar((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary-700"
                  aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.contrasena && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.contrasena.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-900 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-primary-800 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Ingresar
          </button>

          <p className="mt-5 text-center text-xs text-slate-400">
            El acceso distingue los roles <span className="font-medium text-slate-500">médico</span> y{' '}
            <span className="font-medium text-slate-500">secretaría</span>, que se activará con la API.
          </p>
        </form>

        <Link
          to="/"
          className="mt-6 text-center text-sm font-medium text-primary-700 underline-offset-4 hover:underline"
        >
          Volver al sitio del consultorio
        </Link>
      </div>
    </div>
  )
}
