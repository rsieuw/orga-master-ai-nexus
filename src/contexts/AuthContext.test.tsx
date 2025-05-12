import { describe, it, expect } from 'vitest';
import { AuthProvider } from './AuthContext.tsx';
import { useAuth } from '../hooks/useAuth';

describe('AuthContext', () => {
  it('kan worden geïmporteerd', () => {
    expect(AuthProvider).toBeDefined();
    expect(useAuth).toBeDefined();
  });
}); 