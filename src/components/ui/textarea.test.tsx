import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils.ts';
import { Textarea } from './textarea.tsx';

describe('Textarea', () => {
  it('rendert een textarea element', () => {
    renderWithProviders(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('past placeholder text toe', () => {
    renderWithProviders(<Textarea placeholder="Voer tekst in" />);
    expect(screen.getByPlaceholderText('Voer tekst in')).toBeInTheDocument();
  });

  it('staat gebruikersinvoer toe', async () => {
    renderWithProviders(<Textarea />);
    const textarea = screen.getByRole('textbox');
    
    await userEvent.setup().type(textarea, 'Test invoer');
    
    expect(textarea).toHaveValue('Test invoer');
  });

  it('accepteert een aangepaste className', () => {
    renderWithProviders(<Textarea className="custom-class" data-testid="test-textarea" />);
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveClass('custom-class');
  });

  it('past toegevoegde props toe', () => {
    renderWithProviders(<Textarea readOnly data-testid="test-textarea" />);
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('kan disabled worden', () => {
    renderWithProviders(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });
}); 