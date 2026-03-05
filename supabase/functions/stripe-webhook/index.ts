import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// Importamos o Stripe de uma CDN específica para Deno (esm.sh) sem as dependências de Node
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
  // Detalhe crucial: usamos o FetchHttpClient nativo do Deno
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()
  const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  try {
    // Para ambientes de Edge, usamos a verificação assíncrona que não depende de crypto nativo de Node
    const event = await stripe.webhooks.constructEventAsync(
      body, 
      signature!, 
      endpointSecret!
    )
    
    // Conexão com Supabase usando Service Role para ignorar RLS
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const clinicId = session.client_reference_id;
      
      console.log(`Pagamento confirmado para ID: ${clinicId}`);

      if (clinicId) {
        const { error } = await supabaseAdmin
          .from('clinics')
          .update({ 
            plan_type: 'premium',
            stripe_customer_id: session.customer 
          })
          .eq('id', clinicId);

        if (error) throw error;
        console.log("Conta ConectNew atualizada para PREMIUM!");
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" } 
    })
  } catch (err) {
    console.error(`Erro no Webhook: ${err.message}`)
    return new Response(`Erro: ${err.message}`, { status: 400 })
  }
})