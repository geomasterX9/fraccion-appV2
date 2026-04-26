import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../components/Toast'
import ReportarPagoModal from '../components/ReportarPagoModal'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function MiCuentaPage() {
  const { usuario, logout } = useAuth()
  const { toast } = useToast()

  const [propiedad, setPropiedad] = useState(null)
  const [adeudos, setAdeudos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false)

  useEffect(() => {
    if (usuario) cargarDatosVecino()
  }, [usuario])

  const cargarDatosVecino = async () => {
    try {
      setCargando(true)
      const { data: prop, error: propError } = await supabase
        .from('propiedades')
        .select('*')
        .eq('owner_user_id', usuario.id)
        .single()

      if (propError && propError.code !== 'PGRST116') throw propError
      if (prop) {
        setPropiedad(prop)
        const { data: ads, error: adsError } = await supabase
          .from('adeudos')
          .select('*')
          .eq('propiedad_id', prop.id)
          .order('anio_cargo', { ascending: false })
          .order('mes_cargo', { ascending: false })

        if (adsError) throw adsError
        setAdeudos(ads || [])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('No se pudo cargar la información de tu cuenta')
    } finally {
      setCargando(false)
    }
  }

  const saldoPendiente = adeudos
    .filter(a => a.estatus === 'PENDIENTE')
    .reduce((acc, curr) => acc + Number(curr.monto_total), 0)

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-2">sync</span>
          <p className="text-slate-500 font-medium">Cargando tu cuenta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 font-display pb-10">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-center items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <span className="material-symbols-outlined">home</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">FracciónApp 1.0</h1>

        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">

        {/* MENSAJE DE BIENVENIDA */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="text-2xl font-black text-slate-800 capitalize">
            Hola, {usuario?.user_metadata?.nombre || usuario?.user_metadata?.full_name || usuario?.email?.split('@')[0] || 'Vecino'} 👋
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Qué bueno verte por aquí.
          </p>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />

          <div className="relative z-10">
            <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1 opacity-80">Tu Propiedad</p>
            <h2 className="text-4xl font-black mb-1">
              {propiedad ? `Casa ${propiedad.numero_casa || propiedad.identificador}` : 'Sin asignar'}
            </h2>
            <p className="text-indigo-100 text-sm font-medium mb-6 opacity-90">
              {propiedad ? (propiedad.domicilio || 'Residencia Activa') : 'No tienes una propiedad vinculada aún.'}
            </p>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-1">Saldo Total</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black">${saldoPendiente.toFixed(2)}</span>
                <span className="text-indigo-200 text-xs font-bold mb-1.5 uppercase">MXN</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all">
            <div className="size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-xs font-bold text-slate-700">Pagar en línea</span>
          </button>

          <button
            onClick={() => setModalPagoAbierto(true)}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="text-xs font-bold text-slate-700">Reportar Pago</span>
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-[18px]">history</span>
            Historial de Mantenimientos
          </h3>

          {adeudos.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">sentiment_satisfied</span>
              <p className="text-slate-500 text-sm font-medium">No hay recibos registrados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adeudos.map(adeudo => {
                // Lógica de colores e íconos para accesibilidad visual
                let bgTarjeta = 'bg-white border-slate-100'
                let colorIcono = 'bg-orange-50 text-orange-500'
                let colorTexto = 'text-orange-500'
                let icono = 'pending_actions'

                if (adeudo.estatus === 'PAGADO') {
                  bgTarjeta = 'bg-emerald-50 border-emerald-100'
                  colorIcono = 'bg-emerald-100 text-emerald-600'
                  colorTexto = 'text-emerald-600'
                  icono = 'check_circle'
                } else if (adeudo.estatus === 'EN REVISIÓN') {
                  bgTarjeta = 'bg-orange-200 border-orange-400 border-2' // Borde más grueso y naranja visible
                  colorIcono = 'bg-orange-500 text-white' // Ícono sólido para que resalte
                  colorTexto = 'text-orange-800' // Texto oscuro para lectura muy clara
                  icono = 'hourglass_empty'
                }

                return (
                  <div key={adeudo.id} className={`${bgTarjeta} p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-all hover:shadow-md`}>
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl flex items-center justify-center ${colorIcono}`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {icono}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          Mantenimiento {MESES[adeudo.mes_cargo - 1]} {adeudo.anio_cargo}
                        </p>
                        <p className={`text-[10px] font-black uppercase tracking-tighter ${colorTexto}`}>
                          {adeudo.estatus}
                        </p>
                      </div>
                    </div>
                    <p className="font-black text-slate-900 text-sm">
                      ${Number(adeudo.monto_total).toFixed(2)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* BOTÓN DE CERRAR SESIÓN (Rediseño Premium) */}
        <div className="pt-6 pb-12">
          <button 
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.reload() 
            }}
            className="w-full bg-slate-900 text-slate-100 font-bold py-4 rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all border border-slate-800"
          >
            <div className="size-8 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </div>
            <span>Finalizar Sesión</span>
          </button>
          <p className="text-center text-slate-400 text-[10px] mt-4 uppercase tracking-[0.2em] font-black opacity-50">
            FraccionApp v1.0
          </p>
        </div>

        <ReportarPagoModal
          isOpen={modalPagoAbierto}
          onClose={() => setModalPagoAbierto(false)}
          adeudosPendientes={adeudos.filter(a => a.estatus === 'PENDIENTE')}
          alEnviar={async (adeudoId, archivo) => {
            try {
              toast.exito("Subiendo comprobante...")

              const extension = archivo.name.split('.').pop()
              const nombreArchivo = `casa_${propiedad?.numero_casa || 'sn'}_${Date.now()}.${extension}`

              const { error: uploadError } = await supabase.storage
                .from('comprobantes')
                .upload(nombreArchivo, archivo)

              if (uploadError) throw uploadError

              const { data: { publicUrl } } = supabase.storage
                .from('comprobantes')
                .getPublicUrl(nombreArchivo)

              const { error: updateError } = await supabase
                .from('adeudos')
                .update({
                  estatus: 'EN REVISIÓN',
                  comprobante_url: publicUrl
                })
                .eq('id', adeudoId)

              if (updateError) throw updateError

              setModalPagoAbierto(false)
              toast.exito("¡Comprobante enviado! Será revisado por la administración.")

              // Actualizamos la memoria de React al instante sin recargar la página
              setAdeudos(adeudosActuales =>
                adeudosActuales.map(adeudo =>
                  adeudo.id === adeudoId
                    ? { ...adeudo, estatus: 'EN REVISIÓN', comprobante_url: publicUrl }
                    : adeudo
                )
              );

            } catch (error) {
              console.log("Error completo:", error) // Esto lo mandará a la consola (F12)

              // Esto desarmará el "Object" para sacar el texto real del error
              const mensajeError = error.message || error.error || JSON.stringify(error)

              toast.error(`Error: ${mensajeError}`)
            }
          }}
        />

      </main>
    </div>
  )
}