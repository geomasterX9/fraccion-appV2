import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useToast } from './Toast'

export default function GenerarAdeudosModal({ onClose, onExito }) {
  const { fraccionamientoId } = useAuth()
  const { toast } = useToast()
  
  const [montoBase, setMontoBase] = useState(150)
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [procesando, setProcesando] = useState(false)

  const handleGenerar = async (e) => {
    e.preventDefault()
    setProcesando(true)

    try {
      // Nota que aquí usamos fraccionamientoId (con I mayúscula)
      // que es el nombre que viene del useAuth()
      const { data, error } = await supabase.functions.invoke('generar-adeudos', {
        body: {
          fraccionamiento_id: fraccionamientoId, // <--- CORREGIDO AQUÍ
          monto_base: Number(montoBase),
          mes: Number(mes),
          anio: Number(anio)
        }
      })

      if (error) throw error
      if (!data.ok) throw new Error(data.mensaje)

      toast.exito(`¡Éxito! Se generaron ${data.generados} adeudos.`)
      onExito()
      onClose()
    } catch (error) {
      toast.error('Error al generar: ' + error.message)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-display">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 p-8">
        <form onSubmit={handleGenerar}>
          <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">bolt</span>
          </div>

          <h3 className="text-2xl font-black text-slate-800 mb-2">Generar Mensualidad</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Se aplicará el cargo a todas las casas. Si tienen **cuota especial**, el sistema la usará automáticamente.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Monto Base</label>
              <input 
                type="number"
                required
                value={montoBase}
                onChange={(e) => setMontoBase(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none font-bold text-slate-700 focus:border-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Mes</label>
                <select 
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none"
                >
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Año</label>
                <input 
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
              Cerrar
            </button>
            <button 
              type="submit" 
              disabled={procesando}
              className="flex-[2] py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {procesando ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Generar Ahora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}