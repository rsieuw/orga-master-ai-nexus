
import { Task, TaskPriority } from "@/types/task";
import { formatDistance } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const priorityClass = `priority-${task.priority}`;
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const deadline = new Date(task.deadline);
  const now = new Date();
  const isOverdue = deadline < now && task.status !== "done";

  const priorityLabel: Record<TaskPriority, string> = {
    high: "Hoog",
    medium: "Middel",
    low: "Laag"
  };

  const statusLabel: Record<string, string> = {
    todo: "Te doen",
    in_progress: "In behandeling",
    done: "Voltooid"
  };

  const statusColor: Record<string, string> = {
    todo: "bg-yellow-500",
    in_progress: "bg-blue-500",
    done: "bg-green-500"
  };

  return (
    <Link to={`/task/${task.id}`}>
      <Card className={`task-card mb-3 cursor-pointer ${priorityClass}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg">{task.title}</h3>
            <div className="flex items-center space-x-1">
              <Badge
                variant="outline"
                className={`text-xs flex items-center ${
                  isOverdue ? "border-red-500 text-red-500" : ""
                }`}
              >
                {isOverdue ? "Verlopen" : formatDistance(deadline, now, { addSuffix: true, locale: nl })}
              </Badge>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
            {task.description}
          </p>

          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="secondary">
                {priorityLabel[task.priority]}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${statusColor[task.status]}`}></div>
                {statusLabel[task.status]}
              </Badge>
            </div>

            {task.subtasks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedSubtasks}/{task.subtasks.length} subtaken
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
