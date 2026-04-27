import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function GenerarAdeudosModal({ onClose, onExito }) {
    const { fraccionamientoId } = useAuth()
    const { toast } = useToast()
    const [cargando, setCargando] = useState(false)
    
    // Estados del formulario
    const [monto, setMonto] = useState('150')
    const fechaActual = new Date()
    const [mes, setMes] = useState(fechaActual.getMonth() + 1)
    const [anio, setAnio] = useState(fechaActual.getFullYear())
    
    // NUEVO: Estado para el concepto dinámico
    const [concepto, setConcepto] = useState(`Mantenimiento ${MESES_NOMBRES[fechaActual.getMonth()]}`)

    const ejecutarGeneracion = async () => {
        if (!monto || monto <= 0) return toast.error("Ingresa un monto válido")
        if (!concepto.trim()) return toast.error("El concepto no puede estar vacío")
        
        try {
            setCargando(true)

            // 1. Traer todas las casas del fraccionamiento
            const { data: propiedades, error: errP } = await supabase
                .from('propiedades')
                .select('id')
                .eq('fraccionamiento_id', fraccionamientoId)

            if (errP) throw errP

            // 2. Preparar la carga masiva
            const nuevosAdeudos = propiedades.map(p => ({
                propiedad_id: p.id,
                monto_total: parseFloat(monto),
                mes_cargo: parseInt(mes),
                anio_cargo: parseInt(anio),
                concepto: concepto.trim(), // Usamos el concepto del input
                estatus: 'PENDIENTE'
            }))

            // 3. Inserción masiva
            const { error: errI } = await supabase
                .from('adeudos')
                .insert(nuevosAdeudos)

            if (errI) {
                // Si choca con nuestra nueva regla UNIQUE(propiedad, mes, anio, concepto)
                if (errI.code === '23505') {
                    toast.error("Ya existe un cargo con este mismo concepto para este mes.")
                } else {
                    throw errI
                }
            } else {
                toast.exito(`¡Listo! Se generaron ${propiedades.length} cargos de "${concepto}"`)
                if (onExito) onExito()
                onClose()
            }

        } catch (error) {
            console.error(error)
            toast.error("Error al generar los cargos")
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="size-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
                    <span className="material-symbols-outlined text-3xl">bolt</span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-1">Generar Cargos</h3>
                <p className="text-slate-500 text-sm mb-6 font-medium">Crea una cuenta por cobrar para todo el fraccionamiento.</p>

                <div className="space-y-5 mb-8">
                    {/* Campo de Concepto */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Concepto del Cargo</label>
                        <input 
                            type="text" 
                            value={concepto}
                            onChange={(e) => setConcepto(e.target.value)}
                            className="w-full mt-1.5 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                            placeholder="Ej. Mantenimiento Mayo"
                        />
                    </div>

                    {/* Campo de Monto */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Monto Individual</label>
                        <div className="relative mt-1.5">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                            <input 
                                type="number" 
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-lg"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={onClose}
                        className="py-4 bg-slate-50 text-slate-500 rounded-2xl font-black hover:bg-slate-100 transition-all text-sm uppercase tracking-wider"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={ejecutarGeneracion}
                        disabled={cargando}
                        className="py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 text-sm uppercase tracking-wider"
                    >
                        {cargando ? 'Generando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    )
}