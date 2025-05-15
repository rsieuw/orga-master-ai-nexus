/**
 * @fileoverview Supabase Edge Function to retrieve theme settings for different user roles.
 * This function calls a Supabase RPC function `get_theme_settings` to fetch the settings.
 * If the RPC function fails or returns no data (e.g., the settings table doesn't exist),
 * it returns a default set of theme settings.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.41.0';

/**
 * CORS headers for the function response.
 * Allows requests from any origin and specifies allowed headers and methods.
 * @constant
 * @type {Record<string, string>}
 */
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
serve(async (req) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Create a Supabase client with the ANON key (we only need read access)
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Haal de thema-instellingen op met een SQL query die compatibel is met elke versie
    // Dit werkt ook als de thema-instellingen tabel nog niet bestaat
    const { data, error } = await supabaseClient.rpc(
      'get_theme_settings',
    );

    if (error) {
      throw error;
    }

    // Als er geen data is (tabel bestaat niet), geef standaard waardes terug
    if (!data || !data.length) {
      return new Response(
        JSON.stringify([
          { role: 'admin', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
          { role: 'paid', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
          { role: 'free', available_themes: ['custom-dark'], default_theme: 'custom-dark' }
        ]),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Geef de geformatteerde data terug
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    // Geef een standaard response terug bij fouten
    console.error('Error fetching theme settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching theme settings';
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        defaultSettings: [
          { role: 'admin', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
          { role: 'paid', available_themes: ['light', 'dark', 'custom-dark'], default_theme: 'custom-dark' },
          { role: 'free', available_themes: ['custom-dark'], default_theme: 'custom-dark' }
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 