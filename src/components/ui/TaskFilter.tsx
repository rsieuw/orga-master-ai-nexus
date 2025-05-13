"use client";

import * as React from "react";
import { Button } from "@/components/ui/button.tsx"; // Ensure .tsx extension
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx"; // Ensure .tsx extension
import { Check, Filter } from "lucide-react";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { TASK_CATEGORIES, TaskCategory } from "@/constants/categories.ts";

// Match TaskStatus with your existing types if possible, or define as needed
export type TaskFilterStatus = "all" | "completed" | "incomplete";
// Match TaskPriority with your existing types if possible
export type TaskFilterPriority = "all" | "high" | "medium" | "low" | "none"; // Added 'none' to match TaskPriority type
export type TaskFilterCategory = "all" | TaskCategory;

interface TaskFilterProps {
  onFilterChange: (status: TaskFilterStatus, priority: TaskFilterPriority, category: TaskFilterCategory) => void;
}

const TaskFilter: React.FC<TaskFilterProps> = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TaskFilterStatus>("all");
  const [priority, setPriority] = useState<TaskFilterPriority>("all");
  const [category, setCategory] = useState<TaskFilterCategory>("all");

  const handleStatusChange = (newStatus: TaskFilterStatus) => {
    setStatus(newStatus);
    onFilterChange(newStatus, priority, category);
  };

  const handlePriorityChange = (newPriority: TaskFilterPriority) => {
    setPriority(newPriority);
    onFilterChange(status, newPriority, category);
  };

  const handleCategoryChange = (newCategory: TaskFilterCategory) => {
    setCategory(newCategory);
    onFilterChange(status, priority, newCategory);
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
        <DropdownMenuCheckboxItem
          className="cursor-pointer"
          checked={category === "all"}
          onCheckedChange={() => handleCategoryChange("all")}
        >
          {t('taskFilter.all')}
          {category === "all" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        
        {TASK_CATEGORIES.map((cat) => (
          <DropdownMenuCheckboxItem
            key={cat}
            className="cursor-pointer"
            checked={category === cat}
            onCheckedChange={() => handleCategoryChange(cat as TaskFilterCategory)}
          >
            {cat}
            {category === cat && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskFilter; 