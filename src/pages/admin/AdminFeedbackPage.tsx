import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { GradientLoader } from '@/components/ui/loader.tsx';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FeedbackEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  subject: string | null;
  message: string;
  created_at: string;
  status: string | null;
  important: boolean | null;
}

const AdminFeedbackPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentLocale = i18n.language === 'nl' ? nl : enUS;

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        throw dbError;
      }

      setFeedbackEntries((data || []) as FeedbackEntry[]);
    } catch (err: unknown) {
      console.error("Error fetching feedback:", err);
      const message = err instanceof Error ? err.message : t('common.error'); // Gebruik een generieke error message
      setError(message);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'Pp', { locale: currentLocale });
    } catch (e) {
      return dateString; // Fallback if date is invalid
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('feedback')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) fetchFeedback();
  };

  const handleToggleImportant = async (id: string, current: boolean | null) => {
    const { error } = await supabase
      .from('feedback')
      .update({ important: !current })
      .eq('id', id);
    if (!error) fetchFeedback();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);
    if (!error) fetchFeedback();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <GradientLoader />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="text-destructive">{t('common.error')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <button type="button" onClick={fetchFeedback} className="mt-4 p-2 bg-blue-500 text-white rounded">
            {t('common.retry', 'Retry')} 
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('adminFeedbackPage.title', 'Feedback Berichten')}</CardTitle>
        <CardDescription>{t('adminFeedbackPage.description', 'Overzicht van ontvangen feedback via het contactformulier.')}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {feedbackEntries.length === 0 ? (
          <p className="p-4">{t('adminFeedbackPage.noFeedback', 'Nog geen feedback ontvangen.')}</p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="whitespace-nowrap">{t('adminFeedbackPage.tableHeaders.date', 'Datum')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('adminFeedbackPage.tableHeaders.user', 'Gebruiker')}</TableHead>
                  <TableHead>{t('adminFeedbackPage.tableHeaders.subject', 'Onderwerp')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('adminFeedbackPage.tableHeaders.status', 'Status')}</TableHead>
                  <TableHead className="w-10">{t('adminFeedbackPage.tableHeaders.important', 'Belangrijk')}</TableHead>
                  <TableHead className="w-auto">{t('adminFeedbackPage.tableHeaders.actions', 'Acties')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackEntries.map((entry) => {
                  const isExpanded = expandedId === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <TableRow className="group hover:bg-muted transition cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                        <TableCell className="w-8 align-middle text-center">
                          <button
                            type="button"
                            aria-label={isExpanded ? 'Details verbergen' : 'Details tonen'}
                            className="focus:outline-none p-1 rounded-md hover:bg-muted-foreground/10 transition-colors"
                            onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : entry.id); }}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(entry.created_at)}</TableCell>
                        <TableCell className="hidden md:table-cell">{entry.user_email || entry.user_id}</TableCell>
                        <TableCell className="max-w-[150px] sm:max-w-[250px] truncate">{entry.subject}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant={
                              entry.status === 'afgehandeld'
                                ? 'success'
                                : entry.status === 'gelezen'
                                ? 'info'
                                : entry.status === 'nieuw' || !entry.status
                                ? 'warning'
                                : 'secondary'
                            }
                            className="capitalize"
                          >
                            {entry.status || 'nieuw'}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-10 text-center">
                          <button
                            type="button"
                            aria-label={entry.important ? 'Markeer als niet belangrijk' : 'Markeer als belangrijk'}
                            className="text-xl text-yellow-400 hover:text-yellow-600 focus:outline-none"
                            onClick={e => { e.stopPropagation(); handleToggleImportant(entry.id, !!entry.important); }}
                          >
                            {entry.important ? '★' : '☆'}
                          </button>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-green-500 text-green-500 hover:bg-green-500/10 hover:text-green-600 flex-1 min-w-[80px]"
                              onClick={e => { e.stopPropagation(); handleStatusChange(entry.id, 'afgehandeld'); }}
                              disabled={entry.status === 'afgehandeld'}
                            >
                              <span className="hidden sm:inline">{t('adminFeedbackPage.actions.handled', 'Afgehandeld')}</span>
                              <span className="sm:hidden">✓</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600 flex-1 min-w-[80px]"
                              onClick={e => { e.stopPropagation(); handleStatusChange(entry.id, 'gelezen'); }}
                              disabled={entry.status === 'gelezen'}
                            >
                              <span className="hidden sm:inline">{t('adminFeedbackPage.actions.read', 'Gelezen')}</span>
                              <span className="sm:hidden">👁️</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs flex-1 min-w-[80px]"
                              onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                            >
                              <span className="hidden sm:inline">{t('common.delete', 'Verwijderen')}</span>
                              <span className="sm:hidden">🗑️</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted">
                          <TableCell colSpan={7} className="p-4">
                            <div className="text-sm w-full">
                              <strong>{t('adminFeedbackPage.tableHeaders.message', 'Bericht')}:</strong>
                              <div className="whitespace-pre-wrap mb-2">{entry.message}</div>
                              <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4">
                                {entry.id && <span className="mr-4"><strong>ID:</strong> {entry.id}</span>}
                                <span><strong>{t('adminFeedbackPage.tableHeaders.date', 'Datum')}:</strong> {formatDate(entry.created_at)}</span>
                                <span><strong>{t('adminFeedbackPage.tableHeaders.user', 'Gebruiker')}:</strong> {entry.user_email || entry.user_id}</span>
                                <span><strong>{t('adminFeedbackPage.tableHeaders.subject', 'Onderwerp')}:</strong> {entry.subject}</span>
                                <span className="sm:hidden"><strong>{t('adminFeedbackPage.tableHeaders.status', 'Status')}:</strong> {entry.status || 'nieuw'}</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminFeedbackPage; 