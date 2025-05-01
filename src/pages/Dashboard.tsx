import { useTask } from "@/contexts/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import TaskSection from "@/components/task/TaskSection";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { isLoading, groupTasksByDate } = useTask();
  const { user } = useAuth();
  const taskGroups = groupTasksByDate();

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
        <div className="flex flex-col gap-6 md:col-span-1">
          <TaskSection
            title="Vandaag"
            tasks={taskGroups.today}
            emptyMessage="Geen taken voor vandaag"
          />
          
          <TaskSection
            title="Morgen"
            tasks={taskGroups.tomorrow}
            emptyMessage="Geen taken voor morgen"
          />
        </div>

        <div className="flex flex-col gap-6 md:col-span-1">
          <TaskSection
            title="Overmorgen"
            tasks={taskGroups.dayAfterTomorrow}
            emptyMessage="Geen taken voor overmorgen"
          />
          <TaskSection
            title="Volgende week"
            tasks={taskGroups.nextWeek}
            emptyMessage="Geen taken voor volgende week"
          />
        </div>

        <div className="md:col-span-1">
          <TaskSection
            title="Binnenkort"
            tasks={taskGroups.later}
            emptyMessage="Geen taken gepland voor later"
          />
        </div>
      </div>
    </AppLayout>
  );
}
