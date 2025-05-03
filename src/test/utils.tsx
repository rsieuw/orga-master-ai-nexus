import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { vi } from 'vitest';

// Maak een nieuwe QueryClient voor elke test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Wrapper met alle providers die nodig zijn voor de applicatie
interface AllTheProvidersProps {
  children: React.ReactNode;
}

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

// Aangepaste render functie met alle providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Mock voor de Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(),
      order: vi.fn(),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}; 