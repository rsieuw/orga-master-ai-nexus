import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client.ts';
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Eye, EyeOff } from "lucide-react";

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenFound, setTokenFound] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase stuurt de token in de URL hash na een wachtwoord reset.
    // De Supabase client handelt dit automatisch af en zet de sessie.
    // We controleren hier of de sessie succesvol is hersteld.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setTokenFound(true);
      } else {
        setError("Ongeldige of verlopen link. Vraag opnieuw wachtwoordherstel aan.");
        // Optioneel: navigeer weg na een vertraging
        // setTimeout(() => navigate('/login'), 5000);
      }
    };
    checkSession();
  }, [navigate]);

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }
    if (password.length < 6) {
       setError('Wachtwoord moet minimaal 6 tekens lang zijn.');
       return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Wachtwoord Bijgewerkt",
        description: "Uw wachtwoord is succesvol bijgewerkt. U kunt nu inloggen.",
      });
      navigate('/login'); // Stuur gebruiker naar login na succes
    } catch (err) {
      console.error("Password Update error:", err);
      let errorMessage = 'Er is een fout opgetreden bij het bijwerken van het wachtwoord.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Fout bij Bijwerken",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Stijl consistent houden met andere auth paginas
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="text-center mb-6">
        {/* Logo en Titel zoals in Login/ForgotPassword */}
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
           <svg /* SVG icoon */ xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#login-icon-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <defs><linearGradient id="login-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor: "#3b82f6"}} /><stop offset="100%" style={{stopColor: "#a855f7"}} /></linearGradient></defs><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
           </svg>
           <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">OrgaMaster AI</span>
         </h1>
        <p className="mt-2 text-muted-foreground">Stel een nieuw wachtwoord in</p>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Nieuw Wachtwoord Instellen</CardTitle>
        </CardHeader>
        <CardContent>
          {!tokenFound && !error && (
            <p className="text-center text-muted-foreground">Link valideren...</p>
          )}
          {error && (
            <p className="text-center text-red-500 mb-4">{error}</p>
          )}
          {tokenFound && (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="space-y-2 relative">
                <Label htmlFor="password">Nieuw Wachtwoord</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-7 h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Verberg" : "Toon"} wachtwoord</span>
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="confirm-password">Bevestig Nieuw Wachtwoord</Label>
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                  autoComplete="new-password"
                  disabled={isLoading}
                />
                 <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-7 h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showConfirmPassword ? "Verberg" : "Toon"} wachtwoord</span>
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full mt-8 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                size="lg"
                disabled={isLoading || !tokenFound}
              >
                {isLoading ? "Bijwerken..." : "Wachtwoord Bijwerken"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage; 