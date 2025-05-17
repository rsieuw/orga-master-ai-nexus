import { cn } from "@/lib/utils.ts";
import { useTranslation } from 'react-i18next';
// import { motion, AnimatePresence } from 'framer-motion'; // Verwijderd
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
  // isInfoCollapsed, // Niet meer direct gebruikt voor animatie hier
  className,
}: TaskInfoDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("px-0", className)}> {/* px-0 was hier, maar padding wordt nu door parent in TaskDetail.tsx afgehandeld */}
      <div className="flex-shrink-0">
        {/* Verwijder AnimatePresence en motion.div; de parent div in TaskDetail.tsx handelt nu de animatie af */}
        <p className="text-sm text-white whitespace-pre-wrap leading-relaxed pt-1">
          {task.description || t('taskDetail.noDescription')}
        </p>
      </div>
    </div>
  );
} 