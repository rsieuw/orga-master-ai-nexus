import { PropsWithChildren, useState } from "react";
import Navbar from "./Navbar.tsx";
import Footer from "./Footer.tsx";
import BottomNavigation from "./BottomNavigation.tsx";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { Navigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPortal,
} from "@/components/ui/dialog.tsx";
import NewTaskDialog from "@/components/tasks/NewTaskDialog.tsx";

interface AppLayoutProps extends PropsWithChildren {
  requireAuth?: boolean;
}

export default function AppLayout({ 
  children, 
  requireAuth = true 
}: AppLayoutProps) {
  const { isAuthenticated } = useAuth();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar openNewTaskModal={() => setIsNewTaskOpen(true)} />
      <main className="flex-1 container mx-auto px-4 pt-8 pb-20 mb-4 md:pb-4">
        {children}
      </main>
      <Footer />
      <BottomNavigation />

      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} modal={false}>
        <DialogPortal>
          {isNewTaskOpen && (
             <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" aria-hidden="true" />
          )}
          <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card p-6 shadow-lg duration-200 sm:max-w-[600px] sm:rounded-lg z-50">
            <DialogHeader>
              <DialogTitle className="text-2xl">Nieuwe taak</DialogTitle>
              <DialogDescription>
                Beschrijf wat je wilt doen, en laat AI de details invullen.
              </DialogDescription>
            </DialogHeader>
            <NewTaskDialog setOpen={setIsNewTaskOpen} /> 
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
