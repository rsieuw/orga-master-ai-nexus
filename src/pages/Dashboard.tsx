import { useTask } from "@/contexts/TaskContext";
import { useAuth } from "@/contexts/AuthContext";
import TaskSection from "@/components/task/TaskSection";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { GradientLoader } from "@/components/ui/loader";

export default function Dashboard() {
  const { isLoading, groupTasksByDate } = useTask();
  const { user } = useAuth();
  const taskGroups = groupTasksByDate();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <GradientLoader size="lg" />
          <p className="mt-4 text-muted-foreground">Taken laden...</p>
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

      {/* Apply grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Vandaag, Morgen */}
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

        {/* Column 2: Overmorgen, Volgende week */}
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

        {/* Column 3: Later */}
        <div className="md:col-span-1">
          <TaskSection
            title="Later"
            tasks={taskGroups.later}
            emptyMessage="Geen taken gepland voor later"
          />
        </div>
      </div>
    </AppLayout>
  );
}
