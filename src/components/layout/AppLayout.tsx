import { PropsWithChildren } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface AppLayoutProps extends PropsWithChildren {
  requireAuth?: boolean;
}

export default function AppLayout({ 
  children, 
  requireAuth = true 
}: AppLayoutProps) {
  const { isAuthenticated } = useAuth();

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-8 pb-4 mb-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}
