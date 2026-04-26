import React, { useState } from 'react'

export default function AsignarResidenteModal({ propiedad, onClose, onGuardar, procesando }) {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onGuardar(formData)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-display">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="size-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">person_add</span>
          </div>
          
          <h3 className="text-2xl font-black text-slate-800 mb-2">Asignar Residente</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Ingresa los datos del nuevo vecino para la casa <span className="font-bold text-slate-700">{propiedad.numero_casa}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Nombre Completo</label>
              <input 
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary/30 outline-none font-medium transition-all"
                placeholder="Ej. Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Correo Electrónico</label>
              <input 
                type="email"
                required
                value={formData.correo}
                onChange={(e) => setFormData({...formData, correo: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary/30 outline-none font-medium transition-all"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Teléfono</label>
              <input 
                type="tel"
                required
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary/30 outline-none font-medium transition-all"
                placeholder="10 dígitos"
              />
            </div>

            <div className="flex gap-3 mt-8 pt-4">
              <button 
                type="button"
                onClick={onClose}
                disabled={procesando}
                className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={procesando}
                className="flex-[2] py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {procesando ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  'Guardar Vecino'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}