import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Grid2x2, Settings, LayoutList, BotMessageSquare, User, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useTask } from '@/contexts/TaskContext.hooks.ts';
import { isPast, isToday, parseISO } from 'date-fns';
import { Task } from '@/types/task.ts';
import { useTranslation } from 'react-i18next';

// Define the structure for a navigation item
/**
 * @interface NavItem
 * @description Defines the structure for a navigation item.
 * @property {string} [path] - For direct navigation.
 * @property {string} [hash] - For view switching via hash.
 * @property {() => void} [action] - For other actions like opening a modal.
 * @property {React.ElementType} icon - The icon component for the navigation item.
 * @property {string} label - The label for the navigation item.
 */
interface NavItem {
  path?: string; // For direct navigation
  hash?: string; // For view switching via hash
  action?: () => void; // For other actions like opening a modal
  icon: React.ElementType;
  label: string;
}

// Remove BottomNavigationProps interface, as it's no longer needed
// interface BottomNavigationProps {}

/**
 * @component BottomNavigation
 * @description Renders the bottom navigation bar for mobile devices.
 * It adapts its items based on whether the user is viewing a task detail page or a general page.
 * Displays badges for overdue and today's tasks on the tasks icon.
 */
const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { tasks } = useTask();
  const { t } = useTranslation();

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
  let itemWidthClass = 'w-1/3'; // Default for 3 items

  if (isTaskDetail) {
    navItems = [
      { path: '/', icon: Grid2x2, label: t('bottomNavigation.tasks') },
      { hash: '#details', icon: LayoutList, label: t('bottomNavigation.taskDetails') },
      { hash: '#chat', icon: BotMessageSquare, label: t('bottomNavigation.chat') },
    ];
    itemWidthClass = 'w-1/3';
  } else {
    navItems = [
      { path: '/', icon: Grid2x2, label: t('bottomNavigation.tasks') },
      { path: '/profile', icon: User, label: t('bottomNavigation.profile') },
      { path: '/settings', icon: Settings, label: t('bottomNavigation.settings') },
      { path: '/support', icon: LifeBuoy, label: t('bottomNavigation.support', 'Support') },
    ];
    itemWidthClass = 'w-1/4'; // Adjusted for 4 items
  }

  const handleNavClick = (item: NavItem) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.hash) {
      // Scroll to top when switching views via hash
      if (typeof globalThis !== 'undefined' && 'scrollTo' in globalThis && typeof globalThis.scrollTo === 'function') {
        (globalThis as unknown as Window).scrollTo(0, 0);
      }
      navigate(`${location.pathname}${item.hash}`);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <nav className="fixed bottom-[-1px] left-0 right-0 h-16 bg-card/80 backdrop-blur-sm border-t border-border shadow-md flex justify-around items-center md:hidden z-[70] transition-transform duration-300 ease-in-out">
      {navItems.map((item) => {
        // Determine if the current item is active.
        // For path-based items, it checks if the current pathname matches the item's path.
        // For hash-based items, it checks if the current hash matches the item's hash.
        // As a fallback for hash-based items, if there's no current hash and the item's hash is '#details', it's considered active (default view).
        const isActive = item.path ? location.pathname === item.path : currentHash === item.hash || (!currentHash && item.hash === '#details');
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => handleNavClick(item)}
            className={cn(
              'relative flex flex-col items-center justify-center text-xs px-2 py-1 rounded-md transition-colors h-full',
              itemWidthClass,
              isActive ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5 mb-0.5" />
            <span>{item.label}</span>
            {/* Display badge count for tasks */}
            {item.label === t('bottomNavigation.tasks') && totalBadgeCount > 0 && (
              <span className="absolute top-1 right-[35%] md:right-[40%] transform translate-x-1/2 text-xs bg-red-600 text-white rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center leading-none">
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