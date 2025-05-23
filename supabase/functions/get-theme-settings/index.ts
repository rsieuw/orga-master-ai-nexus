/**
 * @fileoverview Supabase Edge Function to retrieve theme settings for different user roles.
 * This function calls a Supabase RPC function `get_theme_settings` to fetch the settings.
 * If the RPC function fails or returns no data (e.g., the settings table doesn't exist),
 * it returns a default set of theme settings.
 */

// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // Deno.serve is now preferred
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.41.0'; // Pinned version for stability
import { corsHeaders } from "../_shared/cors.ts"; // Importeren als het een gedeeld bestand is
// import { createSuccessResponse, createErrorResponse } from "../_shared/responseBuilders.ts"; // Indien gebruikt

console.log("Function get-theme-settings loading...");

/**
 * @typedef {Object} ThemeSetting
 * @property {'admin' | 'paid' | 'free' | string} role - The user role.
 * @property {string[]} available_themes - An array of theme names available to this role.
 * @property {string} default_theme - The default theme for this role.
 */

/**
 * Main Deno server function that handles incoming HTTP requests to get theme settings.
 * - Handles CORS preflight requests.
 * - Creates a Supabase client with the anonymous key (read-only access needed).
 * - Calls the `get_theme_settings` RPC function in Supabase.
 * - If the RPC call is successful and returns data, that data is returned to the client.
 * - If the RPC call fails or returns no data, a predefined set of default theme settings is returned.
 * - Handles errors by returning a 500 status code with an error message and default settings.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object containing an array of ThemeSetting objects or an error.
 */
Deno.serve(async (req: Request) => { 
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Logging variabelen worden verwijderd of hieronder uitgecommentarieerd
  // const functionNameForLogging = 'get-theme-settings';
  // let loggingSupabaseClient: SupabaseClient | undefined = undefined; 
  // const requestIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'); 
  // const userAgent = req.headers.get('user-agent');
  // let supabaseAdminLoggingClient: SupabaseClient | null = null;
  // let userIdForLogging: string | undefined;

  // Client voor de RPC call
  let rpcSupabaseClient: SupabaseClient;
  const authHeader = req.headers.get('Authorization');

  /* // Verwijder admin client creatie als niet meer nodig
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (supabaseServiceRoleKey) {
    supabaseAdminLoggingClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      supabaseServiceRoleKey
    );
  } else {
    console.warn("[get-theme-settings] SUPABASE_SERVICE_ROLE_KEY not set.");
  }
  */

  try {
    /* // Verwijder user specifieke client creatie voor logging als niet meer nodig
    if (authHeader) {
      loggingSupabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      try {
        const { data: { user } } = await loggingSupabaseClient.auth.getUser();
        userIdForLogging = user?.id;
      } catch (authError) {
        console.warn('[get-theme-settings] Error fetching user for logging:', authError);
      }
    } else {
      console.warn("[get-theme-settings] No Authorization header found.");
    }
    */
    
    rpcSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader || '' }, 
        },
      }
    );

    const { data, error: rpcError } = await rpcSupabaseClient.rpc(
      'get_theme_settings',
    );

    let settingsToReturn = data;
    // let logData: Record<string, unknown> = { requestIp, userAgent }; // logData niet meer nodig

    if (rpcError) {
      console.error('[get-theme-settings] RPC error, falling back to defaults:', rpcError);
      // logData = { ...logData, success: false, rpc_error_message: rpcError.message, rpc_error_code: rpcError.code, details: 'RPC call to get_theme_settings failed, using defaults.' };
    }

    if (!settingsToReturn || (Array.isArray(settingsToReturn) && settingsToReturn.length === 0) || rpcError) {
      settingsToReturn = [
        { role: 'admin', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
        { role: 'paid', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
        { role: 'free', available_themes: ['custom-dark'], default_theme: 'custom-dark' }
      ];
      /* // logData niet meer nodig
      if (!rpcError) {
        logData = { ...logData, success: true, used_default_settings: true, details: 'No theme settings from RPC, returned default set.' };
      } else {
        logData.used_default_settings = true; 
      }
      */
    } else {
      // logData = { ...logData, success: true, used_default_settings: false, settings_count: settingsToReturn?.length };
    }

    // Logging naar user_api_logs hier uitgecommentarieerd
    /*
    const actualLoggingClient = supabaseAdminLoggingClient || loggingSupabaseClient || createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    try {
      await actualLoggingClient.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: logData,
      });
    } catch (dbLogError) {
      console.error('[get-theme-settings] FAILED TO LOG TO user_api_logs:', dbLogError);
    }
    */

    return new Response(
      JSON.stringify(settingsToReturn),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: rpcError ? 500 : 200, 
      }
    );
  } catch (error: unknown) {
    console.error('Error fetching theme settings (main catch block):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching theme settings';
    
    // Logging naar user_api_logs hier uitgecommentarieerd
    /*
    const actualErrorLoggingClient = supabaseAdminLoggingClient || loggingSupabaseClient || createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    try {
      await actualErrorLoggingClient.from('user_api_logs').insert({
        user_id: userIdForLogging, // userIdForLogging is niet meer beschikbaar hier
        function_name: functionNameForLogging, // functionNameForLogging is niet meer beschikbaar hier
        metadata: { success: false, error: 'General error in function', rawErrorMessage: errorMessage, requestIp, userAgent }, // requestIp en userAgent niet meer beschikbaar
      });
    } catch (dbLogError) {
      console.error('[get-theme-settings] FAILED TO LOG TO user_api_logs (main catch):', dbLogError);
    }
    */

    const defaultErrorResponseSettings = [
        { role: 'admin', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
        { role: 'paid', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
        { role: 'free', available_themes: ['custom-dark'], default_theme: 'custom-dark' }
      ];

    return new Response(
      JSON.stringify({
        error: errorMessage,
        defaultSettings: defaultErrorResponseSettings
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 