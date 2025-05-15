import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { UserProfile } from '@/types/auth.ts'; // Mogelijk nodig voor user info
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
import { Database } from '@/integrations/supabase/database.types.ts';

// Type voor het return type van de get_aggregated_user_api_logs RPC functie
type AggregatedApiLogResult = Database['public']['Functions']['get_aggregated_user_api_logs']['Returns'];
type AggregatedUserApiLog = AggregatedApiLogResult[0];

/**
 * @interface ApiLogEntry
 * @description Represents an entry for aggregated API log data to be displayed.
 * It combines data from the RPC call with user profile information.
 */
interface ApiLogEntry extends AggregatedUserApiLog {
  /** The email of the user. Mapped from user profiles. */
  email?: string; 
  /** The name of the user. Mapped from user profiles. */
  name?: string; 
}

/**
 * AdminApiUsagePage component.
 * @description Displays a table of aggregated internal API usage logs.
 * Fetches data from the `get_aggregated_user_api_logs` Supabase RPC function
 * and user profile information to show which user called which function, how many times, and when last.
 * @returns {React.FC} The AdminApiUsagePage component.
 */
const AdminApiUsagePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]); // To map user email/name for display
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
      // const { data: usersData, error: usersError } = await supabase // usersData niet gebruikt
      //   .from('profiles')
      //   .select('id, name'); 
      
      // if (usersError) throw usersError;
      
      // Fetch all user data (including email) via the Edge Function, similar to AdminUsersPage
      const { data: allUsersData, error: allUsersError } = await supabase.functions.invoke<UserProfile[]>('get-all-users');
      if (allUsersError) throw allUsersError;
      if (allUsersData) setUsers(allUsersData);

    } catch (err) {
      console.error("Error fetching users for API log mapping:", err);
      toast({
        variant: 'destructive',
        title: t('adminApiUsagePage.toastTitles.fetchUsersError'),
        description: err instanceof Error ? err.message : t('adminApiUsagePage.errors.unknownError'),
      });
    }
  }, [t, toast]);

  /**
   * @function fetchApiLogs
   * @description Fetches aggregated API logs using the 'get_aggregated_user_api_logs' RPC call.
   * Maps the log data with fetched user data to create displayable entries.
   * This function is only called if user data has been successfully fetched.
   */
  const fetchApiLogs = useCallback(async () => {
    if (users.length === 0) { 
      setIsLoading(false); 
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Gebruik de juiste typeparameters voor de Supabase RPC functie
      // Gebruik een type cast om te verzekeren dat data altijd een array is
      const { data, error: rpcError } = await supabase.rpc('get_aggregated_user_api_logs');

      if (rpcError) throw rpcError;

      if (data) {
        // Type cast omdat Supabase.js v2 types zijn niet helemaal perfect
        const apiLogsData = data as AggregatedUserApiLog[];
        const mappedLogs = apiLogsData.map((log) => {
          const user = users.find(u => u.id === log.user_id);
          return {
            ...log,
            email: user?.email || log.user_id, // Fallback to user_id if email is not found
            name: user?.name || 'N/A', // Fallback if name is not found
            call_count: Number(log.call_count), // Ensure call_count is a number
          };
        });
        // Data is already sorted by the RPC (ORDER BY last_called_at DESC)
        setApiLogs(mappedLogs);
      }

    } catch (err: unknown) {
      console.error("Error fetching API logs:", err);
      const message = err instanceof Error ? err.message : t('adminApiUsagePage.errors.fetchLogsError');
      setError(message);
      toast({
        variant: 'destructive',
        title: t('adminApiUsagePage.toastTitles.fetchError'),
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t, users]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (users.length > 0) { // Start fetching logs only when users are available
      fetchApiLogs();
    }
  }, [users, fetchApiLogs]);

  if (isLoading && apiLogs.length === 0) return <GradientLoader />; // Show loader only if no logs are present yet
  if (error && apiLogs.length === 0) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('adminApiUsagePage.title')}</h1>
      {isLoading && <p>{t('adminApiUsagePage.loadingMore')}</p>} {/* Optional loading indicator for refresh while data is already shown */}
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
          {apiLogs.length === 0 && !isLoading ? (
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
                <TableCell>{format(new Date(log.last_called_at), 'Pp', { locale: currentLocale })}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminApiUsagePage; 