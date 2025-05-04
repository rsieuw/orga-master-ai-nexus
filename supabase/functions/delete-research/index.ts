// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
// import { supabaseAdmin } from "../_shared/supabaseAdmin.ts"

// console.log(`Function 'delete-research' booting up.`);

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
      // console.error("User authentication error:", userError);
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

    // 4. Delete data from the saved_research table
    const { count, error: deleteError } = await supabaseClient
      .from('saved_research')
      .delete({ count: 'exact' })
      .eq('id', researchId)
      .eq('user_id', user.id); // Extra check: only delete if it belongs to the user

    // ---> NIEUW: Log het resultaat van de delete operatie <---
    console.log(`[delete-research] Attempted delete for researchId: ${researchId}, userId: ${user.id}. Result count: ${count}`);
    // ---> EINDE NIEUW <---

    if (deleteError) {
      // console.error("Error deleting saved research:", deleteError);
      // Differentiate between not found and other errors?
      // For now, just throw generic error
      throw new Error(`Database error: ${deleteError.message}`);
    }

    // ---> NIEUW: Check of er daadwerkelijk iets is verwijderd <---
    if (count === 0) {
      console.warn(`[delete-research] No research found with id ${researchId} for user ${user.id}, or deletion prevented (e.g., RLS).`);
      // Besluit of je hier een fout wilt teruggeven of succes (als 'niet gevonden' ook ok is)
      // Voor nu geven we een mildere foutmelding terug
      return new Response(JSON.stringify({ 
        warning: `Onderzoek met ID ${researchId} niet gevonden of kon niet worden verwijderd.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404, // Of 403 als RLS waarschijnlijker is
      });
    }
    // ---> EINDE NIEUW <---

    // 5. Return success response
    // console.log(`Research with ID ${researchId} deleted successfully.`);
    return new Response(JSON.stringify({ message: "Onderzoek succesvol verwijderd!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // console.error("Error in delete-research function:", error);
    const errorMessage = error instanceof Error ? error.message : "Interne serverfout bij verwijderen onderzoek.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 