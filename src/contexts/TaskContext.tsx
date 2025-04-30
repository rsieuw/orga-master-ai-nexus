
import { createContext, useContext, useState, useEffect } from "react";
import { Task, TaskPriority, TaskStatus, TasksByDate } from "../types/task";
import { useAuth } from "./AuthContext";

interface TaskContextProps {
  tasks: Task[];
  isLoading: boolean;
  createTask: (task: Omit<Task, "id" | "userId" | "createdAt" | "subtasks">) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  groupTasksByDate: () => TasksByDate;
  suggestPriority: (title: string, description: string) => Promise<TaskPriority>;
}

const TaskContext = createContext<TaskContextProps | undefined>(undefined);

// Mock tasks for development
const generateMockTasks = (userId: string): Task[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const later = new Date(today);
  later.setDate(later.getDate() + 14);

  return [
    {
      id: "1",
      title: "Finish OrgaMaster AI project",
      description: "Complete all required features and deploy",
      priority: "high",
      status: "in_progress",
      deadline: today.toISOString(),
      userId,
      createdAt: new Date(today.getTime() - 86400000).toISOString(),
      subtasks: [
        { id: "1-1", title: "Set up authentication", completed: true, taskId: "1" },
        { id: "1-2", title: "Create task management UI", completed: false, taskId: "1" }
      ]
    },
    {
      id: "2",
      title: "Send client proposal",
      description: "Prepare and send the project proposal",
      priority: "high",
      status: "todo",
      deadline: today.toISOString(),
      userId,
      createdAt: new Date(today.getTime() - 172800000).toISOString(),
      subtasks: []
    },
    {
      id: "3",
      title: "Weekly team meeting",
      description: "Discuss progress and blockers",
      priority: "medium",
      status: "todo",
      deadline: tomorrow.toISOString(),
      userId,
      createdAt: new Date(today.getTime() - 259200000).toISOString(),
      subtasks: []
    },
    {
      id: "4",
      title: "Review design mockups",
      description: "Provide feedback on new designs",
      priority: "medium",
      status: "todo",
      deadline: dayAfter.toISOString(),
      userId,
      createdAt: new Date(today.getTime() - 345600000).toISOString(),
      subtasks: []
    },
    {
      id: "5",
      title: "Quarterly planning",
      description: "Plan next quarter objectives",
      priority: "low",
      status: "todo",
      deadline: nextWeek.toISOString(),
      userId,
      createdAt: new Date(today.getTime() - 432000000).toISOString(),
      subtasks: []
    },
    {
      id: "6",
      title: "Research new technologies",
      description: "Look into emerging tech trends",
      priority: "low",
      status: "todo",
      deadline: later.toISOString(),
      userId,
      createdAt: new Date(today.getTime() - 518400000).toISOString(),
      subtasks: []
    }
  ];
};

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Mock API call - replace with Supabase once integrated
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Get tasks from localStorage or generate mock tasks
          const storedTasks = localStorage.getItem("tasks");
          if (storedTasks) {
            setTasks(JSON.parse(storedTasks));
          } else {
            const mockTasks = generateMockTasks(user.id);
            setTasks(mockTasks);
            localStorage.setItem("tasks", JSON.stringify(mockTasks));
          }
        } else {
          setTasks([]);
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [user]);

  const createTask = async (
    taskData: Omit<Task, "id" | "userId" | "createdAt" | "subtasks">
  ): Promise<Task> => {
    if (!user) throw new Error("User must be authenticated to create tasks");

    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
      subtasks: []
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    
    return newTask;
  };

  const updateTask = async (id: string, taskData: Partial<Task>): Promise<Task> => {
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...taskData
    };

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = updatedTask;
    
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    
    return updatedTask;
  };

  const deleteTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  };

  const getTaskById = (id: string): Task | undefined => {
    return tasks.find(t => t.id === id);
  };

  const groupTasksByDate = (): TasksByDate => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(nextWeekStart.getDate() + 3);
    
    const nextWeekEnd = new Date(today);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

    return {
      today: tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      }),
      tomorrow: tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === tomorrow.getTime();
      }),
      dayAfterTomorrow: tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === dayAfterTomorrow.getTime();
      }),
      nextWeek: tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return (
          taskDate.getTime() >= nextWeekStart.getTime() && 
          taskDate.getTime() <= nextWeekEnd.getTime()
        );
      }),
      later: tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() > nextWeekEnd.getTime();
      })
    };
  };

  // Mock AI priority suggestion (to be replaced with actual API call)
  const suggestPriority = async (title: string, description: string): Promise<TaskPriority> => {
    // Simple mock logic - in real app, this would call an AI API
    const combinedText = (title + " " + description).toLowerCase();
    if (
      combinedText.includes("urgent") ||
      combinedText.includes("important") ||
      combinedText.includes("critical") ||
      combinedText.includes("asap")
    ) {
      return "high";
    } else if (
      combinedText.includes("soon") ||
      combinedText.includes("next") ||
      combinedText.includes("follow")
    ) {
      return "medium";
    } else {
      return "low";
    }
  };

  return (
    <TaskContext.Provider 
      value={{ 
        tasks, 
        isLoading, 
        createTask, 
        updateTask, 
        deleteTask,
        getTaskById,
        groupTasksByDate,
        suggestPriority
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};
