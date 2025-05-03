import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, User, LogOut, Settings, CircleUserRound, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogPortal,
} from "@/components/ui/dialog";
import NewTaskDialog from "@/components/tasks/NewTaskDialog";
import { useState } from "react";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="container flex h-16 items-center px-4 justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 text-xl font-medium text-foreground">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="url(#icon-gradient)"
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="h-7 w-7"
            >
              <defs>
                <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: "#3b82f6"}} />
                  <stop offset="100%" style={{stopColor: "#a855f7"}} />
                </linearGradient>
              </defs>
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            OrgaMaster AI
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} modal={false}>
                <DialogTrigger asChild>
                  <Button className="gap-1 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nieuwe Taak</span>
                  </Button>
                </DialogTrigger>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="border-white/10 bg-secondary/50">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-effect">
                  <DropdownMenuItem>
                    <span className="text-sm font-medium">
                      {user?.name || "Gebruiker"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/profile" className="flex w-full items-center">
                      <CircleUserRound className="mr-2 h-4 w-4" />
                      Profiel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/settings" className="flex w-full items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Instellingen
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem>
                      <Link to="/admin" className="flex w-full items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="border-white/10 bg-secondary/50 hover:bg-secondary">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
