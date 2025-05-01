
import { Task } from "@/types/task";
import TaskCard from "./TaskCard";

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  emptyMessage?: string;
  gridClass?: string;
}

export default function TaskSection({ 
  title, 
  tasks,
  emptyMessage = "Geen taken gevonden",
  gridClass = ""
}: TaskSectionProps) {
  return (
    <div className={`mb-6 ${gridClass}`}>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      )}
    </div>
  );
}
