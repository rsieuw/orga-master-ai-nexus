import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.ts';
import { GradientLoader } from '@/components/ui/loader.tsx';

const AdminRouteGuard: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    // Toon een lader terwijl de authenticatiestatus wordt bepaald
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <GradientLoader size="lg" />
      </div>
    );
  }

  // Als de gebruiker ingelogd is EN de rol 'admin' heeft, toon de gevraagde route
  if (isAuthenticated && user?.role === 'admin') {
    return <Outlet />;
  }

  // Anders, stuur de gebruiker weg (bv. naar de hoofdpagina)
  // Je kunt ook naar een specifieke 'geen toegang' pagina sturen
  return <Navigate to="/" replace />;
};

export default AdminRouteGuard; 