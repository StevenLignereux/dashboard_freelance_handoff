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

    it('propage une erreur sur la requête secondaire requests (pas de résultat partiel silencieux)', async () => {
      const mockContactsResponse = { data: [{ id: 'c-1' }], error: null };
      const mockRequestsError = { message: 'requests error' };
      const mockMissionsResponse = { data: [], error: null };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'contacts') {
          return {
            select: vi.fn().mockReturnThis(),
            order: () => Promise.resolve(mockContactsResponse),
          };
        }
        if (table === 'requests') {
          return {
            select: () => Promise.resolve({ data: null, error: mockRequestsError }),
          };
        }
        if (table === 'missions') {
          return { select: () => Promise.resolve(mockMissionsResponse) };
        }
        return { select: vi.fn() };
      });

      await expect(repository.loadContacts()).rejects.toThrow(
        /Failed to load requests .* dérivés contact/
      );
    });

    it('propage une erreur sur la requête secondaire missions (pas de résultat partiel silencieux)', async () => {
      const mockContactsResponse = { data: [{ id: 'c-1' }], error: null };
      const mockRequestsResponse = { data: [], error: null };
      const mockMissionsError = { message: 'missions error' };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'contacts') {
          return {
            select: vi.fn().mockReturnThis(),
            order: () => Promise.resolve(mockContactsResponse),
          };
        }
        if (table === 'requests') {
          return { select: () => Promise.resolve(mockRequestsResponse) };
        }
        if (table === 'missions') {
          return {
            select: () => Promise.resolve({ data: null, error: mockMissionsError }),
          };
        }
        return { select: vi.fn() };
      });

      await expect(repository.loadContacts()).rejects.toThrow(
        /Failed to load missions .* dérivés contact/
      );
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

    it('propage une erreur request_actions (requête secondaire)', async () => {
      const mockRequestsResponse = { data: [{ id: 'r-1' }], error: null };
      const mockActionsError = { message: 'actions DB error' };

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
            is: vi.fn().mockResolvedValue({ data: null, error: mockActionsError }),
          };
        }
        return { select: vi.fn() };
      });

      await expect(repository.loadRequests()).rejects.toThrow(
        /Failed to load request_actions .* nextAction/
      );
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

    it('propage une erreur requests (requête secondaire pour résolution contactId)', async () => {
      const mockMissionsResponse = { data: [{ id: 'm-1', request_id: 'r-1' }], error: null };
      const mockRequestsError = { message: 'requests error' };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'missions') {
          return {
            select: vi.fn().mockReturnThis(),
            order: () => Promise.resolve(mockMissionsResponse),
          };
        }
        if (table === 'requests') {
          return {
            select: () => Promise.resolve({ data: null, error: mockRequestsError }),
          };
        }
        return { select: vi.fn() };
      });

      await expect(repository.loadMissions()).rejects.toThrow(
        /Failed to load requests .* résolution mission\.contactId/
      );
    });

    it('lève une erreur explicite si une mission réfère une request introuvable (plus contactId === "")', async () => {
      const mockMissions = [
        {
          id: 'm-orphan',
          request_id: 'r-missing',
          title: 'Mission orpheline',
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
      const mockMissionsResponse = { data: mockMissions, error: null };
      const mockRequestsResponse = { data: [], error: null };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'missions') {
          return {
            select: vi.fn().mockReturnThis(),
            order: () => Promise.resolve(mockMissionsResponse),
          };
        }
        if (table === 'requests') {
          return { select: () => Promise.resolve(mockRequestsResponse) };
        }
        return { select: vi.fn() };
      });

      await expect(repository.loadMissions()).rejects.toThrow(
        /Mission m-orphan.*request r-missing.*introuvable.*contactId/
      );
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
      };

      await expect(sb.createContact(payload)).rejects.toThrow(
        /Supabase write requires an authenticated user/
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

  describe('updateContact', () => {
    it('n\'envoie JAMAIS user_id depuis input et n\'écrase pas archived/created_at/last_activity_at', async () => {
      const capturedPatches: Record<string, unknown>[] = [];

      const updatedDbContact = {
        id: 'c-jean-dupont',
        first_name: 'Jean',
        last_name: 'Dupont',
        company: null,
        email: null,
        phone: null,
        notes: null,
        relationship: 'client',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-10T00:00:00Z',
        archived: false,
        user_id: 'user-1',
      };
      const relatedRequests = [
        {
          id: 'r-1',
          contact_id: 'c-jean-dupont',
          title: 'X',
          description: null,
          status: 'nouveau',
          created_at: '2024-01-01T00:00:00Z',
          last_activity_at: '2024-01-02T00:00:00Z',
          is_active: true,
          archived: false,
          user_id: 'user-1',
        },
      ];
      const relatedMissions: unknown[] = [];

      const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
        capturedPatches.push(patch);
        return {
          eq: (_k: string, _v: string) => ({
            select: () => ({
              single: () => Promise.resolve({ data: updatedDbContact, error: null }),
            }),
          }),
        };
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'contacts') {
          return { update: mockUpdate };
        }
        if (table === 'requests') {
          return { select: () => Promise.resolve({ data: relatedRequests, error: null }) };
        }
        if (table === 'missions') {
          return { select: () => Promise.resolve({ data: relatedMissions, error: null }) };
        }
        return { select: vi.fn() };
      });

      const updated = await repository.updateContact('c-jean-dupont', {
        firstName: 'Jean-Michel',
        lastName: 'Dupont',
        company: 'XYZ',
        email: 'jm@exemple.fr',
        phone: '0123',
        notes: 'note',
        relationship: 'ancien_client',
      });

      expect(capturedPatches).toHaveLength(1);
      const patch = capturedPatches[0];
      expect(patch.first_name).toBe('Jean-Michel');
      expect(patch.last_name).toBe('Dupont');
      expect(patch.company).toBe('XYZ');
      expect(patch.email).toBe('jm@exemple.fr');
      expect(patch.phone).toBe('0123');
      expect(patch.notes).toBe('note');
      expect(patch.relationship).toBe('ancien_client');
      expect(patch).not.toHaveProperty('user_id');
      expect(patch).not.toHaveProperty('archived');
      expect(patch).not.toHaveProperty('created_at');
      expect(patch).not.toHaveProperty('last_activity_at');

      expect(updated.id).toBe('c-jean-dupont');
      expect(updated.totalRequests).toBe(1);
      expect(updated.activeRequestId).toBe('r-1');
      expect(updated.totalMissions).toBe(0);
    });

    it('ne modifie pas archived via updateContact', async () => {
      let capturedPatch: Record<string, unknown> = {};
      const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
        capturedPatch = { ...patch };
        return {
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({
                data: {
                  id: 'c-1',
                  first_name: 'A',
                  last_name: 'B',
                  company: null,
                  email: null,
                  phone: null,
                  notes: null,
                  relationship: 'prospect',
                  created_at: '2024-01-01T00:00:00Z',
                  last_activity_at: '2024-01-10T00:00:00Z',
                  archived: false,
                  user_id: 'u-1',
                },
                error: null,
              }),
            }),
          }),
        };
      });

      mockFrom.mockImplementation((table) => {
        if (table === 'contacts') return { update: mockUpdate };
        if (table === 'requests') return { select: () => Promise.resolve({ data: [], error: null }) };
        if (table === 'missions') return { select: () => Promise.resolve({ data: [], error: null }) };
        return { select: vi.fn() };
      });

      await repository.updateContact('c-1', { firstName: 'X' });

      expect(capturedPatch.archived).toBeUndefined();
      expect(capturedPatch.user_id).toBeUndefined();
    });

    it('propage une erreur Supabase de l\'UPDATE', async () => {
      const mockError = { message: 'Update boom' };
      const mockUpdate = vi.fn().mockReturnValue({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: mockError }),
          }),
        }),
      });
      mockFrom.mockImplementation((t) => {
        if (t === 'contacts') return { update: mockUpdate };
        return { select: vi.fn() };
      });

      await expect(
        repository.updateContact('c-1', { firstName: 'X' })
      ).rejects.toThrow(/Failed to update contact id=c-1: Update boom/);
    });

    it('le Contact retourné conserve des dérivés cohérents (totalRequests/activeRequestId/totalMissions calculés depuis relations rechargées)', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: {
                id: 'c-has-relations',
                first_name: 'Toto',
                last_name: 'Tata',
                company: null,
                email: null,
                phone: null,
                notes: null,
                relationship: 'client',
                created_at: '2024-01-01T00:00:00Z',
                last_activity_at: '2024-02-01T00:00:00Z',
                archived: false,
                user_id: 'u-1',
              },
              error: null,
            }),
          }),
        }),
      });
      const mockRequests = [
        { id: 'r-a', contact_id: 'c-has-relations', title: 'R1', description: null, status: 'nouveau', created_at: '2024-01-02', last_activity_at: '2024-01-03', is_active: true, archived: false, user_id: 'u-1' },
        { id: 'r-b', contact_id: 'c-has-relations', title: 'R2', description: null, status: 'en_attente', created_at: '2024-01-05', last_activity_at: '2024-01-06', is_active: false, archived: false, user_id: 'u-1' },
      ];
      const mockMissions = [
        { id: 'm-x', request_id: 'r-a', title: 'M1', status: 'en_cours', start_date: null, end_date: null, progress: null, notes: null, created_at: '2024-01-10', updated_at: '2024-01-11', user_id: 'u-1' },
        { id: 'm-y', request_id: 'r-b', title: 'M2', status: 'terminee', start_date: null, end_date: null, progress: null, notes: null, created_at: '2024-01-12', updated_at: '2024-01-13', user_id: 'u-1' },
      ];

      mockFrom.mockImplementation((t) => {
        if (t === 'contacts') return { update: mockUpdate };
        if (t === 'requests') return { select: () => Promise.resolve({ data: mockRequests, error: null }) };
        if (t === 'missions') return { select: () => Promise.resolve({ data: mockMissions, error: null }) };
        return { select: vi.fn() };
      });

      const updated = await repository.updateContact('c-has-relations', { firstName: 'Toto' });

      expect(updated.id).toBe('c-has-relations');
      expect(updated.totalRequests).toBe(2);
      expect(updated.activeRequestId).toBe('r-a');
      expect(updated.totalMissions).toBe(2);
      expect(updated.firstName).toBe('Toto');
    });
  });

  describe('archiveContact', () => {
    it('utilise UPDATE archived=true avec filtre id uniquement', async () => {
      let capturedPatch: Record<string, unknown> | null = null;
      let capturedEq: [string, unknown] | null = null;
      let capturedSelectArg: unknown = undefined;

      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'c-123' }, error: null });
      const mockSelect = vi.fn().mockImplementation((arg) => {
        capturedSelectArg = arg;
        return { single: mockSingle };
      });
      const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
        capturedPatch = patch;
        return {
          eq: (key: string, val: unknown) => {
            capturedEq = [key, val];
            return { select: mockSelect };
          },
        };
      });
      mockFrom.mockImplementation((t) => {
        if (t === 'contacts') return { update: mockUpdate };
        return { select: vi.fn() };
      });

      await repository.archiveContact('c-123');

      expect(capturedPatch).not.toBeNull();
      expect(capturedPatch).toEqual({ archived: true });
      expect(capturedEq).not.toBeNull();
      expect(capturedEq?.[0]).toBe('id');
      expect(capturedEq?.[1]).toBe('c-123');
      expect(capturedSelectArg).toBe('id');
    });

    it('propage une erreur Supabase', async () => {
      const mockError = { message: 'archive boom' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockImplementation((t) => {
        if (t === 'contacts') return { update: mockUpdate };
        return { select: vi.fn() };
      });

      await expect(repository.archiveContact('c-x')).rejects.toThrow(
        /Failed to archive contact id=c-x: archive boom/
      );
    });

    it('5. UPDATE retourne zéro ligne / no data → archiveContact rejette', async () => {
      const mockSingle = vi.fn().mockReturnValue({ data: null, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockImplementation((t) => {
        if (t === 'contacts') return { update: mockUpdate };
        return { select: vi.fn() };
      });

      try {
        await repository.archiveContact('c-absent-999');
        expect.fail('archiveContact aurait dû rejeter');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toMatch(
          /no row updated for id=c-absent-999/
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const capturedSelect = mockSelect.mock.calls[0]?.[0];
      // select('id') appelé
      expect(capturedSelect).toBe('id');
      // eq appelé avec id
      expect(mockEq).toHaveBeenCalledWith('id', 'c-absent-999');
    });
  });

  describe('updateContact — null = NULL SQL', () => {
    it('4. null dans input.company/email/phone/notes transmis comme NULL dans le patch', async () => {
      const capturedPatches: Record<string, unknown>[] = [];

      const updatedDbContact = {
        id: 'c-jean-dupont',
        user_id: 'u-1',
        first_name: 'Jean',
        last_name: 'Dupont',
        company: null,
        email: null,
        phone: null,
        notes: null,
        relationship: 'prospect',
        archived: false,
        created_at: '2024-06-01T00:00:00Z',
        last_activity_at: '2024-06-10T00:00:00Z',
      };
      const mockSingle = vi
        .fn()
        .mockReturnValue({ data: updatedDbContact, error: null });
      const mockSelectAll = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelectAll });
      const mockUpdate = vi.fn().mockImplementation((patch) => {
        capturedPatches.push(patch as Record<string, unknown>);
        return { eq: mockEq };
      });
      const mockReqSelect = vi
        .fn()
        .mockResolvedValue({ data: [], error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'contacts') return { update: mockUpdate };
        if (table === 'requests' || table === 'missions') {
          return { select: mockReqSelect };
        }
        return { select: vi.fn() };
      });

      await repository.updateContact('c-jean-dupont', {
        company: null,
        email: null,
        phone: null,
        notes: null,
      });

      expect(capturedPatches).toHaveLength(1);
      const p = capturedPatches[0];
      expect(p).toBeDefined();
      expect(p).not.toHaveProperty('user_id');
      expect(p).not.toHaveProperty('archived');
      expect(p).not.toHaveProperty('created_at');
      expect(p).not.toHaveProperty('last_activity_at');
      expect(p.company).toBeNull();
      expect(p.email).toBeNull();
      expect(p.phone).toBeNull();
      expect(p.notes).toBeNull();
    });
  });

  describe('createRequest (tests 15-20)', () => {
    it('15. createRequest utilise authenticated user (calls auth.getUser)', async () => {
      const createdDbRequest = {
        id: 'r-created',
        contact_id: 'c-1',
        title: 'Nouv dem',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-01T00:00:00Z',
        is_active: true,
        archived: false,
        user_id: 'user-auth-xyz',
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: createdDbRequest,
        error: null,
      });

      let getUserCalled = false;
      const sb = repository as unknown as {
        getSupabase: () => {
          auth: {
            getUser: () => Promise<{ data: { user: { id: string } }; error: null }>;
          };
          from: (_t: string) => {
            insert: (_row: unknown) => unknown;
          };
        };
        createRequest: (input: object) => Promise<unknown>;
      };
      sb.getSupabase = () => ({
        auth: {
          getUser: () => {
            getUserCalled = true;
            return Promise.resolve({
              data: { user: { id: 'user-auth-xyz' } },
              error: null,
            });
          },
        },
        from: () => ({
          insert: (row: unknown) => {
            mockInsert(row);
            return { select: mockSelect, single: mockSingle };
          },
        }),
      });

      const created = await sb.createRequest({ contactId: 'c-1', title: 'Nouv dem' });

      expect(getUserCalled).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
      expect((created as { id: string }).id).toBe('r-created');
    });

    it('16. INSERT contient contact_id correct', async () => {
      const capturedPatches: Record<string, unknown>[] = [];
      const createdDbRequest = {
        id: 'r-1',
        contact_id: 'c-contact-42',
        title: 'X',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-01',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };

      const sb = repository as unknown as {
        getSupabase: () => {
          auth: {
            getUser: () => Promise<{ data: { user: { id: string } }; error: null }>;
          };
          from: (_t: string) => {
            insert: (row: Record<string, unknown>) => unknown;
          };
        };
        createRequest: (input: object) => Promise<unknown>;
      };
      sb.getSupabase = () => ({
        auth: {
          getUser: () => Promise.resolve({ data: { user: { id: 'u-1' } }, error: null }),
        },
        from: () => ({
          insert: (row: Record<string, unknown>) => {
            capturedPatches.push({ ...row });
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: createdDbRequest, error: null }),
            };
          },
        }),
      });

      await sb.createRequest({ contactId: 'c-contact-42', title: 'X' });

      expect(capturedPatches).toHaveLength(1);
      expect(capturedPatches[0]?.contact_id).toBe('c-contact-42');
    });

    it('17. INSERT contient status=nouveau', async () => {
      const capturedPatches: Record<string, unknown>[] = [];
      const createdDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'X',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-01',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };

      const sb = repository as unknown as {
        getSupabase: () => {
          auth: {
            getUser: () => Promise<{ data: { user: { id: string } }; error: null }>;
          };
          from: (_t: string) => {
            insert: (row: Record<string, unknown>) => unknown;
          };
        };
        createRequest: (input: object) => Promise<unknown>;
      };
      sb.getSupabase = () => ({
        auth: {
          getUser: () => Promise.resolve({ data: { user: { id: 'u-1' } }, error: null }),
        },
        from: () => ({
          insert: (row: Record<string, unknown>) => {
            capturedPatches.push({ ...row });
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: createdDbRequest, error: null }),
            };
          },
        }),
      });

      await sb.createRequest({ contactId: 'c-1', title: 'X' });

      expect(capturedPatches).toHaveLength(1);
      expect(capturedPatches[0]?.status).toBe('nouveau');
    });

    it('18. INSERT contient is_active=true', async () => {
      const capturedPatches: Record<string, unknown>[] = [];
      const createdDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'X',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-01',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };

      const sb = repository as unknown as {
        getSupabase: () => {
          auth: {
            getUser: () => Promise<{ data: { user: { id: string } }; error: null }>;
          };
          from: (_t: string) => {
            insert: (row: Record<string, unknown>) => unknown;
          };
        };
        createRequest: (input: object) => Promise<unknown>;
      };
      sb.getSupabase = () => ({
        auth: {
          getUser: () => Promise.resolve({ data: { user: { id: 'u-1' } }, error: null }),
        },
        from: () => ({
          insert: (row: Record<string, unknown>) => {
            capturedPatches.push({ ...row });
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: createdDbRequest, error: null }),
            };
          },
        }),
      });

      await sb.createRequest({ contactId: 'c-1', title: 'X' });

      expect(capturedPatches).toHaveLength(1);
      expect(capturedPatches[0]?.is_active).toBe(true);
    });

    it('19. aucun user_id accepté depuis input', async () => {
      const capturedPatches: Record<string, unknown>[] = [];
      const createdDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'X',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-01',
        is_active: true,
        archived: false,
        user_id: 'u-from-auth',
      };

      const sb = repository as unknown as {
        getSupabase: () => {
          auth: {
            getUser: () => Promise<{ data: { user: { id: string } }; error: null }>;
          };
          from: (_t: string) => {
            insert: (row: Record<string, unknown>) => unknown;
          };
        };
        createRequest: (input: Record<string, unknown>) => Promise<unknown>;
      };
      sb.getSupabase = () => ({
        auth: {
          getUser: () => Promise.resolve({ data: { user: { id: 'u-from-auth' } }, error: null }),
        },
        from: () => ({
          insert: (row: Record<string, unknown>) => {
            capturedPatches.push({ ...row });
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: createdDbRequest, error: null }),
            };
          },
        }),
      });

      await sb.createRequest({
        contactId: 'c-1',
        title: 'X',
        user_id: 'u-from-input-evil',
      });

      expect(capturedPatches).toHaveLength(1);
      expect(capturedPatches[0]?.user_id).not.toBe('u-from-input-evil');
      expect(capturedPatches[0]?.user_id).toBe('u-from-auth');
    });

    it('20. erreur insert propagée', async () => {
      const mockError = { message: 'Insert request failed' };
      const sb = repository as unknown as {
        getSupabase: () => {
          auth: {
            getUser: () => Promise<{ data: { user: { id: string } }; error: null }>;
          };
          from: (_t: string) => {
            insert: (_row: unknown) => { select: unknown; single: unknown };
          };
        };
        createRequest: (input: object) => Promise<unknown>;
      };
      sb.getSupabase = () => ({
        auth: {
          getUser: () => Promise.resolve({ data: { user: { id: 'u-1' } }, error: null }),
        },
        from: () => ({
          insert: () => ({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      });

      await expect(sb.createRequest({ contactId: 'c-1', title: 'X' })).rejects.toThrow(
        /Failed to create request for contact id=c-1: Insert request failed/
      );
    });
  });

  describe('updateRequest (tests 21-27)', () => {
    it('21. update patch ne contient que title/description', async () => {
      const capturedPatches: Record<string, unknown>[] = [];
      const updatedDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'Titre nouv',
        description: null,
        status: 'en_attente',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-02',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedDbRequest, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
        capturedPatches.push({ ...patch });
        return { eq: mockEq };
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'requests') return { update: mockUpdate };
        if (table === 'request_actions') {
          return {
            select: (_cols?: string) => ({
              eq: (_k: string, _v: unknown) => ({
                is: (_k2: string, _v2: unknown) =>
                  Promise.resolve({ data: [], error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      await repository.updateRequest('r-1', {
        title: 'Titre nouv',
        description: 'Desc',
      });

      expect(capturedPatches).toHaveLength(1);
      const patch = capturedPatches[0];
      expect(patch.title).toBe('Titre nouv');
      expect(patch.description).toBe('Desc');
      expect(patch).not.toHaveProperty('user_id');
      expect(patch).not.toHaveProperty('contact_id');
      expect(patch).not.toHaveProperty('status');
      expect(patch).not.toHaveProperty('is_active');
      expect(patch).not.toHaveProperty('archived');
      expect(patch).not.toHaveProperty('created_at');
      expect(patch).not.toHaveProperty('last_activity_at');
    });

    it('22. description null → NULL in patch', async () => {
      const capturedPatches: Record<string, unknown>[] = [];
      const updatedDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'X',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-02',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedDbRequest, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
        capturedPatches.push({ ...patch });
        return { eq: mockEq };
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'requests') return { update: mockUpdate };
        if (table === 'request_actions') {
          return {
            select: (_cols?: string) => ({
              eq: (_k: string, _v: unknown) => ({
                is: (_k2: string, _v2: unknown) =>
                  Promise.resolve({ data: [], error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      await repository.updateRequest('r-1', { description: null });

      expect(capturedPatches).toHaveLength(1);
      expect(capturedPatches[0]?.description).toBeNull();
    });

    it('23. update ne modifie pas status (not sent in patch)', async () => {
      const capturedPatches: Record<string, unknown>[] = [];
      const updatedDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'X',
        description: null,
        status: 'en_attente',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-02',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedDbRequest, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
        capturedPatches.push({ ...patch });
        return { eq: mockEq };
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'requests') return { update: mockUpdate };
        if (table === 'request_actions') {
          return {
            select: (_cols?: string) => ({
              eq: (_k: string, _v: unknown) => ({
                is: (_k2: string, _v2: unknown) =>
                  Promise.resolve({ data: [], error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      await repository.updateRequest('r-1', { title: 'X' });

      expect(capturedPatches).toHaveLength(1);
      expect(capturedPatches[0]).not.toHaveProperty('status');
    });

    it('24. update ne modifie pas is_active', async () => {
      const capturedPatches: Record<string, unknown>[] = [];
      const updatedDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'X',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-02',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedDbRequest, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
        capturedPatches.push({ ...patch });
        return { eq: mockEq };
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'requests') return { update: mockUpdate };
        if (table === 'request_actions') {
          return {
            select: (_cols?: string) => ({
              eq: (_k: string, _v: unknown) => ({
                is: (_k2: string, _v2: unknown) =>
                  Promise.resolve({ data: [], error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      await repository.updateRequest('r-1', { title: 'X' });

      expect(capturedPatches).toHaveLength(1);
      expect(capturedPatches[0]).not.toHaveProperty('is_active');
    });

    it('25. update ne modifie pas last_activity_at', async () => {
      const capturedPatches: Record<string, unknown>[] = [];
      const updatedDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'X',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-02',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedDbRequest, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
        capturedPatches.push({ ...patch });
        return { eq: mockEq };
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'requests') return { update: mockUpdate };
        if (table === 'request_actions') {
          return {
            select: (_cols?: string) => ({
              eq: (_k: string, _v: unknown) => ({
                is: (_k2: string, _v2: unknown) =>
                  Promise.resolve({ data: [], error: null }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      await repository.updateRequest('r-1', { title: 'X' });

      expect(capturedPatches).toHaveLength(1);
      expect(capturedPatches[0]).not.toHaveProperty('last_activity_at');
    });

    it('26. update conserve nextAction ouverte existante', async () => {
      const updatedDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'X',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-02',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };
      const mockActions = [
        {
          id: 'na-open-1',
          request_id: 'r-1',
          type: 'relance',
          label: 'Relancer',
          due_at: '2024-01-10T10:00:00Z',
          completed_at: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          user_id: 'u-1',
        },
      ];

      const mockSingle = vi.fn().mockResolvedValue({ data: updatedDbRequest, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockActionsIs = vi.fn().mockResolvedValue({ data: mockActions, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'requests') return { update: mockUpdate };
        if (table === 'request_actions') {
          return {
            select: (_cols?: string) => ({
              eq: (_k: string, _v: unknown) => ({
                is: mockActionsIs,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const updated = await repository.updateRequest('r-1', { title: 'X' });

      expect(updated.nextAction).toBeDefined();
      expect(updated.nextAction?.id).toBe('na-open-1');
      expect(mockActionsIs).toHaveBeenCalledWith('completed_at', null);
    });

    it('27. erreur action secondaire propagée', async () => {
      const updatedDbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'X',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01',
        last_activity_at: '2024-01-02',
        is_active: true,
        archived: false,
        user_id: 'u-1',
      };
      const mockActionsError = { message: 'request_actions DB down' };

      const mockSingle = vi.fn().mockResolvedValue({ data: updatedDbRequest, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockActionsIs = vi.fn().mockResolvedValue({ data: null, error: mockActionsError });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'requests') return { update: mockUpdate };
        if (table === 'request_actions') {
          return {
            select: (_cols?: string) => ({
              eq: (_k: string, _v: unknown) => ({
                is: mockActionsIs,
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      await expect(repository.updateRequest('r-1', { title: 'X' })).rejects.toThrow(
        /Failed to load open action for request id=r-1: request_actions DB down/
      );
    });
  });

  describe('archiveRequest (tests 28-31)', () => {
    it('28. archive UPDATE archived=true + is_active=false', async () => {
      let capturedPatch: Record<string, unknown> | null = null;

      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'r-99' }, error: null });
      const mockSelect = vi.fn().mockImplementation((arg: unknown) => {
        expect(arg).toBe('id');
        return { single: mockSingle };
      });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockImplementation((patch: Record<string, unknown>) => {
        capturedPatch = { ...patch };
        return { eq: mockEq };
      });
      mockFrom.mockImplementation((t) => {
        if (t === 'requests') return { update: mockUpdate };
        return { select: vi.fn() };
      });

      await repository.archiveRequest('r-99');

      expect(capturedPatch).not.toBeNull();
      expect(capturedPatch).toEqual({ archived: true, is_active: false });
    });

    it('29. archive filtre id correct', async () => {
      let capturedEq: [string, unknown] | null = null;

      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'r-filter-me' }, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockImplementation((key: string, val: unknown) => {
        capturedEq = [key, val];
        return { select: mockSelect };
      });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockImplementation((t) => {
        if (t === 'requests') return { update: mockUpdate };
        return { select: vi.fn() };
      });

      await repository.archiveRequest('r-filter-me');

      expect(capturedEq).not.toBeNull();
      expect(capturedEq?.[0]).toBe('id');
      expect(capturedEq?.[1]).toBe('r-filter-me');
    });

    it('30. archive zéro ligne → erreur', async () => {
      const mockSingle = vi.fn().mockReturnValue({ data: null, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockImplementation((t) => {
        if (t === 'requests') return { update: mockUpdate };
        return { select: vi.fn() };
      });

      try {
        await repository.archiveRequest('r-absent-777');
        expect.fail('archiveRequest aurait dû rejeter');
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toMatch(
          /no row updated for id=r-absent-777/
        );
      }
      expect(mockSelect).toHaveBeenCalledWith('id');
    });

    it('31. archive erreur Supabase propagée', async () => {
      const mockError = { message: 'archive req failed' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockImplementation((t) => {
        if (t === 'requests') return { update: mockUpdate };
        return { select: vi.fn() };
      });

      await expect(repository.archiveRequest('r-err')).rejects.toThrow(
        /Failed to archive request id=r-err: archive req failed/
      );
    });
  });
});