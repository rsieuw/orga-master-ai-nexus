import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.ts";
import LoginForm from "@/components/auth/LoginForm.tsx";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * `Login` page component.
 * This page displays the login form for existing users.
 * If the user is already authenticated, it redirects them to the homepage.
 * It uses the `LoginForm` component to handle the actual login logic.
 */
export default function Login() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
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

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {t("login.noAccount")}{" "}
            <Link to="/register" className="text-primary hover:underline">
              {t("login.registerHere")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
