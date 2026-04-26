import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import PropiedadDetalle from '../components/PropiedadDetalle'
import GenerarAdeudosModal from '../components/GenerarAdeudosModal'
import { useToast } from '../components/Toast'

export default function AdminDashboard() {
    const { cerrarSesion, fraccionamientoId } = useAuth()
    const [propiedades, setPropiedades] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtro, setFiltro] = useState('todos') // 'todos', 'al-corriente', 'con-adeudo'
    const [cargando, setCargando] = useState(true)
    const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null)
    const [modalGenerarAbierto, setModalGenerarAbierto] = useState(false)

    useEffect(() => {
        if (fraccionamientoId) {
            cargarPropiedades()
        }
    }, [fraccionamientoId])

    const cargarPropiedades = async () => {
        setCargando(true)
        try {
            // Traemos las propiedades y sus adeudos pendientes para calcular el estado
            const { data, error } = await supabase
                .from('propiedades')
                .select(`
          *,
          usuarios (nombre),
          adeudos (monto_total, estatus)
        `)
                .eq('fraccionamiento_id', fraccionamientoId)
                .order('identificador', { ascending: true })

            if (error) throw error

            // Procesamos los datos para la interfaz
            const procesadas = data.map(p => {
                const adeudosPendientes = p.adeudos?.filter(a => a.estatus === 'PENDIENTE') || []
                const saldo = adeudosPendientes.reduce((sum, a) => sum + Number(a.monto_total), 0)

                return {
                    id: p.id,
                    numero_casa: p.identificador,
                    domicilio: p.domicilio,
                    residente: p.usuarios?.nombre || 'Sin asignar',
                    saldo: saldo,
                    tieneAdeudo: saldo > 0
                }
            })

            setPropiedades(procesadas)
        } catch (error) {
            console.error('Error:', error.message)
        } finally {
            setCargando(false)
        }
    }

    const propiedadesFiltradas = propiedades.filter(p => {
        const coincideBusqueda = p.numero_casa.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.residente.toLowerCase().includes(busqueda.toLowerCase())

        if (filtro === 'al-corriente') return coincideBusqueda && !p.tieneAdeudo
        if (filtro === 'con-adeudo') return coincideBusqueda && p.tieneAdeudo
        return coincideBusqueda
    })

    return (
        <div className="min-h-screen bg-slate-50 font-display">
            {/* Navbar Superior */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">domain</span>
                    </div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">AdminPanel</h1>
                </div>
                <button onClick={cerrarSesion} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </nav>

            <div className="p-6 max-w-6xl mx-auto">
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Control de Propiedades</h2>
                        <p className="text-slate-500">Gestiona residentes y estados de cuenta.</p>
                    </div>

                    <button
                        onClick={() => setModalGenerarAbierto(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95 text-sm"
                    >
                        <span className="material-symbols-outlined">bolt</span>
                        GENERAR MENSUALIDAD
                    </button>
                </header>

                {/* Buscador y Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por casa o residente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:border-primary/50 outline-none shadow-sm transition-all"
                        />
                    </div>
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                        {['todos', 'al-corriente', 'con-adeudo'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filtro === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
                                    }`}
                            >
                                {f.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rejilla de Propiedades */}
                {cargando ? (
                    <div className="flex justify-center py-20">
                        <span className="material-symbols-outlined animate-spin text-5xl text-slate-200">sync</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {propiedadesFiltradas.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setPropiedadSeleccionada(p)}
                                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 rounded-bl-full ${p.tieneAdeudo ? 'bg-red-500' : 'bg-green-500'}`} />

                                <div className="flex justify-between items-start mb-4">
                                    <div className={`size-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transition-transform group-hover:scale-110 ${p.tieneAdeudo ? 'bg-red-50 text-red-500 shadow-red-500/10' : 'bg-green-50 text-green-500 shadow-green-500/10'
                                        }`}>
                                        {p.numero_casa}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${p.tieneAdeudo ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {p.tieneAdeudo ? 'Con Adeudo' : 'Al Corriente'}
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-800 truncate mb-1">{p.domicilio}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                    {p.residente}
                                </p>

                                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                    <p className="text-sm font-medium text-slate-400">Saldo:</p>
                                    <p className={`text-lg font-black ${p.tieneAdeudo ? 'text-red-500' : 'text-green-500'}`}>
                                        ${p.saldo.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Detalle */}
            {propiedadSeleccionada && (
                <PropiedadDetalle
                    propiedad={propiedadSeleccionada}
                    alCerrar={() => {
                        setPropiedadSeleccionada(null)
                        cargarPropiedades() // Recarga al cerrar para ver cambios de pagos o residentes
                    }}
                />
            )}
            {/* Modal de Generación Masiva */}
            {modalGenerarAbierto && (
                <GenerarAdeudosModal
                    onClose={() => setModalGenerarAbierto(false)}
                    onExito={cargarPropiedades}
                />
            )}
        </div>
    )
}