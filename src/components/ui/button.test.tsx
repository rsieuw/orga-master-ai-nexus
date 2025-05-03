import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils.tsx';
import { Button } from './button.tsx';

describe('Button', () => {
  it('rendert een button element standaard', () => {
    renderWithProviders(<Button>Klik mij</Button>);
    const button = screen.getByRole('button', { name: 'Klik mij' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('rendert kinderen correct', () => {
    renderWithProviders(<Button>Test Knop</Button>);
    expect(screen.getByText('Test Knop')).toBeInTheDocument();
  });

  it('past de juiste klassen toe op basis van variant prop', () => {
    renderWithProviders(<Button variant="destructive">Destructieve Knop</Button>);
    const button = screen.getByRole('button', { name: 'Destructieve Knop' });
    expect(button).toHaveClass('bg-destructive/90');
  });

  it('past de juiste klassen toe op basis van size prop', () => {
    renderWithProviders(<Button size="sm">Kleine Knop</Button>);
    const button = screen.getByRole('button', { name: 'Kleine Knop' });
    expect(button).toHaveClass('h-8');
    expect(button).toHaveClass('text-xs');
  });

  it('geeft de onClick event door', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithProviders(<Button onClick={handleClick}>Klik Event</Button>);
    const button = screen.getByRole('button', { name: 'Klik Event' });
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is uitgeschakeld wanneer disabled prop is ingesteld', () => {
    renderWithProviders(<Button disabled>Uitgeschakeld</Button>);
    expect(screen.getByRole('button', { name: 'Uitgeschakeld' })).toBeDisabled();
  });

  it('accepteert een aangepaste className', () => {
    renderWithProviders(<Button className="custom-class">Aangepaste Class</Button>);
    const button = screen.getByRole('button', { name: 'Aangepaste Class' });
    expect(button).toHaveClass('custom-class');
  });
}); 