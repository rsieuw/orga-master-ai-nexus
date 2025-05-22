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
import { cn } from "@/lib/utils.ts";

/**
 * @constant LOCAL_STORAGE_KEYS
 * @description Object containing keys for local storage items.
 */
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
/**
 * @constant priorityOrder
 * @description Maps task priority levels to numerical values for sorting.
 * Higher numbers indicate higher priority.
 */
const priorityOrder: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

// Sort function for tasks by priority (descending) and new status
/**
 * Sorts tasks first by their 'isNew' status (new tasks first),
 * then by priority in descending order (High > Medium > Low > None).
 * @param {Task} a - The first task to compare.
 * @param {Task} b - The second task to compare.
 * @returns {number} Returns -1 if a should come before b, 1 if b should come before a, 0 if equal.
 */
const sortTasksByPriority = (a: Task, b: Task): number => {
  // Sort new tasks first
  if (a.isNew && !b.isNew) {
    return -1; // a comes first
  }
  if (!a.isNew && b.isNew) {
    return 1; // b comes first
  }

  // If both are new or both are not new, sort by priority
  return priorityOrder[b.priority] - priorityOrder[a.priority];
};

/**
 * Animation variants for container elements.
 * Controls the animation of the container when it enters or exits the DOM.
 */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

/**
 * Animation variants for individual card elements.
 * Defines how cards animate when they enter, are visible, and exit the DOM.
 */
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "tween",
      ease: "easeInOut",
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
  const [isFabVisible, setIsFabVisible] = useState(true);
  const fabScrollTimeoutDashboard = useRef<number | null>(null);
  const FAB_SCROLL_THRESHOLD = 5;

  // State object for tracking active pages per category
  const [activePages, setActivePages] = useState<Record<string, number>>({});

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

  // NEW: Effect for managing FAB visibility on scroll direction
  useEffect(() => {
    let localLastScrollY = typeof globalThis !== 'undefined' && typeof globalThis.scrollY === 'number' ? globalThis.scrollY : 0;

    const handleFabScroll = () => {
      if (typeof globalThis === 'undefined' || typeof globalThis.scrollY !== 'number') return; // Guard against globalThis or scrollY not being available
      const currentScrollY = globalThis.scrollY;
      const scrollDifference = currentScrollY - localLastScrollY;

      if (Math.abs(scrollDifference) > FAB_SCROLL_THRESHOLD) {
        if (currentScrollY > localLastScrollY && currentScrollY > 50) { // Scrolled down
          setIsFabVisible(false);
        } else { // Scrolled up or at the top
          setIsFabVisible(true);
        }
      }
      localLastScrollY = currentScrollY;
    };

    const throttledHandleFabScroll = () => {
      if (typeof globalThis === 'undefined' || typeof globalThis.setTimeout !== 'function') return; // Guard against globalThis or setTimeout not being available
      if (fabScrollTimeoutDashboard.current) {
        clearTimeout(fabScrollTimeoutDashboard.current);
      }
      fabScrollTimeoutDashboard.current = globalThis.setTimeout(handleFabScroll, 100);
    };

    if (typeof globalThis !== 'undefined' && typeof globalThis.innerWidth === 'number' && globalThis.innerWidth < 768 && typeof globalThis.addEventListener === 'function') { // Only apply for mobile (md breakpoint)
        globalThis.addEventListener('scroll', throttledHandleFabScroll, { passive: true });
    }

    return () => {
      if (fabScrollTimeoutDashboard.current && typeof globalThis.clearTimeout === 'function') { // check clearTimeout availability
        clearTimeout(fabScrollTimeoutDashboard.current);
      }
      if (typeof globalThis !== 'undefined' && typeof globalThis.innerWidth === 'number' && globalThis.innerWidth < 768 && typeof globalThis.removeEventListener === 'function') { // Check globalThis for removal as well
          globalThis.removeEventListener('scroll', throttledHandleFabScroll);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  // Effect to add the gradient animation style to the document
  useEffect(() => {
    // Add the style to the document
    const styleElement = document.createElement('style');
    styleElement.textContent = gradientAnimationStyle + `
      /* Hide scrollbars on mobile but retain functionality */
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
      favorites: [],
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
        case 'favorites': return t('dashboard.categories.favorites');
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
    
    const categoryOrder: Array<keyof TasksByDate> = [
      'favorites',
      'overdue', 'today', 'tomorrow', 'dayAfterTomorrow', 'nextWeek', 'later'
    ];

    // Helper function to generate a section
    const generateSection = (category: keyof TasksByDate, tasksInCategory: Task[]) => {
      // Show the section if there are tasks, OR if it's the 'today' category (to be able to show the placeholder)
      if (tasksInCategory.length > 0 || category === 'today') {
        return (
          <div key={`category-${category}`} className="mt-4 first:mt-0"> {/* Less space above each section */}
            <h2 className="text-lg sm:text-lg text-xl md:text-lg font-bold sm:font-semibold mb-2 sm:mb-2 text-center md:text-left relative pb-2 sm:pb-0">
              <span className="relative z-10">
                {getCategoryTitle(category)}{' '}
                <span className="text-sm font-normal text-muted-foreground">({tasksInCategory.length})</span>
              </span>
              {/* Decorative line under category title - mobile only */}
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-blue-700 to-purple-800 rounded sm:hidden"></span>
            </h2>
            
            {/* Grid container for tasks - responsive with 1, 2 or 4 columns */}
            <motion.div
              className="sm:grid md:grid-cols-2 lg:hidden gap-3 md:gap-4 hidden"
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
              {/* Custom condition for the placeholder card on tablet */}
              {category === 'today' && (tasksInCategory.length === 0 || tasksInCategory.length % 2 !== 0) && (
                <motion.div
                  key="add-new-task-placeholder"
                  variants={cardVariants}
                  layout="position"
                  className="mb-2 h-full"
                >
                  <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                    <DialogTrigger asChild>
                      <Card className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 hover:border-primary/40 transition-colors cursor-pointer bg-card/50 hover:bg-muted/10 min-h-[208px]">
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

            {/* NEW Desktop grid with horizontal scrolling for 3x4 layout */}
            <div className="hidden lg:block">
              {(() => {
                // Calculate how many pages of 12 cards we need
                const tasksPerPage = 12; // 3 rows x 4 columns
                const totalTasks = tasksInCategory.length;
                const pagesCount = Math.ceil(totalTasks / tasksPerPage);
                
                // Only render if there are at least 5 tasks, otherwise use the standard grid
                if (totalTasks < 5) {
                  return (
                    <motion.div
                      className="grid grid-cols-4 gap-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {tasksInCategory.map((task) => (
                        <motion.div
                          key={task.id}
                          variants={cardVariants}
                          layout="position"
                          className="mb-2"
                        >
                          <TaskCard task={task} />
                        </motion.div>
                      ))}
                      
                      {/* Add new task placeholder for desktop < 5 tasks */}
                      {category === 'today' && (tasksInCategory.length === 0 || tasksInCategory.length % 4 !== 0) && (
                        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                          <DialogTrigger asChild>
                            <Card className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 hover:border-primary/40 transition-colors cursor-pointer bg-card/50 hover:bg-muted/10 min-h-[208px]">
                              <PlusCircle className="h-10 w-10 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                              <span className="mt-2 text-sm text-muted-foreground/90 group-hover:text-primary transition-colors">
                                {t('dashboard.addNewTaskPlaceholder')}
                              </span>
                            </Card>
                          </DialogTrigger>
                        </Dialog>
                      )}
                    </motion.div>
                  );
                }
                
                // Get or initialize the active page for this category
                const activePage = activePages[category] || 0;
                
                return (
                  <div className="relative group">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`page-${category}-${activePage}`}
                        className="grid grid-cols-4 gap-4 mb-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {tasksInCategory
                          .slice(activePage * tasksPerPage, (activePage + 1) * tasksPerPage)
                          .map((task) => (
                          <motion.div
                            key={task.id}
                            variants={cardVariants}
                            className="mb-2"
                          >
                            <TaskCard task={task} />
                          </motion.div>
                        ))}
                        
                        {/* Add new task placeholder if this is the first page and category is 'today' */}
                        {activePage === 0 && category === 'today' && (
                          <motion.div className="h-full"> {/* Wrapper to take full height */}
                            <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                              <DialogTrigger asChild>
                                <Card className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 hover:border-primary/40 transition-colors cursor-pointer bg-card/50 hover:bg-muted/10 min-h-[208px]">
                                  <PlusCircle className="h-10 w-10 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                                  <span className="mt-2 text-sm text-muted-foreground/90 group-hover:text-primary transition-colors">
                                    {t('dashboard.addNewTaskPlaceholder')}
                                  </span>
                                </Card>
                              </DialogTrigger>
                            </Dialog>
                          </motion.div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Navigation controls */}
                    {pagesCount > 1 && (
                      <>
                        {/* Left arrow */}
                        {activePage > 0 && (
                          <button 
                            type="button"
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-6 bg-card/80 hover:bg-primary/10 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={() => setActivePages({...activePages, [category]: activePage - 1})}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m15 18-6-6 6-6"/>
                            </svg>
                          </button>
                        )}
                        
                        {/* Right arrow */}
                        {activePage < pagesCount - 1 && (
                          <button 
                            type="button"
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-6 bg-card/80 hover:bg-primary/10 rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            onClick={() => setActivePages({...activePages, [category]: activePage + 1})}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 18 6-6-6-6"/>
                            </svg>
                          </button>
                        )}
                        
                        {/* Page indicators */}
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {Array.from({ length: pagesCount }).map((_, i) => (
                            <button
                              key={`page-indicator-${i}`}
                              type="button"
                              className={`w-2.5 h-2.5 rounded-full transition-all ${i === activePage ? 'bg-primary scale-110' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                              onClick={() => setActivePages({...activePages, [category]: i})}
                              aria-label={`Page ${i+1} of ${pagesCount}`}
                            ></button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Horizontal scrollable container for mobile */}
            <div className="flex flex-col space-y-2 sm:hidden">
              {(() => {
                const totalCards = tasksInCategory.length;

                // Special case: If it's 'today' and there are no tasks, render only the placeholder.
                if (category === 'today' && totalCards === 0) {
                  return (
                    <motion.div
                      key={`row-${category}-placeholder-only`}
                      className="flex overflow-x-auto pb-3 px-4 -mx-4 gap-3 snap-x snap-mandatory hide-scrollbar lg:pb-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <div className="flex-shrink-0 min-w-[8%]"></div>
                      <motion.div
                        key="add-new-task-placeholder-mobile"
                        variants={cardVariants}
                        layout="position"
                        className="flex-shrink-0 w-[85vw] max-w-[300px] snap-center shadow-md mt-1 mb-2.5 mx-1 h-full"
                      >
                        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                          <DialogTrigger asChild>
                            <Card className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 hover:border-primary/40 transition-colors cursor-pointer bg-card/50 hover:bg-muted/10 min-h-[208px]">
                              <PlusCircle className="h-10 w-10 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                              <span className="mt-2 text-sm text-muted-foreground/90 group-hover:text-primary transition-colors">
                                {t('dashboard.addNewTaskPlaceholder')}
                              </span>
                            </Card>
                          </DialogTrigger>
                        </Dialog>
                      </motion.div>
                      <div className="flex-shrink-0 min-w-[8%]"></div>
                    </motion.div>
                  );
                }

                // If there are no tasks and it's not 'today', render nothing.
                if (totalCards === 0) { // category !== 'today' is implied here due to the check above
                  return null;
                }

                // Calculate optimal cards per row
                const MIN_CARDS_MOBILE = 3;
                const ABSOLUTE_MAX_CARDS_MOBILE = 10;

                let optimalCardsPerRow = MIN_CARDS_MOBILE;

                if (totalCards <= MIN_CARDS_MOBILE) {
                    optimalCardsPerRow = totalCards;
                } else {
                    // Check for perfect square
                    const sqrt = Math.sqrt(totalCards);
                    if (Number.isInteger(sqrt) && sqrt >= MIN_CARDS_MOBILE && sqrt <= ABSOLUTE_MAX_CARDS_MOBILE) {
                        optimalCardsPerRow = sqrt;
                    } else {
                        // Find the best distribution
                        let bestOption = {
                            cards: optimalCardsPerRow,
                            rows: Math.ceil(totalCards / optimalCardsPerRow),
                            remainder: totalCards % optimalCardsPerRow,
                            score: 0 // Higher score is better (prefer fewer rows, then fewer remainder, then more cards per row)
                        };

                        for (let cards = MIN_CARDS_MOBILE; cards <= ABSOLUTE_MAX_CARDS_MOBILE; cards++) {
                            if (cards > totalCards) continue; // Not more cards per row than available

                            const rows = Math.ceil(totalCards / cards);
                            const remainder = totalCards % cards;
                            
                            let currentScore = 0;
                            currentScore -= rows * 1000; // Heavily penalize more rows
                            if (remainder === 0) {
                                currentScore += 500; // Reward no remainder
                            }
                            currentScore += remainder * 10; // Slightly penalize remainder
                            currentScore += cards; // Prefer more cards per row if other factors are equal

                            if (currentScore > bestOption.score) {
                                bestOption = { cards, rows, remainder, score: currentScore };
                            }
                        }
                        optimalCardsPerRow = bestOption.cards;
                    }
                }

                optimalCardsPerRow = Math.min(optimalCardsPerRow, totalCards); 
                optimalCardsPerRow = totalCards <= MIN_CARDS_MOBILE ? totalCards : Math.max(MIN_CARDS_MOBILE, optimalCardsPerRow);
                optimalCardsPerRow = Math.min(optimalCardsPerRow, ABSOLUTE_MAX_CARDS_MOBILE); 

                const cardsPerRow = optimalCardsPerRow;
                const numberOfRows = Math.ceil(totalCards / cardsPerRow);
                
                return Array.from({ length: numberOfRows }).map((_, rowIndex) => (
                  <motion.div
                    key={`row-${category}-${rowIndex}`}
                    className="flex overflow-x-auto pb-3 px-4 -mx-4 gap-3 snap-x snap-mandatory hide-scrollbar lg:pb-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
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
                    
                    {/* Placeholder for mobile view, shown after the tasks if the category is 'today' */}
                    {/* This condition should now correctly display the placeholder alongside tasks if it's the first row of 'today' */}
                    {category === 'today' && rowIndex === 0 && (
                      <motion.div
                        key="add-new-task-placeholder-mobile"
                        variants={cardVariants}
                        layout="position"
                        className="flex-shrink-0 w-[85vw] max-w-[300px] snap-center shadow-md mt-1 mb-2.5 mx-1 h-full"
                      >
                        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                          <DialogTrigger asChild>
                            <Card className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 hover:border-primary/40 transition-colors cursor-pointer bg-card/50 hover:bg-muted/10 min-h-[208px]">
                              <PlusCircle className="h-10 w-10 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                              <span className="mt-2 text-sm text-muted-foreground/90 group-hover:text-primary transition-colors">
                                {t('dashboard.addNewTaskPlaceholder')}
                              </span>
                            </Card>
                          </DialogTrigger>
                        </Dialog>
                      </motion.div>
                    )}
                    
                    <div className="flex-shrink-0 min-w-[8%]"></div>
                  </motion.div>
                ));
              })()}
            </div>
          </div>
        );
      }
      return null; // No tasks and not 'today'
    };

    // Loop through the defined order
    categoryOrder.forEach(category => {
      const tasksInCategory = filteredAndSortedTaskGroups[category];
      const section = generateSection(category, tasksInCategory);
      if (section) sections.push(section);
    });

    // Explicitly add the 'completed' section last
    const completedTasks = filteredAndSortedTaskGroups.completed;
    const completedSection = generateSection('completed', completedTasks);
    if (completedSection) sections.push(completedSection);
    
    return sections;
  }, [filteredAndSortedTaskGroups, t, isNewTaskOpen, activePages]); // These dependencies are sufficient
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

        {/* FAB button for mobile */}
        <AnimatePresence>
          {typeof globalThis !== 'undefined' && typeof globalThis.innerWidth === 'number' && globalThis.innerWidth < 768 && (
            <motion.div
              className={cn(
                "fixed bottom-[75.4px] right-6 z-40 lg:hidden transition-all duration-300 ease-in-out",
                isFabVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
              )}
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
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-background/70 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none">{t('navbar.newTaskButton.fabText')}</span>
                  </div>
                </DialogTrigger>
                <DialogPortal>
                  <DialogOverlay className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                  <DialogContent 
                    className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card/90 backdrop-blur-md p-6 shadow-lg sm:rounded-lg z-[101] sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
                    onOpenAutoFocus={(e) => e.preventDefault()} 
                  >
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
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
