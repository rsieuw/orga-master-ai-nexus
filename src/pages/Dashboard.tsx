// import React from 'react'; // Verwijderd, niet meer nodig na vervangen Fragment
import React from 'react'; // Add React import for React.isValidElement
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import TaskCard from "@/components/task/TaskCard.tsx";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Task, TasksByDate, TaskPriority } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "react-router-dom";
import { Plus } from 'lucide-react'; // Import Plus icon

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

  // --- Logica voor 4-4-5 kolomverdeling ---
  const numColumns = 3;
  const columns: React.ReactNode[][] = Array.from({ length: numColumns }, () => []);
  let lastCategory: keyof TasksByDate | null = null;
  const totalTasks = allTasksOrdered.length;
  
  const baseTasks = Math.floor(totalTasks / numColumns); 
  const columnBreak1 = baseTasks; 
  const columnBreak2 = baseTasks * 2; 

  allTasksOrdered.forEach(({ task, category }, taskIndex) => {
    const showTitle = category !== lastCategory;
    
    let targetColumnIndex;
    if (taskIndex < columnBreak1) {
        targetColumnIndex = 0;
    } else if (taskIndex < columnBreak2) {
        targetColumnIndex = 1;
    } else {
        targetColumnIndex = 2;
    }

    if (showTitle) {
      columns[targetColumnIndex].push(
        <h2 key={`title-${String(category)}`} className="text-lg font-semibold mb-3 pt-0 break-inside-avoid">
          {getCategoryTitle(category)}
        </h2>
      );
    }
    lastCategory = category;

    columns[targetColumnIndex].push(
      <div key={task.id} className="mb-6 break-inside-avoid">
        <TaskCard task={task} />
      </div>
    );
  });
  // --- Einde logica voor 4-4-5 verdeling ---

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Hallo, {user?.name || "Gebruiker"}
          </span>
        </h1>
        <p className="text-muted-foreground">
          Hier is een overzicht van je taken
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {totalTasks > 0 ? (
          columns.map((columnItems, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-0">
              {columnItems.map((item) => {
                // Bepaal of het de eerste kaart is in een latere kolom
                const isCardDiv = React.isValidElement(item) && item.type === 'div';
                const isFirstItemInColumn = columnItems[0] === item;
                const needsAlignment = isFirstItemInColumn && colIndex > 0 && isCardDiv;

                if (needsAlignment) {
                  // Wikkel de kaart-div in een div met de margin
                  return <div className="mt-[2.5rem]" key={(item as React.ReactElement).key}>{item}</div>;
                } else {
                  // Geef de titel of kaart-div direct weer
                  return item;
                }
              })}
            </div>
          ))
        ) : (
          <div className="text-center col-span-1 md:col-span-3 mt-8">
            <p className="text-muted-foreground mb-4">Je hebt nog geen taken.</p>
            <Link to="/new-task">
              {/* Added size="lg" and Plus icon */}
              <Button size="lg" className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white">
                <Plus className="mr-2 h-5 w-5" /> {/* Icon added */} 
                Nieuwe Taak Toevoegen
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
