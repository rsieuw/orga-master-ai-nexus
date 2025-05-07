import { Task, SubTask } from "@/types/task.ts";
import { Card } from "@/components/ui/card.tsx";
import { Link } from "react-router-dom";
import { GradientProgress } from "@/components/ui/GradientProgress.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { CheckSquare, Hourglass } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const priorityClass = `priority-${task.priority}`;
  const completedSubtasks = task.subtasks.filter((st: SubTask) => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  const progressValue = totalSubtasks > 0
    ? (completedSubtasks / totalSubtasks) * 100
    : 0;

  const statusColor: Record<string, string> = {
    todo: "bg-red-500",
    in_progress: "bg-yellow-500",
    done: "bg-green-500"
  };

  let deadlineText: string | null = null;
  if (task.deadline) {
    try {
      deadlineText = format(parseISO(task.deadline), "PPP", { locale: nl });
    } catch (e) {
      console.error("Invalid date format for deadline in TaskCard:", task.deadline);
      deadlineText = "Ongeldige datum";
    }
  }

  return (
    <Link to={`/task/${task.id}`}>
      <Card className={`task-card ${priorityClass} h-full flex flex-col`}>
        <div className="p-3 flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-base line-clamp-1">{task.title}</h3>
            <div className={`w-2 h-2 rounded-full ${statusColor[task.status]}`}></div>
          </div>

          {task.description && (
            <p className="text-muted-foreground text-xs mt-1 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>
        {/* Conditionally render the entire bottom section */}
        {(deadlineText || totalSubtasks > 0) && (
          <div className="p-3 pt-1 mt-auto">
            <div className="flex items-center text-xs min-h-[1rem]">
              {/* Subtask info on the left */}
              {totalSubtasks > 0 && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-default">
                        <CheckSquare className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                        <GradientProgress value={progressValue} className="h-1 w-16 lg:w-32 ml-2" />
                        <span className="text-xs text-muted-foreground/90 ml-2">
                          ({Math.round(progressValue)}%)
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover/90 backdrop-blur-lg">
                      <p>{completedSubtasks} van {totalSubtasks} {totalSubtasks === 1 ? 'subtaak' : 'subtaken'} voltooid</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* Deadline info on the right (with ml-auto) */}
              {deadlineText && (
                <div className="ml-auto flex items-center text-muted-foreground">
                  <Hourglass className="h-3.5 w-3.5 mr-1" />
                  <span>{deadlineText}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}
