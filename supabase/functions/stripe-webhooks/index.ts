/**
 * @fileoverview Supabase Edge Function to handle Stripe webhooks.
 * This function listens for relevant Stripe events (e.g., checkout.session.completed,
 * customer.subscription.updated) and updates subscription data in the Supabase database accordingly.
 * It also optionally updates the user's role in the `profiles` table based on subscription status.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno&no-check'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database } from '../../../src/types/supabase.ts' // Adjust this path to your type generation location if necessary

/**
 * @typedef {Database['public']['Tables']['subscriptions']['Row']} SubscriptionRow
 * @typedef {Database['public']['Tables']['customers']['Row']} CustomerRow
 * @typedef {Database['public']['Tables']['prices']['Row']} PriceRow
 */

// Type alias for convenience
type Subscription = Database['public']['Tables']['subscriptions']['Row']
type Customer = Database['public']['Tables']['customers']['Row']
type Price = Database['public']['Tables']['prices']['Row']

// Initialize Stripe client
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16', // Use a specific API version
})

// Initialize Supabase Admin client
const supabaseAdmin = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// --- Helper functions ---

/**
 * Upserts a subscription record in the Supabase `subscriptions` table.
 * Also updates the user's role in the `profiles` table based on the subscription status.
 * @async
 * @param {Stripe.Subscription} subscription - The Stripe Subscription object.
 * @throws Will throw an error if the Supabase upsert operation fails.
 */
const upsertSubscriptionRecord = async (subscription: Stripe.Subscription) => {
  console.log(`Upserting subscription [${subscription.id}] for user [${subscription.customer}]`)
  const subscriptionData: Partial<Subscription> = {
    id: subscription.id,
    user_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id, // Stripe can send customer ID as a string or an object
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    created: new Date(subscription.created * 1000).toISOString(),
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  }

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData)

  if (error) {
    console.error('Error upserting subscription:', error)
    throw error
  }
  console.log(`Subscription [${subscription.id}] upserted successfully.`)

  // Update user role based on subscription status (optional, but often useful)
  // Only update if status is active or trial, otherwise revert to 'free'
  const userId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const newRole = (subscription.status === 'active' || subscription.status === 'trialing') ? 'paid' : 'free'; // Adjust 'paid' role name if needed

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

   if (profileError) {
     console.error(`Error updating profile role for user [${userId}]:`, profileError)
     // Do not throw an error here, as the subscription update was successful
   } else {
     console.log(`Profile role for user [${userId}] updated to '${newRole}'.`)
   }
}

/**
 * Manages subscription status changes by retrieving the latest subscription details
 * from Stripe and then calling `upsertSubscriptionRecord`.
 * @async
 * @param {string} subscriptionId - The ID of the Stripe subscription.
 * @param {string} customerId - The ID of the Stripe customer.
 */
const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
) => {
  console.log(`Managing subscription status change for subscription [${subscriptionId}], customer [${customerId}]`)
  // Retrieve the subscription details from Stripe to ensure we have the latest state
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method']
  });

  await upsertSubscriptionRecord(subscription);
}


const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created', // Extra event for directly created subs
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
])

/**
 * Main Deno server function that handles incoming Stripe webhook requests.
 * - Verifies the Stripe webhook signature.
 * - Processes relevant events (checkout completion, subscription updates, invoice payments).
 * - Calls helper functions to update subscription data and user roles in Supabase.
 * - Returns appropriate HTTP responses to Stripe.
 * This function requires the `STRIPE_WEBHOOK_SIGNING_SECRET` to be set for signature verification.
 * @param {Request} req - The incoming HTTP request object from Stripe.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')

  // Logging variables
  const functionNameForLogging = 'stripe-webhooks';
  let requestBodyForLogging: Record<string, unknown> = {};
  let eventType: string | undefined;
  let eventId: string | undefined;
  let userId: string | undefined; // Will be populated when we have a customer ID that maps to a user
  let stripeCustomerId: string | undefined;

  if (!signature || !webhookSecret) {
    console.error('Missing Stripe signature or webhook secret.')
    
    // Log error without userId
    try {
      await supabaseAdmin.from('user_api_logs').insert({
        // No user_id available
        function_name: functionNameForLogging,
        metadata: { 
          success: false, 
          error: 'Missing Stripe signature or webhook secret',
          headers: { 
            'stripe-signature': !!signature, 
            'webhook-secret-configured': !!webhookSecret 
          }
        },
      });
    } catch (logError) {
      console.error('Failed to log missing signature/secret to user_api_logs:', logError);
    }
    
    return new Response('Webhook Error: Missing signature or secret.', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider() // Use Deno's SubtleCrypto
    )
    eventType = event.type;
    eventId = event.id;
    
    // Basic logging information
    requestBodyForLogging = {
      eventType,
      eventId,
      endpoint: req.url,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`Webhook event received: ${event.type} [${event.id}]`)
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    
    // Log signature verification error without userId
    try {
      await supabaseAdmin.from('user_api_logs').insert({
        // No user_id available
        function_name: functionNameForLogging,
        metadata: { 
          success: false, 
          error: 'Webhook signature verification failed',
          errorMessage: err.message,
          ...requestBodyForLogging
        },
      });
    } catch (logError) {
      console.error('Failed to log signature verification error to user_api_logs:', logError);
    }
    
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  // Process only relevant events
  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode === 'subscription' && session.subscription) {
             // Get subscription ID and customer ID from the session
             const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
             const customerId = typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? null); // Check again if it's a string or an object

             if (!customerId) {
               console.error('Customer ID missing in checkout session.');
               throw new Error('Customer ID missing in checkout session.');
             }

             stripeCustomerId = customerId;
             // Try to get the Supabase user ID from the Stripe customer ID
             try {
               const { data: customerData } = await supabaseAdmin
                 .from('customers')
                 .select('id') // id is the user_id in the customers table
                 .eq('stripe_customer_id', customerId)
                 .single();
               
               if (customerData?.id) {
                 userId = customerData.id;
               }
             } catch (lookupError) {
               console.error('Error looking up user ID from customer ID:', lookupError);
             }

             await manageSubscriptionStatusChange(subscriptionId, customerId);
          } else {
             console.log(`Ignoring checkout session [${session.id}] (mode: ${session.mode}).`)
          }
          break;
        }
        case 'invoice.paid':
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

          if (customerId) {
            stripeCustomerId = customerId;
            // Try to get the Supabase user ID from the Stripe customer ID
            try {
              const { data: customerData } = await supabaseAdmin
                .from('customers')
                .select('id') // id is the user_id in the customers table
                .eq('stripe_customer_id', customerId)
                .single();
              
              if (customerData?.id) {
                userId = customerData.id;
              }
            } catch (lookupError) {
              console.error('Error looking up user ID from customer ID:', lookupError);
            }
          }

          if (subscriptionId && customerId) {
            await manageSubscriptionStatusChange(subscriptionId, customerId);
          } else {
             console.log(`Ignoring invoice event [${invoice.id}] - missing subscription or customer ID.`)
          }
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
          
          if (customerId) {
            stripeCustomerId = customerId;
            // Try to get the Supabase user ID from the Stripe customer ID
            try {
              const { data: customerData } = await supabaseAdmin
                .from('customers')
                .select('id') // id is the user_id in the customers table
                .eq('stripe_customer_id', customerId)
                .single();
              
              if (customerData?.id) {
                userId = customerData.id;
              }
            } catch (lookupError) {
              console.error('Error looking up user ID from customer ID:', lookupError);
            }
          }
          
          await upsertSubscriptionRecord(subscription); // `upsert` handles create, update, and delete (via status)
          break;
        }
        default:
          console.log(`Unhandled relevant event type: ${event.type}`)
      }
       console.log(`Successfully processed event: ${event.type} [${event.id}]`)
       
       // Log success to user_api_logs
       try {
         await supabaseAdmin.from('user_api_logs').insert({
           user_id: userId, // May be undefined for some events
           function_name: functionNameForLogging,
           metadata: { 
             success: true, 
             eventType: event.type,
             eventId: event.id,
             stripeCustomerId,
             hasUserId: !!userId,
             ...requestBodyForLogging
           },
         });
       } catch (logError) {
         console.error('Failed to log webhook success to user_api_logs:', logError);
       }
    } catch (error) {
      console.error(`Error processing event ${event.type} [${event.id}]:`, error)
      
      // Log processing error to user_api_logs
      try {
        await supabaseAdmin.from('user_api_logs').insert({
          user_id: userId, // May be undefined
          function_name: functionNameForLogging,
          metadata: { 
            success: false, 
            error: `Error processing event ${event.type}`,
            errorMessage: error.message,
            eventId: event.id,
            stripeCustomerId,
            hasUserId: !!userId,
            ...requestBodyForLogging
          },
        });
      } catch (logError) {
        console.error('Failed to log processing error to user_api_logs:', logError);
      }
      
      return new Response(`Webhook handler failed: ${error.message}`, { status: 500 })
    }
  } else {
    console.log(`Ignoring irrelevant event type: ${event.type}`)
    
    // Optionally log ignored events
    try {
      await supabaseAdmin.from('user_api_logs').insert({
        // No user_id for irrelevant events
        function_name: functionNameForLogging,
        metadata: { 
          success: true, 
          ignored: true,
          reason: 'Irrelevant event type',
          eventType: event.type,
          eventId: event.id,
          ...requestBodyForLogging
        },
      });
    } catch (logError) {
      console.error('Failed to log ignored event to user_api_logs:', logError);
    }
  }

  // Return a 200 OK response to Stripe
  return new Response(JSON.stringify({ received: true }), { status: 200 })
})

/* --- TODO & Notes ---
- **Deployment:** Deploy this function using `supabase functions deploy stripe-webhooks --no-verify-jwt`.
- **Environment Variables:** Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in your Supabase project secrets.
- **Stripe Configuration:** Create a webhook endpoint in your Stripe Dashboard pointing to the URL of this deployed function. Select the relevant events (listed in `relevantEvents` Set).
- **Error Handling:** Add more robust error handling and potentially notifications for failures.
- **Database Types:** Ensure the path to your Supabase database types (`../../../src/types/supabase.ts`) is correct. Generate types if you haven't: `supabase gen types typescript --project-id <your-project-id> --schema public > src/types/supabase.ts`.
- **Role Management:** Adjust the role name (e.g., 'paid') in `upsertSubscriptionRecord` if you use different role names in your application.
- **Security:** Review and potentially refine the Supabase RLS policies for the `customers`, `subscriptions`, and `profiles` tables to ensure this function has the necessary permissions.
*/ 