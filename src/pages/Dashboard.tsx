import React, { useState, useEffect, useMemo, useRef } from 'react'; // Add React import for React.isValidElement and useState, useEffect, useMemo, useRef
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import TaskCard from "@/components/task/TaskCard.tsx";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Task, TasksByDate, TaskPriority } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { PlusCircle } from 'lucide-react'; // Import PlusCircle icon
import SearchInput from '@/components/ui/SearchInput.tsx'; // Import SearchInput
import TaskFilter, { TaskFilterStatus, TaskFilterPriority, TaskFilterCategory } from '@/components/ui/TaskFilter.tsx'; // Import TaskFilter and types
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog.tsx";
import NewTaskDialog from "@/components/tasks/NewTaskDialog.tsx";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Variants } from 'framer-motion'; // Framer Motion import and Variants
import { Card } from "@/components/ui/card.tsx";
import { TypedGreeting } from "@/components/ui/TypedGreeting.tsx";

const LOCAL_STORAGE_KEYS = {
  SEARCH_TERM: 'dashboardSearchTerm',
  FILTER_STATUS: 'dashboardFilterStatus',
  FILTER_PRIORITY: 'dashboardFilterPriority',
  FILTER_CATEGORY: 'dashboardFilterCategory',
};

// const getCategoryTitle = (category: keyof TasksByDate): string => {
//   switch (category) {
//     case 'overdue': return 'Verlopen';
//     case 'today': return 'Vandaag';
//     case 'tomorrow': return 'Morgen';
//     case 'dayAfterTomorrow': return 'Overmorgen';
//     case 'nextWeek': return 'Volgende week';
//     case 'later': return 'Binnenkort';
//     default: return '';
//   }
// };

// Priority mapping for sorting
const priorityOrder: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

// Sort function for tasks by priority (descending)
/**
 * Sorts tasks by priority in descending order.
 * High > Medium > Low > None.
 * @param {Task} a - The first task to compare.
 * @param {Task} b - The second task to compare.
 * @returns {number} Returns -1 if b > a, 1 if a > b, 0 if equal.
 */
const sortTasksByPriority = (a: Task, b: Task): number => {
  return priorityOrder[b.priority] - priorityOrder[a.priority];
};

// Variants for animations
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

// Variants for individual cards
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

// New gradient colors for the greeting - now exactly the same as the New Task button
const greetingGradientStart = '#1D4ED8'; // Tailwind Blue-700
const greetingGradientEnd = '#6B21A8';   // Tailwind Purple-800

// CSS Animation style for the greeting text gradient
const gradientAnimationStyle = `
  .animated-gradient-text {
    background: linear-gradient(to right, ${greetingGradientStart}, ${greetingGradientEnd});
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    position: relative;
  }
`;

/**
 * Dashboard component to display and manage tasks.
 *
 * Features:
 * - Displays tasks grouped by date categories (Overdue, Today, Tomorrow, etc.).
 * - Allows searching and filtering tasks by status, priority, and category.
 * - Persists search and filter settings in Local Storage.
 * - Provides a dialog to create new tasks.
 * - Responsive design with different layouts for desktop and mobile.
 * - Animated transitions for task cards and sections.
 * - Shows a greeting message with a typed animation.
 * - Handles empty states (no tasks, no tasks after filtering).
 * - Floating Action Button (FAB) for creating new tasks on mobile, which hides on inactivity.
 * @returns {JSX.Element} The rendered Dashboard component.
 */
export default function Dashboard() {
  const { isLoading, groupTasksByDate } = useTask();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Initialize state from Local Storage or defaults
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.SEARCH_TERM) || '';
  });
  const [filterStatus, setFilterStatus] = useState<TaskFilterStatus>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.FILTER_STATUS) as TaskFilterStatus) || 'all';
  });
  const [filterPriority, setFilterPriority] = useState<TaskFilterPriority>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.FILTER_PRIORITY) as TaskFilterPriority) || 'all';
  });
  const [filterCategory, setFilterCategory] = useState<TaskFilterCategory>(() => {
    return (localStorage.getItem(LOCAL_STORAGE_KEYS.FILTER_CATEGORY) as TaskFilterCategory) || 'all';
  });
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update Local Storage when local state changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SEARCH_TERM, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.FILTER_STATUS, filterStatus);
  }, [filterStatus]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.FILTER_PRIORITY, filterPriority);
  }, [filterPriority]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.FILTER_CATEGORY, filterCategory);
  }, [filterCategory]);

  // EFFECT MODIFIED: Manually block body scroll when NewTaskDialog is open
  useEffect(() => {
    if (isNewTaskOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto'; // Back to auto
    }

    // Cleanup function to restore overflow when the component unmounts
    // or before the effect runs again if isNewTaskOpen changes.
    return () => {
      document.body.style.overflow = 'auto'; // Back to auto
    };
  }, [isNewTaskOpen]);

  // Effect for managing FAB button visibility
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 2500;
    const handleActivity = () => {
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current);
      }
      setShowMobileActions(true);
      hideTimerRef.current = setTimeout(() => {
        setShowMobileActions(false);
      }, INACTIVITY_TIMEOUT) as ReturnType<typeof setTimeout>;
    };
    handleActivity();
    globalThis.addEventListener('scroll', handleActivity, { passive: true });
    globalThis.addEventListener('click', handleActivity, { capture: true });
    globalThis.addEventListener('mousemove', handleActivity, { passive: true });
    globalThis.addEventListener('touchmove', handleActivity, { passive: true });
    return () => {
      globalThis.removeEventListener('scroll', handleActivity);
      globalThis.removeEventListener('click', handleActivity, { capture: true });
      globalThis.removeEventListener('mousemove', handleActivity);
      globalThis.removeEventListener('touchmove', handleActivity);
      if (hideTimerRef.current !== null) { 
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  // Effect to add the gradient animation style to the document
  useEffect(() => {
    // Add the style to the document
    const styleElement = document.createElement('style');
    styleElement.textContent = gradientAnimationStyle + `
      /* Verberg scrollbars op mobiel maar behoud functionaliteit */
      @media (max-width: 640px) {
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // Cleanup function to remove the style when the component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const rawTaskGroups = groupTasksByDate();

  const filteredAndSortedTaskGroups = useMemo(() => {
    const groups: TasksByDate = {
      completed: [],
      overdue: [],
      today: [],
      tomorrow: [],
      dayAfterTomorrow: [],
      nextWeek: [],
      later: [],
    };

    for (const key in rawTaskGroups) {
      if (Object.prototype.hasOwnProperty.call(rawTaskGroups, key)) {
        const categoryKey = key as keyof TasksByDate;
        const tasksInCategory = rawTaskGroups[categoryKey] as Task[];

        const filtered = tasksInCategory.filter(task => {
          const matchesSearch = searchTerm === '' ||
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
          const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'completed' && task.status === 'done') ||
            (filterStatus === 'incomplete' && task.status !== 'done');
          const matchesPriority = filterPriority === 'all' ||
            task.priority === filterPriority;
          const matchesCategory = filterCategory === 'all' ||
            task.category === filterCategory;

          return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });

        filtered.sort(sortTasksByPriority);
        groups[categoryKey] = filtered;
      }
    }
    return groups;
  }, [rawTaskGroups, searchTerm, filterStatus, filterPriority, filterCategory]);

  /**
   * Handles changes in the search input.
   * Updates the searchTerm state.
   * @param {string} newSearchTerm - The new search term.
   */
  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  /**
   * Handles changes in the filter controls.
   * Updates filterStatus, filterPriority, and filterCategory states.
   * @param {TaskFilterStatus} status - The new filter status.
   * @param {TaskFilterPriority} priority - The new filter priority.
   * @param {TaskFilterCategory} category - The new filter category.
   */
  const handleFilterChange = (status: TaskFilterStatus, priority: TaskFilterPriority, category: TaskFilterCategory) => {
    setFilterStatus(status);
    setFilterPriority(priority);
    setFilterCategory(category);
  };
  
  // --- NEW CATEGORY-BASED HORIZONTAL DISTRIBUTION ---
  // Generate category sections with tasks in horizontal rows
  const taskCategorySections = useMemo(() => {
    const sections: React.ReactNode[] = [];
    
    // Function placed inside useMemo to prevent unnecessary re-renders
    const getCategoryTitle = (category: keyof TasksByDate): string => {
      switch (category) {
        case 'completed': return t('dashboard.categories.completed');
        case 'overdue': return t('dashboard.categories.overdue');
        case 'today': return t('dashboard.categories.today');
        case 'tomorrow': return t('dashboard.categories.tomorrow');
        case 'dayAfterTomorrow': return t('dashboard.categories.dayAfterTomorrow');
        case 'nextWeek': return t('dashboard.categories.nextWeek');
        case 'later': return t('dashboard.categories.later');
        default: return '';
      }
    };
    
    // Loop through each category (overdue, today, etc.)
    (Object.keys(filteredAndSortedTaskGroups) as Array<keyof TasksByDate>).forEach(category => {
      const tasksInCategory = filteredAndSortedTaskGroups[category];
      
      // Only show categories with tasks
      if (tasksInCategory.length > 0) {
        // Add category title
        sections.push(
          <div key={`category-${category}`} className="mt-8 first:mt-0">
            <h2 className="text-lg sm:text-lg text-xl md:text-lg font-bold sm:font-semibold mb-4 sm:mb-3 text-center md:text-left relative pb-2 sm:pb-0">
              <span className="relative z-10">
                {getCategoryTitle(category)}{' '}
                <span className="text-sm font-normal text-muted-foreground">({tasksInCategory.length})</span>
              </span>
              {/* Decoratieve lijn onder categorie titel - alleen op mobiel */}
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-blue-700 to-purple-800 rounded sm:hidden"></span>
            </h2>
            
            {/* Grid container for tasks - responsive with 1, 2 or 4 columns */}
            <motion.div
              className="sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 hidden"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {tasksInCategory.map(task => (
                <motion.div
                  key={task.id}
                  variants={cardVariants}
                  layout="position"
                  className="mb-2"
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
              {/* Custom condition for the placeholder card */}
              {category === 'today' && (tasksInCategory.length === 0 || tasksInCategory.length % 4 !== 0) && (
                <motion.div
                  key="add-new-task-placeholder"
                  variants={cardVariants}
                  layout="position"
                  className="mb-2"
                >
                  <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                    <DialogTrigger asChild>
                      <Card className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 hover:border-primary/40 transition-colors cursor-pointer bg-card/50 hover:bg-muted/10">
                        <PlusCircle className="h-10 w-10 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                        <span className="mt-2 text-sm text-muted-foreground/90 group-hover:text-primary transition-colors">
                          {t('dashboard.addNewTaskPlaceholder')}
                        </span>
                      </Card>
                    </DialogTrigger>
                    <DialogPortal>
                      <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                      <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card/90 backdrop-blur-md border-white/10 p-6 shadow-lg sm:rounded-lg z-50 sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl">{t('appLayout.newTaskDialog.title')}</DialogTitle>
                          <DialogDescription>
                            {t('appLayout.newTaskDialog.description')}
                          </DialogDescription>
                        </DialogHeader>
                        <NewTaskDialog setOpen={setIsNewTaskOpen} />
                      </DialogContent>
                    </DialogPortal>
                  </Dialog>
                </motion.div>
              )}
            </motion.div>

            {/* Horizontal scrollable container for mobile */}
            <div className="flex flex-col space-y-2 sm:hidden">
              {/* Dynamisch aantal taken per rij op basis van totaal aantal taken */}
              {(() => {
                // Bereken optimale aantal kaarten per rij
                let cardsPerRow = 4; // Standaard waarde
                const totalCards = tasksInCategory.length;
                
                // Bereken dynamisch aantal rijen/kaarten
                if (totalCards <= 6) {
                  // Voor weinig kaarten: 1 rij
                  cardsPerRow = totalCards;
                } else if (totalCards <= 16) {
                  // Voor middelmatig aantal: ongeveer 4 per rij
                  cardsPerRow = 4;
                } else if (totalCards <= 36) {
                  // Voor groter aantal: ongeveer 6 per rij
                  cardsPerRow = 6;
                } else {
                  // Voor heel groot aantal: ongeveer wortel uit aantal (ongeveer vierkante indeling)
                  cardsPerRow = Math.min(8, Math.ceil(Math.sqrt(totalCards)));
                }
                
                // Zorg voor minimaal 2 kaarten per rij, als er kaarten zijn
                if (totalCards > 0) {
                  cardsPerRow = Math.max(2, cardsPerRow);
                }
                
                // Bereken aantal rijen
                const numberOfRows = Math.ceil(totalCards / cardsPerRow);
                
                return Array.from({ length: numberOfRows }).map((_, rowIndex) => (
                  <motion.div
                    key={`row-${category}-${rowIndex}`}
                    className="flex overflow-x-auto pb-3 px-4 -mx-4 gap-3 snap-x snap-mandatory hide-scrollbar lg:pb-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Lege ruimte aan het begin voor center-snap effect */}
                    <div className="flex-shrink-0 min-w-[8%]"></div>
                    
                    {tasksInCategory.slice(rowIndex * cardsPerRow, rowIndex * cardsPerRow + cardsPerRow).map(task => (
                      <motion.div
                        key={task.id}
                        variants={cardVariants}
                        layout="position"
                        className="flex-shrink-0 w-[85vw] max-w-[300px] snap-center shadow-md mt-1 mb-2.5 mx-1"
                      >
                        <TaskCard task={task} />
                      </motion.div>
                    ))}
                    
                    {/* Voeg de placeholder alleen toe aan de eerste rij als het category 'today' is */}
                    {category === 'today' && rowIndex === 0 && (tasksInCategory.length === 0 || tasksInCategory.length % cardsPerRow !== 0) && (
                      <motion.div
                        key="add-new-task-placeholder-mobile"
                        variants={cardVariants}
                        layout="position"
                        className="flex-shrink-0 w-[85vw] max-w-[300px] snap-center shadow-md mt-1 mb-2.5 mx-1"
                      >
                        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                          <DialogTrigger asChild>
                            <Card className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 hover:border-primary/40 transition-colors cursor-pointer bg-card/50 hover:bg-muted/10">
                              <PlusCircle className="h-10 w-10 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                              <span className="mt-2 text-sm text-muted-foreground/90 group-hover:text-primary transition-colors">
                                {t('dashboard.addNewTaskPlaceholder')}
                              </span>
                            </Card>
                          </DialogTrigger>
                        </Dialog>
                      </motion.div>
                    )}
                    
                    {/* Lege ruimte aan het einde voor center-snap effect */}
                    <div className="flex-shrink-0 min-w-[8%]"></div>
                  </motion.div>
                ));
              })()}
            </div>
          </div>
        );
      }
    });
    
    return sections;
  }, [filteredAndSortedTaskGroups, t, isNewTaskOpen]);
  // --- END NEW HORIZONTAL DISTRIBUTION ---

  // Construct the greeting text using user?.name
  const greeting = t('dashboard.greeting', { name: user?.name || user?.email || t('common.guest') });

  // --- Determine message for empty state ---
  let emptyStateMessage: React.ReactNode = null;
  // Check if there are *any* tasks *after filtering* in *any* category
  const hasAnyFilteredTasks = (Object.values(filteredAndSortedTaskGroups) as Task[][]).some(group => group.length > 0);

  if (!hasAnyFilteredTasks && (searchTerm !== '' || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all')) {
    emptyStateMessage = <p className="text-muted-foreground mb-4">{t('dashboard.emptyState.noTasksAfterFilter')}</p>;
  } else if (!hasAnyFilteredTasks) { // If there are no tasks at all (even before filtering)
    emptyStateMessage = (
      <>
        <p className="text-muted-foreground mb-4">{t('dashboard.emptyState.noTasksAtAll')}</p>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="lg" className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900">
              {t('dashboard.emptyState.addNewTaskButton')}
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card/90 backdrop-blur-md border-white/10 p-6 shadow-lg sm:rounded-lg z-50 sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{t('appLayout.newTaskDialog.title')}</DialogTitle>
                <DialogDescription>
                  {t('appLayout.newTaskDialog.description')}
                </DialogDescription>
              </DialogHeader>
              <NewTaskDialog setOpen={setIsNewTaskOpen} />
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </>
    );
  }
  // --- End message for empty state ---

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
          </div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="h-6 w-40" />
              {Array.from({ length: 2 }).map((_, cardIndex) => (
                <Skeleton key={cardIndex} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Greeting and Search/Filter Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Wrapper div for Greeting and Subtitle */}
          <div className="w-full md:w-auto text-center md:text-left"> 
            <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold relative overflow-visible">
              <span className="animated-gradient-text block">
                <TypedGreeting 
                  text={greeting}
                  speed={50}
                  gradientColors={{
                    start: greetingGradientStart,
                    end: greetingGradientEnd
                  }}
                />
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('dashboard.tasksOverview')}
            </p>
          </div>
          {/* Search and Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SearchInput
              onChange={handleSearchChange}
              placeholder={t('dashboard.searchPlaceholder')}
              className="flex-grow min-w-0"
            />
            <TaskFilter 
              onFilterChange={handleFilterChange} 
            />
          </div>
        </div>

        {/* New task category view - horizontal rows per category */}
        <AnimatePresence mode="sync">
          {hasAnyFilteredTasks ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
              variants={containerVariants}
            >
              {taskCategorySections}
            </motion.div>
          ) : (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center mt-8"
            >
              {emptyStateMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button for new task (mobile only) */}
        <AnimatePresence>
          {showMobileActions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-[75.4px] right-6 z-40 lg:hidden"
              transition={{ duration: 0.2 }}
            >
              <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                <DialogTrigger asChild>
                  <div className="flex flex-col items-center cursor-pointer">
                    <Button
                      variant="default"
                      size="icon"
                      className="aspect-square rounded-full h-14 w-14 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white shadow-lg mb-1"
                      aria-label={t('navbar.newTaskButton.ariaLabel')}
                    >
                      <PlusCircle className="h-7 w-7" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-background/70 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">{t('navbar.newTaskButton.text')}</span>
                  </div>
                </DialogTrigger>
              </Dialog>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
