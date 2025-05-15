import { cn } from "@/lib/utils.ts";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from "@/types/task.ts";

/**
 * Props for the TaskInfoDisplay component.
 * 
 * @interface TaskInfoDisplayProps
 */
export interface TaskInfoDisplayProps {
  /** The task whose information is being displayed */
  task: Task;
  /** Whether the task information is collapsed or not */
  isInfoCollapsed: boolean;
  /** Optional CSS class to add to the component */
  className?: string;
}

/**
 * Component that displays the description of a task with animation effects.
 * 
 * This component shows or hides the task description based on the 'isInfoCollapsed' prop
 * and applies smooth animations when collapsing or expanding the information.
 * 
 * @param {TaskInfoDisplayProps} props - The properties for the TaskInfoDisplay component
 * @returns {JSX.Element} - The rendered TaskInfoDisplay component
 */
export default function TaskInfoDisplay({
  task,
  isInfoCollapsed,
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
            <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">
              {task.description || t('taskDetail.noDescription')}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 