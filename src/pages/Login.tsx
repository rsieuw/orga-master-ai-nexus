import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.ts";
import LoginForm from "@/components/auth/LoginForm.tsx";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { FaGoogle } from 'react-icons/fa';

/**
 * `Login` page component.
 * This page displays the login form for existing users and an option for Google Sign-In.
 * If the user is already authenticated, it redirects them to the application's homepage.
 * It utilizes the `LoginForm` component for traditional email/password authentication
 * and provides a button for `signInWithGoogle` functionality from `useAuth` hook.
 */
export default function Login() {
  const { isAuthenticated, signInWithGoogle } = useAuth();
  const { t } = useTranslation();

  // If the user is already authenticated, redirect to the homepage.
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="url(#login-icon-gradient)"
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
              {t("login.title")}
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("login.subtitle")}
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 flex flex-row items-center justify-center space-x-4">
          <Button 
            variant="outline" 
            size="lg"
            className="flex items-center justify-center gap-2 border-gray-500 hover:border-gray-400"
            onClick={async () => {
              try {
                await signInWithGoogle();
                // Supabase handles redirection by default upon successful Google Sign-In.
                // Additional client-side success handling can be added here if needed.
              } catch (error) {
                // Error handling for Google Sign-In is primarily managed within the AuthContext.
                // Specific UI feedback for this page can be added here if necessary.
                console.error("Google Sign-In failed on LoginPage:", error);
              }
            }}
          >
            <FaGoogle className="h-5 w-5" /> 
            {t("login.signInWithGoogle")}
          </Button>

          <a 
            href="#" // TODO: Replace with actual Google Play Store link
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-block"
            aria-label="Download on Google Play"
          >
            <img 
              src="/assets/icons/google-play-badge.svg"
              alt="Get it on Google Play" 
              className="h-12 hover:opacity-90 transition-opacity"
            />
          </a>
        </div>

        <div className="mt-8 text-center">
          <span className="text-muted-foreground text-sm">
            {t("login.noAccount")}{" "}
          </span>
          <Button asChild variant="link" size="lg" className="px-1 py-0 align-baseline">
            <Link to="/register">
              {t("login.registerHere")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
