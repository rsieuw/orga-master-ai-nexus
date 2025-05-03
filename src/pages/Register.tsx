import { Link, Navigate } from "react-router-dom";
import RegisterForm from "@/components/auth/RegisterForm.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";

export default function Register() {
  const { isAuthenticated } = useAuth();

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
              stroke="url(#register-icon-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
            >
              <defs>
                <linearGradient id="register-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
          <p className="mt-2 text-muted-foreground">
            Registreer om aan de slag te gaan
          </p>
        </div>

        <RegisterForm />

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Heb je al een account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in hier
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
