import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno&no-check'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts' // Using alias defined in deno.jsonc
import { Database } from '@/types/supabase.ts' // Using alias defined in deno.jsonc

// Type alias
// type Customer = Database['public']['Tables']['customers']['Row'] // Verwijderd want ongebruikt

// Initialize Stripe client
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
})

// Initialize Supabase Admin client (needed to create/get Stripe customer mapping)
const supabaseAdmin = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get User from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }
    // Initialize Supabase client with user's auth token to get user data
    const supabaseClient = createClient<Database>(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('User retrieval error:', userError)
      throw new Error('Failed to retrieve user')
    }
    console.log(`User [${user.id}] authenticated.`);

    // 2. Get Price ID from request body
    const { priceId } = await req.json()
    if (!priceId) {
      throw new Error('Missing priceId in request body')
    }
    console.log(`Received request for priceId: ${priceId}`);

    // 3. Get or Create Stripe Customer
    let customerId: string;
    // Check if customer exists in Supabase `customers` table
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (customerError && customerError.code !== 'PGRST116') { // PGRST116: row not found
      console.error('Error fetching customer:', customerError)
      throw new Error('Failed to fetch customer data')
    }

    if (customerData?.stripe_customer_id) {
      customerId = customerData.stripe_customer_id
      console.log(`Found existing Stripe customer [${customerId}] for user [${user.id}]`);
    } else {
      console.log(`No Stripe customer found for user [${user.id}], creating one...`);
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id, // Link back to Supabase user
        },
      })
      customerId = customer.id
      console.log(`Created new Stripe customer [${customerId}] for user [${user.id}]`);

      // Insert mapping into Supabase `customers` table
      const { error: insertError } = await supabaseAdmin
        .from('customers')
        .insert({ id: user.id, stripe_customer_id: customerId })

      if (insertError) {
        console.error('Error inserting customer mapping:', insertError)
        // Don't block checkout if mapping fails, but log it
      } else {
        console.log(`Successfully inserted customer mapping for user [${user.id}]`);
      }
    }

    // 4. Create Stripe Checkout Session
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:8080' // Fallback for local dev
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'], // Voeg evt. andere methoden toe
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${siteUrl}/profile?checkout=success`, // Redirect naar profiel pagina (succes)
      cancel_url: `${siteUrl}/profile`, // Redirect terug naar profiel pagina (annulering)
      // Optioneel: trial periode, metadata, etc.
      // subscription_data: {
      //   trial_period_days: 14
      // }
    })

    if (!session.url) {
       throw new Error('Failed to create checkout session URL')
    }
    console.log(`Created checkout session [${session.id}] for customer [${customerId}]`);

    // 5. Return Session URL
    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) { 
    console.error('Checkout session creation failed:', error)
    
    let errorKey = 'checkout.error.unknown'; // Default error key
    if (error instanceof Error) {
        // Map known error messages to specific keys
        switch (error.message) {
            case 'Missing Authorization header':
                errorKey = 'checkout.error.missingAuth';
                break;
            case 'Failed to retrieve user':
                errorKey = 'checkout.error.userRetrievalFailed';
                break;
            case 'Missing priceId in request body':
                errorKey = 'checkout.error.missingPriceId';
                break;
            case 'Failed to fetch customer data':
                errorKey = 'checkout.error.customerFetchFailed';
                break;
            case 'Failed to create checkout session URL':
                errorKey = 'checkout.error.sessionCreationFailed';
                break;
            // Add more specific error message mappings here if needed
            default:
                 // Keep the default 'checkout.error.unknown' or log the specific message
                 console.error('Unknown but specific error:', error.message); 
        }
    }

    return new Response(
      JSON.stringify({ errorKey }), // Return the error key
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/* --- TODO & Notes ---
- **Deployment:** Deploy this function: `supabase functions deploy create-checkout-session --project-ref <your-project-id>`.
- **Environment Variables:** Ensure `STRIPE_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` and `SITE_URL` are set.
- **CORS Helper:** Make sure the `../_shared/cors.ts` file exists and contains the correct CORS headers.
- **Database Types:** Verify the path to `Database` types.
- **Frontend Integration:** Call this function from your UI (e.g., on button click), passing the selected `priceId`. Use the returned `url` to redirect the user: `window.location.href = session.url`.
- **Success/Cancel URLs:** Update the `success_url` and `cancel_url` to point to the correct pages in your application.
- **RLS:** Ensure RLS policies on the `customers` table allow the admin client (service_role) to read/write.
*/ 