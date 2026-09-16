/**
 * Tests pour le Repository Factory
 */

import { describe, it, expect, vi } from 'vitest';
import { createRepository, createRepositoryWithSource, DATA_SOURCE } from './factory';
import { SeedRepository } from './seedRepository';
import { SupabaseRepository } from './supabaseRepository';

const mockSupabaseFrom = vi.fn();
vi.mock('../../lib/supabase/client', () => ({
  get supabase() {
    return { from: mockSupabaseFrom };
  },
  isSupabaseConfigured: false,
}));

describe('Repository Factory', () => {
  describe('DATA_SOURCE', () => {
    it('vaut supabase par défaut (configuration explicite, pas auto-détection)', () => {
      expect(DATA_SOURCE).toBe('supabase');
    });
  });

  describe('createRepository', () => {
    it('retourne SupabaseRepository sans argument', () => {
      const repo = createRepository();
      expect(repo).toBeInstanceOf(SupabaseRepository);
    });

    it('accepte seed en paramètre explicite', () => {
      const repo = createRepository('seed');
      expect(repo).toBeInstanceOf(SeedRepository);
    });

    it('retourne SupabaseRepository quand source=supabase explicitement', () => {
      const repo = createRepository('supabase');
      expect(repo).toBeInstanceOf(SupabaseRepository);
    });
  });

  describe('createRepositoryWithSource', () => {
    it('retourne SeedRepository avec source seed', () => {
      const repo = createRepositoryWithSource('seed');
      expect(repo).toBeInstanceOf(SeedRepository);
    });

    it('retourne SupabaseRepository avec source supabase', () => {
      const repo = createRepositoryWithSource('supabase');
      expect(repo).toBeInstanceOf(SupabaseRepository);
    });

    it('ne fait pas de fallback silencieux quand Supabase échoue', async () => {
      const repo = createRepositoryWithSource('supabase');

      mockSupabaseFrom.mockImplementation(() => {
        throw new Error('Supabase connection failed');
      });

      await expect(repo.loadContacts()).rejects.toThrow('Supabase connection failed');
    });
  });

  describe('absence de fallback silencieux', () => {
    it('ne bascule pas vers seed après erreur Supabase explicite', async () => {
      const repo = createRepositoryWithSource('supabase');

      const mockError = new Error('Network error');
      mockSupabaseFrom.mockImplementation(() => {
        throw mockError;
      });

      await expect(repo.loadContacts()).rejects.toThrow('Network error');

      expect(repo).toBeInstanceOf(SupabaseRepository);
    });

    it('createRepository() default ne retourne jamais SeedRepository même si Supabase indisponible', async () => {
      const repo = createRepository();
      expect(repo).toBeInstanceOf(SupabaseRepository);

      mockSupabaseFrom.mockImplementation(() => {
        throw new Error('Supabase down');
      });
      await expect(repo.loadContacts()).rejects.toThrow('Supabase down');
      expect(repo).toBeInstanceOf(SupabaseRepository);
    });
  });
});