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
import { Loader2, ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon
import { useNavigate } from 'react-router-dom'; // Initialize useNavigate hook
import { useTranslation } from 'react-i18next';

/**
 * `ContactPage` provides a form for users to send feedback, suggestions, or report issues.
 * It requires the user to be authenticated. The form includes fields for subject and message.
 * On submission, it sends the data to the 'feedback' table in Supabase.
 * It displays loading states and provides toast notifications for success or failure.
 * Includes a back button for navigation.
 */
const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate(); // Initialize useNavigate hook
  const { t } = useTranslation();
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Handles the submission of the contact/feedback form.
   * Prevents default form submission and validates user authentication, subject, and message.
   * If valid, it inserts the feedback into the Supabase 'feedback' table.
   * Shows appropriate toast notifications for success or errors.
   * Resets the form on successful submission.
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: t('contactPage.toast.notLoggedIn.title'),
        description: t('contactPage.toast.notLoggedIn.description'),
      });
      return;
    }

    if (!subject) {
       toast({ variant: "destructive", title: t('contactPage.toast.subjectRequired.title'), description: t('contactPage.toast.subjectRequired.description') });
       return;
    }
    if (!message.trim()) {
       toast({ variant: "destructive", title: t('contactPage.toast.messageRequired.title'), description: t('contactPage.toast.messageRequired.description') });
       return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          user_email: user.email, // Store email for context
          subject: subject,
          message: message.trim(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: t('contactPage.toast.messageSent.title'),
        description: t('contactPage.toast.messageSent.description'),
      });
      // Reset form
      setSubject('');
      setMessage('');

    } catch (error: unknown) {
      console.error("Error sending feedback:", error);
      // Type check for error message
      const errorMessage = error instanceof Error ? error.message : t('contactPage.toast.sendFailed.defaultError');
      toast({
        variant: "destructive",
        title: t('contactPage.toast.sendFailed.title'),
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Wrapper for vertical centering */}
      <div className="flex flex-grow flex-col items-center justify-center">
        {/* Container for the card and back button */}
        <div className="w-full max-w-2xl px-4">
           {/* Back button */}
           <div className="mb-4">
             <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('contactPage.backButton')}
              </Button>
           </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('contactPage.title')}</CardTitle>
              <CardDescription>
                {t('contactPage.description')}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('contactPage.subjectLabel')}</Label>
                   <Select 
                     value={subject} 
                     onValueChange={setSubject}
                     required // HTML5 validation
                   >
                     <SelectTrigger id="subject">
                       <SelectValue placeholder={t('contactPage.subjectPlaceholder')} />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="suggestie">{t('contactPage.subjectOptions.suggestion')}</SelectItem>
                       <SelectItem value="bug">{t('contactPage.subjectOptions.bugReport')}</SelectItem>
                       <SelectItem value="vraag">{t('contactPage.subjectOptions.generalQuestion')}</SelectItem>
                       <SelectItem value="anders">{t('contactPage.subjectOptions.other')}</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contactPage.messageLabel')}</Label>
                  <Textarea
                    id="message"
                    placeholder={t('contactPage.messagePlaceholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required // HTML5 validation
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
                  {isLoading ? t('contactPage.sendingButton') : t('contactPage.sendButton')}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ContactPage; 