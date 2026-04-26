import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Contextos
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'

// Páginas
import Login from './pages/Login'
import MiCuentaPage from './pages/MiCuentaPage'
import AdminDashboard from './pages/AdminDashboard' // <-- Asegúrate de tener este import

function RutasProtegidas() {
  const { usuario, rol, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={!usuario ? <Login /> : <Navigate to={rol === 'ADMIN' ? '/admin' : '/mi-cuenta'} replace />} />
      <Route path="/mi-cuenta" element={usuario && rol === 'VECINO' ? <MiCuentaPage /> : <Navigate to="/login" replace />} />
      
      {/* Aquí cambiamos el letrero de construcción por el AdminDashboard real */}
      <Route 
        path="/admin" 
        element={
          usuario && (rol === 'ADMIN' || rol === 'SUPERADMIN') 
            ? <AdminDashboard /> 
            : <Navigate to="/login" replace />
        } 
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <RutasProtegidas />
        </Router>
      </AuthProvider>
    </ToastProvider>
  )
}