import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { UserProfile } from '@/types/auth.ts'; // May be needed for user info
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
// import { Badge } from '@/components/ui/badge.tsx'; // Badge niet gebruikt, verwijderd
import { useToast } from '@/hooks/use-toast.ts';
import { GradientLoader } from '@/components/ui/loader.tsx';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import PopularFunctionsChart from '@/components/admin/api-usage/PopularFunctionsChart.tsx';
import TopUsersChart from '@/components/admin/api-usage/TopUsersChart.tsx';

// Type based on the response from get-api-usage-stats
interface AggregatedInternalApiUsage {
  user_id: string | null;
  function_name: string | null;
  call_count: number;
  last_called_at: string | null;
}

/**
 * @interface ApiLogEntry
 * @description Represents an entry for aggregated API log data to be displayed.
 * It combines data from the RPC call with user profile information.
 */
interface ApiLogEntry extends AggregatedInternalApiUsage {
  /** The email of the user. Mapped from user profiles. */
  email?: string; 
  /** The name of the user. Mapped from user profiles. */
  name?: string; 
}

/**
 * AdminApiUsagePage component.
 * @description Displays a table of aggregated internal API usage logs.
 * Fetches data from the `get-api-usage-stats` Supabase Edge Function
 * and user profile information to show which user called which function, how many times, and when last.
 * Also displays charts of popular functions and top users.
 * @returns {React.FC} The AdminApiUsagePage component.
 */
const AdminApiUsagePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]); // To map user email/name for display
  const [usersFetched, setUsersFetched] = useState(false); // Track if users were fetched
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const currentLocale = i18n.language === 'nl' ? nl : enUS;

  /**
   * @function fetchUsers
   * @description Fetches all user profiles to map user IDs to names and emails.
   * Uses the 'get-all-users' Edge Function.
   */
  const fetchUsers = useCallback(async () => {
    try {
      const { data: allUsersData, error: allUsersError } = await supabase.functions.invoke<UserProfile[]>('get-all-users');
      if (allUsersError) throw allUsersError;
      if (allUsersData) {
        setUsers(allUsersData);
        setUsersFetched(true); // Mark users as fetched
      }
    } catch (err) {
      console.error("Error fetching users for API log mapping:", err);
      toast({
        variant: 'destructive',
        title: t('adminApiUsagePage.toastTitles.fetchUsersError'),
        description: err instanceof Error ? err.message : t('adminApiUsagePage.errors.unknownError'),
      });
      setUsersFetched(true); // Mark as fetched even on error to prevent loops
    }
  }, [t, toast]);

  /**
   * @function fetchApiLogs
   * @description Fetches aggregated API logs using the 'get-api-usage-stats' Edge Function.
   * Maps the log data with user data to create displayable entries.
   * Only called after user data has been fetched.
   */
  const fetchApiLogs = useCallback(async () => {
    if (!usersFetched) return; // Haal logs pas op als gebruikers zijn (geprobeerd) opgehaald

    setIsLoading(true);
    setError(null);
    try {
      const { data: usageStatsData, error: usageStatsError } = await supabase.functions.invoke(
        'get-api-usage-stats',
        { body: { limit: 1000 } } // Hoge limit voor interne geaggregeerde data
      );
      console.log('Response from get-api-usage-stats:', JSON.stringify(usageStatsData, null, 2)); // DEBUG LOG

      if (usageStatsError) throw usageStatsError;

      if (usageStatsData && usageStatsData.aggregatedInternalUsage) {
        const apiLogsData = usageStatsData.aggregatedInternalUsage as AggregatedInternalApiUsage[];
        if (apiLogsData.length === 0) {
          // Geslaagd, maar geen data gevonden
          setApiLogs([]);
          // Zetten error op specifieke 'geen data' error type
          setError('NO_DATA'); 
        } else {
          const mappedLogs = apiLogsData.map((log) => {
            const user = users.find(u => u.id === log.user_id);
            return {
              ...log,
              email: user?.email || (log.user_id ? `ID: ${log.user_id}` : 'N/A'),
              name: user?.name || 'Unknown User',
              call_count: Number(log.call_count), 
            };
          });
          setApiLogs(mappedLogs);
          setError(null);
        }
      } else {
        // API geeft geen aggregatedInternalUsage terug
        setApiLogs([]);
        setError('NO_AGGREGATION');
      }

    } catch (err: unknown) {
      console.error("Error fetching API logs:", err);
      const message = err instanceof Error ? err.message : t('adminApiUsagePage.errors.fetchLogsError');
      setError(`ERROR:${message}`); // Prefix voor later identificeren van error type
      setApiLogs([]);
      toast({
        variant: 'destructive',
        title: t('adminApiUsagePage.toastTitles.fetchError'),
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t, users, usersFetched]);

  // Effect to fetch users once
  useEffect(() => {
    if (!usersFetched) {
        fetchUsers();
    }
  }, [fetchUsers, usersFetched]);

  // Effect to fetch logs after users have been fetched
  useEffect(() => {
    if (usersFetched) {
        fetchApiLogs();
    }
  }, [usersFetched, fetchApiLogs]);

  if (isLoading && apiLogs.length === 0 && users.length === 0) return <GradientLoader />; // Show loader only if nothing is loaded yet
  if (error && apiLogs.length === 0 && users.length === 0) return <div className="text-red-500 p-4">{error}</div>;

  // Filter and map logs for charts to ensure user_id is a string and satisfy chart prop types
  const chartApiLogs = apiLogs
    .filter(log => log.user_id !== null)
    .map(log => ({
      ...log,
      user_id: log.user_id as string, // Assert user_id as string after filtering
    }));

  return (
    <div className="">
      <h1 className="text-2xl font-semibold mb-6">{t('adminApiUsagePage.title')}</h1>

      {/* API Logs Table Section */}
      <h2 className="text-xl font-semibold mb-4">{t('adminApiUsagePage.logsTableTitle')}</h2>
      {(isLoading && apiLogs.length === 0) && <p className="text-sm text-muted-foreground">{t('adminApiUsagePage.loadingLogs')}</p>}
      {(!isLoading && error && apiLogs.length === 0) && (
        <>
          {error === 'NO_DATA' && (
            <div className="text-amber-500 p-4 bg-amber-50 rounded-md border border-amber-200">
              <h3 className="font-semibold mb-1">{t('adminApiUsagePage.noDataAvailable')}</h3>
              <p className="text-sm">{t('adminApiUsagePage.noDataDescription')}</p>
            </div>
          )}
          {error === 'NO_AGGREGATION' && (
            <div className="text-amber-600 p-4 bg-amber-50 rounded-md border border-amber-200">
              <h3 className="font-semibold mb-1">{t('adminApiUsagePage.noAggregationTitle')}</h3>
              <p className="text-sm">{t('adminApiUsagePage.noAggregationDescription')}</p>
            </div>
          )}
          {error.startsWith('ERROR:') && (
            <div className="text-red-500 p-4 bg-red-50 rounded-md border border-red-200">
              <h3 className="font-semibold mb-1">{t('adminApiUsagePage.errorLoadingLogs')}</h3>
              <p className="text-sm">{error.substring(6)}</p>
              <button 
                onClick={() => fetchApiLogs()} 
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
            <TableHead>{t('adminApiUsagePage.tableHeaders.user')}</TableHead>
            <TableHead>{t('adminApiUsagePage.tableHeaders.functionName')}</TableHead>
            <TableHead className="text-right">{t('adminApiUsagePage.tableHeaders.callCount')}</TableHead>
            <TableHead>{t('adminApiUsagePage.tableHeaders.lastCalledAt')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiLogs.length === 0 && !isLoading && !error ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">{t('adminApiUsagePage.noLogs')}</TableCell>
            </TableRow>
          ) : (
            apiLogs.map((log, index) => (
              <TableRow key={`${log.user_id}-${log.function_name}-${index}`}>
                <TableCell>
                  <div>{log.name}</div>
                  <div className="text-xs text-muted-foreground">{log.email}</div>
                </TableCell>
                <TableCell>{log.function_name}</TableCell>
                <TableCell className="text-right">{log.call_count}</TableCell>
                <TableCell>
                  {log.last_called_at && !isNaN(new Date(log.last_called_at).getTime())
                    ? format(new Date(log.last_called_at), 'Pp', { locale: currentLocale })
                    : t('common.none')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 mb-8">
        {/* Popular Functions Chart Section */}
        <div className="lg:col-span-1">
          {isLoading && apiLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><GradientLoader /></div>
          ) : error && apiLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-red-500 p-4">
              {t('charts.errorLoadingChartData')}: {error}
            </div>
          ) : apiLogs.length > 0 ? (
            <PopularFunctionsChart logs={chartApiLogs} logType="internal" />
          ) : (
            <div className="h-[300px] flex items-center justify-center p-4 text-center text-muted-foreground">
              {t('charts.noPopularFunctionsData')} 
            </div>
          )}
        </div>

        {/* Top Users Chart Section */}
        <div className="lg:col-span-1">
          {isLoading && apiLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><GradientLoader /></div>
          ) : error && apiLogs.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-red-500 p-4">
              {t('charts.errorLoadingChartData')}: {error} 
            </div>
          ) : apiLogs.length > 0 ? (
            <TopUsersChart logs={chartApiLogs} />
          ) : (
            <div className="h-[300px] flex items-center justify-center p-4 text-center text-muted-foreground">
              {t('charts.noTopUsersData')}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminApiUsagePage; 