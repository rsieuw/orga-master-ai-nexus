import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client.ts';
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * `UpdatePasswordPage` component allows users to update their password after a password reset request.
 * It validates the reset token from the URL, handles password input and confirmation,
 * and communicates with Supabase to update the user's password.
 * Displays appropriate loading states, error messages, and success notifications.
 */
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
  const { t } = useTranslation();

  /**
   * useEffect hook to check for a valid password reset token in the URL hash.
   * Supabase client automatically handles the token and attempts to recover the session.
   * This effect verifies if the session was successfully recovered.
   * If the session is recovered, `tokenFound` is set to true.
   * If not, an error message is displayed indicating an invalid or expired link.
   */
  useEffect(() => {
    // Supabase sends the token in the URL hash after a password reset
    // The Supabase client handles this automatically and sets the session
    // We check here if the session was successfully recovered
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setTokenFound(true);
      } else {
        setError(t("auth.updatePassword.invalidLinkError"));
        // Optional: navigate away after a delay
        // setTimeout(() => navigate('/login'), 5000);
      }
    };
    checkSession();
  }, [navigate, t]);

  /**
   * Handles the submission of the password update form.
   * Prevents default form submission, validates that passwords match and meet length requirements.
   * If validation passes, it attempts to update the user's password via Supabase.
   * Displays loading states, success or error toasts, and navigates to login on success.
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t("auth.updatePassword.passwordsMismatchError"));
      return;
    }
    if (password.length < 6) {
       setError(t("auth.updatePassword.passwordTooShortError"));
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
        title: t("auth.updatePassword.success.title"),
        description: t("auth.updatePassword.success.description"),
      });
      navigate('/login'); // Redirect user to login after success
    } catch (err) {
      console.error("Password Update error:", err);
      let errorMessage = t("auth.updatePassword.error.defaultMessage");
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: t("auth.updatePassword.error.title"),
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
        <p className="mt-2 text-muted-foreground">{t("auth.updatePassword.subtitle")}</p>
      </div>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t("auth.updatePassword.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!tokenFound && !error && (
            <p className="text-center text-muted-foreground">{t("auth.updatePassword.validatingLink")}</p>
          )}
          {error && (
            <p className="text-center text-red-500 mb-4">{error}</p>
          )}
          {tokenFound && (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="space-y-2 relative">
                <Label htmlFor="password">{t("auth.updatePassword.newPasswordLabel")}</Label>
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
                  <span className="sr-only">
                    {showPassword ? t("auth.updatePassword.hidePassword") : t("auth.updatePassword.showPassword")}
                  </span>
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="confirm-password">{t("auth.updatePassword.confirmPasswordLabel")}</Label>
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
                  <span className="sr-only">
                    {showConfirmPassword ? t("auth.updatePassword.hidePassword") : t("auth.updatePassword.showPassword")}
                  </span>
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full mt-8 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                size="lg"
                disabled={isLoading || !tokenFound}
              >
                {isLoading ? t("auth.updatePassword.updatingButton") : t("auth.updatePassword.updateButton")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage; 