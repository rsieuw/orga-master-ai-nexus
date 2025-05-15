import { Toaster } from "@/components/ui/toaster.tsx";
import { Toaster as Sonner } from "@/components/ui/sonner.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { ThemeProvider } from "@/contexts/ThemeContext.tsx";
import { AuthProvider } from "@/contexts/AuthContext.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import { TaskProvider } from "@/contexts/TaskContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GradientLoader } from "@/components/ui/loader.tsx";
import { useEffect } from "react";
import { initCapacitor } from "./capacitorApp.ts";

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
import ContactPage from "./pages/ContactPage.tsx";
import PricingPage from "./pages/Pricing.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import UpdatePasswordPage from "./pages/UpdatePasswordPage.tsx";
import TypedGreetingTest from "./pages/TypedGreetingTest.tsx";

// Import the new admin components
import AdminRouteGuard from "./components/auth/AdminRouteGuard.tsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.tsx";

/**
 * React Query client instance for managing server state, caching, and data fetching.
 * @constant
 * @type {QueryClient}
 */
const queryClient = new QueryClient();

/**
 * `AppContent` component handles the conditional rendering based on the authentication loading state.
 * It initializes Capacitor functionalities and renders the main application structure (routes and providers)
 * once the authentication status is determined.
 * If authentication is loading, it displays a loading spinner.
 * @returns {JSX.Element} The main application content or a loader.
 */
const AppContent = () => {
  const { isLoading } = useAuth();

  /**
   * useEffect hook to initialize Capacitor functionalities when the component mounts.
   * Logs an error if Capacitor initialization fails.
   */
  useEffect(() => {
    const initApp = async () => {
      try {
        await initCapacitor();
      } catch (error) {
        console.error("Error initializing Capacitor:", error);
      }
    };

    initApp();
  }, []);

  if (isLoading) {
    // Show loader while AuthProvider is initializing
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/new-task" element={<TaskForm />} />
            <Route path="/task/edit/:id" element={<TaskForm />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/typed-greeting-test" element={<TypedGreetingTest />} />
            
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

/**
 * The main `App` component that sets up the root providers for the application.
 * It wraps the `AppContent` with `QueryClientProvider`, `AuthProvider`, and `ThemeProvider`.
 * @returns {JSX.Element} The root application component.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        {/* Render AppContent which handles auth loading state */}
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
