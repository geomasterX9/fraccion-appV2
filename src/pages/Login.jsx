import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      // El AuthContext detectará el cambio y redirigirá desde App.jsx
    } catch (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Correo o contraseña incorrectos' 
        : error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-display p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">key</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800">Bienvenido</h2>
          <p className="text-slate-500 text-sm mt-1">Ingresa a tu cuenta de FraccionApp</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold mb-6 flex gap-2 items-center">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary/30 outline-none font-medium transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary/30 outline-none font-medium transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 mt-2"
          >
            {cargando ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}