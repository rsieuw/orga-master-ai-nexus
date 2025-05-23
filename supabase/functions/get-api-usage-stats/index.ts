import { 
  serve, 
  createClient, 
  type SupabaseClient, 
  corsHeaders, 
  supabaseAdmin,
  createSuccessResponse,
  createErrorResponse
} from "../_shared/imports.ts";

/**
 * FORCE REDEPLOY WITH IMPROVED IMPORTS - TIMESTAMP: 2024-09-21
 * @interface RequestPayload
 * @description Defines the expected request body structure for filtering API usage stats.
 * @property {string} [startDate] - ISO 8601 date string for the start of the filter period.
 * @property {string} [endDate] - ISO 8601 date string for the end of the filter period.
 * @property {string} [userId] - Filter stats by a specific user ID.
 * @property {string} [functionName] - Filter stats by a specific function name (for internal API calls).
 * @property {string} [serviceName] - Filter stats by a specific service name (for external API calls).
 * @property {Array<'user' | 'function' | 'service' | 'day' | 'week' | 'month'>} [groupBy] - Fields to group the results by (implementation pending).
 * @property {number} [limit] - The maximum number of items to return per page.
 * @property {number} [page] - The page number for pagination.
 */
interface RequestPayload {
  startDate?: string; // ISO 8601 date string
  endDate?: string;   // ISO 8601 date string
  userId?: string;
  functionName?: string;
  serviceName?: string; // For external APIs
  groupBy?: Array<'user' | 'function' | 'service' | 'day' | 'week' | 'month'>;
  limit?: number;
  page?: number;
}

/**
 * @interface AggregatedInternalApiUsage
 * @description Defines the structure for aggregated internal API usage.
 */
interface AggregatedInternalApiUsage {
  user_id: string | null;
  function_name: string | null;
  call_count: number;
  last_called_at: string | null;
  // Potentieel: user_email en user_name kunnen hier later worden toegevoegd na join in frontend
}

/**
 * @interface UsageStatsResponse
 * @description Defines the structure of the response for the API usage statistics.
 * @property {unknown[]} [internalApiUsage] - Array of internal API usage logs. Structure depends on aggregation (to be defined).
 * @property {unknown[]} [externalApiUsage] - Array of external API usage logs. Structure depends on aggregation (to be defined).
 * @property {object} [summary] - Summary of API usage.
 * @property {number} summary.totalInternalCalls - Total number of internal API calls.
 * @property {number} summary.totalExternalCalls - Total number of external API calls.
 * @property {number} [summary.totalTokensUsed] - Optional: Total tokens used, if aggregated.
 * @property {number} [summary.errorCountInternal] - Optional: Count of errors for internal API calls.
 * @property {number} [summary.errorCountExternal] - Optional: Count of errors for external API calls.
 * @property {object} [pagination] - Pagination information, if applicable.
 * @property {number} pagination.currentPage - The current page number.
 * @property {number} pagination.totalPages - The total number of pages.
 * @property {number} pagination.totalItems - The total number of items across all pages.
 */
interface UsageStatsResponse {
  internalApiUsage?: unknown[]; // To be defined based on aggregations
  externalApiUsage?: unknown[]; // To be defined based on aggregations
  aggregatedInternalUsage?: AggregatedInternalApiUsage[]; // Nieuw veld
  aggregatedExternalUsage?: AggregatedExternalServiceUsage[]; // New property for aggregated data
  summary?: {
    totalInternalCalls: number;
    totalExternalCalls: number;
    totalTokensUsed?: number; // Optional, if we aggregate this
    errorCountInternal?: number;
    errorCountExternal?: number;
  };
  // Pagination info if applicable
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

/**
 * @interface AggregatedExternalServiceUsage
 * @description Defines the structure for aggregated external service usage, including average response time.
 */
interface AggregatedExternalServiceUsage {
  service_name: string;
  total_calls: number;
  avg_response_time_ms: number | null;
  total_tokens_prompt?: number;
  total_tokens_completion?: number;
  total_tokens_total?: number;
  total_cost?: number;
  // Add other aggregated metrics as needed
}

/**
 * @function serve
 * @description Handles incoming HTTP requests to retrieve API usage statistics.
 * This function performs authentication and authorization (admin check),
 * parses request payload for filters, fetches data from `user_api_logs`
 * and `external_api_usage_logs`, and returns the aggregated statistics.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
serve(async (req: Request) => {
  // Handle CORS preflight requests
  // Updated: 2024-05-16 forcing redeploy
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authentication and Authorization (Admin Check)
    const userClient: SupabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return createErrorResponse("Not authorized", 401);
    }

    // Check if the user has an admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      console.warn(`User ${user.id} with role ${profile?.role} attempted to access admin API stats.`);
      // Log unauthorized attempt
      return createErrorResponse("Forbidden: Admin access required", 403);
    }

    // 2. Parse Request Body for filters (optional)
    let payload: RequestPayload = {};
    if (req.method === "POST" && req.body) {
        try {
            payload = await req.json();
        } catch (e) {
            console.error("Error parsing request body:", e);
            return createErrorResponse("Invalid JSON in request body", 400);
        }
    }

    const {
        startDate: _startDate,
        endDate: _endDate,
        userId: filterUserId,
        functionName: filterFunctionName,
        serviceName: filterServiceName,
        // groupBy, // Implementation of groupBy is complex and will be added later
        limit = 25,
        page = 1
    } = payload;
    const offset = (page - 1) * limit;

    // DEBUG: Log incoming filters // RE-ENABLED
    console.log("[get-api-usage-stats] DEBUG: Incoming payload filters:", JSON.stringify(payload, null, 2));
    console.log("[get-api-usage-stats] DEBUG: Parsed filters - startDate:", _startDate, "endDate:", _endDate, "filterUserId:", filterUserId, "filterFunctionName:", filterFunctionName);

    // 3. Fetch data from user_api_logs (internal API usage) for TABLE DISPLAY
    let internalApiTableQuery = supabaseAdmin
      .from("user_api_logs")
      .select("*", { count: "exact" })
      .order("called_at", { ascending: false })
      .range(offset, offset + limit -1);

    // if (startDate) internalApiTableQuery = internalApiTableQuery.gte("timestamp", startDate); // Temporarily removed
    // if (endDate) internalApiTableQuery = internalApiTableQuery.lte("timestamp", endDate);     // Temporarily removed
    if (filterUserId) internalApiTableQuery = internalApiTableQuery.eq("user_id", filterUserId);
    if (filterFunctionName) internalApiTableQuery = internalApiTableQuery.eq("function_name", filterFunctionName);
    // Add more filters here if needed

    const { data: internalLogsForTable, error: internalTableError, count: internalCount } = await internalApiTableQuery;

    if (internalTableError) {
      console.error("Error fetching internal API logs for table:", internalTableError);
      throw internalTableError;
    }

    // NEW: 3.B Fetch and Aggregate data from user_api_logs for GRAPH/AGGREGATION
    // This query fetches all relevant logs for aggregation without pagination limits applied to the aggregation itself.
    // Filters for date/user/functionName could still be applied if needed for the aggregated view.
    let internalApiAggQuery = supabaseAdmin
        .from('user_api_logs')
        .select('user_id, function_name, called_at') // Select only necessary fields
        .order('called_at', { ascending: false }) // NEW: Explicitly order by called_at descending
        .limit(10000); // NEW: Explicitly set a high limit to fetch more/all logs for aggregation

    if (_startDate) internalApiAggQuery = internalApiAggQuery.gte("called_at", _startDate);
    if (_endDate) internalApiAggQuery = internalApiAggQuery.lte("called_at", _endDate);
    // Note: filterUserId and filterFunctionName are applied to the table logs,
    // For a general "top functions" graph, we might not want to filter by functionName here,
    // or make it a separate payload option. For now, let's keep it consistent with table filters.
    if (filterUserId) internalApiAggQuery = internalApiAggQuery.eq("user_id", filterUserId);
    if (filterFunctionName) internalApiAggQuery = internalApiAggQuery.eq("function_name", filterFunctionName);


    const { data: allInternalLogsForAgg, error: internalAggError } = await internalApiAggQuery;

    if (internalAggError) {
        console.error("Error fetching all internal API logs for aggregation:", internalAggError);
        throw internalAggError;
    }
    
    // DEBUG: Check for deep-research in allInternalLogsForAgg // RE-ENABLED
    if (allInternalLogsForAgg) {
        const deepResearchLogsRaw = allInternalLogsForAgg.filter(log => log.function_name === 'deep-research');
        console.log(`[get-api-usage-stats] DEBUG: Found ${deepResearchLogsRaw.length} 'deep-research' entries in allInternalLogsForAgg (total: ${allInternalLogsForAgg.length}).`);
    } else {
        console.log("[get-api-usage-stats] DEBUG: allInternalLogsForAgg is null or undefined.");
    }

    // Perform aggregation on allInternalLogsForAgg
    const aggregatedInternal: { [key: string]: AggregatedInternalApiUsage } = {};
    if (allInternalLogsForAgg) {
      for (const log of allInternalLogsForAgg) {
        const key = `${log.user_id || 'unknown'}-${log.function_name || 'unknown_function'}`; // Ensure function_name is part of key
        if (!aggregatedInternal[key]) {
          aggregatedInternal[key] = {
            user_id: log.user_id,
            function_name: log.function_name || 'unknown_function',
            call_count: 0,
            last_called_at: new Date(0).toISOString(), 
          };
        }
        aggregatedInternal[key].call_count++;
        if (log.called_at && new Date(log.called_at) > new Date(aggregatedInternal[key].last_called_at!)) {
          aggregatedInternal[key].last_called_at = log.called_at;
        }
      }
    }
    const aggregatedInternalUsage: AggregatedInternalApiUsage[] = Object.values(aggregatedInternal)
                                                                    .sort((a, b) => b.call_count - a.call_count); // Sort by call_count desc for "top"

    // DEBUG: Check for deep-research in the final aggregatedInternalUsage // RE-ENABLED
    if (aggregatedInternalUsage && aggregatedInternalUsage.length > 0) {
        const deepResearchEntryAggregated = aggregatedInternalUsage.find(item => item.function_name === 'deep-research');
        console.log("[get-api-usage-stats] DEBUG: 'deep-research' entry in final aggregatedInternalUsage:", JSON.stringify(deepResearchEntryAggregated, null, 2));
        console.log("[get-api-usage-stats] DEBUG: Final aggregatedInternalUsage (first 5 items):", JSON.stringify(aggregatedInternalUsage.slice(0,5), null, 2));
    } else {
        console.log("[get-api-usage-stats] DEBUG: aggregatedInternalUsage is empty or undefined after aggregation.");
    }

    // 4. Fetch data from external_api_usage_logs
    let externalApiQuery = supabaseAdmin
      .from("external_api_usage_logs")
      .select("*", { count: "exact" })
      .order("called_at", { ascending: false })
      .range(offset, offset + limit -1);

    // if (startDate) externalApiQuery = externalApiQuery.gte("timestamp", startDate); // Temporarily removed
    // if (endDate) externalApiQuery = externalApiQuery.lte("timestamp", endDate);     // Temporarily removed
    if (filterUserId) externalApiQuery = externalApiQuery.eq("user_id", filterUserId);
    if (filterServiceName) externalApiQuery = externalApiQuery.eq("service_name", filterServiceName);
    // Add more filters here

    const { data: externalLogs, error: externalError, count: externalCount } = await externalApiQuery;

    if (externalError) {
      console.error("Error fetching external API logs:", externalError);
      throw externalError;
    }

    // 6. Aggregate external API usage for average response times
    const aggregatedExternal: Record<string, {
        sum_response_time_ms: number;
        response_time_log_count: number; // Renamed from 'count' for clarity
        actual_total_calls: number; // New counter for all logs of a service
        total_tokens_prompt: number;
        total_tokens_completion: number;
        total_tokens_total: number;
        total_cost: number;
    }> = {};

    if (externalLogs) {
      for (const log of externalLogs) {
        const service = log.service_name || 'Unknown Service';
        if (!aggregatedExternal[service]) {
          aggregatedExternal[service] = {
            sum_response_time_ms: 0,
            response_time_log_count: 0,
            actual_total_calls: 0,
            total_tokens_prompt: 0,
            total_tokens_completion: 0,
            total_tokens_total: 0,
            total_cost: 0
          };
        }

        aggregatedExternal[service].actual_total_calls++; // Increment for every log entry for the service

        if (typeof log.response_time_ms === 'number') {
          aggregatedExternal[service].sum_response_time_ms += log.response_time_ms;
          aggregatedExternal[service].response_time_log_count++;
        }
        aggregatedExternal[service].total_tokens_prompt += (log.tokens_prompt || 0);
        aggregatedExternal[service].total_tokens_completion += (log.tokens_completion || 0);
        aggregatedExternal[service].total_tokens_total += (log.tokens_total || 0);
        aggregatedExternal[service].total_cost += (log.cost || 0); // Add cost aggregation
      }
    }

    const aggregatedExternalUsage: AggregatedExternalServiceUsage[] = Object.entries(aggregatedExternal).map(([serviceName, data]) => ({
      service_name: serviceName,
      total_calls: data.actual_total_calls, // Use actual_total_calls
      avg_response_time_ms: data.response_time_log_count > 0 ? data.sum_response_time_ms / data.response_time_log_count : null,
      total_tokens_prompt: data.total_tokens_prompt,
      total_tokens_completion: data.total_tokens_completion,
      total_tokens_total: data.total_tokens_total,
      total_cost: parseFloat(data.total_cost.toFixed(6)) // Ensure cost is a number with fixed precision
    }));

    const response: UsageStatsResponse = {
      internalApiUsage: internalLogsForTable || [], // Use the paginated logs for table display
      externalApiUsage: externalLogs || [],
      aggregatedInternalUsage: aggregatedInternalUsage, // Use the new aggregation
      aggregatedExternalUsage: aggregatedExternalUsage,
      summary: { 
        totalInternalCalls: internalCount || 0,
        totalExternalCalls: externalCount || 0,
        // Placeholder for more summary data
      },
      pagination: { // Basic pagination, depends on which dataset you are paginating
          currentPage: page,
          totalPages: Math.ceil((internalCount || 0) / limit), // Example for internal logs
          totalItems: internalCount || 0
      }
    };

    return createSuccessResponse(response);

  } catch (error: unknown) {
    console.error("Error in get-api-usage-stats:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return createErrorResponse("Internal Server Error", 500, errorMessage);
  }
}); 