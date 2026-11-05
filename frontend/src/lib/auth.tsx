import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getMe, login as apiLogin, logout as apiLogout, type UsuarioSesion } from '@/lib/api'

interface AuthContextValue {
  usuario: UsuarioSesion | null
  cargando: boolean
  login: (email: string, contrasena: string) => Promise<UsuarioSesion>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getMe()
      .then((u) => setUsuario(u))
      .finally(() => setCargando(false))
  }, [])

  const login = async (email: string, contrasena: string): Promise<UsuarioSesion> => {
    const u = await apiLogin(email, contrasena)
    setUsuario(u)
    return u
  }

  const logout = async (): Promise<void> => {
    await apiLogout()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}