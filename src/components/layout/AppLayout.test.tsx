import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import AppLayout from './AppLayout';
import { useAuth } from '@/contexts/AuthContext';

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/contexts/AuthContext')>();
  return {
    ...original, // Keep AuthProvider
    useAuth: vi.fn(),
  };
});

// Optional: Mock Navbar and Footer if they cause issues or have complex logic
// vi.mock('./Navbar', () => ({ default: () => <nav data-testid="mock-navbar">Mock Navbar</nav> }));
// vi.mock('./Footer', () => ({ default: () => <footer data-testid="mock-footer">Mock Footer</footer> }));

describe('AppLayout', () => {

  beforeEach(() => {
    // Reset mocks and provide default implementation for useAuth
    vi.clearAllMocks();
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true, // Default to authenticated
      user: { id: 'test-user', email: 'test@test.com' },
      logout: vi.fn(),
      // Add other context values if AppLayout uses them
    });
  });

  it('should render its children', () => {
    const testMessage = 'Test Child Component';
    renderWithProviders(
      <AppLayout>
        <div>{testMessage}</div>
      </AppLayout>
    );
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it('should render the Navbar component', () => {
    // This test assumes Navbar is NOT mocked and renders identifiable content
    renderWithProviders(<AppLayout><div /></AppLayout>);
    // Look for something specific rendered by Navbar (e.g., the app title or logo)
    // If Navbar IS mocked, use: expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByText('OrgaMaster AI')).toBeInTheDocument(); // Assuming Navbar renders this title
  });

  it('should render the Footer component', () => {
    // This test assumes Footer is NOT mocked
    renderWithProviders(<AppLayout><div /></AppLayout>);
    // Look for something specific rendered by Footer
    // If Footer IS mocked, use: expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    // Example: Assuming footer has copyright text
    expect(screen.getByText(/© \d{4} OrgaMaster AI/i)).toBeInTheDocument(); 
  });

  // Test adjusted to check for non-rendering due to navigation
  it('should not render layout content when unauthenticated and auth is required', () => {
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    });

    const testMessage = 'Should Not Be Rendered';
    renderWithProviders(<AppLayout><div>{testMessage}</div></AppLayout>); // requireAuth is default true

    // Verify that children are NOT rendered due to navigation
    expect(screen.queryByText(testMessage)).not.toBeInTheDocument();
    // Verify Navbar/Footer are NOT rendered
    expect(screen.queryByText('OrgaMaster AI')).not.toBeInTheDocument(); // Assuming Navbar title
    expect(screen.queryByText(/© \d{4} OrgaMaster AI/i)).not.toBeInTheDocument(); // Assuming Footer text
  });
}); 