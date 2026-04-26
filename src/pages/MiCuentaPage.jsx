import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function MiCuentaPage() {
  const { usuario, perfil, propiedadVecino, cerrarSesion } = useAuth()
  const [pestañaActiva, setPestañaActiva] = useState('cuenta') // 'cuenta' o 'avisos'
  const [adeudos, setAdeudos] = useState([])
  const [avisos, setAvisos] = useState([])
  const [cargando, setCargando] = useState(true)

  // Saludo dinámico según la hora
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  useEffect(() => {
    if (propiedadVecino?.id) {
      cargarDatos()
    }
  }, [propiedadVecino])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      // 1. Cargar Adeudos de esta casa
      const { data: dataAdeudos } = await supabase
        .from('adeudos')
        .select('*')
        .eq('propiedad_id', propiedadVecino.id)
        .order('anio_cargo', { ascending: false })
        .order('mes_cargo', { ascending: false })
      
      if (dataAdeudos) setAdeudos(dataAdeudos)

      // 2. Cargar Avisos del fraccionamiento
      const { data: dataAvisos } = await supabase
        .from('avisos')
        .select('*')
        .order('fecha_publicacion', { ascending: false })
      
      if (dataAvisos) setAvisos(dataAvisos)

    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const saldoTotal = adeudos
    .filter(a => a.estatus === 'PENDIENTE')
    .reduce((suma, a) => suma + Number(a.monto_total), 0)

  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

  if (!propiedadVecino) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-display p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg text-center max-w-md w-full">
          <span className="material-symbols-outlined text-5xl text-orange-400 mb-4">house_siding</span>
          <h2 className="text-xl font-black text-slate-800 mb-2">Aún no tienes una casa asignada</h2>
          <p className="text-slate-500 text-sm mb-6">Contacta a la administración para que vinculen tu cuenta con tu propiedad.</p>
          <button onClick={cerrarSesion} className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 w-full transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-display pb-20">
      {/* Header Fijo */}
      <div className="bg-slate-900 text-white pt-12 pb-6 px-6 rounded-b-[40px] shadow-xl relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-slate-400 text-sm font-medium">{saludo},</p>
            <h1 className="text-2xl font-black truncate max-w-[200px]">{perfil?.nombre || 'Vecino'}</h1>
          </div>
          <button onClick={cerrarSesion} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">
            <span className="material-symbols-outlined text-white">logout</span>
          </button>
        </div>

        <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/10 flex items-center gap-4">
          <div className="size-14 bg-orange-500 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">
            {propiedadVecino.numero_casa}
          </div>
          <div>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-widest mb-1">Mi Propiedad</p>
            <p className="font-bold leading-tight">{propiedadVecino.domicilio}</p>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex p-4 gap-2 sticky top-0 bg-slate-50/80 backdrop-blur-xl z-0">
        <button 
          onClick={() => setPestañaActiva('cuenta')}
          className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${pestañaActiva === 'cuenta' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Estado de Cuenta
        </button>
        <button 
          onClick={() => setPestañaActiva('avisos')}
          className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${pestañaActiva === 'avisos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Avisos {avisos.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{avisos.length}</span>}
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="px-6 mt-2">
        {cargando ? (
          <div className="flex justify-center py-10">
            <span className="material-symbols-outlined animate-spin text-4xl text-slate-300">sync</span>
          </div>
        ) : pestañaActiva === 'cuenta' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Saldo Pendiente</p>
              <h3 className={`text-5xl font-black tracking-tighter ${saldoTotal > 0 ? 'text-slate-900' : 'text-green-500'}`}>
                ${saldoTotal.toFixed(2)}
              </h3>
              {saldoTotal === 0 && <p className="text-green-500 text-sm font-bold mt-2">¡Estás al corriente! 🎉</p>}
            </div>

            <div>
              <h4 className="font-bold text-slate-800 mb-4 px-1">Historial</h4>
              <div className="space-y-3">
                {adeudos.map(adeudo => (
                  <div key={adeudo.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <div className={`p-2 rounded-xl ${adeudo.estatus === 'PENDIENTE' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                        <span className="material-symbols-outlined text-sm">{adeudo.estatus === 'PENDIENTE' ? 'warning' : 'task_alt'}</span>
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${adeudo.estatus === 'PAGADO' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                          Mantenimiento {MESES[adeudo.mes_cargo - 1]} {adeudo.anio_cargo}
                        </p>
                        <p className={`text-xs font-bold ${adeudo.estatus === 'PENDIENTE' ? 'text-orange-500' : 'text-green-500'}`}>
                          {adeudo.estatus}
                        </p>
                      </div>
                    </div>
                    <span className={`font-black ${adeudo.estatus === 'PAGADO' ? 'text-slate-400' : 'text-slate-800'}`}>
                      ${Number(adeudo.monto_total).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {avisos.map(aviso => (
              <div key={aviso.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-orange-500 text-xl">campaign</span>
                  <h4 className="font-bold text-slate-800">{aviso.titulo}</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{aviso.contenido}</p>
                <p className="text-xs text-slate-400 font-medium mt-4 text-right">
                  {new Date(aviso.fecha_publicacion).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}