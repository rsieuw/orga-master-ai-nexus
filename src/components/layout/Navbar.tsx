import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import { PlusCircle, User, LogOut, Settings, CircleUserRound, Shield, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.tsx";
import { useTranslation } from 'react-i18next';

/**
 * Props for the Navbar component.
 */
interface NavbarProps {
  /** Function to open the modal for creating a new task. */
  openNewTaskModal: () => void;
}

/**
 * The top navigation bar component of the application.
 * 
 * This component displays the app logo, a button to create new tasks (when authenticated),
 * and either user menu options (when authenticated) or login/register buttons (when not authenticated).
 * The user menu includes links to profile, settings, admin dashboard (for admin users),
 * upgrade option (for free users), and logout functionality.
 *
 * @param {NavbarProps} props - The props for the Navbar component.
 * @returns {JSX.Element} The Navbar component.
 */
export default function Navbar({ openNewTaskModal }: NavbarProps) {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <nav className="sticky top-0 z-30 bg-card border-b border-border">
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
                  <stop offset="100%" style={{stopColor: "#9333ea"}} />
                </linearGradient>
              </defs>
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            OrgaMaster AI
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Button 
                className="rounded-full md:rounded-lg h-9 w-9 flex items-center justify-center p-0 sm:h-auto sm:w-auto sm:px-3 sm:py-2 sm:gap-1 md:px-6 md:gap-2 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                onClick={openNewTaskModal}
                aria-label={t('navbar.newTaskButton.ariaLabel')}
              >
                <PlusCircle className="h-5 w-5" />
                <span className="hidden sm:inline">{t('navbar.newTaskButton.text')}</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-white/10 bg-secondary/50">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-effect z-[80]">
                  <DropdownMenuItem>
                    <span className="text-sm font-medium">
                      {user?.name || t('navbar.userMenu.defaultUserName')}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/profile" className="flex w-full items-center">
                      <CircleUserRound className="mr-2 h-4 w-4" />
                      {t('navbar.userMenu.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/settings" className="flex w-full items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('navbar.userMenu.settings')}
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem>
                      <Link to="/admin" className="flex w-full items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        {t('navbar.userMenu.adminDashboard')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'free' && (
                    <DropdownMenuItem>
                      <Link to="/pricing" className="flex w-full items-center text-yellow-500 hover:text-yellow-400">
                         <Star className="mr-2 h-4 w-4" />
                         {t('navbar.userMenu.upgradeToPremium')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('navbar.userMenu.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="border-white/10 bg-secondary/50 hover:bg-secondary">
                  {t('navbar.authButtons.login')}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900">{t('navbar.authButtons.register')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
