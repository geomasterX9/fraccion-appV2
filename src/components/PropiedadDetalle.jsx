import React, { useState } from 'react'
import { useAdeudos } from '../hooks/useAdeudos'
import { useToast } from './Toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import AsignarResidenteModal from './AsignarResidenteModal'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const nombreMes = (n) => MESES[n - 1] ?? ''

export default function PropiedadDetalle({ propiedad, alCerrar }) {
  const { toast, confirmar } = useToast()
  const { fraccionamientoId } = useAuth()
  
  const {
    adeudos, saldoPendiente, cargando, procesando,
    pagarUno, pagarTodos,
  } = useAdeudos(propiedad.id)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [asignando, setAsignando] = useState(false)
  const [residenteActual, setResidenteActual] = useState(propiedad.residente)
  const [desvinculando, setDesvinculando] = useState(false)

  const handlePagarTodos = async () => {
    if (saldoPendiente === 0) return
    const ok = await confirmar(`¿Confirmas el pago total de $${saldoPendiente.toFixed(2)} para la propiedad ${propiedad.numero_casa}?`)
    if (!ok) return
    const res = await pagarTodos()
    res.ok ? toast.exito('¡Pago total registrado!') : toast.error('Error: ' + res.mensaje)
  }

  const handlePagarUno = async (adeudo) => {
    const ok = await confirmar(`¿Pagar $${Number(adeudo.monto_total).toFixed(2)} de Mantenimiento ${nombreMes(adeudo.mes_cargo)} ${adeudo.anio_cargo}?`)
    if (!ok) return
    const res = await pagarUno(adeudo.id)
    res.ok ? toast.exito('¡Adeudo pagado!') : toast.error('Error: ' + res.mensaje)
  }

  const handleDesvincular = async () => {
    const ok = await confirmar(`¿Estás seguro de que deseas desvincular a este residente de la casa ${propiedad.numero_casa}?`)
    if (!ok) return

    setDesvinculando(true)
    try {
      const { error } = await supabase
        .from('propiedades')
        .update({ owner_user_id: null })
        .eq('id', propiedad.id)

      if (error) throw error

      toast.exito('Residente desvinculado correctamente')
      setResidenteActual(null) 
    } catch (error) {
      toast.error('Error al desvincular: ' + error.message)
    } finally {
      setDesvinculando(false)
    }
  }

  const handleGuardarResidente = async (formData) => {
    setAsignando(true)
    const passwordTemporal = `Casa${propiedad.numero_casa}-Temp`

    try {
      const { data, error } = await supabase.functions.invoke('asignar-vecino', {
        body: {
          email: formData.correo,
          password: passwordTemporal,
          nombre: formData.nombre,
          telefono: formData.telefono,
          fraccionamiento_id: fraccionamientoId,
          propiedad_id: propiedad.id
        }
      })

      if (error) throw error
      if (!data.ok) throw new Error(data.mensaje)

      toast.exito(`¡Vecino asignado! Contraseña temporal: ${passwordTemporal}`)
      setResidenteActual(formData.nombre)
      setModalAbierto(false)
    } catch (error) {
      toast.error(error.message || 'Error al asignar residente. Verifica que el correo no exista ya.')
    } finally {
      setAsignando(false)
    }
  }

  const esModoAdmin = Boolean(alCerrar)

  return (
    <div className={esModoAdmin ? 'fixed inset-0 z-[70] bg-slate-50 flex flex-col font-display' : 'flex flex-col font-display w-full'}>

      {esModoAdmin && (
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white sticky top-0 z-10 shadow-sm">
          <button onClick={alCerrar} className="material-symbols-outlined text-slate-500 hover:bg-slate-100 rounded-full p-2 transition-colors">
            arrow_back
          </button>
          <h2 className="text-lg font-bold text-slate-800">Detalle de Propiedad</h2>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto space-y-5 ${esModoAdmin ? 'p-4' : 'px-0 pb-10'}`}>

        {/* Tarjeta de identificación */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-start gap-4 relative z-10">
            <div className="size-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/30 flex-shrink-0">
              {propiedad.numero_casa}
            </div>
            <div className="pt-1 min-w-0">
              <h3 className="text-xl font-black text-slate-800 leading-tight mb-1 truncate">{propiedad.domicilio}</h3>
              
              <div className="text-xs font-bold uppercase tracking-widest mt-1 h-8 flex items-center">
                {!residenteActual || residenteActual === 'Sin asignar' ? (
                  <button 
                    onClick={() => setModalAbierto(true)}
                    className="text-orange-500 hover:text-orange-600 flex items-center gap-1 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    Asignar residente
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{residenteActual}</span>
                    
                    {esModoAdmin && (
                      <button 
                        onClick={handleDesvincular}
                        disabled={desvinculando}
                        className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors flex items-center justify-center"
                        title="Desvincular residente"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${desvinculando ? 'animate-spin' : ''}`}>
                          {desvinculando ? 'sync' : 'person_remove'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Tarjeta de saldo */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg">
          <p className="text-sm font-medium text-slate-400 mb-1">Saldo Pendiente</p>
          <h4 className="text-4xl font-black tracking-tighter mb-5">
            ${saldoPendiente.toFixed(2)}
          </h4>
          <button
            onClick={handlePagarTodos}
            disabled={saldoPendiente === 0 || procesando === 'bulk'}
            className={`w-full font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 text-sm
              ${saldoPendiente === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-white active:scale-95 shadow-md shadow-primary/30'
              }`}
          >
            {procesando === 'bulk'
              ? <><span className="material-symbols-outlined animate-spin text-sm">sync</span> Procesando...</>
              : saldoPendiente === 0
                ? <><span className="material-symbols-outlined text-sm">check_circle</span> Cuenta al corriente</>
                : <><span className="material-symbols-outlined text-sm">payments</span> Pagar Todo (${saldoPendiente.toFixed(2)})</>
            }
          </button>
        </div>

        {/* Lista de adeudos */}
        <div>
          <h4 className="font-bold text-slate-700 mb-3 px-1 text-sm uppercase tracking-wider">
            Historial de Adeudos
          </h4>
          {cargando ? (
            <p className="text-center text-slate-400 text-sm mt-6 animate-pulse">Cargando...</p>
          ) : adeudos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">check_circle</span>
              <p className="text-slate-500 text-sm font-medium">Esta propiedad está al corriente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adeudos.map(adeudo => {
                const esPendiente = adeudo.estatus === 'PENDIENTE'
                return (
                  <div key={adeudo.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${esPendiente ? 'bg-orange-100 text-orange-500' : 'bg-green-100 text-green-500'}`}>
                        <span className="material-symbols-outlined text-sm">
                          {esPendiente ? 'warning' : 'task_alt'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${esPendiente ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                          Mantenimiento {nombreMes(adeudo.mes_cargo)} {adeudo.anio_cargo}
                        </p>
                        <p className={`text-xs font-semibold capitalize ${esPendiente ? 'text-orange-500' : 'text-green-500'}`}>
                          {adeudo.estatus.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                      <p className={`font-bold text-sm ${esPendiente ? 'text-slate-800' : 'text-slate-400'}`}>
                        ${Number(adeudo.monto_total).toFixed(2)}
                      </p>
                      {esPendiente && (
                        <button
                          onClick={() => handlePagarUno(adeudo)}
                          disabled={Boolean(procesando)}
                          className="text-[10px] font-black uppercase tracking-wide bg-primary/10 text-primary hover:bg-primary hover:text-white px-2 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {procesando === adeudo.id
                            ? <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                            : 'Pagar'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {modalAbierto && (
        <AsignarResidenteModal
          propiedad={propiedad}
          onClose={() => setModalAbierto(false)}
          onGuardar={handleGuardarResidente}
          procesando={asignando}
        />
      )}
    </div>
  )
}