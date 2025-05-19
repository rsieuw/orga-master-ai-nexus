import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { UserProfile } from '@/types/auth.ts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { GradientLoader } from '@/components/ui/loader.tsx';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge.tsx';
import { Database } from '@/integrations/supabase/database.types.ts';
import PopularFunctionsChart from '@/components/admin/api-usage/PopularFunctionsChart.tsx';
import CostDistributionChart from '@/components/admin/api-usage/CostDistributionChart.tsx';
import TokenUsageByFunctionChart from '@/components/admin/api-usage/TokenUsageByFunctionChart.tsx';
import { Tooltip } from '@/components/ui/tooltip.tsx';
import AvgResponseTimeChart, { AggregatedExternalServiceUsage } from '@/components/admin/api-usage/AvgResponseTimeChart.tsx';

export type ExternalApiUsageLog = Database['public']['Tables']['external_api_usage_logs']['Row'];

/**
 * @interface LogMetadata
 * @description Defines the structure for metadata associated with an API log entry.
 * This can include success status, error messages, or the AI model used.
 */
interface LogMetadata {
  /** Indicates if the API call was successful. */
  success?: boolean;
  /** Contains an error message if the API call failed. */
  error?: string;
  /** Specifies the AI model used, if applicable. */
  model?: string;
}

/**
 * @interface ExternalApiLogDisplayEntry
 * @description Represents a fully processed log entry for external API usage, ready for display.
 * It combines raw log data with user profile information.
 */
export interface ExternalApiLogDisplayEntry extends Omit<ExternalApiUsageLog, 'cost'> {
  /** The email of the user. */
  user_email?: string | null;
  /** The name of the user. */
  user_name?: string | null;
  /** Derived from metadata, indicating if the call was successful. */
  success?: boolean;
  /** The cost, potentially formatted for display. */
  cost?: string | null;
}

/**
 * AdminExternalApiUsagePage component.
 * @description Displays a table of external API usage logs.
 * Fetches data from the `external_api_usage_logs` table and user profiles.
 * Shows details like which user/function called which external service, token usage, cost, and status.
 * @returns {React.FC} The AdminExternalApiUsagePage component.
 */
const AdminExternalApiUsagePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [externalApiLogs, setExternalApiLogs] = useState<ExternalApiLogDisplayEntry[]>([]);
  const [aggregatedExternalLogs, setAggregatedExternalLogs] = useState<AggregatedExternalServiceUsage[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersFetched, setUsersFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const currentLocale = i18n.language === 'nl' ? nl : enUS;

  /**
   * @function fetchUsers
   * @description Fetches all user profiles to map user IDs to names and emails for the log display.
   * Uses the 'get-all-users' Edge Function.
   */
  const fetchUsers = useCallback(async () => {
    try {
      const { data: allUsersData, error: allUsersError } = await supabase.functions.invoke<UserProfile[]>('get-all-users');
      if (allUsersError) throw allUsersError;
      if (allUsersData) {
        setUsers(allUsersData);
        setUsersFetched(true);
      }
    } catch (err) {
      console.error("Error fetching users for API log mapping:", err);
      toast({
        variant: "destructive",
        title: t('adminExternalApiUsagePage.toastTitles.fetchUsersError'),
        description: err instanceof Error ? err.message : t('adminExternalApiUsagePage.errors.unknownError'),
      });
      setUsersFetched(true);
    }
  }, [t, toast]);

  /**
   * @function fetchExternalApiLogs
   * @description Fetches external API usage logs from the `external_api_usage_logs` table.
   * It then maps this data with fetched user profiles to create displayable entries.
   * It only proceeds if user data has been fetched (or attempted).
   */
  const fetchExternalApiLogs = useCallback(async () => {
    if (!usersFetched) return;

    setIsLoading(true);
    setError(null);
    setExternalApiLogs([]);
    setAggregatedExternalLogs([]);

    try {
      const { data: usageStatsData, error: usageStatsError } = await supabase.functions.invoke(
        'get-api-usage-stats',
        { body: { limit: 1000 } }
      );
      console.log('Response from get-api-usage-stats (External Page):', JSON.stringify(usageStatsData, null, 2));

      if (usageStatsError) throw usageStatsError;

      if (usageStatsData) {
        const rawLogs: ExternalApiUsageLog[] = usageStatsData.externalApiUsage || [];
        const aggregatedLogsData: AggregatedExternalServiceUsage[] = usageStatsData.aggregatedExternalUsage || [];
        
        let currentError: string | null = null;

        if (rawLogs.length === 0) {
          currentError = 'NO_RAW_DATA';
        } else {
          const mappedRawLogs = rawLogs.map(log => {
            const user = users.find(u => u.id === log.user_id);
            const metadata = log.metadata as LogMetadata | null;
            const success = typeof metadata?.success === 'boolean' ? metadata.success : undefined;
            const costNumber = log.cost;
            const costString = typeof costNumber === 'number' ? costNumber.toFixed(6) : null;
            
            return {
              ...log,
              user_email: user?.email || (log.user_id ? 'User ID: ' + log.user_id : 'N/A'),
              user_name: user?.name || 'Unknown User',
              success: success,
              cost: costString,
            };
          });
          setExternalApiLogs(mappedRawLogs as ExternalApiLogDisplayEntry[]);
        }

        if (aggregatedLogsData.length === 0) {
          currentError = currentError ? `${currentError}_AND_NO_AGGREGATION_DATA` : 'NO_AGGREGATION_DATA';
        } else {
          setAggregatedExternalLogs(aggregatedLogsData);
        }
        
        setError(currentError);

      } else {
        setError('ERROR:No data object received from API');
      }
    } catch (err: unknown) {
      console.error("Error fetching external API logs:", err);
      const message = err instanceof Error ? err.message : t('adminExternalApiUsagePage.errors.fetchLogsError');
      setError(`ERROR:${message}`);
      toast({
        variant: "destructive",
        title: t('adminExternalApiUsagePage.toastTitles.fetchError'),
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast, users, usersFetched]);

  useEffect(() => {
    if (!usersFetched) {
      fetchUsers();
    }
  }, [fetchUsers, usersFetched]);

  useEffect(() => {
    if (usersFetched) {
      fetchExternalApiLogs();
    }
  }, [usersFetched, fetchExternalApiLogs]);

  // Transformations for chart data
  const popularFunctionsChartInput = aggregatedExternalLogs.flatMap((aggLog) =>
    Array(aggLog.total_calls ?? 0)
      .fill(null)
      .map(() => ({
        service_name: aggLog.service_name,
        // function_name is not available in AggregatedExternalServiceUsage, chart handles its absence for external type
      }))
  );

  // const costDistributionChartInput = aggregatedExternalLogs.map((log) => ({
  //   service_name: log.service_name,
  //   total_cost: log.total_cost,
  // }));

  // const tokenUsageByFunctionChartInput = aggregatedExternalLogs.map((log) => ({
  //   service_name: log.service_name,
  //   total_tokens_prompt: log.total_tokens_prompt,
  //   total_tokens_completion: log.total_tokens_completion,
  //   total_tokens_total: log.total_tokens_total,
  // }));

  return (
    <div className="">
      <h1 className="text-2xl font-semibold mb-6">{t('adminExternalApiUsagePage.title')}</h1>
      
      {/* API Logs Table Section */}
      <h2 className="text-xl font-semibold mb-4">{t('adminExternalApiUsagePage.logsTableTitle')}</h2>
      {(isLoading && externalApiLogs.length === 0) && <p className="text-sm text-muted-foreground">{t('adminExternalApiUsagePage.loadingLogs')}</p>}
      
      {(!isLoading && error && externalApiLogs.length === 0 && aggregatedExternalLogs.length === 0) && (
         <>
          {error.includes('NO_RAW_DATA') && (
            <div className="text-amber-500 p-4 bg-amber-50 rounded-md border border-amber-200 mb-4">
              <h3 className="font-semibold mb-1">{t('adminExternalApiUsagePage.noRawDataAvailable')}</h3>
              <p className="text-sm">{t('adminExternalApiUsagePage.noRawDataDescription')}</p>
            </div>
          )}
          {error.includes('NO_AGGREGATION_DATA') && (
            <div className="text-orange-500 p-4 bg-orange-50 rounded-md border border-orange-200 mb-4">
              <h3 className="font-semibold mb-1">{t('adminExternalApiUsagePage.noAggregationDataAvailable')}</h3>
              <p className="text-sm">{t('adminExternalApiUsagePage.noAggregationDataDescription')}</p>
            </div>
          )}
          {error.startsWith('ERROR:') && (
            <div className="text-red-500 p-4 bg-red-50 rounded-md border border-red-200 mb-4">
              <h3 className="font-semibold mb-1">{t('adminExternalApiUsagePage.errorLoadingLogs')}</h3>
              <p className="text-sm">{error.substring(6)}</p>
              <button 
                onClick={() => fetchExternalApiLogs()} 
                className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
              >
                {t('common.retry')}
              </button>
            </div>
          )}
        </>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('adminExternalApiUsagePage.tableHeaders.timestamp')}</TableHead>
            <TableHead>{t('adminExternalApiUsagePage.tableHeaders.user')}</TableHead>
            <TableHead>{t('adminExternalApiUsagePage.tableHeaders.service')}</TableHead>
            <TableHead>{t('adminExternalApiUsagePage.tableHeaders.function')}</TableHead>
            <TableHead className="text-right">{t('adminExternalApiUsagePage.tableHeaders.promptTokens')}</TableHead>
            <TableHead className="text-right">{t('adminExternalApiUsagePage.tableHeaders.completionTokens')}</TableHead>
            <TableHead className="text-right">{t('adminExternalApiUsagePage.tableHeaders.totalTokens')}</TableHead>
            <TableHead className="text-right">{t('adminExternalApiUsagePage.tableHeaders.cost')}</TableHead>
            <TableHead>{t('adminExternalApiUsagePage.tableHeaders.status')}</TableHead>
            <TableHead>{t('adminExternalApiUsagePage.tableHeaders.details')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {externalApiLogs.length === 0 && !isLoading && !error ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center">{t('adminExternalApiUsagePage.noLogs')}</TableCell>
            </TableRow>
          ) : (
            externalApiLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{format(new Date(log.called_at), 'Pp', { locale: currentLocale })}</TableCell>
                <TableCell>
                  <div>{log.user_name}</div>
                  <div className="text-xs text-muted-foreground">{log.user_email}</div>
                </TableCell>
                <TableCell>{log.service_name}</TableCell>
                <TableCell>{log.function_name}</TableCell>
                <TableCell className="text-right">{log.tokens_prompt ?? '-'}</TableCell>
                <TableCell className="text-right">{log.tokens_completion ?? '-'}</TableCell>
                <TableCell className="text-right">{log.tokens_total ?? '-'}</TableCell>
                <TableCell className="text-right">{log.cost ? `$${log.cost}` : '-'}</TableCell>
                <TableCell>
                  {typeof log.success === 'boolean' ? (
                    <Badge variant={log.success ? 'default' : 'destructive'}>
                      {log.success ? t('adminExternalApiUsagePage.status.success') : t('adminExternalApiUsagePage.status.failed')}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{t('adminExternalApiUsagePage.status.unknown')}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {log.metadata && (log.metadata as LogMetadata).error ? (
                    <Tooltip>
                        <span className="text-xs text-destructive underline cursor-pointer">{t('adminExternalApiUsagePage.viewError')}</span>
                        <div className="max-w-xs break-words text-xs p-2 bg-popover text-popover-foreground shadow-md rounded-md">
                            {(log.metadata as LogMetadata).error}
                        </div>
                    </Tooltip>
                    
                  ) : log.metadata && (log.metadata as LogMetadata).model ? (
                    <span className="text-xs">Model: {(log.metadata as LogMetadata).model}</span>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 mb-8">
        {/* Popular External Functions/Services Chart Section */}
        <div className="lg:col-span-1">
          {isLoading && aggregatedExternalLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><GradientLoader /></div>
          ) : error && aggregatedExternalLogs.length === 0 && !error.startsWith('ERROR:') && !error.includes('NO_RAW_DATA') ? (
            <PopularFunctionsChart logs={popularFunctionsChartInput} logType="external" />
          ) : error && aggregatedExternalLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground p-4 text-center">
                {t('charts.errorLoadingChartData')}
                 {error.startsWith('ERROR:') && `: ${error.substring(6)}`}
                 {error.includes('NO_AGGREGATION_DATA') && `: ${t('adminExternalApiUsagePage.noAggregationDataForChart')}`}
            </div>
          ) : aggregatedExternalLogs.length > 0 ? (
            <PopularFunctionsChart logs={popularFunctionsChartInput} logType="external" />
          ) : (
            <div className="h-[300px] flex items-center justify-center p-4 text-center text-muted-foreground">
              {t('charts.noPopularFunctionsData')} 
            </div>
          )}
        </div>

        {/* Token Usage Chart Section */}
        <div className="lg:col-span-1">
          {isLoading && aggregatedExternalLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><GradientLoader /></div>
          ) : error && aggregatedExternalLogs.length === 0 && !error.startsWith('ERROR:') && !error.includes('NO_RAW_DATA')? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
             <TokenUsageByFunctionChart logs={aggregatedExternalLogs as any} />
          ) : error && aggregatedExternalLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground p-4 text-center">
                {t('charts.errorLoadingChartData')}
                 {error.startsWith('ERROR:') && `: ${error.substring(6)}`}
                 {error.includes('NO_AGGREGATION_DATA') && `: ${t('adminExternalApiUsagePage.noAggregationDataForChart')}`}
            </div>
          ) : aggregatedExternalLogs.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <TokenUsageByFunctionChart logs={aggregatedExternalLogs as any} />
          ) : (
            <div className="h-[300px] flex items-center justify-center p-4 text-center text-muted-foreground">
              {t('charts.noTokenDataForChart')}
            </div>
          )}
        </div>

        {/* Cost Distribution Chart Section */}
        <div className="lg:col-span-1">
          {isLoading && aggregatedExternalLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><GradientLoader /></div>
          ) : error && aggregatedExternalLogs.length === 0 && !error.startsWith('ERROR:') && !error.includes('NO_RAW_DATA')? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
             <CostDistributionChart logs={aggregatedExternalLogs as any} />
          ) : error && aggregatedExternalLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground p-4 text-center">
                {t('charts.errorLoadingChartData')}
                 {error.startsWith('ERROR:') && `: ${error.substring(6)}`}
                 {error.includes('NO_AGGREGATION_DATA') && `: ${t('adminExternalApiUsagePage.noAggregationDataForChart')}`}
            </div>
          ) : aggregatedExternalLogs.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <CostDistributionChart logs={aggregatedExternalLogs as any} />
          ) : (
            <div className="h-[300px] flex items-center justify-center p-4 text-center text-muted-foreground">
              {t('charts.noCostDataForChart')}
            </div>
          )}
        </div>

        {/* Average Response Time Chart */}
         <div className="lg:col-span-1">
          {isLoading && aggregatedExternalLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><GradientLoader /></div>
          ) : error && aggregatedExternalLogs.length === 0 && !error.startsWith('ERROR:') && !error.includes('NO_RAW_DATA')? (
             <AvgResponseTimeChart data={aggregatedExternalLogs} />
          ) : error && aggregatedExternalLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground p-4 text-center">
                 {t('charts.errorLoadingChartData')}
                 {error.startsWith('ERROR:') && `: ${error.substring(6)}`}
                 {error.includes('NO_AGGREGATION_DATA') && `: ${t('adminExternalApiUsagePage.noAggregationDataForChart')}`}
            </div>
          ) : aggregatedExternalLogs.length > 0 ? (
            <AvgResponseTimeChart data={aggregatedExternalLogs} />
          ) : (
            <div className="h-[300px] flex items-center justify-center p-4 text-center text-muted-foreground">
              {t('charts.noAvgResponseTimeData')}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminExternalApiUsagePage; 