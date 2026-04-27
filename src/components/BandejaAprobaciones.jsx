import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../components/Toast'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// Agrega triggerRecarga aquí
export default function BandejaAprobaciones({ onActualizar, triggerRecarga }) {
  const { fraccionamientoId } = useAuth()
  const [pagosEnRevision, setPagosEnRevision] = useState([])
  const [cargando, setCargando] = useState(true)
  const [comprobanteViendo, setComprobanteViendo] = useState(null)
  const [ticketsVistos, setTicketsVistos] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    if (fraccionamientoId) {
      cargarPagos()
    }
  }, [fraccionamientoId, triggerRecarga]) // <-- Agregamos triggerRecarga aquí

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
      console.log("Error:", error)
      toast.error(`Error al cargar datos`)
    } finally {
      setCargando(false)
    }
  }

  const abrirVisor = (pago) => {
    setComprobanteViendo(pago.comprobante_url)
    if (!ticketsVistos.includes(pago.id)) {
      setTicketsVistos(prev => [...prev, pago.id])
    }
  }

  const procesarPago = async (adeudoId, nuevoEstatus) => {
    try {
      const estatusFinal = nuevoEstatus === 'APROBAR' ? 'PAGADO' : 'PENDIENTE'

      const updateData = {
        estatus: estatusFinal,
        ...(nuevoEstatus === 'RECHAZAR' && { comprobante_url: null })
      }

      const { error } = await supabase
        .from('adeudos')
        .update(updateData)
        .eq('id', adeudoId)

      if (error) throw error

      toast.exito(`Pago ${nuevoEstatus === 'APROBAR' ? 'aprobado' : 'rechazado'}`)

      // Actualiza la lista local de la bandeja
      setPagosEnRevision(actuales => actuales.filter(p => p.id !== adeudoId))

      // Damos 500ms para que Supabase asimile el cambio antes de pedir los datos de nuevo
      setTimeout(() => {
        if (onActualizar) {
          onActualizar()
        }
      }, 500)

    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al procesar')
    }
  }

  if (cargando) {
    return (
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex justify-center italic text-slate-400">
        Cargando bandeja...
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
            <p className="text-slate-500 font-medium">¡Todo al día!</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
            {pagosEnRevision.map(pago => {
              const fueRevisado = ticketsVistos.includes(pago.id)

              return (
                <div key={pago.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 hover:border-blue-200 transition-colors">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide">
                        Casa {pago.propiedades?.identificador || 'S/N'}
                      </span>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-tight">
                        {pago.concepto || `Mantenimiento ${MESES[pago.mes_cargo - 1]}`}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-slate-800">
                      ${Number(pago.monto_total).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto mt-3 md:mt-0">
                    <button
                      onClick={() => abrirVisor(pago)}
                      className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      Ver Ticket
                    </button>

                    <button
                      onClick={() => procesarPago(pago.id, 'RECHAZAR')}
                      disabled={!fueRevisado}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 border
                        ${fueRevisado
                          ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 cursor-pointer opacity-100'
                          : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-60'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                      Rechazar
                    </button>

                    <button
                      onClick={() => procesarPago(pago.id, 'APROBAR')}
                      disabled={!fueRevisado}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 shadow-md
                        ${fueRevisado
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200 cursor-pointer opacity-100'
                          : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed opacity-50'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      Aprobar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {comprobanteViendo && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-[2rem] p-4 max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-black text-slate-800 text-lg">Revisar Comprobante</h3>
              <button onClick={() => setComprobanteViendo(null)} className="size-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
              <img src={comprobanteViendo} alt="Ticket" className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
            <button onClick={() => setComprobanteViendo(null)} className="mt-4 w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm uppercase tracking-wide">
              Ya lo revisé
            </button>
          </div>
        </div>
      )}
    </>
  )
}