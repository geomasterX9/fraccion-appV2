import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { propiedad_id, nombre, email, telefono } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? '' // El mismo secreto que ya configuramos
    )

    // 1. Aquí va tu lógica para crear el usuario o vincularlo
    // (Por ahora, vamos a suponer que solo actualizas la propiedad)
    const { data, error } = await supabase
      .from('propiedades')
      .update({ 
        nombre_residente: nombre, 
        email_residente: email, 
        telefono_residente: telefono 
      })
      .eq('id', propiedad_id)

    if (error) throw error

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})