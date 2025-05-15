"use client";

import * as React from "react";
import { Button } from "@/components/ui/button.tsx"; // Ensure .tsx extension
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu.tsx"; // Ensure .tsx extension
import { Check, Filter } from "lucide-react";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { TASK_CATEGORIES, TASK_CATEGORY_KEYS, TaskCategory } from "@/constants/categories.ts";

// Match TaskStatus with your existing types if possible, or define as needed
/** Type for task status filter options. */
export type TaskFilterStatus = "all" | "completed" | "incomplete";
// Match TaskPriority with your existing types if possible
/** Type for task priority filter options. */
export type TaskFilterPriority = "all" | "high" | "medium" | "low" | "none"; // Added 'none' to match TaskPriority type
/** Type for task category filter options. */
export type TaskFilterCategory = "all" | TaskCategory;

/**
 * Props for the TaskFilter component.
 *
 * @interface TaskFilterProps
 */
interface TaskFilterProps {
  /** Callback function triggered when any filter selection changes. */
  onFilterChange: (status: TaskFilterStatus, priority: TaskFilterPriority, category: TaskFilterCategory) => void;
}

/**
 * TaskFilter component.
 *
 * Provides a dropdown menu to filter tasks by status, priority, and category.
 *
 * @param {TaskFilterProps} props - The props for the component.
 * @returns {JSX.Element} The rendered TaskFilter component.
 */
const TaskFilter: React.FC<TaskFilterProps> = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TaskFilterStatus>("all");
  const [priority, setPriority] = useState<TaskFilterPriority>("all");
  const [category, setCategory] = useState<TaskFilterCategory>("all");

  /**
   * Handles changes to the status filter.
   * Updates the status state and calls onFilterChange.
   * @param {TaskFilterStatus} newStatus - The new status filter value.
   */
  const handleStatusChange = (newStatus: TaskFilterStatus) => {
    setStatus(newStatus);
    onFilterChange(newStatus, priority, category);
  };

  /**
   * Handles changes to the priority filter.
   * Updates the priority state and calls onFilterChange.
   * @param {TaskFilterPriority} newPriority - The new priority filter value.
   */
  const handlePriorityChange = (newPriority: TaskFilterPriority) => {
    setPriority(newPriority);
    onFilterChange(status, newPriority, category);
  };

  /**
   * Handles changes to the category filter.
   * Updates the category state and calls onFilterChange.
   * @param {TaskFilterCategory} newCategory - The new category filter value.
   */
  const handleCategoryChange = (newCategory: TaskFilterCategory) => {
    setCategory(newCategory);
    onFilterChange(status, priority, newCategory);
  };

  // Finds the translation key for a given category string.
  /**
   * Finds the translation key for a given category string.
   * @param {string} category - The category string.
   * @returns {string} The translation key or the original category string if not found.
   */
  const getCategoryTranslationKey = (category: string) => {
    const index = TASK_CATEGORIES.findIndex(cat => cat === category);
    return index !== -1 ? TASK_CATEGORY_KEYS[index] : category;
  };

  // Gets the translated name for a given category string using its translation key.
  /**
   * Gets the translated name for a given category string using its translation key.
   * @param {string} category - The category string.
   * @returns {string} The translated category name.
   */
  const getTranslatedCategory = (category: string) => {
    const translationKey = getCategoryTranslationKey(category);
    return t(translationKey);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 glass-effect" // Made wider to accommodate category names
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {t('taskFilter.statusTitle')}
        </div>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={status === "all"}
          onCheckedChange={() => handleStatusChange("all")}
        >
          {t('taskFilter.all')}
          {status === "all" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={status === "completed"}
          onCheckedChange={() => handleStatusChange("completed")}
        >
          {t('taskFilter.completed')}
          {status === "completed" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={status === "incomplete"}
          onCheckedChange={() => handleStatusChange("incomplete")}
        >
          {t('taskFilter.incomplete')}
          {status === "incomplete" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {t('taskFilter.priorityTitle')}
        </div>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={priority === "all"}
          onCheckedChange={() => handlePriorityChange("all")}
        >
          {t('taskFilter.all')}
          {priority === "all" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={priority === "high"}
          onCheckedChange={() => handlePriorityChange("high")}
        >
          {t('taskFilter.high')}
          {priority === "high" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={priority === "medium"}
          onCheckedChange={() => handlePriorityChange("medium")}
        >
          {t('taskFilter.medium')}
          {priority === "medium" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={priority === "low"}
          onCheckedChange={() => handlePriorityChange("low")}
        >
          {t('taskFilter.low')}
          {priority === "low" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {t('taskFilter.categoryTitle', 'Categorie')}
        </div>
        <DropdownMenuRadioGroup 
          value={category} 
          onValueChange={(value: string) => handleCategoryChange(value as TaskFilterCategory)}
          className="px-2" // Add padding for alignment with checkbox items
        >
          <DropdownMenuRadioItem value="all">
            {t('taskFilter.all')}
          </DropdownMenuRadioItem>
          
          {TASK_CATEGORIES.map((cat) => (
            <DropdownMenuRadioItem key={cat} value={cat}>
              {getTranslatedCategory(cat)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskFilter; 