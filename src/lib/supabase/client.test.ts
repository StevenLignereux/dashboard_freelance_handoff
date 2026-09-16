/**
 * Tests — src/lib/supabase/client.ts
 *
 * Vérifie que :
 * 1. isSupabaseConfigured est false sans variables d'env
 * 2. supabase est null sans variables d'env
 * 3. isSupabaseConfigured est false avec les valeurs placeholder
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Helper : recharge le module avec des import.meta.env contrôlés
async function importClientWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.stubEnv('VITE_SUPABASE_URL', env.VITE_SUPABASE_URL ?? '');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '');
  return import('./client');
}

describe('src/lib/supabase/client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('isSupabaseConfigured est false quand les variables sont absentes', async () => {
    const { isSupabaseConfigured, supabase } = await importClientWith({
      VITE_SUPABASE_URL: undefined,
      VITE_SUPABASE_PUBLISHABLE_KEY: undefined,
    });
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
  });

  it('isSupabaseConfigured est false avec les valeurs placeholder du .env.example', async () => {
    const { isSupabaseConfigured, supabase } = await importClientWith({
      VITE_SUPABASE_URL: 'https://your-project-ref.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'your-anon-publishable-key',
    });
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
  });

  it('isSupabaseConfigured est false avec des chaînes vides', async () => {
    const { isSupabaseConfigured, supabase } = await importClientWith({
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
    });
    expect(isSupabaseConfigured).toBe(false);
    expect(supabase).toBeNull();
  });

  it('isSupabaseConfigured est true et supabase non-null avec des vraies valeurs', async () => {
    const { isSupabaseConfigured, supabase } = await importClientWith({
      VITE_SUPABASE_URL: 'https://abcdefgh.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    });
    expect(isSupabaseConfigured).toBe(true);
    expect(supabase).not.toBeNull();
  });
});
