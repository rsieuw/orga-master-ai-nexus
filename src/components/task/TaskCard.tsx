import { Task, SubTask } from "@/types/task.ts";
import { Card } from "@/components/ui/card.tsx";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { 
  BriefcaseBusiness,
  Home, 
  Users,
  GlassWater, 
  Heart, 
  Wallet, 
  User,
  BookOpen,
  Hammer
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge.tsx";
import AnimatedBadge from "@/components/ui/AnimatedBadge.tsx";
import { cn } from "@/lib/utils.ts";
import { motion } from "framer-motion";
import { TASK_CATEGORIES, TASK_CATEGORY_KEYS } from "@/constants/categories.ts";

/**
 * Props for the TaskCard component.
 */
interface TaskCardProps {
  /** The task data to display in the card. */
  task: Task;
}

/**
 * Determines the CSS classes for styling a task card based on its priority.
 * 
 * @param {string} priority - The priority level of the task ('high', 'medium', 'low', or 'none').
 * @returns {{ backgroundClass: string; shadowClass: string }} An object containing the CSS classes for background and shadow effects.
 */
const getPriorityClass = (priority: string = 'none'): { backgroundClass: string; shadowClass: string } => {
  let backgroundClass = '';
  let shadowClass = '';

  switch(priority) {
    case 'high':
      backgroundClass = 'bg-gradient-to-br from-[#b12429]/30 via-[#8112a9]/30 to-[#690365]/30 dark:bg-gradient-to-br dark:from-[rgba(220,38,38,0.8)] dark:via-[rgba(150,25,80,0.75)] dark:to-[rgba(70,20,90,0.7)]';
      shadowClass = 'neumorphic-shadow-high';
      break;
    case 'medium':
      backgroundClass = 'bg-gradient-to-br from-[#db7b0b]/30 via-[#9e4829]/30 to-[#651945]/30 dark:bg-gradient-to-br dark:from-[rgba(255,145,0,0.9)] dark:to-[rgba(101,12,78,0.85)]';
      shadowClass = 'neumorphic-shadow-medium';
      break;
    case 'low':
      backgroundClass = 'bg-gradient-to-br from-blue-500/30 via-cyan-400/30 to-teal-400/30 dark:bg-gradient-to-br dark:from-[rgb(36,74,212)] dark:via-[rgba(15,168,182,0.75)] dark:to-[rgba(16,185,129,0.7)]';
      shadowClass = 'neumorphic-shadow-low';
      break;
    default: // none
      backgroundClass = 'bg-gradient-to-br from-blue-600/30 to-purple-700/30 dark:bg-gradient-to-br dark:from-[rgba(100,116,139,0.8)] dark:via-[rgba(71,85,105,0.75)] dark:to-[rgba(51,65,85,0.7)]';
      shadowClass = 'neumorphic-shadow-none';
      break;
  }
  return { backgroundClass, shadowClass };
};

/**
 * A card component that displays a task with its details and visual styling based on priority.
 * 
 * This component shows task information including title, description, deadline, category,
 * and subtask progress. It includes visual enhancements like animations for new tasks,
 * category icons, and progress bars styled according to the task's priority.
 *
 * @param {TaskCardProps} props - The props for the TaskCard component.
 * @returns {JSX.Element} The TaskCard component wrapped in a Link to the task detail page.
 */
export default function TaskCard({ task }: TaskCardProps) {
  const { i18n, t } = useTranslation();
  const priorityStyles = getPriorityClass(task.priority);
  const completedSubtasks = task.subtasks.filter((st: SubTask) => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  const progressValue = totalSubtasks > 0
    ? (completedSubtasks / totalSubtasks) * 100
    : 0;

  /**
   * Finds the correct translation key for a category.
   * Handles various input formats:
   * - Direct English/simplified terms (e.g., "health", "work")
   * - Dutch display labels from TASK_CATEGORIES (e.g., "Gezondheid")
   * - Already formatted i18n keys (e.g., "categories.health")
   * 
   * @param {string} rawCategory - The raw category string from the task data.
   * @returns {string} The i18n translation key for the category.
   */
  const getCategoryTranslationKey = (rawCategory: string): string => {
    if (!rawCategory) return ""; // Return empty string if rawCategory is null, undefined, or empty
    
    const normalizedInput = rawCategory.trim().toLowerCase();

    // 1. Direct mapping for known English/simplified terms to specific i18n keys
    // These keys are expected to exist in the translation files (e.g., public/locales/en/translation.json)
    const simpleToI18nKeyMap: { [key: string]: string } = {
      "work": "categories.work",
      "study": "categories.work", 
      "personal": "categories.personal",
      "home": "categories.home",
      "household": "categories.home", 
      "family": "categories.family",
      "finance": "categories.finance",
      "health": "categories.health",
      "projects": "categories.projects", // Plural form for "Projecten"
      "project": "categories.projects",
      "learning": "categories.learning", // Added for 'learning'
      "travel": "categories.travel",
      "hobbies": "categories.hobbies",
      "other": "categories.other",
      "uncategorized": "categories.other" 
    };

    if (simpleToI18nKeyMap[normalizedInput]) {
      return simpleToI18nKeyMap[normalizedInput];
    }

    // 2. Map from original cased Dutch display names (TASK_CATEGORIES) to i18n keys (TASK_CATEGORY_KEYS)
    // This loop is a fallback if the lowercase directMap didn't catch it (e.g. due to casing not matching normalizedInput)
    for (let i = 0; i < TASK_CATEGORIES.length; i++) {
      if (TASK_CATEGORIES[i].trim().toLowerCase() === normalizedInput) {
        return TASK_CATEGORY_KEYS[i];
      }
    }
    
    // 3. Check if the input itself is already a valid i18n key (from the main list or known aliases)
    const allKnownCategoryI18nKeys = [
      ...TASK_CATEGORY_KEYS, 
      "categories.work", 
      "categories.home", 
      "categories.learning", 
      "categories.overdue", // commonly used in dashboard/filters
      "categories.later"    // commonly used in dashboard/filters
    ];
    // Ensure we compare apples to apples (lowercase to lowercase)
    const lowercasedKnownKeys = allKnownCategoryI18nKeys.map(k => k.toLowerCase());
    const knownKeyIndex = lowercasedKnownKeys.indexOf(normalizedInput);

    if (knownKeyIndex !== -1) {
      return allKnownCategoryI18nKeys[knownKeyIndex]; // Return the key with its original casing
    }

    // 4. If still no match, log a warning and return the normalized input as a fallback.
    // This might lead to i18next warning if 'normalizedInput' isn't a defined translation key.
    console.warn(`TaskCard: Category '${rawCategory}' (normalized: '${normalizedInput}') could not be mapped to a known translation key. Passing '${normalizedInput}' to i18n as a fallback.`);
    return normalizedInput; 
  };

  /**
   * Gets the translated name of a category.
   * 
   * @param {string | undefined} category - The category name to translate.
   * @returns {string} The translated category name or an empty string if undefined.
   */
  const getTranslatedCategory = (category?: string) => {
    if (!category) return "";
    const translationKey = getCategoryTranslationKey(category);
    return t(translationKey);
  };

  /**
   * Returns the appropriate icon component for a task category.
   * 
   * @param {string | undefined} category - The category to get an icon for.
   * @param {string | undefined} taskStatus - The status of the task.
   * @returns {JSX.Element | null} The icon component or null if no matching category.
   */
  const getCategoryBackgroundIcon = (category?: string, taskStatus?: string) => {
    let iconColorClass = "text-muted-foreground"; // Default color
    let opacityClass = "opacity-40";

    if (taskStatus === 'done') {
      iconColorClass = "text-[#51976a]"; // Green for completed tasks
      opacityClass = "opacity-60";
    } else {
      // Verwijderd: Geen specifieke kleuren voor prioriteiten, alleen standaard kleur
      // We houden de kleuren alleen bij hover (wordt via CSS gedaan)
    }
    
    const iconProps = { 
      className: `category-background-icon ${iconColorClass} ${opacityClass}`,
      size: 52, // Aangepast van 62 naar 52
      strokeWidth: 0.6 
    };
    
    const normalizedInputCategory = category?.trim().toLowerCase();

    // Compare with normalized TASK_CATEGORIES
    if (normalizedInputCategory === TASK_CATEGORIES[0].trim().toLowerCase()) { // Werk/Studie (Work/Study)
      return <BriefcaseBusiness {...iconProps} />;
    } else if (normalizedInputCategory === TASK_CATEGORIES[1].trim().toLowerCase()) { // Persoonlijk (Personal)
      return <User {...iconProps} />;
    } else if (normalizedInputCategory === TASK_CATEGORIES[2].trim().toLowerCase()) { // Huishouden (Household)
      return <Home {...iconProps} />;
    } else if (normalizedInputCategory === TASK_CATEGORIES[3].trim().toLowerCase()) { // Familie (Family)
      return <Users {...iconProps} />;
    } else if (normalizedInputCategory === TASK_CATEGORIES[4].trim().toLowerCase()) { // Sociaal (Social)
      return <GlassWater {...iconProps} />;
    } else if (normalizedInputCategory === TASK_CATEGORIES[5].trim().toLowerCase()) { // Gezondheid (Health)
      return <Heart {...iconProps} />;
    } else if (normalizedInputCategory === TASK_CATEGORIES[6].trim().toLowerCase()) { // Financiën (Finance)
      return <Wallet {...iconProps} />;
    } else if (normalizedInputCategory === TASK_CATEGORIES[7].trim().toLowerCase()) { // Projecten (Projects)
      return <Hammer {...iconProps} />;
    } else if (normalizedInputCategory === "work") { // Alias
        return <BriefcaseBusiness {...iconProps} />;
    } else if (normalizedInputCategory === "personal") { // Alias
        return <User {...iconProps} />;
    } else if (normalizedInputCategory === "home") { // Alias for Huishouden (Household)
        return <Home {...iconProps} />;
    } else if (normalizedInputCategory === "family") { // Alias
        return <Users {...iconProps} />;
    } else if (normalizedInputCategory === "social") { // Alias
        return <GlassWater {...iconProps} />;
    } else if (normalizedInputCategory === "health") { // Alias
        return <Heart {...iconProps} />;
    } else if (normalizedInputCategory === "finances") { // Alias
        return <Wallet {...iconProps} />;
    } else if (normalizedInputCategory === "projects" || normalizedInputCategory === "project") { // Alias
        return <Hammer {...iconProps} />;
    } else if (normalizedInputCategory === "leren" || normalizedInputCategory === "learning") { // Alias for Leren/Learning
        return <BookOpen {...iconProps} />;
    } else {
        if (category) {
        // This console.warn is kept in case there's a truly unknown category.
        console.warn(`[TaskCard] Unknown category for background icon (after normalization and TASK_CATEGORIES check): '${category}' (normalized to: '${normalizedInputCategory}')`);
        }
        return null;
    }
  };

  let deadlineText: string | null = null;
  let deadlineDay: string | null = null;
  let deadlineMonth: string | null = null;
  
  if (task.deadline) {
    try {
      const locale = i18n.language === 'nl' ? nl : enUS;
      deadlineText = format(parseISO(task.deadline), "PPP", { locale });
      deadlineDay = format(parseISO(task.deadline), "d", { locale });
      deadlineMonth = format(parseISO(task.deadline), "MMM", { locale });
    } catch (e) {
      console.error("Invalid date format for deadline in TaskCard:", task.deadline);
      deadlineText = t('taskCard.invalidDate');
    }
  }

  return (
    <Link to={`/task/${task.id}`}>
      <Card 
        className={cn(
          "task-card h-full flex flex-col relative overflow-hidden",
          `priority-${task.priority}`,
          priorityStyles.backgroundClass,
          priorityStyles.shadowClass,
          task.status === 'done' ? 'auto-completed' : ''
        )}
        data-category={task.category}
      >
        {/* Keep only the gleam effect */}
        {task.isNew && (
          <motion.div
            className="absolute inset-0 z-1 pointer-events-none overflow-hidden rounded-xl"
          >
            <motion.div
              className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/25 to-transparent"
              style={{
                width: "200%",
                boxShadow: "0 0 15px 5px rgba(255, 255, 255, 0.1)"
              }}
              animate={{
                x: ["100%", "-100%"]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
        
        {task.category && (
          <div className={cn(
            `absolute right-5 z-0 pointer-events-none`,
            "transition-all duration-800 ease-in-out",
            task.subtasks && task.subtasks.length > 0 ? 'bottom-12' : 'bottom-8'
          )}>
            {getCategoryBackgroundIcon(task.category, task.status)} 
          </div>
        )}
        
        <div className="p-3 flex flex-col h-full justify-between relative z-10">
          <div>
            <div className="flex justify-between items-start">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-medium text-base line-clamp-1 cursor-default">
                      {task.emoji && <span className="mr-1.5 text-xl task-emoji">{task.emoji}</span>}
                      {task.title}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    align="start" 
                    sideOffset={5} 
                    avoidCollisions
                    className="bg-popover/90 backdrop-blur-lg px-3 py-2 max-w-[250px] z-50 whitespace-normal break-words"
                  >
                    <p>{task.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Calendar badge */}
              {deadlineDay && deadlineMonth && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 flex flex-col items-center justify-center rounded-full border border-white/10 overflow-hidden shadow-md calendar-badge ${
                          task.priority === 'high' ? 'bg-gradient-to-br from-red-600/90 to-rose-700/90' :
                          task.priority === 'medium' ? 'bg-gradient-to-br from-amber-500/90 to-orange-600/90' :
                          task.priority === 'low' ? 'bg-gradient-to-br from-blue-500/90 to-cyan-600/90' :
                          'bg-gradient-to-br from-slate-500/90 to-slate-600/90'
                        }`}>
                          <div className="text-base font-bold text-white leading-none">
                            {deadlineDay}
                          </div>
                          <div className="!text-[0.7rem] font-medium uppercase tracking-tight text-white/80 mt-[-8px] leading-none">
                            {deadlineMonth.substring(0, 3)}
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="bottom" 
                      align="end" 
                      sideOffset={5} 
                      alignOffset={5}
                      avoidCollisions
                      className="bg-popover/90 backdrop-blur-lg px-3 py-2 max-w-[200px] z-50 whitespace-normal break-words"
                    >
                      <p>{deadlineText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {task.description && (
              <p className={`text-muted-foreground text-sm mt-1 ${totalSubtasks > 0 ? 'line-clamp-2' : 'line-clamp-3'}`}>
                {task.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {task.isNew && (
                <AnimatedBadge 
                  sparkleEffect
                >
                  {t('common.new')}
                </AnimatedBadge>
              )}
              {task.category && (
                <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 category-badge shadow-md rounded-full bg-white/10 backdrop-blur-sm text-white border-white/10">
                  {getTranslatedCategory(task.category)}
                </Badge>
              )}
            </div>
          </div>
          {totalSubtasks > 0 && (
            <div className="mt-4">
              <div className="flex items-center text-xs min-h-[1rem]">
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center cursor-default w-full">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
                          className={`mr-1.5
                            ${task.priority === 'high' ? 'text-red-400' : ''}
                            ${task.priority === 'medium' ? 'text-amber-400' : ''}
                            ${task.priority === 'low' ? 'text-cyan-400' : ''}
                            ${task.priority !== 'high' && task.priority !== 'medium' && task.priority !== 'low' ? 'text-slate-400' : ''}
                          `}>
                            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className={`text-sm font-medium mr-2
                          ${task.priority === 'high' ? '!text-red-400' : ''}
                          ${task.priority === 'medium' ? '!text-amber-400' : ''}
                          ${task.priority === 'low' ? '!text-cyan-400' : ''}
                          ${task.priority !== 'high' && task.priority !== 'medium' && task.priority !== 'low' ? '!text-slate-400' : ''}
                        `}>
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                        <div className="relative w-full h-3.5 bg-white/20 backdrop-blur-md rounded-full overflow-hidden shadow-md">
                          <div
                            className={`h-full rounded-full transition-all duration-300
                              ${task.priority === 'high' ? 'bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 shadow-[0_0_8px_2px_rgba(244,63,94,0.4)]' : ''}
                              ${task.priority === 'medium' ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.4)]' : ''}
                              ${task.priority === 'low' ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.4)]' : ''}
                              ${task.priority !== 'high' && task.priority !== 'medium' && task.priority !== 'low' ? 'bg-gradient-to-r from-slate-400 to-slate-500 shadow-[0_0_8px_2px_rgba(100,116,139,0.3)]' : ''}
                            `}
                            style={{ width: `${progressValue}%` }}
                          />
                          {progressValue > 10 && (
                            <span 
                              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-white font-bold select-none progress-percentage-text"
                            >
                              {Math.round(progressValue)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      align="center" 
                      sideOffset={5} 
                      avoidCollisions
                      className="bg-popover/90 backdrop-blur-lg px-3 py-2 max-w-[250px] z-50 whitespace-normal break-words"
                    >
                      <p>{t('taskCard.tooltip.subtasksCompleted', { completed: completedSubtasks, total: totalSubtasks, context: totalSubtasks === 1 ? 'singular' : 'plural' })}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
