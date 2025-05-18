import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from "@/lib/utils.ts";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Trash2, Edit, Save, X } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useSwipeable } from 'react-swipeable';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Task, SubTask } from "@/types/task.ts";

/**
 * Props for the SubtaskRow component.
 */
export interface SubtaskRowProps {
  /** The parent task to which the subtask belongs. */
  task: Task;
  /** The subtask object to display. */
  subtask: SubTask;
  /** The index of the subtask within the list of subtasks. */
  index: number;
  /** Function to toggle the completion status of a subtask. */
  handleSubtaskToggle: (subtaskId: string, completed: boolean) => void;
  /** Optional function called on click (mobile) or contextmenu (desktop) to show an action menu. */
  onOpenActionMenu?: (subtaskId: string, event: React.MouseEvent, subtaskTitle: string) => void;
  /** Function to call when the user initiates deleting a subtask. */
  onInitiateDelete: (subtask: SubTask) => void;
  /** Optional ID of a subtask whose editing mode should be triggered from the parent. */
  editingSubtaskIdFromDetail?: string | null;
  /** Optional callback when editing is started via editingSubtaskIdFromDetail. */
  onEditStarted?: (subtaskId: string) => void;
}

/**
 * Component that displays a single subtask in a row with interaction capabilities.
 * 
 * Provides functionality for:
 * - Viewing and editing a subtask
 * - Marking a subtask as complete/incomplete
 * - Deleting a subtask
 * - Context menu via long press (mobile) or right-click (desktop)
 * - Swipe interaction for completing subtasks
 * 
 * @param {SubtaskRowProps} props - The props for the SubtaskRow component.
 * @returns {JSX.Element} The SubtaskRow component.
 */
export default function SubtaskRow({
  task,
  subtask,
  index,
  handleSubtaskToggle,
  onOpenActionMenu,
  onInitiateDelete,
  editingSubtaskIdFromDetail,
  onEditStarted,
}: SubtaskRowProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { updateSubtask } = useTask();

  const [isEditing, setIsEditing] = useState(false);
  const [currentEditTitle, setCurrentEditTitle] = useState(subtask.title);
  
  const subtaskRowRef = useRef<HTMLDivElement>(null);

  /**
   * Hook for swipe interactions, converting right swipes to toggle completion status.
   */
  const { ref: swipeableGeneratedRef, ...eventHandlers } = useSwipeable({
    onSwipedRight: () => {
      if (!isEditing) {
        handleSubtaskToggle(subtask.id, !subtask.completed);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  /**
   * Combines the swipeable ref with our local ref for subtaskRow.
   * 
   * @param {HTMLDivElement | null} node - The DOM element to attach to the refs.
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
   * Effect to reset the edit title if isEditing changes or the subtask title changes.
   */
  useEffect(() => {
    if (!isEditing) {
      setCurrentEditTitle(subtask.title);
    }
  }, [subtask.title, isEditing]);

  /**
   * Effect to start editing if triggered externally via editingSubtaskIdFromDetail prop.
   */
  useEffect(() => {
    if (editingSubtaskIdFromDetail && editingSubtaskIdFromDetail === subtask.id && !isEditing) {
      setIsEditing(true);
      if (onEditStarted) {
        onEditStarted(subtask.id);
      }
    }
  }, [editingSubtaskIdFromDetail, subtask.id, isEditing, onEditStarted]);

  /**
   * Enables edit mode for the subtask title.
   * 
   * @param {React.MouseEvent} [event] - The mouse event that triggered editing.
   */
  const handleStartEditing = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setIsEditing(true);
    setCurrentEditTitle(subtask.title);
  };

  /**
   * Cancels editing of the subtask title.
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentEditTitle(subtask.title);
  };

  /**
   * Saves the edited subtask title.
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
        setCurrentEditTitle(subtask.title); // Revert to original title on error
      }
    }
    setIsEditing(false);
  };

  /**
   * Handles keyboard input during editing.
   * (Enter to save, Escape to cancel).
   * 
   * @param {React.KeyboardEvent<HTMLInputElement>} event - The keyboard event.
   */
  const handleEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSaveEdit();
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  };

  /**
   * Handles click events on the subtask row.
   * If not editing and on an interactive element, it triggers the onOpenActionMenu if provided.
   * @param {React.MouseEvent} event - The mouse click event.
   */
  const handleLocalClick = (event: React.MouseEvent) => {
    if (isEditing) {
      event.stopPropagation();
      return;
    }
    const targetElement = event.target as HTMLElement;
    // Check if the click was on an interactive element (checkbox, button, input, link)
    const isInteractiveElement = targetElement.closest('input, button, [role="button"], [role="checkbox"], a');

    if (onOpenActionMenu && !isInteractiveElement) {
      event.preventDefault(); // Prevent default browser context menu if it's a right click
      onOpenActionMenu(subtask.id, event, subtask.title);
    }
  };

  return (
    <div
      ref={combinedRefCallback}
      {...eventHandlers}
      onContextMenu={(e) => onOpenActionMenu && onOpenActionMenu(subtask.id, e, subtask.title)}
      data-role="subtask-row"
      className={cn(
        "group/row flex items-center justify-between space-x-3 rounded-md py-1 pl-2 lg:pl-2 pr-2 hover:bg-muted/50 overflow-hidden relative mt-0",
        "border border-white/5 shadow-sm mb-0.5 bg-white/5 backdrop-blur-sm",
        isEditing && "bg-muted/60"
      )}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="relative mr-3 flex items-center justify-center h-5 w-5 shrink-0">
          <Checkbox
            id={`subtask-${subtask.id}`}
            checked={subtask.completed}
            onCheckedChange={(checked) => handleSubtaskToggle(subtask.id, !!checked)}
            aria-hidden="true"
            className={cn(
              "peer h-full w-full rounded border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:ring-offset-0",
              subtask.completed && "bg-green-500 border-green-600 text-white data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600",
              "data-[state=checked]:text-white"
            )}
          />
          {!subtask.completed && (
            <span 
              className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-medium pointer-events-none",
                "text-muted-foreground/90"
              )}
            >
            {index + 1}
          </span>
          )}
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
                onClick={handleLocalClick}
                onDoubleClick={handleStartEditing}
              >
                {currentEditTitle} 
              </label>
            </>
          )}
        </div>
      </div>
      <div className={cn(
          "hidden lg:flex items-center space-x-1 transition-opacity",
          !isEditing ? "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100" : "opacity-0"
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
              <Button
                variant="ghost"
                size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-red-500 dark:text-muted-foreground dark:hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onInitiateDelete(subtask);
            }}
            aria-label={t('taskDetail.subtask.deleteSubtaskSR')}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">{t('taskDetail.subtask.deleteSubtaskSR')}</span>
              </Button>
        )}
      </div>
    </div>
  );
} 