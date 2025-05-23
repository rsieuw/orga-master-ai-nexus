import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-helpers.ts';
import Navbar from './Navbar.tsx';
import { useAuth } from '@/hooks/useAuth.ts';

// Mock de AuthContext hook, maar behoud de originele provider
vi.mock('@/contexts/AuthContext.tsx', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/contexts/AuthContext.tsx')>();
  return {
    ...original, // Exporteer alle originele onderdelen (inclusief AuthProvider)
    useAuth: vi.fn(), // Overschrijf alleen useAuth met de mock
  };
});

describe('Navbar', () => {
  const mockOpenNewTaskModal = vi.fn(); // Define the mock function once

  describe('Niet-geauthenticeerde gebruiker', () => {
    beforeEach(() => {
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: false,
        logout: vi.fn(),
        user: null,
      });
      mockOpenNewTaskModal.mockClear(); // Clear mock before each test in this describe block
    });

    it('toont de logo en applicatienaam', () => {
      renderWithProviders(<Navbar openNewTaskModal={mockOpenNewTaskModal} />);
      expect(screen.getByText('OrgaMaster AI')).toBeInTheDocument();
    });

    it('toont login en register links wanneer gebruiker niet is ingelogd', () => {
      renderWithProviders(<Navbar openNewTaskModal={mockOpenNewTaskModal} />);
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('toont geen nieuwe taak knop wanneer gebruiker niet is ingelogd', () => {
      renderWithProviders(<Navbar openNewTaskModal={mockOpenNewTaskModal} />);
      expect(screen.queryByText(/nieuwe taak/i)).not.toBeInTheDocument();
    });
  });

  describe('Geauthenticeerde gebruiker', () => {
    const mockLogout = vi.fn();
    
    beforeEach(() => {
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isAuthenticated: true,
        logout: mockLogout,
        user: { name: 'Test Gebruiker', email: 'test@example.com' },
      });
      mockOpenNewTaskModal.mockClear(); // Clear mock before each test in this describe block
    });

    it('toont de "Nieuwe Taak" knop wanneer gebruiker is ingelogd', () => {
      renderWithProviders(<Navbar openNewTaskModal={mockOpenNewTaskModal} />);
      expect(screen.getByText(/nieuwe taak/i)).toBeInTheDocument();
    });

    it('toont de gebruiker dropdown met gebruikersnaam', async () => {
      renderWithProviders(<Navbar openNewTaskModal={mockOpenNewTaskModal} />);
      
      // Klik op het gebruikerspictogram om de dropdown te openen
      const userIcon = screen.getByRole('button', { name: '' });
      await userEvent.setup().click(userIcon);
      
      // Controleer of de gebruikersnaam in de dropdown staat
      await waitFor(() => {
        expect(screen.getByText('Test Gebruiker')).toBeInTheDocument();
      });
    });

    it('bevat profiel en instellingen links in de dropdown', async () => {
      renderWithProviders(<Navbar openNewTaskModal={mockOpenNewTaskModal} />);
      
      // Klik op het gebruikerspictogram om de dropdown te openen
      const userIcon = screen.getByRole('button', { name: '' });
      await userEvent.setup().click(userIcon);
      
      // Controleer of de links in de dropdown staan
      await waitFor(() => {
        expect(screen.getByText('Profiel')).toBeInTheDocument();
        expect(screen.getByText('Instellingen')).toBeInTheDocument();
      });
    });

    it('roept de logout functie aan wanneer op uitloggen wordt geklikt', async () => {
      renderWithProviders(<Navbar openNewTaskModal={mockOpenNewTaskModal} />);
      
      // Klik op het gebruikerspictogram om de dropdown te openen
      const userIcon = screen.getByRole('button', { name: '' });
      await userEvent.setup().click(userIcon);
      
      // Klik op de uitlog knop
      const logoutButton = await screen.findByText('Uitloggen');
      await userEvent.setup().click(logoutButton);
      
      // Controleer of de logout functie is aangeroepen
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });
}); 