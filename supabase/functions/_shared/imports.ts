/**
 * @fileoverview Central import helper for Supabase Edge Functions.
 * 
 * This file exports all shared modules and utilities to standardize imports
 * across all Edge Functions and prevent path-related deployment issues.
 * 
 * Usage example in an Edge Function:
 *   import { corsHeaders, supabaseAdmin } from "./imports.ts";
 */

// Import shared modules first so they're available for use within this file
import { corsHeaders } from "./cors.ts";
import { supabaseAdmin } from "./supabaseAdmin.ts";

// Re-export shared modules
export { corsHeaders, supabaseAdmin };

// Standard library imports that are commonly used
export { serve } from "https://deno.land/std@0.168.0/http/server.ts";
export { 
  createClient, 
  type SupabaseClient 
} from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Helper function to create a standardized error response
 */
export function createErrorResponse(
  message: string, 
  status: number = 500, 
  details?: unknown
) {
  return new Response(JSON.stringify({ 
    error: message, 
    details: details || null 
  }), {
    status,
    headers: { 
      ...corsHeaders, 
      "Content-Type": "application/json"
    },
  });
}

/**
 * Helper function to create a standardized success response
 */
export function createSuccessResponse(data: unknown, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      ...corsHeaders, 
      "Content-Type": "application/json"
    },
  });
} 