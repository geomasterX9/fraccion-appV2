import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../components/Toast'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function BandejaAprobaciones() {
  const { fraccionamientoId } = useAuth()
  const [pagosEnRevision, setPagosEnRevision] = useState([])
  const [cargando, setCargando] = useState(true)
  const [comprobanteViendo, setComprobanteViendo] = useState(null) // Nuevo estado para el visor
  const { toast } = useToast()

  useEffect(() => {
    if (fraccionamientoId) {
      cargarPagos()
    }
  }, [fraccionamientoId])

  const cargarPagos = async () => {
    try {
      setCargando(true)
      
      const { data, error } = await supabase
        .from('adeudos')
        .select(`
          *,
          propiedades (identificador, fraccionamiento_id)
        `)
        .eq('estatus', 'EN REVISIÓN')

      if (error) throw error

      const filtrados = (data || []).filter(
        pago => pago.propiedades?.fraccionamiento_id === fraccionamientoId
      )

      setPagosEnRevision(filtrados)

    } catch (error) {
      console.log("Error completo de Supabase:", error)
      const mensajeError = error.message || error.details || JSON.stringify(error)
      toast.error(`Error: ${mensajeError}`)
    } finally {
      setCargando(false)
    }
  }

  const procesarPago = async (adeudoId, nuevoEstatus) => {
    try {
      const estatusFinal = nuevoEstatus === 'APROBAR' ? 'PAGADO' : 'PENDIENTE'
      
      const { error } = await supabase
        .from('adeudos')
        .update({ estatus: estatusFinal })
        .eq('id', adeudoId)

      if (error) throw error

      toast.exito(`Recibo marcado como ${estatusFinal}`)
      setPagosEnRevision(actuales => actuales.filter(p => p.id !== adeudoId))
      
      setTimeout(() => window.location.reload(), 1500)
      
    } catch (error) {
      console.error('Error al procesar:', error)
      toast.error('Hubo un error al actualizar el estatus')
    }
  }

  if (cargando) {
    return (
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-slate-300">sync</span>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">inbox</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Bandeja de Aprobaciones</h2>
            <p className="text-sm text-slate-500 font-medium">
              {pagosEnRevision.length} comprobantes por revisar
            </p>
          </div>
        </div>

        {pagosEnRevision.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">done_all</span>
            <p className="text-slate-500 font-medium">¡Todo al día! No hay pagos pendientes de revisión.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pagosEnRevision.map(pago => (
              <div key={pago.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 hover:border-blue-200 transition-colors">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-700 text-xs font-black px-2 py-1 rounded-md uppercase tracking-wide">
                      Casa {pago.propiedades?.identificador || 'S/N'}
                    </span>
                    <span className="text-slate-400 text-sm font-medium">
                      Mantenimiento {MESES[pago.mes_cargo - 1]} {pago.anio_cargo}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-800">
                    ${Number(pago.monto_total).toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
                  {/* Ahora es un botón que abre el visor en lugar de un enlace web */}
                  <button 
                    onClick={() => setComprobanteViendo(pago.comprobante_url)}
                    className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors text-center flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    Ver Ticket
                  </button>
                  
                  <button 
                    onClick={() => procesarPago(pago.id, 'RECHAZAR')} 
                    className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Rechazar
                  </button>

                  <button 
                    onClick={() => procesarPago(pago.id, 'APROBAR')} 
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-200 flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VISOR DE IMÁGENES INTEGRADO */}
      {comprobanteViendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[2rem] p-4 max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-black text-slate-800 text-lg">Comprobante de Pago</h3>
              <button 
                onClick={() => setComprobanteViendo(null)}
                className="size-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
              <img 
                src={comprobanteViendo} 
                alt="Comprobante subido por el vecino" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            <button 
              onClick={() => setComprobanteViendo(null)}
              className="mt-4 w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm uppercase tracking-wide"
            >
              Cerrar Visor
            </button>
          </div>
        </div>
      )}
    </>
  )
}