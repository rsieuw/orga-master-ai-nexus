// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function 'delete-research' booting up.`);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Create Supabase client with Auth context
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2. Get user from Auth context
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("User authentication error:", userError);
      return new Response(JSON.stringify({ error: 'Niet geautoriseerd' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 3. Parse request body to get the researchId
    const { researchId } = await req.json();
    if (!researchId || typeof researchId !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'researchId' in request body" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    console.log(`Attempting to delete research ID: ${researchId} for user: ${user.id}`);

    // 4. Delete data from the saved_research table
    const { error: deleteError } = await supabaseClient
      .from('saved_research')
      .delete()
      .eq('id', researchId)
      .eq('user_id', user.id); // Extra check: only delete if it belongs to the user

    if (deleteError) {
      console.error("Error deleting saved research:", deleteError);
      // Differentiate between not found and other errors?
      // For now, just throw generic error
      throw new Error(`Database error: ${deleteError.message}`);
    }

    // 5. Return success response
    console.log(`Research with ID ${researchId} deleted successfully.`);
    return new Response(
      JSON.stringify({ message: "Onderzoek succesvol verwijderd!" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in delete-research function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Interne serverfout" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
}); 