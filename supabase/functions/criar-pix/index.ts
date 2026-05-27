import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const body = await req.json()
    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const payload = {
      items: [{
        title: 'Bolao Copa 2026 - Inscricao',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: 50,
      }],
      payer: {
        email: body.email || 'comprador@teste.com',
      },
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" }
        ],
        excluded_payment_methods: [],
        installments: 1,
        default_payment_method_id: "pix"
      },
      back_urls: {
        success: 'https://bolao-copa-2026-ijq7.vercel.app/dashboard',
        failure: 'https://bolao-copa-2026-ijq7.vercel.app/inscricao',
        pending: 'https://bolao-copa-2026-ijq7.vercel.app/dashboard',
      },
      auto_return: 'approved',
      external_reference: body.user_id,
    }
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!data.init_point) {
      return new Response(JSON.stringify({ error: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    return new Response(JSON.stringify({
      init_point: data.init_point,
      id: data.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})