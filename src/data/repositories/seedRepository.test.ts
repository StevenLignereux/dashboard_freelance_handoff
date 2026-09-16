/**
 * Tests pour le Seed Repository
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SeedRepository } from './seedRepository';

describe('SeedRepository', () => {
  let repository: SeedRepository;

  beforeEach(() => {
    repository = new SeedRepository();
  });

  describe('loadContacts', () => {
    it('retourne les contacts seed', async () => {
      const contacts = await repository.loadContacts();

      expect(contacts).toBeDefined();
      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);
    });

    it('les contacts ont les champs attendus', async () => {
      const contacts = await repository.loadContacts();
      const firstContact = contacts[0];

      expect(firstContact).toHaveProperty('id');
      expect(firstContact).toHaveProperty('firstName');
      expect(firstContact).toHaveProperty('lastName');
      expect(firstContact).toHaveProperty('totalRequests');
      expect(firstContact).toHaveProperty('totalMissions');
      expect(firstContact).toHaveProperty('avatarSeed');
    });
  });

  describe('loadRequests', () => {
    it('retourne les demandes seed', async () => {
      const requests = await repository.loadRequests();

      expect(requests).toBeDefined();
      expect(Array.isArray(requests)).toBe(true);
      expect(requests.length).toBeGreaterThan(0);
    });

    it('les demandes ont les champs attendus', async () => {
      const requests = await repository.loadRequests();
      const firstRequest = requests[0];

      expect(firstRequest).toHaveProperty('id');
      expect(firstRequest).toHaveProperty('contactId');
      expect(firstRequest).toHaveProperty('title');
      expect(firstRequest).toHaveProperty('status');
    });
  });

  describe('loadMissions', () => {
    it('retourne les missions seed', async () => {
      const missions = await repository.loadMissions();

      expect(missions).toBeDefined();
      expect(Array.isArray(missions)).toBe(true);
      expect(missions.length).toBeGreaterThan(0);
    });

    it('les missions ont les champs attendus', async () => {
      const missions = await repository.loadMissions();
      const firstMission = missions[0];

      expect(firstMission).toHaveProperty('id');
      expect(firstMission).toHaveProperty('requestId');
      expect(firstMission).toHaveProperty('contactId');
      expect(firstMission).toHaveProperty('title');
      expect(firstMission).toHaveProperty('status');
    });
  });

  describe('loadExchanges', () => {
    it('retourne les échanges seed', async () => {
      const exchanges = await repository.loadExchanges();

      expect(exchanges).toBeDefined();
      expect(Array.isArray(exchanges)).toBe(true);
      expect(exchanges.length).toBeGreaterThan(0);
    });

    it('les échanges ont les champs attendus', async () => {
      const exchanges = await repository.loadExchanges();
      const firstExchange = exchanges[0];

      expect(firstExchange).toHaveProperty('id');
      expect(firstExchange).toHaveProperty('requestId');
      expect(firstExchange).toHaveProperty('type');
      expect(firstExchange).toHaveProperty('date');
      expect(firstExchange).toHaveProperty('summary');
    });
  });

  describe('createContact', () => {
    it('crée un contact avec un ID généré', async () => {
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

      const created = await repository.createContact(newContact);

      expect(created.id).toBeDefined();
      expect(created.id).toMatch(/^c-[a-z0-9-]+$/);
      expect(created.firstName).toBe('Marie');
      expect(created.lastName).toBe('Curie');
    });

    it('génère les champs dérivés', async () => {
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

      const created = await repository.createContact(newContact);

      expect(created.totalRequests).toBe(0);
      expect(created.totalMissions).toBe(0);
      expect(created.avatarSeed).toBeDefined();
      expect(created.avatarSeed).toContain(created.id);
    });

    it('génère createdAt et lastActivityAt', async () => {
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

      const created = await repository.createContact(newContact);

      expect(created.createdAt).toBeDefined();
      expect(created.lastActivityAt).toBeDefined();
      expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);
    });

    it('fonctionne sans variables Supabase', async () => {
      // Ce test vérifie que le seed repository fonctionne sans dépendance Supabase
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

      const created = await repository.createContact(newContact);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
    });

    it('ajoute le contact à la source mémoire, visible au loadContacts suivant, une seule fois', async () => {
      const before = await repository.loadContacts();
      const countBefore = before.length;

      const newContact = {
        firstName: 'Test',
        lastName: 'Persist',
        company: 'Persistent Co',
        email: undefined,
        phone: undefined,
        notes: undefined,
        relationship: 'prospect' as const,
        archived: false,
      };

      const created = await repository.createContact(newContact);
      expect(created.firstName).toBe('Test');
      expect(created.lastName).toBe('Persist');

      const after = await repository.loadContacts();

      expect(after).toHaveLength(countBefore + 1);

      const found = after.filter((c) => c.id === created.id);
      expect(found).toHaveLength(1);
      expect(found[0]?.firstName).toBe('Test');
      expect(found[0]?.lastName).toBe('Persist');
    });

    it('ne pollue pas les exports globaux seedContacts (2 instances indépendantes)', async () => {
      const repoA = new SeedRepository();
      const repoB = new SeedRepository();

      const before = await repoA.loadContacts();
      const baseCount = before.length;

      await repoA.createContact({
        firstName: 'RepoA',
        lastName: 'Only',
        relationship: 'prospect',
        archived: false,
      });

      const aAfter = await repoA.loadContacts();
      const bAfter = await repoB.loadContacts();

      expect(aAfter).toHaveLength(baseCount + 1);
      expect(bAfter).toHaveLength(baseCount);
    });
  });
});