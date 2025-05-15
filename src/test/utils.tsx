import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext.tsx';
import { TaskProvider } from '@/contexts/TaskContext.tsx';
import { ThemeProvider } from '@/contexts/ThemeContext.tsx';

/**
 * @fileoverview Provides utility functions and components for testing React components.
 * Includes a custom render function that wraps components with necessary providers
 * (Router, QueryClient, Theme, Auth, Task) and a mock for the Supabase client.
 */

/**
 * Creates a new `QueryClient` instance specifically configured for testing.
 * Disables retries for queries by default to make tests more predictable.
 * @returns {QueryClient} A new QueryClient instance for tests.
 */
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

/**
 * Props for the `AllTheProviders` wrapper component.
 * @interface AllTheProvidersProps
 */
interface AllTheProvidersProps {
  /** The child components to be wrapped by the providers. */
  children: React.ReactNode;
}

/**
 * A React functional component that wraps its children with all the necessary context providers
 * used in the application. This is used as a wrapper in `renderWithProviders` to ensure
 * components have access to contexts like Router, QueryClient, Theme, Auth, and Task.
 *
 * @param {AllTheProvidersProps} props - The props for the component.
 * @returns {JSX.Element} The children wrapped with all providers.
 */
export const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();
  
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TaskProvider>
              {children}
            </TaskProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// renderWithProviders functie is verplaatst naar src/test/test-helpers.ts

// mockSupabaseClient object is verplaatst naar src/test/test-helpers.ts 