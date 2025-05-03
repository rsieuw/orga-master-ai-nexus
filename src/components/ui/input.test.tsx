import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { Input } from './input';

describe('Input', () => {
  it('rendert een input element', () => {
    renderWithProviders(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('past het type attribuut toe', () => {
    renderWithProviders(<Input type="password" data-testid="password-input" />);
    const input = screen.getByTestId('password-input');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('past placeholder text toe', () => {
    renderWithProviders(<Input placeholder="Voer tekst in" />);
    expect(screen.getByPlaceholderText('Voer tekst in')).toBeInTheDocument();
  });

  it('accepteert een aangepaste className', () => {
    renderWithProviders(<Input className="custom-class" data-testid="test-input" />);
    const input = screen.getByTestId('test-input');
    expect(input).toHaveClass('custom-class');
  });

  it('handelt waardewijzigingen af', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    renderWithProviders(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test');
    expect(handleChange).toHaveBeenCalled();
  });

  it('geeft de ingevoerde waarde weer', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<Input />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'test');
    expect(input).toHaveValue('test');
  });

  it('past disabled attribuut toe', () => {
    renderWithProviders(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('past required attribuut toe', () => {
    renderWithProviders(<Input required />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });
}); 