import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils.tsx';
import { Textarea } from './textarea.tsx';

describe('Textarea', () => {
  it('renders a textarea element', () => {
    renderWithProviders(<Textarea />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('applies placeholder text', () => {
    renderWithProviders(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('allows user input', async () => {
    renderWithProviders(<Textarea />);
    const textarea = screen.getByRole('textbox');
    
    await userEvent.setup().type(textarea, 'Test input');
    
    expect(textarea).toHaveValue('Test input');
  });

  it('accepts a custom className', () => {
    renderWithProviders(<Textarea className="custom-class" data-testid="test-textarea" />);
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveClass('custom-class');
  });

  it('applies additional props', () => {
    renderWithProviders(<Textarea readOnly data-testid="test-textarea" />);
    const textarea = screen.getByTestId('test-textarea');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('can be disabled', () => {
    renderWithProviders(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });
}); 