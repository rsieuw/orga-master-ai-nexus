import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from "@/lib/utils.ts";
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Trash2, Edit, Save, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu.tsx";
import { useTranslation } from 'react-i18next';
import { useSwipeable } from 'react-swipeable';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Task, SubTask } from "@/types/task.ts";

/**
 * Props voor het SubtaskRow component.
 * 
 * @interface SubtaskRowProps
 */
export interface SubtaskRowProps {
  /** De taak waartoe de subtaak behoort */
  task: Task;
  /** De subtaak die wordt weergegeven */
  subtask: SubTask;
  /** De index van de subtaak binnen de lijst met subtaken */
  index: number;
  /** Functie om de voltooiingsstatus van een subtaak te wisselen */
  handleSubtaskToggle: (subtaskId: string, completed: boolean) => void;
  /** Functie die wordt aangeroepen wanneer op het label van de subtaak wordt geklikt */
  handleSubtaskLabelClick: (title: string) => void;
}

/**
 * Component dat een enkele subtaak weergeeft in een rij met interactiemogelijkheden.
 * 
 * Biedt functies voor:
 * - Het bekijken en bewerken van een subtaak
 * - Het markeren van een subtaak als voltooid/onvoltooid
 * - Het verwijderen van een subtaak
 * - Contextmenu via lang indrukken (mobiel) of rechtsmuisklik
 * - Swipe-interactie voor het voltooien van subtaken
 * 
 * @param {SubtaskRowProps} props - De eigenschappen voor het SubtaskRow component
 * @returns {JSX.Element} - Het SubtaskRow component
 */
export default function SubtaskRow({
  task,
  subtask,
  index,
  handleSubtaskToggle,
  handleSubtaskLabelClick,
}: SubtaskRowProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { updateSubtask, deleteSubtask: deleteSubtaskFromContext } = useTask();

  const [isEditing, setIsEditing] = useState(false);
  const [currentEditTitle, setCurrentEditTitle] = useState(subtask.title);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressThreshold = 500;
  const subtaskRowRef = useRef<HTMLDivElement>(null);

  /**
   * Hook voor swipe-interacties die rechtse swipes omzet naar het togglen van de voltooiingsstatus
   */
  const { ref: swipeableGeneratedRef, ...eventHandlers } = useSwipeable({
    onSwipedRight: () => !isEditing && handleSubtaskToggle(subtask.id, !subtask.completed),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  /**
   * Combineert de swipeable ref met onze lokale ref voor subtaskRow
   * 
   * @param {HTMLDivElement | null} node - Het DOM-element om aan de refs te koppelen
   */
  const combinedRefCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof swipeableGeneratedRef === 'function') {
        swipeableGeneratedRef(node);
      }
      (subtaskRowRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [swipeableGeneratedRef]
  );

  /**
   * Effect om de bewerkingstitel te resetten als isEditing verandert of de subtaaknaam verandert
   */
  useEffect(() => {
    if (!isEditing) {
      setCurrentEditTitle(subtask.title);
    }
  }, [subtask.title, isEditing]);

  /**
   * Schakelt de bewerkingsmodus in voor de subtaak titel
   * 
   * @param {React.MouseEvent} [event] - De muisgebeurtenis die de bewerking activeerde
   */
  const handleStartEditing = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setIsEditing(true);
    setCurrentEditTitle(subtask.title);
    setIsContextMenuOpen(false);
  };

  /**
   * Annuleert de bewerking van de subtaak titel
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentEditTitle(subtask.title);
  };

  /**
   * Slaat de bewerkte subtaaknaam op
   * 
   * @returns {Promise<void>} Een promise die voltooit wanneer de update is verwerkt
   */
  const handleSaveEdit = async () => {
    if (!isEditing) return;
    const trimmedTitle = currentEditTitle.trim();
    if (trimmedTitle && trimmedTitle !== subtask.title) {
      try {
        await updateSubtask(task.id, subtask.id, { title: trimmedTitle });
        toast({ title: t('taskDetail.toast.subtaskUpdated') });
      } catch (error) {
        toast({ variant: "destructive", title: t('taskDetail.toast.updateFailed'), description: t('taskDetail.toast.subtaskUpdateFailedDescription') });
        setCurrentEditTitle(subtask.title);
      }
    }
    setIsEditing(false);
  };

  /**
   * Afhandeling van toetsenbordinvoer tijdens het bewerken
   * 
   * @param {React.KeyboardEvent<HTMLInputElement>} event - De toetsenbordgebeurtenis
   */
  const handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSaveEdit();
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  /**
   * Verwijdert de subtaak na bevestiging
   * 
   * @returns {Promise<void>} Een promise die voltooit wanneer de verwijdering is verwerkt
   */
  const handleDeleteSubtask = async () => {
    try {
      await deleteSubtaskFromContext(task.id, subtask.id);
    } catch (error) {
      toast({ variant: "destructive", title: t('taskDetail.toast.deleteFailed'), description: t('taskDetail.toast.taskDeleteFailedDescription')});
    }
    setIsContextMenuOpen(false);
  };

  /**
   * Toont het contextmenu op de juiste positie na lang indrukken of rechtermuisklik
   * 
   * @param {React.TouchEvent | React.MouseEvent} event - De gebeurtenis die het contextmenu activeert
   */
  const handleLongPress = (event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const targetElement = subtaskRowRef.current;
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      let top, left;

      if ('touches' in event && event.touches.length > 0) {
        top = event.touches[0].clientY;
        left = event.touches[0].clientX;
      } else if ('clientX' in event) {
        top = event.clientY;
        left = event.clientX;
      } else {
        top = rect.top + rect.height / 2;
        left = rect.left + rect.width / 2;
      }
      
      const menuWidth = 150;
      const menuHeight = 100;
      if (left + menuWidth > globalThis.innerWidth) {
        left = globalThis.innerWidth - menuWidth - 10;
      }
      if (top + menuHeight > globalThis.innerHeight) {
        top = globalThis.innerHeight - menuHeight - 10;
      }
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      setContextMenuPosition({ top, left });
      setIsContextMenuOpen(true);
    }
  };

  /**
   * Start het lang-indrukken proces met een timer
   * 
   * @param {React.TouchEvent | React.MouseEvent} event - De gebeurtenis die de langdruk initieert
   */
  const handlePressStart = (event: React.TouchEvent | React.MouseEvent) => {
    if (isEditing) return;
    if ('button' in event && event.button === 2 && !isContextMenuOpen) return;

    longPressTimerRef.current = setTimeout(() => {
      if (!isEditing) {
         handleLongPress(event);
      }
      longPressTimerRef.current = null;
    }, pressThreshold);
  };

  /**
   * Maakt de lang-indrukken timer schoon
   */
  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div
      ref={combinedRefCallback}
      key={subtask.id}
      {...eventHandlers}
      className={cn(
        "group/row flex items-center justify-between space-x-3 rounded-md py-1 pl-2 lg:pl-2 pr-2 hover:bg-muted/50 overflow-hidden relative mt-0",
        "border border-white/5 shadow-sm mb-0.5 bg-white/5 backdrop-blur-sm",
        isEditing && "bg-muted/60"
      )}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 0 && e.target instanceof HTMLElement && 
            !e.target.closest('input, button, label, a, [role="button"], [data-state="open"], [data-radix-collection-item]')) {
          handlePressStart(e);
        } else if (e.button === 2) {
          handleLongPress(e);
        }
      }}
      onMouseUp={(e: React.MouseEvent<HTMLDivElement>) => { if (e.button === 0) handlePressEnd(); }}
      onMouseLeave={handlePressEnd}
      onContextMenu={(e) => {
          e.preventDefault();
      }}
    >
      <div className="flex items-center space-x-2 flex-grow min-w-0">
        <div className="relative h-5 w-5 lg:h-4.5 lg:w-4.5 flex-shrink-0 mt-0">
          <Checkbox
            id={`subtask-${subtask.id}`}
            checked={subtask.completed}
            onCheckedChange={(checked) => !isEditing && handleSubtaskToggle(subtask.id, !!checked)}
            className={cn(
              "absolute inset-0 h-full w-full border-primary data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600",
              "shadow-md rounded-md"
            )}
            disabled={isEditing}
          />
          <span className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-medium pointer-events-none",
            subtask.completed ? "hidden" : "text-muted-foreground/70",
            "lg:text-[9px]"
          )}>
            {index + 1}
          </span>
        </div>
        <div className="flex-grow leading-none">
          {isEditing ? (
            <div className="flex items-center space-x-1">
              <Input
                type="text"
                id={`subtask-edit-${subtask.id}`}
                aria-label={t('taskDetail.subtask.editTitleAriaLabel')}
                value={currentEditTitle}
                onChange={(e) => setCurrentEditTitle(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="h-6 text-xs flex-grow"
                autoFocus
                onFocus={(e) => e.target.select()}
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:text-green-500" onClick={handleSaveEdit}><Save className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <>
              <label
                htmlFor={`subtask-${subtask.id}`}
                className={cn(
                  "flex-grow text-sm cursor-pointer hover:text-primary transition-colors text-neutral-200",
                  subtask.completed && "text-gray-700 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-400 line-through"
                )}
                onClick={() => {
                  if (!isEditing) {
                    handleSubtaskLabelClick(subtask.title);
                    setIsDescriptionVisible(!isDescriptionVisible);
                  }
                }}
                onDoubleClick={handleStartEditing}
              >
                {currentEditTitle} 
              </label>
              <AnimatePresence>
                {isDescriptionVisible && subtask.description && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '0' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="text-[9px] text-muted-foreground pl-1 pr-2 whitespace-pre-wrap pb-0.5"
                  >
                    {subtask.description}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
      <div className={cn(
          "hidden lg:flex items-center space-x-1 transition-opacity",
          (isContextMenuOpen || !isEditing) ? "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100" : "opacity-0"
        )}
      >
        {!isEditing && !subtask.completed && ( 
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleStartEditing} 
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">{t('taskDetail.subtask.editSubtaskSR')}</span>
          </Button>
        )}
        {!isEditing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">{t('taskDetail.subtask.deleteSubtaskSR')}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogPortal>
              <AlertDialogOverlay />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('taskDetail.subtask.deleteConfirmation.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('taskDetail.subtask.deleteConfirmation.description', { subtaskTitle: subtask.title })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={handlePressEnd}>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSubtask} className="bg-destructive hover:bg-destructive/90">
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogPortal>
          </AlertDialog>
        )}
      </div>

      {isContextMenuOpen && contextMenuPosition && (
        <DropdownMenuPortal>
          <DropdownMenuContent 
            className="w-48 z-[100]" 
            style={{ top: `${contextMenuPosition.top}px`, left: `${contextMenuPosition.left}px`, position: 'fixed' }}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onEscapeKeyDown={() => setIsContextMenuOpen(false)}
            onPointerDownOutside={() => setIsContextMenuOpen(false)}
          >
            {!isEditing && !subtask.completed && (
              <DropdownMenuItem onClick={() => handleStartEditing() }>
                <Edit className="mr-2 h-4 w-4" />
                <span>{t('common.edit')}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDeleteSubtask} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>{t('common.delete')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      )}
    </div>
  );
} 