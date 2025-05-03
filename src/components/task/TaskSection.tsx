import { Task } from "@/types/task.ts";
import TaskCard from "./TaskCard.tsx";

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  emptyMessage?: string;
}

export default function TaskSection({ 
  title, 
  tasks,
  emptyMessage = "Geen taken gevonden"
}: TaskSectionProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
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
