import { describe, it, expect } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext.tsx';

describe('AuthContext', () => {
  it('kan worden geïmporteerd', () => {
    expect(AuthProvider).toBeDefined();
    expect(useAuth).toBeDefined();
  });
}); 