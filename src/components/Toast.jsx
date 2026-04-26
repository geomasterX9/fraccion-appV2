import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toastData, setToastData] = useState(null)
  const [confirmData, setConfirmData] = useState(null)

  // Función interna para mostrar el globito de alerta
  const mostrarToast = useCallback((mensaje, tipo) => {
    setToastData({ mensaje, tipo })
    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => setToastData(null), 3000) 
  }, [])

  // Métodos expuestos para usar en otros componentes
  const exito = useCallback((mensaje) => mostrarToast(mensaje, 'exito'), [mostrarToast])
  const error = useCallback((mensaje) => mostrarToast(mensaje, 'error'), [mostrarToast])

  // Lógica del cuadro de diálogo de confirmación usando una Promesa
  const confirmar = useCallback((mensaje) => {
    return new Promise((resolve) => {
      setConfirmData({
        mensaje,
        onConfirm: () => {
          setConfirmData(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmData(null)
          resolve(false)
        }
      })
    })
  }, [])

  return (
    <ToastContext.Provider value={{ toast: { exito, error }, confirmar }}>
      {children}
      
      {/* 1. Renderizado de la notificación flotante (Toast) */}
      {toastData && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`px-6 py-3 rounded-full shadow-xl text-sm font-bold flex items-center gap-2 ${
            toastData.tipo === 'exito' ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-red-500 text-white shadow-red-500/20'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {toastData.tipo === 'exito' ? 'check_circle' : 'error'}
            </span>
            {toastData.mensaje}
          </div>
        </div>
      )}

      {/* 2. Renderizado del cuadro de confirmación (Confirm) */}
      {confirmData && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-display">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center border border-slate-100">
            <div className="size-16 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl">help</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Confirmación</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{confirmData.mensaje}</p>
            <div className="flex gap-3">
              <button 
                onClick={confirmData.onCancel}
                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmData.onConfirm}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-md transition-all active:scale-95"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

// Hook personalizado para usar las funciones fácilmente
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}