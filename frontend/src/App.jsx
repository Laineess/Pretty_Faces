import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/app/ProtectedRoute'
import AppLayout from './components/app/AppLayout'

// Landing
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Promociones from './components/Promociones'
import Nosotros from './components/Nosotros'
import Servicios from './components/Servicios'
import Galeria from './components/Galeria'
import Precios from './components/Precios'
import Horarios from './components/Horarios'
import Contacto from './components/Contacto'
import Footer from './components/Footer'

// Admin pages
import Login from './pages/app/Login'
import Dashboard from './pages/app/Dashboard'
import Citas from './pages/app/Citas'
import Clientes from './pages/app/Clientes'
import Empleadas from './pages/app/Empleadas'
import Ingresos from './pages/app/Ingresos'
import Gastos from './pages/app/Gastos'
import Reportes from './pages/app/Reportes'
import Productos from './pages/app/Productos'
import AdminPromociones from './pages/app/AdminPromociones'
import MiAgenda from './pages/app/MiAgenda'
import CorteDeCaja from './pages/app/CorteDeCaja'

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Promociones />
        <Nosotros />
        <Servicios />
        <Galeria />
        <Precios />
        <Horarios />
        <Contacto />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing pública */}
          <Route path="/" element={<LandingPage />} />

          {/* Admin auth */}
          <Route path="/admin/login" element={<Login />} />

          {/* Admin protegido */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="mi-agenda" element={<MiAgenda />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="citas" element={<Citas />} />
            <Route path="clientes" element={<Clientes />} />
            <Route
              path="empleadas"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Empleadas />
                </ProtectedRoute>
              }
            />
            <Route path="ingresos" element={<Ingresos />} />
            <Route
              path="gastos"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Gastos />
                </ProtectedRoute>
              }
            />
            <Route
              path="reportes"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Reportes />
                </ProtectedRoute>
              }
            />
            <Route
              path="productos"
              element={
                <ProtectedRoute requiredRoles={['recepcion']}>
                  <Productos />
                </ProtectedRoute>
              }
            />
            <Route
              path="promociones"
              element={
                <ProtectedRoute requiredRoles={['recepcion']}>
                  <AdminPromociones />
                </ProtectedRoute>
              }
            />
            <Route
              path="corte-caja"
              element={
                <ProtectedRoute requiredRoles={['recepcion']}>
                  <CorteDeCaja />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 → landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
