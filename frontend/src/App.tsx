import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Publica from '@/pages/Publica'
import LoginPage from '@/pages/Login'
import MedicoPanel from '@/pages/medico/MedicoPanel'
import SecretariaPanel from '@/pages/secretaria/SecretariaPanel'
import AgendaSemana from '@/pages/AgendaSemana'
import PendientePage from '@/pages/Pendiente'
import NotFound from '@/pages/NotFound'

export const router = createBrowserRouter([
  { path: '/', element: <Publica /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/medico', element: <MedicoPanel /> },
  { path: '/medico/pacientes', element: <PendientePage /> },
  { path: '/medico/historias', element: <PendientePage /> },
  { path: '/medico/agenda', element: <AgendaSemana /> },
  { path: '/secretaria', element: <SecretariaPanel /> },
  { path: '/secretaria/llegadas', element: <PendientePage /> },
  { path: '/secretaria/agenda', element: <AgendaSemana /> },
  { path: '*', element: <NotFound /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
