export type TaskPriority = "high" | "medium" | "low" | "none";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string; // ISO date string
  userId: string;
  createdAt: string;
  subtasks: SubTask[];
}

export interface AIResearchResult {
  id: string;
  taskId: string;
  content: string;
  source: "openai" | "perplexity";
  createdAt: string;
}

export interface TasksByDate {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  dayAfterTomorrow: Task[];
  nextWeek: Task[];
  later: Task[];
}
