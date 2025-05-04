// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts";

// console.log(`Function 'save-research' up and running!`); // Verwijderd

// Define CORS headers directly for simplicity
// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*', // Adjust in production!
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

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

    // 3. Parse request body
    const { taskId, researchContent, citations, subtaskTitle } = await req.json();
    if (!taskId || typeof taskId !== 'string') {
      return new Response(JSON.stringify({ error: "Missing or invalid 'taskId'" }), { status: 400, headers: corsHeaders });
    }

    // 4. Insert data into the saved_research table
    const { data: savedData, error: insertError } = await supabaseClient
      .from('saved_research')
      .insert({
        task_id: taskId,
        user_id: user.id,
        research_content: researchContent,
        citations: citations,
        subtask_title: subtaskTitle || null
      })
      .select('id') // Selecteer de ID van de nieuwe rij
      .single(); // Verwacht één resultaat

    if (insertError) {
      console.error("Error inserting saved research:", insertError);
      throw insertError; // Let the generic error handler catch it
    }

    // ---> NIEUW: Controleer of we data (en dus ID) hebben <--- 
    if (!savedData || !savedData.id) {
      console.error("Failed to retrieve ID after inserting saved research");
      throw new Error("Kon de ID van het opgeslagen onderzoek niet ophalen.");
    }

    // 5. Return success response, inclusief de nieuwe ID
    // console.log(`Research saved successfully (ID: ${savedData.id}) for task ${taskId} by user ${user.id}`); // Verwijderd
    return new Response(
      // ---> NIEUW: Stuur ID mee in de response <--- 
      JSON.stringify({ message: "Onderzoek succesvol opgeslagen!", savedResearchId: savedData.id }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    // console.error("Error saving research:", error); // Optioneel: log de fout server-side
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 