import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu.tsx";
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Flag, CalendarClock } from "lucide-react"; // ChevronUp/Down removed
import { useTranslation } from 'react-i18next';
import { Task, TaskPriority } from "@/types/task.ts"; // TaskStatus was only for props, not used internally

export interface TaskInfoDisplayProps {
  task: Task;
  isInfoCollapsed: boolean;
  // setIsInfoCollapsed: (isCollapsed: boolean) => void; // Controlled by parent
  statusColor: Record<string, string>;
  priorityBadgeColor: Record<TaskPriority, string>;
  deadlineText: string;
  deadlineColor: string;
  isOverdue: boolean;
  onStatusChange: (newStatus: string) => void;
  onPriorityChange: (newPriority: string) => void;
  className?: string;
}

export default function TaskInfoDisplay({
  task,
  isInfoCollapsed,
  // setIsInfoCollapsed, // Removed
  statusColor,
  priorityBadgeColor,
  deadlineText,
  deadlineColor,
  isOverdue,
  onStatusChange,
  onPriorityChange,
  className,
}: TaskInfoDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("px-4 lg:px-0", className)}>
      <div className="flex-shrink-0">
        <AnimatePresence mode="sync">
          <motion.div 
            initial={false}
            animate={{ 
              height: isInfoCollapsed ? 0 : 'auto',
              opacity: isInfoCollapsed ? 0 : 1,
              marginBottom: isInfoCollapsed ? 0 : 'auto' 
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn("overflow-hidden")}
          >
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost"
                    className={cn("h-6 px-2 text-xs font-normal rounded-md bg-muted/40", statusColor[task.status])}
                  >
                    <Info className="h-4 w-4 mr-1 sm:hidden" />
                    <span className="hidden sm:inline">{t('common.status')}:&nbsp;</span>
                    {t(task.status === 'todo' ? 'common.todo' : task.status === 'in_progress' ? 'common.in_progress' : 'common.done')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover/90 backdrop-blur-lg border border-white/10">
                  <DropdownMenuItem onSelect={() => onStatusChange('todo')}>
                    {t('common.todo')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onStatusChange('in_progress')}>
                    {t('common.in_progress')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onStatusChange('done')}>
                    {t('common.done')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {task.priority !== 'none' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost"
                      className={cn("h-6 px-2 text-xs font-normal rounded-md bg-muted/40", priorityBadgeColor[task.priority])}
                    >
                      <Flag className="h-4 w-4 mr-1 sm:hidden" />
                      <span className="hidden sm:inline">{t('common.priority')}:&nbsp;</span>
                      {t(task.priority === 'low' ? 'taskDetail.priority.low' : task.priority === 'medium' ? 'taskDetail.priority.medium' : task.priority === 'high' ? 'taskDetail.priority.high' : 'taskDetail.priority.none')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover/90 backdrop-blur-lg border border-white/10">
                    <DropdownMenuItem onSelect={() => onPriorityChange('high')}>
                      {t('taskDetail.priority.high')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onPriorityChange('medium')}>
                      {t('taskDetail.priority.medium')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onPriorityChange('low')}>
                      {t('taskDetail.priority.low')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {task.deadline && (
                <Badge 
                  variant="secondary"
                  className={cn("h-6 px-2 text-xs font-normal border-none bg-muted/40", deadlineColor)}
                >
                  <CalendarClock className="h-4 w-4 mr-1 sm:hidden" />
                  <span className="hidden sm:inline">{t('common.deadline')}:&nbsp;</span>
                  {deadlineText}
                  {isOverdue && <span className="hidden sm:inline">&nbsp;{t('taskDetail.overdueSR')}</span>}
                </Badge>
              )}
            </div>
            <div className="mb-4"></div>
            <div>
              <h3 className="font-medium mb-2">{t('common.description')}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description || t('taskDetail.noDescription')}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
        <Separator className="my-4" />
        {/* Removed the subtask header part from here */}
      </div>
    </div>
  );
} 