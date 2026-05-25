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
    console.log('Body recebido:', JSON.stringify(body))

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    console.log('Token existe:', !!accessToken)

    const payload = {
      items: [{
        title: 'Bolão Copa 2026 — Inscrição',
        quantity: 1,
        currency_id: 'BRL',
        unit_price: 50,
      }],
      payer: {
        email: body.email || 'comprador@teste.com',
      },
      back_urls: {
        success: 'https://bolao-copa-2026-iota-smoky.vercel.app/dashboard',
        failure: 'https://bolao-copa-2026-iota-smoky.vercel.app/inscricao',
        pending: 'https://bolao-copa-2026-iota-smoky.vercel.app/dashboard',
      },
      auto_return: 'approved',
      external_reference: body.user_id,
    }

    console.log('Payload MP:', JSON.stringify(payload))

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    console.log('Resposta MP:', JSON.stringify(data))

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
    console.log('Erro:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})