import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { List, Settings, Info, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { useAuth } from '@/contexts/AuthContext.tsx'; // Import useAuth to check authentication

// Definieer de structuur voor een navigatie item
interface NavItem {
  path?: string; // Voor directe navigatie
  hash?: string; // Voor view switching via hash
  action?: () => void; // Voor andere acties zoals modal openen
  icon: React.ElementType;
  label: string;
}

// Verwijder BottomNavigationProps interface, want die is niet meer nodig
// interface BottomNavigationProps {} 

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // Check if user is authenticated

  // Verberg component als gebruiker niet ingelogd is (optioneel, hangt af van design)
  if (!isAuthenticated) {
    return null;
  }

  const isTaskDetail = location.pathname.startsWith('/task/');
  const currentHash = location.hash;

  // Bepaal welke set navigatie items getoond moet worden
  let navItems: NavItem[] = [];

  if (isTaskDetail) {
    navItems = [
      { path: '/', icon: List, label: 'Taken' },
      { hash: '#details', icon: Info, label: 'Details' },
      { hash: '#chat', icon: MessageSquare, label: 'Chat' },
    ];
  } else {
    // Standaard navigatie voor dashboard en andere hoofdpagina's
    navItems = [
      { path: '/', icon: List, label: 'Taken' },
      // Vervang 'Nieuw taak' door 'Profiel'
      { path: '/profile', icon: User, label: 'Profiel' }, 
      { path: '/settings', icon: Settings, label: 'Instellingen' },
    ];
  }

  const handleNavClick = (item: NavItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.hash) {
      // Scroll naar boven en verander alleen de hash
      if (typeof globalThis !== 'undefined' && 'scrollTo' in globalThis && typeof globalThis.scrollTo === 'function') {
        (globalThis as unknown as Window).scrollTo(0, 0);
      }
      navigate(`${location.pathname}${item.hash}`);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-sm border-t border-border shadow-md flex justify-around items-center md:hidden z-[70]">
      {navItems.map((item) => {
        const isActive = item.path ? location.pathname === item.path : currentHash === item.hash || (!currentHash && item.hash === '#details'); // Default to #details if no hash
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => handleNavClick(item)}
            className={cn(
              'flex flex-col items-center justify-center text-xs px-2 py-1 rounded-md transition-colors w-1/3',
              isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation; 