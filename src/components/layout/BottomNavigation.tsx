import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { List, Settings, Info, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useTask } from '@/contexts/TaskContext.hooks.ts';
import { isPast, isToday, parseISO } from 'date-fns';
import { Task } from '@/types/task.ts';

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
  const { isAuthenticated } = useAuth();
  const { tasks } = useTask();

  if (!isAuthenticated) {
    return null;
  }

  let overdueCount = 0;
  let todayCount = 0;

  if (Array.isArray(tasks) && tasks.length > 0) {
    overdueCount = tasks.filter((task: Task) => {
      if (!task.deadline) return false;
      try {
        const deadlineDate = parseISO(task.deadline);
        return task.status !== 'done' && isPast(deadlineDate) && !isToday(deadlineDate);
      } catch (error) {
        console.error("Error parsing deadline for overdue count:", task.deadline, error);
        return false;
      }
    }).length;

    todayCount = tasks.filter((task: Task) => {
      if (!task.deadline) return false;
      try {
        const deadlineDate = parseISO(task.deadline);
        return task.status !== 'done' && isToday(deadlineDate);
      } catch (error) {
        console.error("Error parsing deadline for today count:", task.deadline, error);
        return false;
      }
    }).length;
  }

  const totalBadgeCount = overdueCount + todayCount;

  const isTaskDetail = location.pathname.startsWith('/task/');
  const currentHash = location.hash;

  let navItems: NavItem[] = [];

  if (isTaskDetail) {
    navItems = [
      { path: '/', icon: List, label: 'Taken' },
      { hash: '#details', icon: Info, label: 'Details' },
      { hash: '#chat', icon: MessageSquare, label: 'Chat' },
    ];
  } else {
    navItems = [
      { path: '/', icon: List, label: 'Taken' },
      { path: '/profile', icon: User, label: 'Profiel' }, 
      { path: '/settings', icon: Settings, label: 'Instellingen' },
    ];
  }

  const handleNavClick = (item: NavItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.hash) {
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
        const isActive = item.path ? location.pathname === item.path : currentHash === item.hash || (!currentHash && item.hash === '#details');
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => handleNavClick(item)}
            className={cn(
              'relative flex flex-col items-center justify-center text-xs px-2 py-1 rounded-md transition-colors w-1/3 h-full',
              isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span>{item.label}</span>
            {item.label === 'Taken' && totalBadgeCount > 0 && (
              <span className="absolute top-1 right-[40%] transform translate-x-1/2 text-xs bg-red-600 text-white rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center leading-none">
                {totalBadgeCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation; 