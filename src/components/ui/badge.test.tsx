import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Badge } from './badge';

describe('Badge', () => {
  it('rendert een badge met standaard variant', () => {
    renderWithProviders(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('past de juiste klassen toe op basis van variant prop', () => {
    renderWithProviders(<Badge variant="secondary" data-testid="test-badge">Secondary Badge</Badge>);
    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveClass('bg-secondary/80');
  });

  it('past destructive variant toe wanneer gespecificeerd', () => {
    renderWithProviders(<Badge variant="destructive" data-testid="test-badge">Destructive Badge</Badge>);
    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveClass('bg-destructive/80');
  });

  it('past outline variant toe wanneer gespecificeerd', () => {
    renderWithProviders(<Badge variant="outline" data-testid="test-badge">Outline Badge</Badge>);
    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveClass('bg-background/30');
  });

  it('rendert kinderen correct', () => {
    renderWithProviders(<Badge>Child Text</Badge>);
    expect(screen.getByText('Child Text')).toBeInTheDocument();
  });

  it('accepteert een aangepaste className', () => {
    renderWithProviders(<Badge className="custom-class" data-testid="test-badge">Custom Class Badge</Badge>);
    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveClass('custom-class');
  });
}); 