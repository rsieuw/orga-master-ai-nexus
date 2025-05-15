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

type ExternalApiUsageLog = Database['public']['Tables']['external_api_usage_logs']['Row'];

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
interface ExternalApiLogDisplayEntry extends Omit<ExternalApiUsageLog, 'cost'> {
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
  const [users, setUsers] = useState<UserProfile[]>([]);
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
      if (allUsersData) setUsers(allUsersData);
    } catch (err) {
      console.error("Error fetching users for API log mapping:", err);
      toast({
        variant: "destructive",
        title: t('adminExternalApiUsagePage.toastTitles.fetchUsersError'),
        description: err instanceof Error ? err.message : t('adminExternalApiUsagePage.errors.unknownError'),
      });
    }
  }, [t, toast]);

  /**
   * @function fetchExternalApiLogs
   * @description Fetches external API usage logs from the `external_api_usage_logs` table.
   * It then maps this data with fetched user profiles to create displayable entries.
   * It only proceeds if user data has been fetched (or attempted).
   */
  const fetchExternalApiLogs = useCallback(async () => {
    if (users.length === 0) { 
      // Wait for logs to be fetched until users are available for mapping, 
      // unless we decide to show logs without mapping if users fetch fails.
      // This prevents unnecessary fetches if users are not yet loaded.
      // fetchUsers will trigger this function again via the useEffect dependency on users.
      setIsLoading(false); // Set loading to false to prevent loop if users fetch fails.
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: logError } = await supabase.from('external_api_usage_logs')
        .select('*') // Fetch all columns for now
        .order('called_at', { ascending: false })
        .limit(100); // Limit for now

      if (logError) throw logError;

      if (data) {
        const mappedLogs = data.map(log => {
          const user = users.find(u => u.id === log.user_id);
          const metadata = log.metadata as LogMetadata | null;
          const success = typeof metadata?.success === 'boolean' ? metadata.success : undefined;
          const costNumber = log.cost; // Deze waarde is een number in de database
          const costString = costNumber ? costNumber.toFixed(6) : null;
          
          return {
            ...log,
            user_email: user?.email || (log.user_id ? 'User ID: ' + log.user_id : 'N/A'),
            user_name: user?.name || 'Unknown User',
            success: success,
            cost: costString, // Nu een string of null voor display
          };
        });
        
        setExternalApiLogs(mappedLogs as ExternalApiLogDisplayEntry[]);
      }
    } catch (err: unknown) {
      console.error("Error fetching external API logs:", err);
      const message = err instanceof Error ? err.message : t('adminExternalApiUsagePage.errors.fetchLogsError');
      setError(message);
      toast({
        variant: "destructive",
        title: t('adminExternalApiUsagePage.toastTitles.fetchError'),
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast, users]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    // Fetch logs if users are loaded, or if fetchUsers is done (even if no users, then show logs without user details).
    // The check users.length === 0 in fetchExternalApiLogs handles this.
    fetchExternalApiLogs();
  }, [users, fetchExternalApiLogs]); // Depends on users to re-fetch after user mapping info.

  if (isLoading && externalApiLogs.length === 0) return <GradientLoader />;
  if (error && externalApiLogs.length === 0) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('adminExternalApiUsagePage.title')}</h1>
      {isLoading && <p className="text-sm text-muted-foreground">{t('adminExternalApiUsagePage.loadingMore')}</p>}
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
          {externalApiLogs.length === 0 && !isLoading ? (
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
                    <Badge variant="secondary">{t('adminExternalApiUsagePage.status.unknown')}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {log.metadata && typeof log.metadata === 'object' && (log.metadata as LogMetadata).error ? (
                    <span className="text-red-500">{(log.metadata as LogMetadata).error}</span>
                  ) : (
                    log.metadata && typeof log.metadata === 'object' && (log.metadata as LogMetadata).model ? (
                      <span>Model: {(log.metadata as LogMetadata).model}</span>
                    ) : null
                  )}
                  {log.task_id && <div>Task ID: {log.task_id}</div>}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminExternalApiUsagePage; 