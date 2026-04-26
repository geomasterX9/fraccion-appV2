import React, { useState } from 'react'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function ReportarPagoModal({ isOpen, onClose, adeudosPendientes, alEnviar }) {
  const [adeudoSeleccionado, setAdeudoSeleccionado] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!adeudoSeleccionado || !archivo) return

    setEnviando(true)
    // Aquí después conectaremos con Supabase Storage
    // Por ahora, simulamos el envío para probar la interfaz
    setTimeout(() => {
      setEnviando(false)
      alEnviar(adeudoSeleccionado, archivo)
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Cabecera del Modal */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <div className="size-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
          <h2 className="text-xl font-black">Reportar Pago</h2>
          <p className="text-blue-100 text-sm mt-1">Sube tu comprobante de transferencia</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Selector de Mes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              ¿Qué mes estás pagando?
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              value={adeudoSeleccionado}
              onChange={(e) => setAdeudoSeleccionado(e.target.value)}
              required
            >
              <option value="">Selecciona un recibo pendiente...</option>
              {adeudosPendientes.map(adeudo => (
                <option key={adeudo.id} value={adeudo.id}>
                  Mantenimiento {MESES[adeudo.mes_cargo - 1]} {adeudo.anio_cargo} - ${Number(adeudo.monto_total).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Subir Archivo */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Comprobante (Foto o Captura)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors relative">
              <input 
                type="file" 
                accept="image/*,.pdf"
                onChange={(e) => setArchivo(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              <div className="pointer-events-none">
                <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">
                  {archivo ? 'check_circle' : 'cloud_upload'}
                </span>
                <p className={`text-sm font-bold ${archivo ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {archivo ? archivo.name : 'Toca para subir o toma una foto'}
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={enviando || !adeudoSeleccionado || !archivo}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
            >
              {enviando ? (
                <span className="material-symbols-outlined animate-spin">sync</span>
              ) : (
                'Enviar'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}