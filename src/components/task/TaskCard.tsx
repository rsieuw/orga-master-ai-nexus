import { Task, SubTask } from "@/types/task.ts";
import { Card } from "@/components/ui/card.tsx";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { Icon } from "lucide-react";
import { frogFace } from "@lucide/lab";
import { 
  CheckSquare, 
  BriefcaseBusiness,
  Home, 
  Users,
  GlassWater, 
  Heart, 
  Wallet, 
  Sparkles
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge.tsx";
import AnimatedBadge from "@/components/ui/AnimatedBadge.tsx";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { i18n, t } = useTranslation();
  const priorityClass = `priority-${task.priority}`;
  const completedSubtasks = task.subtasks.filter((st: SubTask) => st.completed).length;
  const totalSubtasks = task.subtasks.length;

  const progressValue = totalSubtasks > 0
    ? (completedSubtasks / totalSubtasks) * 100
    : 0;

  // Functie voor het achtergrondicoon met aanpassing voor elke prioriteitskleur
  const getCategoryBackgroundIcon = (category?: string) => {
    // Vaste opaciteit voor alle iconen
    const getOpacityClass = () => {
      return "opacity-40"; // Eén vaste opaciteit voor alle iconen (40%)
    };

    const iconProps = { 
      className: `category-background-icon ${getOpacityClass()}`,
      size: 62, 
      strokeWidth: 0.6 
    };
    
    switch(category) {
      case "Werk/Studie":
        return <BriefcaseBusiness {...iconProps} />;
      case "Persoonlijk":
        return <Icon iconNode={frogFace} {...iconProps} />;
      case "Huishouden":
        return <Home {...iconProps} />;
      case "Familie":
        return <Users {...iconProps} />;
      case "Sociaal":
        return <GlassWater {...iconProps} />;
      case "Gezondheid":
        return <Heart {...iconProps} />;
      case "Financiën":
        return <Wallet {...iconProps} />;
      case "Projecten":
        return <Sparkles {...iconProps} />;
      default:
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
        className={`task-card ${priorityClass} h-full flex flex-col relative overflow-hidden`}
        data-category={task.category}
      >
        {task.category && (
          <div className={`absolute ${totalSubtasks > 0 ? 'bottom-[3rem]' : 'bottom-6'} right-4 z-0 pointer-events-none`}>
            {getCategoryBackgroundIcon(task.category)}
          </div>
        )}
        
        <div className="p-3 flex flex-col h-full justify-between relative z-10">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-base line-clamp-1">
                {task.emoji && <span className="mr-1.5 text-xl task-emoji">{task.emoji}</span>}
                {task.title}
              </h3>
              {/* Kalenderbadge */}
              {deadlineDay && deadlineMonth && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 flex flex-col items-center justify-center rounded-full border border-white/10 overflow-hidden shadow-sm calendar-badge ${
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
                <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 category-badge">
                  {task.category}
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
                        <CheckSquare className="h-3.5 w-3.5 mr-1 text-muted-foreground" strokeWidth={0.8} />
                        <span className="text-xs text-muted-foreground">
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                        <div className="relative w-full h-3.5 bg-white/20 backdrop-blur-md rounded-full mx-2 overflow-hidden">
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
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white font-bold select-none">
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
