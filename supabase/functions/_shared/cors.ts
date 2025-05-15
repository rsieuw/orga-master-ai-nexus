/**
 * @fileoverview Defines common CORS headers for Supabase Edge Functions.
 * These headers are used to control cross-origin resource sharing.
 */

/**
 * Standard CORS headers for Supabase Edge Functions.
 * Allows requests from any origin and specifies allowed headers.
 * For production, it's recommended to restrict 'Access-Control-Allow-Origin' to specific domains.
 * @constant
 * @type {Record<string, string>}
 */
// Standard CORS headers for Supabase Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from any origin (adjust for production)
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}; 