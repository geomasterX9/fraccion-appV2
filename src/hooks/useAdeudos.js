import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAdeudos(propiedadId) {
  const [adeudos, setAdeudos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false) // Puede ser 'bulk', un ID, o false

  const cargarAdeudos = useCallback(async () => {
    if (!propiedadId) return
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('adeudos')
        .select('*')
        .eq('propiedad_id', propiedadId)
        .order('anio_cargo', { ascending: false })
        .order('mes_cargo', { ascending: false })

      if (error) throw error
      setAdeudos(data || [])
    } catch (error) {
      console.error('Error al cargar adeudos:', error)
    } finally {
      setCargando(false)
    }
  }, [propiedadId])

  useEffect(() => {
    cargarAdeudos()
  }, [cargarAdeudos])

  // Cálculo automático del saldo pendiente
  const saldoPendiente = adeudos
    .filter(a => a.estatus === 'PENDIENTE')
    .reduce((suma, actual) => suma + Number(actual.monto_total), 0)

  // Función para pagar un solo recibo
  const pagarUno = async (adeudoId) => {
    setProcesando(adeudoId)
    try {
      const { error } = await supabase
        .from('adeudos')
        .update({ estatus: 'PAGADO' })
        .eq('id', adeudoId)

      if (error) throw error
      
      await cargarAdeudos() // Recargamos para actualizar la vista
      return { ok: true }
    } catch (error) {
      return { ok: false, mensaje: error.message }
    } finally {
      setProcesando(false)
    }
  }

  // Función para liquidar toda la deuda de la casa de un solo golpe
  const pagarTodos = async () => {
    setProcesando('bulk')
    try {
      const { error } = await supabase
        .from('adeudos')
        .update({ estatus: 'PAGADO' })
        .eq('propiedad_id', propiedadId)
        .eq('estatus', 'PENDIENTE')

      if (error) throw error
      
      await cargarAdeudos()
      return { ok: true }
    } catch (error) {
      return { ok: false, mensaje: error.message }
    } finally {
      setProcesando(false)
    }
  }

  return {
    adeudos,
    saldoPendiente,
    cargando,
    procesando,
    pagarUno,
    pagarTodos,
    recargar: cargarAdeudos
  }
}