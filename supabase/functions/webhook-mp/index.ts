import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const body = await req.json()
    console.log('Webhook MP:', JSON.stringify(body))

    if (body.type !== 'payment') {
      return new Response('ok', { status: 200 })
    }

    const paymentId = body.data?.id
    if (!paymentId) return new Response('ok', { status: 200 })

    const accessToken = Deno.env.get('MP_ACCESS_TOKEN')
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
    const payment = await mpRes.json()
    console.log('Payment status:', payment.status, 'external_reference:', payment.external_reference)

    if (payment.status === 'approved') {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const userId = payment.external_reference
      await supabase
        .from('users')
        .update({ status: 'ativo' })
        .eq('id', userId)

      console.log('Usuario ativado:', userId)
    }

    return new Response('ok', { status: 200 })
  } catch (error) {
    console.log('Erro webhook:', error.message)
    return new Response('error', { status: 500 })
  }
})