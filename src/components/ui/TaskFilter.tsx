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

// Match TaskStatus with your existing types if possible, or define as needed
export type TaskFilterStatus = "all" | "completed" | "incomplete";
// Match TaskPriority with your existing types if possible
export type TaskFilterPriority = "all" | "high" | "medium" | "low" | "none"; // Added 'none' to match TaskPriority type

interface TaskFilterProps {
  onFilterChange: (status: TaskFilterStatus, priority: TaskFilterPriority) => void;
}

const TaskFilter: React.FC<TaskFilterProps> = ({ onFilterChange }) => {
  const [status, setStatus] = useState<TaskFilterStatus>("all");
  const [priority, setPriority] = useState<TaskFilterPriority>("all");

  const handleStatusChange = (newStatus: TaskFilterStatus) => {
    setStatus(newStatus);
    onFilterChange(newStatus, priority);
  };

  const handlePriorityChange = (newPriority: TaskFilterPriority) => {
    setPriority(newPriority);
    onFilterChange(status, newPriority);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1" // Removed border-dashed for default look
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-48 glass-effect" // Use the same glass-effect class as the user menu
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Status
        </div>
        <DropdownMenuCheckboxItem
          checked={status === "all"}
          onCheckedChange={() => handleStatusChange("all")}
        >
          Alles
          {status === "all" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={status === "completed"}
          onCheckedChange={() => handleStatusChange("completed")}
        >
          Voltooid
          {status === "completed" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={status === "incomplete"}
          onCheckedChange={() => handleStatusChange("incomplete")}
        >
          Onvoltooid
          {status === "incomplete" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Prioriteit
        </div>
        <DropdownMenuCheckboxItem
          checked={priority === "all"}
          onCheckedChange={() => handlePriorityChange("all")}
        >
          Alles
          {priority === "all" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={priority === "high"}
          onCheckedChange={() => handlePriorityChange("high")}
        >
          Hoog
          {priority === "high" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={priority === "medium"}
          onCheckedChange={() => handlePriorityChange("medium")}
        >
          Medium
          {priority === "medium" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={priority === "low"}
          onCheckedChange={() => handlePriorityChange("low")}
        >
          Laag
          {priority === "low" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
         <DropdownMenuCheckboxItem
          checked={priority === "none"}
          onCheckedChange={() => handlePriorityChange("none")}
        >
          Geen
          {priority === "none" && <Check className="h-4 w-4 ml-auto" />}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskFilter; 