/**
 * Tests pour le Supabase Repository
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { SupabaseRepository } from './supabaseRepository';

// Mock du client Supabase
const mockFrom: Mock = vi.fn();
vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    get from() {
      return mockFrom;
    },
  },
  isSupabaseConfigured: true,
}));

describe('SupabaseRepository', () => {
  let repository: SupabaseRepository;

  beforeEach(() => {
    repository = new SupabaseRepository();
    mockFrom.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadContacts', () => {
    it('lance une erreur si Supabase nest pas configuré', async () => {
      const brokenRepo = repository as unknown as {
        ensureSupabaseConfigured: () => void;
        loadContacts: () => Promise<unknown[]>;
      };
      brokenRepo.ensureSupabaseConfigured = () => {
        throw new Error('Supabase repository requires Supabase to be configured. Check environment variables.');
      };

      await expect(brokenRepo.loadContacts()).rejects.toThrow(
        'Supabase repository requires Supabase to be configured'
      );
    });

    it('retourne les contacts mappés', async () => {
      const mockContacts = [
        {
          id: 'c-1',
          first_name: 'Jean',
          last_name: 'Dupont',
          company: 'ACME',
          email: 'jean@example.com',
          phone: '+33123456789',
          notes: 'Test',
          relationship: 'client',
          created_at: '2024-01-01T00:00:00Z',
          last_activity_at: '2024-01-02T00:00:00Z',
          archived: false,
          user_id: 'user-1',
        },
      ];

      const mockRequests = [
        {
          id: 'r-1',
          contact_id: 'c-1',
          title: 'Test',
          description: null,
          status: 'nouveau',
          created_at: '2024-01-01T00:00:00Z',
          last_activity_at: '2024-01-02T00:00:00Z',
          is_active: true,
          archived: false,
          user_id: 'user-1',
        },
      ];

      const mockMissions: unknown[] = [];

      const mockContactsResponse = { data: mockContacts, error: null };
      const mockSelect = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue(mockContactsResponse);
      const mockRequestsResponse = { data: mockRequests, error: null };
      const mockMissionsResponse = { data: mockMissions, error: null };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'contacts') {
          return {
            select: mockSelect,
            order: mockOrder,
          };
        }
        if (table === 'requests') {
          return {
            select: () => Promise.resolve(mockRequestsResponse),
          };
        }
        if (table === 'missions') {
          return {
            select: () => Promise.resolve(mockMissionsResponse),
          };
        }
        return { select: mockSelect };
      });

      const contacts = await repository.loadContacts();

      expect(contacts).toHaveLength(1);
      expect(contacts[0].firstName).toBe('Jean');
      expect(contacts[0].lastName).toBe('Dupont');
      expect(contacts[0].totalRequests).toBe(1);
    });

    it('propage les erreurs Supabase', async () => {
      const mockError = { message: 'Database error' };
      const mockContactsResponse = { data: null, error: mockError };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: () => Promise.resolve(mockContactsResponse),
      });

      await expect(repository.loadContacts()).rejects.toThrow('Failed to load contacts');
    });
  });

  describe('loadRequests', () => {
    it('retourne les demandes avec actions ouvertes', async () => {
      const mockRequests = [
        {
          id: 'r-1',
          contact_id: 'c-1',
          title: 'Test',
          description: null,
          status: 'nouveau',
          created_at: '2024-01-01T00:00:00Z',
          last_activity_at: '2024-01-02T00:00:00Z',
          is_active: true,
          archived: false,
          user_id: 'user-1',
        },
      ];

      const mockActions = [
        {
          id: 'na-1',
          request_id: 'r-1',
          type: 'relance',
          label: 'Relancer',
          due_at: '2024-01-01T10:00:00Z',
          completed_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          user_id: 'user-1',
        },
      ];

      const mockRequestsResponse = { data: mockRequests, error: null };
      const mockActionsResponse = { data: mockActions, error: null };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'requests') {
          return {
            select: vi.fn().mockReturnThis(),
            order: () => Promise.resolve(mockRequestsResponse),
          };
        }
        if (table === 'request_actions') {
          return {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockResolvedValue(mockActionsResponse),
          };
        }
        return { select: vi.fn() };
      });

      const requests = await repository.loadRequests();

      expect(requests).toHaveLength(1);
      expect(requests[0].nextAction).toBeDefined();
      expect(requests[0].nextAction?.id).toBe('na-1');
    });
  });

  describe('loadMissions', () => {
    it('dérive contactId depuis les demandes', async () => {
      const mockMissions = [
        {
          id: 'm-1',
          request_id: 'r-1',
          title: 'Test mission',
          status: 'en_cours',
          start_date: null,
          end_date: null,
          progress: null,
          notes: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          user_id: 'user-1',
        },
      ];

      const mockRequests = [
        {
          id: 'r-1',
          contact_id: 'c-derived',
          title: 'Test',
          description: null,
          status: 'nouveau',
          created_at: '2024-01-01T00:00:00Z',
          last_activity_at: '2024-01-02T00:00:00Z',
          is_active: true,
          archived: false,
          user_id: 'user-1',
        },
      ];

      const mockMissionsResponse = { data: mockMissions, error: null };
      const mockRequestsResponse = { data: mockRequests, error: null };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'missions') {
          return {
            select: vi.fn().mockReturnThis(),
            order: () => Promise.resolve(mockMissionsResponse),
          };
        }
        if (table === 'requests') {
          return {
            select: () => Promise.resolve(mockRequestsResponse),
          };
        }
        return { select: vi.fn() };
      });

      const missions = await repository.loadMissions();

      expect(missions).toHaveLength(1);
      expect(missions[0].contactId).toBe('c-derived');
    });
  });

  describe('loadExchanges', () => {
    it('retourne les échanges mappés', async () => {
      const mockExchanges = [
        {
          id: 'e-1',
          request_id: 'r-1',
          type: 'email',
          occurred_at: '2024-01-01T10:00:00Z',
          summary: 'Test summary',
          created_at: '2024-01-01T00:00:00Z',
          user_id: 'user-1',
        },
      ];

      const mockExchangesResponse = { data: mockExchanges, error: null };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: () => Promise.resolve(mockExchangesResponse),
      });

      const exchanges = await repository.loadExchanges();

      expect(exchanges).toHaveLength(1);
      expect(exchanges[0].type).toBe('email');
      expect(exchanges[0].date).toBe('2024-01-01T10:00:00Z');
    });
  });

  describe('createContact', () => {
    it('lève une erreur explicite sans utilisateur Supabase authentifié', async () => {
      const sb = repository as unknown as {
        getSupabase: () => {
          auth: {
            getUser: () => Promise<{ data: { user: null }; error: null }>;
          };
        };
        createContact: (input: object) => Promise<unknown>;
      };
      sb.getSupabase = () => ({
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        },
      });

      const payload = {
        firstName: 'Marie',
        lastName: 'Curie',
        company: 'Laboratoire',
        email: 'marie@example.com',
        phone: '+33123456789',
        notes: 'Scientifique',
        relationship: 'prospect' as const,
        archived: false,
      };

      await expect(sb.createContact(payload)).rejects.toThrow(
        /no authenticated Supabase user/i
      );
    });

    it('utilise user.id de supabase.auth.getUser() pour le user_id', async () => {
      const newContact = {
        firstName: 'Marie',
        lastName: 'Curie',
        company: 'Laboratoire',
        email: 'marie@example.com',
        phone: '+33123456789',
        notes: 'Scientifique',
        relationship: 'prospect' as const,
        archived: false,
      };

      const createdDbContact = {
        id: 'c-created',
        first_name: 'Marie',
        last_name: 'Curie',
        company: 'Laboratoire',
        email: 'marie@example.com',
        phone: '+33123456789',
        notes: 'Scientifique',
        relationship: 'prospect',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-01T00:00:00Z',
        archived: false,
        user_id: 'user-authenticated',
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: createdDbContact,
        error: null,
      });

      let capturedUser = '';
      const sb = repository as unknown as {
        getSupabase: () => {
          auth: {
            getUser: () => Promise<{ data: { user: { id: string } }; error: null }>;
          };
          from: (table: string) => {
            insert: (row: { user_id?: string }) => unknown;
          };
        };
        createContact: (input: object) => Promise<unknown>;
      };
      sb.getSupabase = () => ({
        auth: {
          getUser: () =>
            Promise.resolve({
              data: { user: { id: 'user-authenticated' } },
              error: null,
            }),
        },
        from: () => ({
          insert: (row: { user_id?: string }) => {
            if (row.user_id) {
              capturedUser = row.user_id;
            }
            mockInsert(row);
            return { select: mockSelect, single: mockSingle };
          },
        }),
      });

      const created = await sb.createContact(newContact);

      expect(capturedUser).toBe('user-authenticated');
      expect(mockInsert).toHaveBeenCalled();
      expect((created as { id: string }).id).toBe('c-created');
      expect((created as { firstName: string }).firstName).toBe('Marie');
    });

    it('propage les erreurs de création', async () => {
      const newContact = {
        firstName: 'Marie',
        lastName: 'Curie',
        company: 'Laboratoire',
        email: 'marie@example.com',
        phone: '+33123456789',
        notes: 'Scientifique',
        relationship: 'prospect' as const,
        archived: false,
      };

      const mockError = { message: 'Insert failed' };
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });

      const sb = repository as unknown as {
        getSupabase: () => {
          auth: {
            getUser: () => Promise<{ data: { user: { id: string } }; error: null }>;
          };
          from: (_t: string) => {
            insert: (_row: unknown) => { select: unknown; single: unknown };
          };
        };
        createContact: (input: object) => Promise<unknown>;
      };
      sb.getSupabase = () => ({
        auth: {
          getUser: () =>
            Promise.resolve({
              data: { user: { id: 'user-1' } },
              error: null,
            }),
        },
        from: () => ({
          insert: () => ({ select: mockSelect, single: mockSingle }),
        }),
      });

      await expect(sb.createContact(newContact)).rejects.toThrow(
        'Failed to create contact'
      );
    });
  });
});