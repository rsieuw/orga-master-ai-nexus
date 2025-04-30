
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RegisterForm from "@/components/auth/RegisterForm";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Register() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">OrgaMaster AI</h1>
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
