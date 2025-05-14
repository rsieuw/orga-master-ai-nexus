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
import { TypeAnimation } from 'react-type-animation'; // Import the component
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, Variants } from 'framer-motion'; // Framer Motion import and Variants

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
const sortTasksByPriority = (a: Task, b: Task): number => {
  return priorityOrder[b.priority] - priorityOrder[a.priority];
};

// Variants voor animaties
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

// Define the gradient values for the animation
const priorityGradients = [
  '#b12429', // Rood
  '#8112a9', // Paars
  '#690365', // Donkerpaars
  '#db7b0b', // Oranje
  '#9e4829', // Bruinrood
  '#651945', // Donkerrood
  '#3b82f6', // Blauw
  '#22d3ee', // Cyaan
  '#14b8a6', // Teal
  '#2563eb', // Donkerblauw
  '#a78bfa', // Lichtpaars
  '#7e22ce', // Paars
  '#b12429'  // Terug naar begin voor een naadloze cyclus
];

// CSS Animation style voor een perfect vloeiende gradient animatie
const gradientAnimationStyle = `
  .animated-gradient-text {
    background: linear-gradient(
      to right,
      ${priorityGradients.join(', ')}
    );
    background-size: 400% 100%;
    animation: gradientFlow 45s ease-in-out infinite;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  @keyframes gradientFlow {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

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

  // Effect om de gradient animatiestijl in te voegen in het document
  useEffect(() => {
    // Voeg de stijl toe aan het document
    const styleElement = document.createElement('style');
    styleElement.textContent = gradientAnimationStyle;
    document.head.appendChild(styleElement);

    // Opruimfunctie om de stijl te verwijderen als de component unmounts
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const rawTaskGroups = groupTasksByDate();

  const filteredAndSortedTaskGroups = useMemo(() => {
    const groups: TasksByDate = {
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

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  const handleFilterChange = (status: TaskFilterStatus, priority: TaskFilterPriority, category: TaskFilterCategory) => {
    setFilterStatus(status);
    setFilterPriority(priority);
    setFilterCategory(category);
  };
  
  // --- NIEUWE CATEGORIE-GEBASEERDE HORIZONTALE DISTRIBUTIE ---
  // Genereer categorie secties met taken in horizontale rijen
  const taskCategorySections = useMemo(() => {
    const sections: React.ReactNode[] = [];
    
    // Functie binnen useMemo geplaatst om onnodige re-renders te voorkomen
    const getCategoryTitle = (category: keyof TasksByDate): string => {
      switch (category) {
        case 'overdue': return t('dashboard.categories.overdue');
        case 'today': return t('dashboard.categories.today');
        case 'tomorrow': return t('dashboard.categories.tomorrow');
        case 'dayAfterTomorrow': return t('dashboard.categories.dayAfterTomorrow');
        case 'nextWeek': return t('dashboard.categories.nextWeek');
        case 'later': return t('dashboard.categories.later');
        default: return '';
      }
    };
    
    // Loop door elke categorie (overdue, today, etc.)
    (Object.keys(filteredAndSortedTaskGroups) as Array<keyof TasksByDate>).forEach(category => {
      const tasksInCategory = filteredAndSortedTaskGroups[category];
      
      // Alleen categorieën met taken tonen
      if (tasksInCategory.length > 0) {
        // Voeg categorie titel toe
        sections.push(
          <div key={`category-${category}`} className="mt-8 first:mt-0">
            <h2 className="text-lg font-semibold mb-3">
              {getCategoryTitle(category)}{' '}
              <span className="text-sm font-normal text-muted-foreground">({tasksInCategory.length})</span>
            </h2>
            
            {/* Grid container voor de taken - responsief met 1, 2 of 4 kolommen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
            </div>
          </div>
        );
      }
    });
    
    return sections;
  }, [filteredAndSortedTaskGroups, t]);
  // --- EINDE NIEUWE HORIZONTALE DISTRIBUTIE ---

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
          <div> 
            <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold"> 
              <span className="animated-gradient-text">
                <TypeAnimation
                  sequence={[
                    100, 
                    greeting,
                  ]}
                  wrapper="span"
                  speed={50}
                  cursor
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

        {/* Nieuwe taak categorieweergave - horizontale rijen per categorie */}
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
                    <span className="text-xs text-muted-foreground">{t('navbar.newTaskButton.text')}</span>
                  </div>
                </DialogTrigger>
                <DialogPortal>
                  <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                  <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card/90 backdrop-blur-md border-white/10 p-6 shadow-lg sm:rounded-lg z-[70] sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
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
