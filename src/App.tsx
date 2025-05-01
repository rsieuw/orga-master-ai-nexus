import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GradientLoader } from "@/components/ui/loader";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TaskDetail from "./pages/TaskDetail";
import TaskForm from "./pages/TaskForm";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// New component to handle conditional rendering based on auth loading state
const AppContent = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    // Show loader while AuthProvider is initializing
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <GradientLoader size="lg" />
      </div>
    );
  }

  // Render TaskProvider and the rest of the app once auth is loaded
  return (
    <TaskProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/new-task" element={<TaskForm />} />
            <Route path="/task/edit/:id" element={<TaskForm />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TaskProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        {/* Render AppContent which handles auth loading state */}
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
