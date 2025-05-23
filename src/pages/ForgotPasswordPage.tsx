import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useToast } from "@/hooks/use-toast.ts"; // Import useToast for feedback
import { supabase } from '@/integrations/supabase/client.ts'; // Import Supabase client - ADDED .ts extension
import { useTranslation } from "react-i18next";

/**
 * `ForgotPasswordPage` component provides a form for users to request a password reset.
 * It collects the user's email address and sends a password reset link via Supabase.
 * Displays loading states and feedback messages (success or error) using toasts.
 */
const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  // const navigate = useNavigate(); // Commented out as it's not currently used

  /**
   * Handles the submission of the password reset request form.
   * Prevents default form submission and sets loading state.
   * Calls Supabase `resetPasswordForEmail` to send a reset link to the user's email.
   * The `redirectTo` URL points to the page where the user can set a new password.
   * Displays success or error toasts based on the outcome of the API call.
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handlePasswordResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // TODO: Consider more specific error handling or logging for the password reset process.

    try {
      // Actual Supabase password reset call
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${globalThis.location.origin}/update-password`, // Use globalThis for universal compatibility (browser/Node.js)
      });

      if (error) {
        throw error; // Throw error to be caught by the catch block
      }

      toast({
        title: t('auth.resetPassword.success.title'),
        description: t('auth.resetPassword.success.description'),
      });
      // Optionally navigate back to login or show a persistent success message
      // navigate('/login'); 
    } catch (error) {
       let errorMessage = t('auth.resetPassword.error.defaultMessage');
       if (error instanceof Error) {
            errorMessage = error.message; // Use the specific error message if it's an Error instance
       }
       toast({
        variant: "destructive",
        title: t('auth.resetPassword.error.title'),
        description: errorMessage, // Display the potentially more specific error message
      });
       console.error("Password Reset error:", error);
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Title/logo section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#login-icon-gradient)" // Ensure this gradient ID is defined or re-use an existing one
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
          >
            <defs>
              <linearGradient id="login-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{stopColor: "#3b82f6"}} />
                <stop offset="100%" style={{stopColor: "#a855f7"}} />
              </linearGradient>
            </defs>
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            OrgaMaster AI
          </span>
        </h1>
        {/* Page-specific subtitle */}
        <p className="mt-2 text-muted-foreground">
          {t('auth.resetPassword.subtitle')}
        </p>
      </div>

      {/* Form container with updated styling */}
      <div className="w-full max-w-md bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-2xl text-center font-bold mb-6">{t('auth.resetPassword.title')}</h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {t('auth.resetPassword.instructions')}
        </p>
        <form onSubmit={handlePasswordResetRequest} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.resetPassword.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.resetPassword.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
              className="border-gray-600 focus:border-primary"
            />
          </div>
          <Button
            type="submit"
            className="w-full mt-8 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? t('auth.resetPassword.sending') : t('auth.resetPassword.submit')}
          </Button>
        </form>
      </div>

      {/* Link section */}
      <div className="mt-8 text-center">
        <p className="text-muted-foreground text-sm">
          {t('auth.resetPassword.backToLogin.prefix')}{' '}
          <Link to="/login" className="text-primary hover:underline">
            {t('auth.resetPassword.backToLogin.link')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 