/**
 * @fileoverview Supabase Edge Function to retrieve theme settings for different user roles.
 * This function calls a Supabase RPC function `get_theme_settings` to fetch the settings.
 * If the RPC function fails or returns no data (e.g., the settings table doesn't exist),
 * it returns a default set of theme settings.
 */

// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // Deno.serve is now preferred
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.41.0'; // Pinned version for stability

// Re-defined corsHeaders locally as it might differ or can be shared from _shared/cors.ts
// For consistency, it's better to import if it's identical to the one in _shared/cors.ts
// import { corsHeaders } from '../_shared/cors.ts'; // Assuming it exists and is suitable
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

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
Deno.serve(async (req: Request) => { // Replaced std/serve with Deno.serve and typed req
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Logging variables
  let userIdForLogging: string | undefined;
  const functionNameForLogging = 'get-theme-settings';
  let loggingSupabaseClient: SupabaseClient | undefined = undefined; // For logging, initialized with user context if available
  let rpcSupabaseClient: SupabaseClient; // For the main RPC call
  const requestIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'); // Get IP for logging
  const userAgent = req.headers.get('user-agent');

  try {
    // Create a client for logging the calling user, if auth header is present
    const authHeader = req.headers.get('Authorization');
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
        // Non-critical, proceed with anonymous logging if user fetch fails
      }
    } else {
      // If no auth header, loggingSupabaseClient remains undefined, logging will use a new anon client if needed.
      console.warn("[get-theme-settings] No Authorization header found. Call will be logged anonymously if possible.");
    }
    
    // Client for the main RPC call. Uses authHeader if present, otherwise anon key for the RPC call.
    // This aligns with the original logic where the client for RPC was built using the request's Authorization header.
    rpcSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader || '' }, // Pass auth header if present
        },
      }
    );

    const { data, error: rpcError } = await rpcSupabaseClient.rpc(
      'get_theme_settings',
    );

    let settingsToReturn = data;
    let usedDefaults = false;
    let logData: Record<string, unknown> = { requestIp, userAgent }; // Base log data

    if (rpcError) {
      console.error('[get-theme-settings] RPC error, falling back to defaults:', rpcError);
      logData = { ...logData, success: false, rpc_error_message: rpcError.message, rpc_error_code: rpcError.code, details: 'RPC call to get_theme_settings failed, using defaults.' };
      // Fall through to use default settings
    }

    if (!settingsToReturn || (Array.isArray(settingsToReturn) && settingsToReturn.length === 0) || rpcError) {
      usedDefaults = true;
      settingsToReturn = [
        { role: 'admin', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
        { role: 'paid', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
        { role: 'free', available_themes: ['custom-dark'], default_theme: 'custom-dark' }
      ];
      // Update logData if defaults are used due to no data (and no prior RPC error logged this way)
      if (!rpcError) {
        logData = { ...logData, success: true, used_default_settings: true, details: 'No theme settings from RPC, returned default set.' };
      } else {
        // If rpcError was already set, logData already reflects the failure but marks that defaults were used.
        logData.used_default_settings = true; 
      }
    } else {
      // Successfully got settings from RPC
      logData = { ...logData, success: true, used_default_settings: false, settings_count: settingsToReturn?.length };
    }

    // Perform the log operation
    const clientForLogging = loggingSupabaseClient || createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    try {
      await clientForLogging.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: logData,
      });
    } catch (dbLogError) {
      console.error('[get-theme-settings] FAILED TO LOG TO user_api_logs:', dbLogError);
    }

    return new Response(
      JSON.stringify(settingsToReturn),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: rpcError ? 500 : 200, // Return 500 if RPC error caused fallback to defaults
      }
    );
  } catch (error: unknown) {
    // This main catch block handles errors like createClient failing or unexpected issues.
    console.error('Error fetching theme settings (main catch block):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching theme settings';
    
    const clientForErrorLogging = loggingSupabaseClient || rpcSupabaseClient || createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    try {
      await clientForErrorLogging.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: { success: false, error: 'General error in function', rawErrorMessage: errorMessage, requestIp, userAgent },
      });
    } catch (dbLogError) {
      console.error('[get-theme-settings] FAILED TO LOG TO user_api_logs (main catch):', dbLogError);
    }

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