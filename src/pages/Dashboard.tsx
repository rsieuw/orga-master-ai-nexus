
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
          <span className="bg-gradient-to-r from-amber-500 to-red-500 bg-clip-text text-transparent">
            Hallo, {user?.name || "Gebruiker"}
          </span>
        </h1>
        <p className="text-muted-foreground">
          Hier is een overzicht van je taken
        </p>
      </div>

      <TaskSection
        title="VANDAAG"
        tasks={taskGroups.today}
        emptyMessage="Geen taken voor vandaag"
      />
      
      <TaskSection
        title="MORGEN"
        tasks={taskGroups.tomorrow}
        emptyMessage="Geen taken voor morgen"
      />
      
      <TaskSection
        title="OVERMORGEN"
        tasks={taskGroups.dayAfterTomorrow}
        emptyMessage="Geen taken voor overmorgen"
      />
      
      <TaskSection
        title="VOLGENDE WEEK"
        tasks={taskGroups.nextWeek}
        emptyMessage="Geen taken voor volgende week"
        gridClass="col-start-2 col-span-full"
      />
      
      <TaskSection
        title="LATER"
        tasks={taskGroups.later}
        emptyMessage="Geen taken gepland voor later"
        gridClass="col-start-3 col-span-full"
      />
    </AppLayout>
  );
}
