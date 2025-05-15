/**
 * @fileoverview Supabase Edge Function to update theme settings for different user roles.
 * This function is restricted to admin users. It accepts an array of theme settings,
 * validates them, and then calls a Supabase RPC function `update_theme_settings` for each role.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.41.0'; // Added SupabaseClient for typing

/**
 * CORS headers for the function response.
 * Allows requests from any origin and specifies allowed headers and methods.
 * @constant
 * @type {Record<string, string>}
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Interface for a single theme setting configuration.
 * @interface ThemeSetting
 * @property {string} role - The user role (e.g., 'admin', 'paid', 'free').
 * @property {string[]} available_themes - An array of theme names available to this role.
 * @property {string} default_theme - The default theme for this role.
 */
interface ThemeSetting {
  role: string;
  available_themes: string[];
  default_theme: string;
}

/**
 * Interface for the request body of the update-theme-settings function.
 * @interface UpdateThemeSettingsRequest
 * @property {ThemeSetting[]} settings - An array of theme settings to be applied.
 */
interface UpdateThemeSettingsRequest {
  settings: ThemeSetting[];
}

/**
 * Main Deno server function that handles incoming HTTP requests to update theme settings.
 * - Handles CORS preflight requests and only allows POST method.
 * - Authenticates the user and verifies if they are an admin.
 * - Parses the request body for an array of `ThemeSetting` objects.
 * - Validates each theme setting, ensuring structure and that the default theme is in available themes.
 * - Calls the `update_theme_settings` RPC function in Supabase for each role's settings.
 * - Returns a success message or an error response with appropriate status codes.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
serve(async (req) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Only POST requests allowed
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Only POST requests are allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Create a Supabase client with the Authorization header
    const supabaseClient: SupabaseClient = createClient( // Typed the client
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Check if the user is an admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only administrators can update theme settings' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const requestData: UpdateThemeSettingsRequest = await req.json();
    
    if (!requestData.settings || !Array.isArray(requestData.settings)) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: settings array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each setting
    for (const setting of requestData.settings) {
      if (!setting.role || !Array.isArray(setting.available_themes) || !setting.default_theme) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid setting format', 
            details: 'Each setting must include role, available_themes array, and default_theme' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if default theme is in available themes
      if (!setting.available_themes.includes(setting.default_theme)) {
        return new Response(
          JSON.stringify({ 
            error: `Default theme (${setting.default_theme}) must be in the list of available themes for role ${setting.role}` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update settings for each role
    for (const setting of requestData.settings) {
      const { error: updateError } = await supabaseClient.rpc('update_theme_settings', {
        p_role: setting.role,
        p_available_themes: setting.available_themes,
        p_default_theme: setting.default_theme
      });

      if (updateError) {
        console.error('Error updating theme settings:', updateError);
        return new Response(
          JSON.stringify({ error: `Could not update settings for role ${setting.role}`, details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // All successful
    return new Response(
      JSON.stringify({ success: true, message: 'Theme settings updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    console.error('Error in update-theme-settings function:', err);
    
    return new Response(
      JSON.stringify({ 
        error: 'A server error occurred', 
        details: err instanceof Error ? err.message : String(err) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 