import { Task, SubTask } from "@/types/task.ts";
import { Card } from "@/components/ui/card.tsx";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { ListChecks } from "lucide-react";

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
    todo: "bg-yellow-500",
    in_progress: "bg-blue-500",
    done: "bg-green-500"
  };

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
        <div className="p-3 pt-1 mt-auto">
          <div className="flex justify-end items-center text-xs min-h-[1rem]">
            {totalSubtasks > 0 && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center cursor-default">
                      <ListChecks className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                      <Progress value={progressValue} className="h-1 w-12 ml-2" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-popover/90 backdrop-blur-lg">
                    <p>{completedSubtasks} van {totalSubtasks} {totalSubtasks === 1 ? 'subtaak' : 'subtaken'} voltooid</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
