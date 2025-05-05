// import React from 'react'; // Verwijderd, niet meer nodig na vervangen Fragment
import React, { useState } from 'react'; // Add React import for React.isValidElement and useState
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import TaskCard from "@/components/task/TaskCard.tsx";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Task, TasksByDate, TaskPriority } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
// import { Link } from "react-router-dom"; // Removed unused import
import { Plus } from 'lucide-react'; // Import Plus icon
import SearchInput from '@/components/ui/SearchInput.tsx'; // Import SearchInput
import TaskFilter, { TaskFilterStatus, TaskFilterPriority } from '@/components/ui/TaskFilter.tsx'; // Import TaskFilter and types
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogPortal,
} from "@/components/ui/dialog.tsx";
import NewTaskDialog from "@/components/tasks/NewTaskDialog.tsx";
import { TypeAnimation } from 'react-type-animation'; // Import the component

const getCategoryTitle = (category: keyof TasksByDate): string => {
  switch (category) {
    case 'overdue': return 'Verlopen';
    case 'today': return 'Vandaag';
    case 'tomorrow': return 'Morgen';
    case 'dayAfterTomorrow': return 'Overmorgen';
    case 'nextWeek': return 'Volgende week';
    case 'later': return 'Binnenkort';
    default: return '';
  }
};

// Prioriteitsmapping voor sorteren
const priorityOrder: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

// Sorteerfunctie voor taken op prioriteit (aflopend)
const sortTasksByPriority = (a: Task, b: Task): number => {
  return priorityOrder[b.priority] - priorityOrder[a.priority];
};

export default function Dashboard() {
  const { isLoading, groupTasksByDate } = useTask();
  const { user } = useAuth();
  const taskGroups = groupTasksByDate();
  const [searchTerm, setSearchTerm] = useState(''); // Add state for search term
  const [filterStatus, setFilterStatus] = useState<TaskFilterStatus>('all'); // Add state for filter status
  const [filterPriority, setFilterPriority] = useState<TaskFilterPriority>('all'); // Add state for filter priority
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false); // State voor nieuwe taak dialog

  // --- Sorteer taken binnen elke groep op prioriteit ---
  for (const key in taskGroups) {
    if (Object.prototype.hasOwnProperty.call(taskGroups, key)) {
      // Type assertion nodig omdat TS niet weet dat elke property een Task[] is
      (taskGroups[key as keyof TasksByDate] as Task[]).sort(sortTasksByPriority);
    }
  }
  // --- Einde sorteren ---

  // allTasksOrdered wordt nu gemaakt met de gesorteerde groepen
  const allTasksOrdered: { task: Task; category: keyof TasksByDate }[] = [
    ...taskGroups.overdue.map((task: Task) => ({ task, category: 'overdue' as const })),
    ...taskGroups.today.map((task: Task) => ({ task, category: 'today' as const })),
    ...taskGroups.tomorrow.map((task: Task) => ({ task, category: 'tomorrow' as const })),
    ...taskGroups.dayAfterTomorrow.map((task: Task) => ({ task, category: 'dayAfterTomorrow' as const })),
    ...taskGroups.nextWeek.map((task: Task) => ({ task, category: 'nextWeek' as const })),
    ...taskGroups.later.map((task: Task) => ({ task, category: 'later' as const })),
  ];

  // --- Filter taken op basis van zoekterm en filters ---
  const filteredTasks = allTasksOrdered.filter(({ task }) => {
    // Zoekterm filter (titel of beschrijving)
    const matchesSearch = searchTerm === '' ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'completed' && task.status === 'done') ||
      (filterStatus === 'incomplete' && task.status !== 'done');

    // Prioriteit filter
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });
  // --- Einde filteren ---

  // --- Callback voor filter wijzigingen ---
  const handleFilterChange = (status: TaskFilterStatus, priority: TaskFilterPriority) => {
    setFilterStatus(status);
    setFilterPriority(priority);
  };
  // --- Einde callback ---

  // --- Herstel logica voor evenwichtige kolomverdeling ---
  const numColumns = 3; 
  const columns: React.ReactNode[][] = Array.from({ length: numColumns }, () => []);
  let lastCategory: keyof TasksByDate | null = null;
  const totalTasks = filteredTasks.length; 

  // Bereken basis aantal taken per kolom en de rest
  const baseTasks = Math.floor(totalTasks / numColumns);
  const remainder = totalTasks % numColumns;

  // Bepaal kolomgroottes voor evenwichtige verdeling
  const col0Size = baseTasks;
  let col1Size = baseTasks;
  let col2Size = baseTasks;

  // Verdeel de rest (bijv. bij 10 taken -> 3, 4, 3; bij 11 taken -> 3, 4, 4)
  if (remainder === 1) {
    col1Size += 1; // Geef extra taak aan de middelste kolom
  } else if (remainder === 2) {
    col1Size += 1; // Geef extra taak aan middelste kolom
    col2Size += 1; // Geef extra taak aan laatste kolom
  }

  // Definieer de breekpunten voor kolomverdeling
  const columnBreak1 = col0Size;
  const columnBreak2 = col0Size + col1Size;

  filteredTasks.forEach(({ task, category }, taskIndex) => { 
    const showTitle = category !== lastCategory;
    
    // Bepaal doelkolom op basis van index en breekpunten
    let targetColumnIndex;
    if (taskIndex < columnBreak1) {
        targetColumnIndex = 0; // Eerste kolom
    } else if (taskIndex < columnBreak2) {
        targetColumnIndex = 1; // Tweede kolom
    } else {
        targetColumnIndex = 2; // Derde kolom
    }

    if (showTitle) {
      columns[targetColumnIndex].push(
        // Pas padding top responsive aan
        <h2 key={`title-${String(category)}-${targetColumnIndex}`} className="text-lg font-semibold mb-3 pt-3 md:pt-0"> 
          {getCategoryTitle(category)}
        </h2>
      );
    }
    lastCategory = category;

    columns[targetColumnIndex].push(
      // Kleine margin op mobiel, herstel op md:
      <div key={task.id} className="mb-2 md:mb-6"> 
        <TaskCard task={task} />
      </div>
    );
  });
  // --- Einde logica voor evenwichtige verdeling ---

  // Construct the greeting text dynamically
  const greetingText = `Hallo, ${user?.name || "Gebruiker"}`;

  // --- Bepaal bericht voor lege staat ---
  let emptyStateMessage: React.ReactNode = null;
  if (filteredTasks.length === 0 && (searchTerm !== '' || filterStatus !== 'all' || filterPriority !== 'all')) {
    emptyStateMessage = <p className="text-muted-foreground mb-4">Geen taken gevonden die voldoen aan de filters.</p>;
  } else if (allTasksOrdered.length === 0) {
    emptyStateMessage = (
      <>
        <p className="text-muted-foreground mb-4">Je hebt nog geen taken.</p>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen} modal={false}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white">
              <Plus className="mr-2 h-5 w-5" />
              Nieuwe Taak Toevoegen
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
      </>
    );
  }
  // --- Einde bericht lege staat ---

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
      {/* Verpak header in een flex container - maak responsive */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
        {/* Linker gedeelte (Begroeting) */}
        <div className="mb-6 md:mb-0">
          <h1 className="text-3xl font-bold h-10"> {/* Or min-h-10 */}
            {/* Use TypeAnimation here */}
            {/* Added check to only render animation when user data is potentially available */}
            {user !== undefined && (
              <TypeAnimation
                sequence={[
                  100, // Start after a short delay
                  greetingText,
                ]}
                wrapper="span"
                speed={50}
                className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"
                cursor
                // repeat={0} // Default is 0 (no repeat)
              />
            )}
          </h1>
          <p className="text-muted-foreground">
            Hier is een overzicht van je taken
          </p>
        </div>
        {/* Rechter gedeelte (Zoekbalk & Filter) - Conditioneel weergeven en maak responsive */}
        {allTasksOrdered.length > 0 && (
          /* Altijd flex-row, items centreren */
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SearchInput
              placeholder="Zoek taken..."
              /* Verwijder expliciete breedte, laat flexbox het regelen of pas aan indien nodig */
              className="flex-grow min-w-0" // Removed ineffective h-10
              onChange={setSearchTerm} // Koppel aan state updater
            />
            <TaskFilter onFilterChange={handleFilterChange} /> {/* Filter knop neemt zijn eigen breedte */}
          </div>
        )}
      </div>

      {/* Geen gap op mobiel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6 items-start">
        {totalTasks > 0 ? ( // Gebruik totalTasks gebaseerd op gefilterde lijst
          // Render de vooraf gevulde kolom-arrays
          columns.map((columnItems, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-0"> 
              {/* --- Placeholder Logica --- */}
              {
                // Controleer of het eerste item bestaat en GEEN h2 is
                columnItems.length > 0 && 
                React.isValidElement(columnItems[0]) && 
                columnItems[0].type !== 'h2' && (
                  // Render placeholder met geschatte hoogte van titel + marge
                  // Verberg op mobiel (default), toon vanaf md: breakpoint
                  <div className="hidden md:block h-10"></div> 
                )
              }
              {/* --- Einde Placeholder Logica --- */}
              {columnItems.map((item) => {
                // Item is al een ReactNode (h2 of div)
                return item;
              })}
            </div>
          ))
        ) : (
          <div className="text-center col-span-1 md:col-span-3 mt-8">
            {emptyStateMessage} {/* Render the determined message */}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
