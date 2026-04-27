import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToast } from './Toast'

export default function PropiedadDetalle({ propiedad, onClose, onActualizar }) {
  const { toast } = useToast()
  const [subiendo, setSubiendo] = useState(false)

  // Esta función permite al admin subir una foto de un pago
  const manejarSubidaManual = async (e, adeudoId) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setSubiendo(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${propiedad.identificador}_${adeudoId}_${Date.now()}.${fileExt}`
      const filePath = `comprobantes/${fileName}`

      // 1. Subir el archivo al Storage de Supabase
      const { error: uploadError } = await supabase.storage
        .from('pagos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('pagos')
        .getPublicUrl(filePath)

      // 2. Actualizar el registro del adeudo
      const { error: updateError } = await supabase
        .from('adeudos')
        .update({ 
          comprobante_url: publicUrl,
          estatus: 'EN REVISIÓN' 
        })
        .eq('id', adeudoId)

      if (updateError) throw updateError

      toast.exito("Pago registrado. Ahora aparece en tu bandeja de aprobación.")
      
      // Cerramos y refrescamos para que el admin vea los cambios
      onActualizar()
      onClose()

    } catch (error) {
      console.error(error)
      toast.error("No se pudo subir el comprobante")
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Cabecera */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Casa {propiedad.identificador}</h2>
            <p className="text-slate-500 font-medium">{propiedad.nombre_residente || 'Residente no asignado'}</p>
          </div>
          <button onClick={onClose} className="size-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Lista de Adeudos */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Estado de Cuenta</h3>
          
          <div className="space-y-3">
            {propiedad.adeudos?.filter(a => a.estatus !== 'PAGADO').map(adeudo => (
              <div key={adeudo.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-800 text-sm">{adeudo.concepto}</p>
                  <p className="text-xl font-black text-indigo-600">${adeudo.monto_total}</p>
                </div>

                {/* Botón de acción según el estatus */}
                <div>
                  {adeudo.estatus === 'EN REVISIÓN' ? (
                    <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100 uppercase tracking-wider">
                      En Revisión
                    </span>
                  ) : (
                    <label className="cursor-pointer bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      {subiendo ? 'Subiendo...' : 'Subir Pago'}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => manejarSubidaManual(e, adeudo.id)}
                        disabled={subiendo}
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}

            {propiedad.adeudos?.filter(a => a.estatus !== 'PAGADO').length === 0 && (
              <div className="text-center py-8 bg-emerald-50 rounded-3xl border border-emerald-100">
                <span className="material-symbols-outlined text-emerald-400 text-4xl mb-2">verified</span>
                <p className="text-emerald-700 font-bold">¡Esta propiedad no tiene adeudos!</p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          Cerrar Expediente
        </button>
      </div>
    </div>
  )
}