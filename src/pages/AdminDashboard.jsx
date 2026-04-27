import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../components/Toast'

import BandejaAprobaciones from '../components/BandejaAprobaciones'
import GenerarAdeudosModal from '../components/GenerarAdeudosModal'
import PropiedadDetalle from '../components/PropiedadDetalle'

export default function AdminDashboard() {
    const { cerrarSesion, fraccionamientoId } = useAuth()
    const { toast } = useToast()

    const [propiedades, setPropiedades] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtro, setFiltro] = useState('todos')

    // Cambiado para gestionar cargas silenciosas
    const [cargandoInicial, setCargandoInicial] = useState(true)

    const [propiedadActiva, setPropiedadActiva] = useState(null)
    const [modalGenerarAbierto, setModalGenerarAbierto] = useState(false)
    // NUEVO: El "timbre" para actualizar la bandeja
    const [recargarBandeja, setRecargarBandeja] = useState(0)


    useEffect(() => {
        if (fraccionamientoId) {
            cargarPropiedades(true) // true = Muestra pantalla de carga
        }
    }, [fraccionamientoId])

    const cargarPropiedades = async (esPrimeraCarga = false) => {
        try {
            if (esPrimeraCarga) setCargandoInicial(true)

            const { data, error } = await supabase
                .from('propiedades')
                .select(`
                    *,
                    adeudos (*)
                `)
                .eq('fraccionamiento_id', fraccionamientoId)
                .order('identificador', { ascending: true })

            if (error) throw error
            setPropiedades(data || [])
        } catch (error) {
            console.error('Error:', error)
            toast.error("No se pudieron cargar las propiedades")
        } finally {
            if (esPrimeraCarga) setCargandoInicial(false)
        }
    }

    const propiedadesFiltradas = propiedades.filter(p => {
        const coincideBusqueda = p.identificador.toLowerCase().includes(busqueda.toLowerCase()) ||
            (p.nombre_residente?.toLowerCase() || '').includes(busqueda.toLowerCase())

        const saldo = p.adeudos?.filter(a => a.estatus !== 'PAGADO')
            .reduce((acc, curr) => acc + curr.monto_total, 0) || 0

        if (filtro === 'adeudo') return coincideBusqueda && saldo > 0
        if (filtro === 'corriente') return coincideBusqueda && saldo === 0
        return coincideBusqueda
    })

    if (cargandoInicial) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="size-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold animate-pulse">Cargando datos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <span className="material-symbols-outlined text-white">domain</span>
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">AdminPanel</h1>
                    </div>
                    <button
                        onClick={cerrarSesion}
                        className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Salir
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pt-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Control de Propiedades</h2>
                        <p className="text-slate-500 font-medium mt-1">Gestiona residentes y estados de cuenta en tiempo real.</p>
                    </div>
                    <button
                        onClick={() => setModalGenerarAbierto(true)}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">bolt</span>
                        GENERAR MENSUALIDAD
                    </button>
                </div>

                <div className="mb-12">
                    <BandejaAprobaciones
                        onActualizar={() => cargarPropiedades(false)}
                        triggerRecarga={recargarBandeja} /* <-- Agrega esta línea */
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por casa o residente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:outline-none focus:border-indigo-500 transition-all font-medium"
                        />
                    </div>
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                        {['todos', 'corriente', 'adeudo'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f)}
                                className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${filtro === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {f === 'todos' ? 'Todos' : f === 'corriente' ? 'Al corriente' : 'Con Adeudo'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {propiedadesFiltradas.map((casa) => {
                        const saldo = casa.adeudos?.filter(a => a.estatus !== 'PAGADO')
                            .reduce((acc, curr) => acc + curr.monto_total, 0) || 0;

                        return (
                            <div
                                key={casa.id}
                                onClick={() => setPropiedadActiva(casa)}
                                className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter ${saldo > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                        {saldo > 0 ? 'Con Adeudo' : 'Al Corriente'}
                                    </span>
                                </div>

                                <div className="size-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                    <span className="text-2xl font-black">{casa.identificador}</span>
                                </div>

                                <div className="flex items-center gap-2 text-slate-400 mb-6">
                                    <span className="material-symbols-outlined text-lg">person</span>
                                    <span className="text-xs font-bold uppercase truncate">{casa.nombre_residente || 'Sin asignar'}</span>
                                </div>

                                <div className="flex items-end justify-between border-t border-slate-50 pt-4">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Saldo:</span>
                                    <span className={`text-xl font-black ${saldo > 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                        ${saldo.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </main>

            {modalGenerarAbierto && (
                <GenerarAdeudosModal
                    onClose={() => setModalGenerarAbierto(false)}
                    onExito={() => cargarPropiedades(false)}
                />
            )}

            {propiedadActiva && (
                <PropiedadDetalle
                    propiedad={propiedadActiva}
                    onClose={() => setPropiedadActiva(null)}
                    onActualizar={() => {
                        cargarPropiedades(false);
                        setRecargarBandeja(prev => prev + 1); // <-- Toca el timbre de la bandeja
                    }}
                />
            )}
        </div>
    )
}