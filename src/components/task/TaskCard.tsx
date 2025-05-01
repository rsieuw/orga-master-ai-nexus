import { Task, TaskPriority } from "@/types/task";
import { formatDistance } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const priorityClass = `priority-${task.priority}`;
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;

  // Parse deadline only if it exists
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const now = new Date();
  // Determine if overdue only if deadline exists and is in the past
  const isOverdue = deadlineDate && deadlineDate < now && task.status !== "done";

  const statusColor: Record<string, string> = {
    todo: "bg-yellow-500",
    in_progress: "bg-blue-500",
    done: "bg-green-500"
  };

  return (
    <Link to={`/task/${task.id}`}>
      <Card className={`task-card ${priorityClass} h-full`}>
        <div className="p-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-base line-clamp-1">{task.title}</h3>
            <div className={`w-2 h-2 rounded-full ${statusColor[task.status]}`}></div>
          </div>

          {task.description && (
            <p className="text-muted-foreground text-xs mt-1 line-clamp-1">
              {task.description}
            </p>
          )}

          <div className="flex justify-between items-center mt-2 text-xs">
            {/* Deadline Badge removed as requested */}
            {/* {deadlineDate ? (
              <Badge
                variant="outline"
                className={`text-xs ${isOverdue ? "border-red-500 text-red-500" : ""} bg-background/30 backdrop-blur-sm`}
              >
                {isOverdue ? "Verlopen" : formatDistance(deadlineDate, now, { addSuffix: true, locale: nl })}
              </Badge>
            ) : (
              <span></span>
            )} */}

            {/* Keep subtask count if it exists */}
            {task.subtasks.length > 0 && (
              <span className="text-xs text-muted-foreground ml-auto"> {/* Add ml-auto if badge is removed */} 
                {completedSubtasks}/{task.subtasks.length}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
