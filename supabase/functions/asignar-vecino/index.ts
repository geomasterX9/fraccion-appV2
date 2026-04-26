import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { propiedad_id, email, password, nombre, telefono, fraccionamiento_id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    let userId;

    // ==========================================
    // PASO 1: Crear o recuperar usuario en AUTH
    // ==========================================
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: nombre, phone: telefono },
      email_confirm: true
    })

    if (authError) {
      if (authError.message.includes("already been registered")) {
        const { data: list } = await supabase.auth.admin.listUsers()
        userId = list.users.find(u => u.email === email)?.id
      } else {
        throw authError
      }
    } else {
      userId = authData.user.id
    }

    if (!userId) throw new Error("No se pudo obtener un ID de usuario válido")

    // ==========================================
    // PASO 1.5: Registrar en tu tabla 'usuarios'
    // ==========================================
    const { error: insertUserError } = await supabase
      .from('usuarios')
      .upsert({ 
        id: userId,
        fraccionamiento_id: fraccionamiento_id,
        nombre: nombre,
        telefono: telefono,
        rol: 'VECINO' // <-- CORREGIDO: Usando el constraint exacto de tu BD
      })

    if (insertUserError) {
      throw new Error(`Fallo al registrar en tabla pública: ${insertUserError.message}`)
    }

    // ==========================================
    // PASO 2: Vínculo con 'propiedades'
    // ==========================================
    const { error: dbError } = await supabase
      .from('propiedades')
      .update({ owner_user_id: userId })
      .eq('id', propiedad_id)

    if (dbError) {
      throw new Error(`Fallo vínculo con la casa: ${dbError.message}`)
    }

    // ==========================================
    // PASO 3: Éxito
    // ==========================================
    return new Response(JSON.stringify({ ok: true, mensaje: "Listo", userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    console.error("ERROR EN FUNCIÓN:", err.message)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})