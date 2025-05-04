import { Toaster } from "@/components/ui/toaster.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { ThemeProvider } from "@/contexts/ThemeContext.tsx";
import { AuthProvider, useAuth } from "@/contexts/AuthContext.tsx";
import { TaskProvider } from "@/contexts/TaskContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GradientLoader } from "@/components/ui/loader.tsx";

// Pages
import Dashboard from "./pages/Dashboard.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import TaskDetail from "./pages/TaskDetail.tsx";
import TaskForm from "./pages/TaskForm.tsx";
import Settings from "./pages/Settings.tsx";
import Profile from "./pages/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";
import SupportPage from "./pages/Support.tsx";
import DocumentationPage from "./pages/Documentation.tsx";

// Importeer de nieuwe admin componenten
import AdminRouteGuard from "./components/auth/AdminRouteGuard.tsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";

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
            <Route path="/support" element={<SupportPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            
            {/* Admin Routes */}
            <Route element={<AdminRouteGuard />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>

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
