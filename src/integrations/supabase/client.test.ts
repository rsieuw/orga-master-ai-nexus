import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock de createClient functie
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {},
    from: vi.fn(),
  }))
}));

describe('Supabase Client', () => {
  // Importeer de module opnieuw voor elke test om zuivere tests te garanderen
  beforeEach(() => {
    vi.resetModules();
  });
  
  it('initialiseert de client met de juiste URL en key', async () => {
    // Dynamisch importeren van client voor elke test
    await import('./client.ts');
    
    // Controleer of createClient is aangeroepen
    expect(createClient).toHaveBeenCalled();
    
    // Controleer of de eerste parameter een geldige Supabase URL is
    const calls = vi.mocked(createClient).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    
    const firstArg = calls[0][0];
    expect(typeof firstArg).toBe('string');
    expect(firstArg).toContain('supabase.co');
    
    // Controleer of de tweede parameter een string is (de API key)
    const secondArg = calls[0][1];
    expect(typeof secondArg).toBe('string');
    expect(secondArg.length).toBeGreaterThan(0);
  });
  
  it('exporteert de supabase client', async () => {
    // Dynamisch importeren van client voor elke test
    const { supabase } = await import('./client.ts');
    
    // Controleer of de client een object is
    expect(typeof supabase).toBe('object');
    expect(supabase).not.toBeNull();
  });
}); 