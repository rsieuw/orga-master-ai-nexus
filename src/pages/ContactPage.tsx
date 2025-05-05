import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout.tsx';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Textarea } from '@/components/ui/textarea.tsx';
import { Button } from '@/components/ui/button.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { supabase } from '@/integrations/supabase/client.ts';
import { Loader2, ArrowLeft } from 'lucide-react'; // Import ArrowLeft
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate(); // Add useNavigate hook
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Niet ingelogd",
        description: "Log in om een bericht te sturen.",
      });
      return;
    }

    if (!subject) {
       toast({ variant: "destructive", title: "Onderwerp vereist", description: "Selecteer een onderwerp." });
       return;
    }
    if (!message.trim()) {
       toast({ variant: "destructive", title: "Bericht vereist", description: "Voer een bericht in." });
       return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          user_email: user.email, // Sla e-mail op voor context
          subject: subject,
          message: message.trim(),
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Bericht verzonden",
        description: "Bedankt voor je feedback! We nemen het zo snel mogelijk in behandeling.",
      });
      // Reset formulier
      setSubject('');
      setMessage('');

    } catch (error: unknown) {
      console.error("Error sending feedback:", error);
      // Type check voor error message
      const message = error instanceof Error ? error.message : "Kon het bericht niet verzenden. Probeer het later opnieuw.";
      toast({
        variant: "destructive",
        title: "Verzenden mislukt",
        description: message,
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
                Terug
              </Button>
           </div>

          <Card>
            <CardHeader>
              <CardTitle>Contacteer Ons</CardTitle>
              <CardDescription>
                Heb je een vraag, suggestie, of heb je een bug gevonden? Laat het ons weten!
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Onderwerp</Label>
                   <Select 
                     value={subject} 
                     onValueChange={setSubject}
                     required // HTML5 validatie
                   >
                     <SelectTrigger id="subject">
                       <SelectValue placeholder="Selecteer een onderwerp..." />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="suggestie">Suggestie / Idee</SelectItem>
                       <SelectItem value="bug">Bug Report</SelectItem>
                       <SelectItem value="vraag">Algemene Vraag</SelectItem>
                       <SelectItem value="anders">Anders</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Bericht</Label>
                  <Textarea
                    id="message"
                    placeholder="Beschrijf je vraag, suggestie of bug zo duidelijk mogelijk..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required // HTML5 validatie
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
                  {isLoading ? 'Bezig met verzenden...' : 'Verzenden'}
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