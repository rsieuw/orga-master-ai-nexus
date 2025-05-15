import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { AllTheProviders } from './utils.tsx'; // Importeren van AllTheProviders

/**
 * Custom render function for testing React components.
 * It wraps the UI with the `AllTheProviders` component, so all necessary contexts are available.
 * Uses `@testing-library/react`'s `render` function.
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

/**
 * Mock object for the Supabase client, used for testing purposes.
 */
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