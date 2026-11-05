import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { ProtectedRoute } from '@/lib/ProtectedRoute'
import Publica from '@/pages/Publica'
import LoginPage from '@/pages/Login'
import MedicoPanel from '@/pages/medico/MedicoPanel'
import SecretariaPanel from '@/pages/secretaria/SecretariaPanel'
import EstadisticasPage from '@/pages/estadisticas/EstadisticasPage'
import NotFound from '@/pages/NotFound'
import PacientesPage from '@/pages/pacientes/PacientesPage'
import RegistrarPacientePage from '@/pages/pacientes/RegistrarPacientePage'
import FichaPacientePage from '@/pages/pacientes/FichaPacientePage'
import HistoriaClinicaPage from '@/pages/historias/HistoriaClinicaPage'
import HistoriasIndexPage from '@/pages/historias/HistoriasIndexPage'

const router = createBrowserRouter([
  { path: '/', element: <Publica /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/medico',
    element: (
      <ProtectedRoute rol="MEDICO">
        <MedicoPanel />
      </ProtectedRoute>
    ),
  },
  {
    path: '/medico/pacientes',
    element: (
      <ProtectedRoute rol="MEDICO">
        <PacientesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/medico/pacientes/nuevo',
    element: (
      <ProtectedRoute rol="MEDICO">
        <RegistrarPacientePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/medico/pacientes/:pacienteId',
    element: (
      <ProtectedRoute rol="MEDICO">
        <FichaPacientePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/medico/pacientes/:pacienteId/historia',
    element: (
      <ProtectedRoute rol="MEDICO">
        <HistoriaClinicaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/medico/historias',
    element: (
      <ProtectedRoute rol="MEDICO">
        <HistoriasIndexPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/medico/estadisticas',
    element: (
      <ProtectedRoute rol="MEDICO">
        <EstadisticasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/medico/agenda',
    element: <ProtectedRoute rol="MEDICO"><Navigate to="/medico" replace /></ProtectedRoute>,
  },
  {
    path: '/secretaria',
    element: (
      <ProtectedRoute rol="SECRETARIA">
        <SecretariaPanel />
      </ProtectedRoute>
    ),
  },
  {
    path: '/secretaria/pacientes',
    element: (
      <ProtectedRoute rol="SECRETARIA">
        <PacientesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/secretaria/pacientes/nuevo',
    element: (
      <ProtectedRoute rol="SECRETARIA">
        <RegistrarPacientePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/secretaria/pacientes/:pacienteId',
    element: (
      <ProtectedRoute rol="SECRETARIA">
        <FichaPacientePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/secretaria/pacientes/:pacienteId/historia',
    element: (
      <ProtectedRoute rol="SECRETARIA">
        <HistoriaClinicaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/secretaria/historias',
    element: (
      <ProtectedRoute rol="SECRETARIA">
        <HistoriasIndexPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/secretaria/estadisticas',
    element: (
      <ProtectedRoute rol="SECRETARIA">
        <EstadisticasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/secretaria/llegadas',
    element: <ProtectedRoute rol="SECRETARIA"><Navigate to="/secretaria" replace /></ProtectedRoute>,
  },
  {
    path: '/medico/llegadas',
    element: <ProtectedRoute rol="MEDICO"><Navigate to="/medico" replace /></ProtectedRoute>,
  },
  {
    path: '/secretaria/agenda',
    element: <ProtectedRoute rol="SECRETARIA"><Navigate to="/secretaria" replace /></ProtectedRoute>,
  },
  { path: '*', element: <NotFound /> },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}