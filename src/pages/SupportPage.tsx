import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout.tsx';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Textarea } from '@/components/ui/textarea.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { supabase } from '@/integrations/supabase/client.ts';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * `SupportPage` provides a form for users to send feedback, suggestions, or report issues.
 * It requires the user to be authenticated. The form includes fields for subject and message.
 * On submission, it sends the data to the 'feedback' table in Supabase.
 * It displays loading states and provides toast notifications for success or failure.
 * Includes a back button for navigation.
 */
const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: t('supportPage.toast.notLoggedIn.title'),
        description: t('supportPage.toast.notLoggedIn.description'),
      });
      return;
    }

    if (!subject) {
       toast({ variant: "destructive", title: t('supportPage.toast.subjectRequired.title'), description: t('supportPage.toast.subjectRequired.description') });
       return;
    }
    if (!message.trim()) {
       toast({ variant: "destructive", title: t('supportPage.toast.messageRequired.title'), description: t('supportPage.toast.messageRequired.description') });
       return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          user_email: user.email,
          subject: subject,
          message: message.trim(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: t('supportPage.toast.messageSent.title'),
        description: t('supportPage.toast.messageSent.description'),
      });
      setSubject('');
      setMessage('');

    } catch (error: unknown) {
      console.error("Error sending feedback:", error);
      const errorMessage = error instanceof Error ? error.message : t('supportPage.toast.sendFailed.defaultError');
      toast({
        variant: "destructive",
        title: t('supportPage.toast.sendFailed.title'),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-grow flex-col items-center justify-center">
        <div className="w-full max-w-2xl px-4">
           <div className="mb-4">
             <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('supportPage.backButton')} 
              </Button>
           </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('supportPage.title')}</CardTitle> 
              <CardDescription>
                {t('supportPage.description')}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('supportPage.subjectLabel')}</Label>
                   <Select 
                     value={subject} 
                     onValueChange={setSubject}
                     required
                   >
                     <SelectTrigger id="subject">
                       <SelectValue placeholder={t('supportPage.subjectPlaceholder')} />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="suggestie">{t('supportPage.subjectOptions.suggestion')}</SelectItem>
                       <SelectItem value="bug">{t('supportPage.subjectOptions.bugReport')}</SelectItem>
                       <SelectItem value="vraag">{t('supportPage.subjectOptions.generalQuestion')}</SelectItem>
                       <SelectItem value="anders">{t('supportPage.subjectOptions.other')}</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('supportPage.messageLabel')}</Label>
                  <Textarea
                    id="message"
                    placeholder={t('supportPage.messagePlaceholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? t('supportPage.sendingButton') : t('supportPage.sendButton')}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default SupportPage; 