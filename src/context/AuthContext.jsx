import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario]                 = useState(null)
  const [rol, setRol]                         = useState(null)
  const [perfil, setPerfil]                   = useState(null)
  const [propiedadVecino, setPropiedadVecino] = useState(null)
  const [fraccionamientoId, setFraccionamientoId] = useState(null)
  const [cargando, setCargando]               = useState(true)

  const limpiarEstado = useCallback(() => {
    setUsuario(null)
    setRol(null)
    setPerfil(null)
    setPropiedadVecino(null)
    setFraccionamientoId(null)
    setCargando(false)
  }, [])

  const cargarPerfil = useCallback(async (user) => {
    if (!user) {
      limpiarEstado()
      return
    }

    try {
      const { data: perfilData, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
            alert(`¡Aviso del Sistema! Tu inicio de sesión fue exitoso, pero el ID real de tu cuenta es:\n\n${user.id}\n\nY no lo encuentra en la tabla 'usuarios'. Verifica que este código sea exactamente el que pegaste.`)
        }
        throw error
      }

      if (perfilData) {
          const rolLimpio = perfilData.rol ? perfilData.rol.trim().toUpperCase() : null
          
          setRol(rolLimpio)
          setPerfil(perfilData)
          setFraccionamientoId(perfilData.fraccionamiento_id)

          if (rolLimpio === 'VECINO') {
            const { data: casa } = await supabase
              .from('propiedades')
              .select('*')
              .eq('owner_user_id', user.id)
              .single()
              
            if (casa) {
              // El mapeo exacto que resolvimos para el cuadro naranja
              setPropiedadVecino({
                ...casa,
                numero_casa: casa.identificador, 
                domicilio: casa.domicilio,
                residente: perfilData.nombre 
              })
            }
          }
      }

    } catch (error) {
      console.error('[AuthContext] Error:', error.message)
    } finally {
      setUsuario(user)
      setCargando(false)
    }
  }, [limpiarEstado])

  useEffect(() => {
    let montado = true;

    const inicializar = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession()
            if (error) throw error
            if (montado) {
                if (session?.user) await cargarPerfil(session.user)
                else limpiarEstado()
            }
        } catch (err) {
            if (montado) limpiarEstado()
        }
    }

    inicializar()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!montado) return
        if (event === 'SIGNED_OUT' || !session) {
            limpiarEstado()
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            cargarPerfil(session.user)
        }
    })

    return () => {
        montado = false
        subscription.unsubscribe()
    }
  }, [cargarPerfil, limpiarEstado])

  const cerrarSesion = async () => {
    setCargando(true)
    await supabase.auth.signOut()
    limpiarEstado()
  }

  return (
    <AuthContext.Provider value={{
      usuario, rol, perfil, propiedadVecino,
      fraccionamientoId, cargando,
      cerrarSesion,
      esAdmin: rol === 'ADMIN',
      esSuperAdmin: rol === 'SUPERADMIN',
      esVecino: rol === 'VECINO',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}