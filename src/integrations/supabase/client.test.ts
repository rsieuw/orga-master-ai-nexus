/**
 * @fileoverview Unit tests for the Supabase client initialization.
 * These tests verify that the Supabase client is created with the correct parameters
 * and that the client instance is properly exported.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock the createClient function
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {},
    from: vi.fn(),
  }))
}));

describe('Supabase Client', () => {
  // Re-import the module before each test to ensure clean tests
  beforeEach(() => {
    vi.resetModules();
  });
  
  it('initializes the client with the correct URL and key', async () => {
    // Dynamically import the client for each test
    await import('./client.ts');
    
    // Check if createClient was called
    expect(createClient).toHaveBeenCalled();
    
    // Check if the first parameter is a valid Supabase URL
    const calls = vi.mocked(createClient).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    
    const firstArg = calls[0][0];
    expect(typeof firstArg).toBe('string');
    expect(firstArg).toContain('supabase.co');
    
    // Check if the second parameter is a string (the API key)
    const secondArg = calls[0][1];
    expect(typeof secondArg).toBe('string');
    expect(secondArg.length).toBeGreaterThan(0);
  });
  
  it('exports the supabase client', async () => {
    // Dynamically import the client for each test
    const { supabase } = await import('./client.ts');
    
    // Check if the client is an object
    expect(typeof supabase).toBe('object');
    expect(supabase).not.toBeNull();
  });
}); 