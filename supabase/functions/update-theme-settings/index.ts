/**
 * @fileoverview Supabase Edge Function to update theme settings for different user roles.
 * This function is restricted to admin users. It accepts an array of theme settings,
 * validates them, and then calls a Supabase RPC function `update_theme_settings` for each role.
 */

import { serve, supabaseAdmin, corsHeaders, createClient as esmCreateClient, createSuccessResponse, createErrorResponse } from "../_shared/imports.ts";
// Verwijder Zod import als niet gebruikt
// import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

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

// Define the schema for a single theme setting update
// const themeSettingSchema = {
//   type: "object",
//   properties: {
//     role: { type: "string" },
//     available_themes: { type: "array", items: { type: "string" } },
//     default_theme: { type: "string" },
//   },
//   required: ["role", "available_themes", "default_theme"],
// };

// Define the schema for the overall request body
// const updateRequestSchema = {
//   type: "object",
//   properties: {
//     settings: {
//       type: "array",
//       items: themeSettingSchema,
//     },
//   },
//   required: ["settings"],
// };

console.log("Function update-theme-settings loading...");

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
serve(async (req: Request) => {
  console.log("Function update-theme-settings called");
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
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

  // Create a Supabase client with the Auth context of the caller
  // Gebruik esmCreateClient hier direct of hernoem de import
  const supabaseUserClient = esmCreateClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    }
  );

  // Get the user ID from the JWT
  const { data: { user } } = await supabaseUserClient.auth.getUser();
  const userId = user?.id;

  // Admin client for logging, using service_role if available
  let supabaseAdminClient: typeof supabaseAdmin | null = null;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (supabaseServiceRoleKey) {
    // Gebruik esmCreateClient hier direct of hernoem de import
    supabaseAdminClient = esmCreateClient(
      Deno.env.get('SUPABASE_URL')!,
      supabaseServiceRoleKey
    );
  } else {
    console.warn("[update-theme-settings] SUPABASE_SERVICE_ROLE_KEY not set. Operations requiring admin rights might fail if RLS is restrictive for authenticated user.");
    // Fallback to user's client for admin operations if service role key is not available,
    // RLS must permit this. For this specific function, we strictly check admin role later.
    // supabaseAdminClient = supabaseUserClient; // This could be problematic if RLS expects service_role
  }
  
  // Use supabaseAdmin from imports if service key is not set, or the specific admin client if it is.
  // This function should primarily use supabaseAdmin for database operations after role check.
  const dbAdminClient = supabaseAdminClient || supabaseAdmin;

  try {
    // Authenticate and authorize: Only admins can update theme settings
    if (!userId) {
      return createErrorResponse('User not authenticated', 401);
    }

    const { data: userProfile, error: profileError } = await dbAdminClient // Use dbAdminClient for profile check
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      console.warn(`[update-theme-settings] Unauthorized attempt by user ${userId} with role ${userProfile?.role}`);
      // Log unauthorized attempt to user_api_logs
      /*
      await loggingClient.from('user_api_logs').insert({
        user_id: userId,
        function_name: 'update-theme-settings',
        metadata: { success: false, error: 'Unauthorized: Admin access required' },
      });
      */
      return createErrorResponse('Forbidden: Admin access required', 403);
    }

    // Validate request body
    const requestData: UpdateThemeSettingsRequest = await req.json();

    // Basic validation (Zod or similar could be used for more complex validation)
    if (!requestData.settings || !Array.isArray(requestData.settings) || requestData.settings.length === 0) {
       // Log invalid request to user_api_logs
      /*
      await loggingClient.from('user_api_logs').insert({
        user_id: userId,
        function_name: 'update-theme-settings',
        metadata: { success: false, error: 'Invalid request body', details: validationError.errors }
      });
      */
      return createErrorResponse('Invalid request body: settings array is required and cannot be empty', 400);
    }

    for (const setting of requestData.settings) {
      if (!setting.role || !Array.isArray(setting.available_themes) || !setting.default_theme || setting.available_themes.length === 0) {
        return createErrorResponse(`Invalid setting format for role "${setting.role}". Ensure role, available_themes (non-empty array), and default_theme are provided.`, 400);
      }
      if (!setting.available_themes.includes(setting.default_theme)) {
        return createErrorResponse(`Default theme "${setting.default_theme}" must be in available_themes for role "${setting.role}".`, 400);
      }
    }
    const validatedSettings = requestData.settings;

    // Update each setting
    const results = [];
    for (const setting of validatedSettings) {
      // Use the RPC function to update settings
      const { data, error: rpcError } = await dbAdminClient.rpc('update_theme_settings', {
        p_role: setting.role,
        p_available_themes: setting.available_themes,
        p_default_theme: setting.default_theme,
      });

      if (rpcError) {
        console.error(`[update-theme-settings] Error updating theme settings for role ${setting.role}:`, rpcError);
        return createErrorResponse(`Could not update settings for role ${setting.role}: ${rpcError.message}`, 500);
      }
      results.push({ role: setting.role, success: true, resultData: data });
    }
    
    // Log successful updates to user_api_logs
    /*
    await loggingClient.from('user_api_logs').insert({
      user_id: userId,
      function_name: 'update-theme-settings',
      metadata: { success: true, updated_settings: validatedSettings }
    });
    */

    return createSuccessResponse({ message: 'Theme settings updated successfully', updated_settings: results });

  } catch (error) { // Verander 'err' naar 'error' als dat de bedoeling was
    console.error("[update-theme-settings] Error in update-theme-settings:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    // const userIdFromError = userId; // userId is al beschikbaar in deze scope

    // Log error to user_api_logs if we have the client and user ID
    if (dbAdminClient && userId) { // Gebruik dbAdminClient
      /*
      await loggingClient.from('user_api_logs').insert({
        user_id: userId, 
        function_name: 'update-theme-settings',
        metadata: { success: false, error: 'General error in update-theme-settings', rawErrorMessage: errorMessage }
      });
      */
    } else if (dbAdminClient) { // Gebruik dbAdminClient
      // Fallback logging if userId couldn't be determined from error
      /*
      await loggingClient.from('user_api_logs').insert({
        user_id: null, // Explicitly null if not determinable
        function_name: 'update-theme-settings',
        metadata: { success: false, error: 'General error in update-theme-settings (userId undetermined)', rawErrorMessage: errorMessage }
      });
      */
    }
    return createErrorResponse(errorMessage, 500);
  }
}); 