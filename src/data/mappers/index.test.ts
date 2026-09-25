/**
 * Tests pour les mappers DB → domaine
 */

import { describe, it, expect } from 'vitest';
import {
  mapContact,
  mapNextAction,
  mapRequest,
  mapMission,
  mapExchange,
} from './index';
import type {
  DbContact,
  DbRequest,
  DbMission,
  DbExchange,
  DbRequestAction,
} from '../dbTypes';

describe('Mappers DB → domaine', () => {
  it('mapRequest conserve le nouveau statut de demande terminée', () => {
    const dbRequest: DbRequest = {
      id: 'r-done',
      contact_id: 'c-1',
      title: 'Demande terminée',
      description: null,
      status: 'terminee',
      created_at: '2024-01-01T00:00:00Z',
      last_activity_at: '2024-01-02T00:00:00Z',
      is_active: false,
      archived: false,
      user_id: 'user-1',
      updated_at: '2024-01-02T00:00:00Z',
    };

    expect(mapRequest(dbRequest, null).status).toBe('terminee');
  });

  describe('mapContact', () => {
    it('convertit snake_case en camelCase', () => {
      const dbContact: DbContact = {
        id: 'c-1',
        first_name: 'Jean',
        last_name: 'Dupont',
        company: 'ACME',
        email: 'jean@example.com',
        phone: '+33123456789',
        notes: 'Test notes',
        relationship: 'client',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = mapContact(dbContact, [], []);

      expect(result.firstName).toBe('Jean');
      expect(result.lastName).toBe('Dupont');
      expect(result.company).toBe('ACME');
      expect(result.email).toBe('jean@example.com');
      expect(result.phone).toBe('+33123456789');
      expect(result.notes).toBe('Test notes');
    });

    it('calcule totalRequests correctement', () => {
      const dbContact: DbContact = {
        id: 'c-1',
        first_name: 'Jean',
        last_name: 'Dupont',
        company: null,
        email: null,
        phone: null,
        notes: null,
        relationship: 'client',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const relatedRequests: DbRequest[] = [
        { id: 'r-1', contact_id: 'c-1', title: 'Test 1', description: null, status: 'nouveau', created_at: '2024-01-01T00:00:00Z', last_activity_at: '2024-01-02T00:00:00Z', is_active: true, archived: false, user_id: 'user-1', updated_at: '2024-01-02T00:00:00Z' },
        { id: 'r-2', contact_id: 'c-1', title: 'Test 2', description: null, status: 'nouveau', created_at: '2024-01-01T00:00:00Z', last_activity_at: '2024-01-02T00:00:00Z', is_active: false, archived: false, user_id: 'user-1', updated_at: '2024-01-02T00:00:00Z' },
      ];

      const result = mapContact(dbContact, relatedRequests, []);

      expect(result.totalRequests).toBe(2);
    });

    it('calcule totalMissions correctement', () => {
      const dbContact: DbContact = {
        id: 'c-1',
        first_name: 'Jean',
        last_name: 'Dupont',
        company: null,
        email: null,
        phone: null,
        notes: null,
        relationship: 'client',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const relatedRequests: DbRequest[] = [
        { id: 'r-1', contact_id: 'c-1', title: 'Test 1', description: null, status: 'nouveau', created_at: '2024-01-01T00:00:00Z', last_activity_at: '2024-01-02T00:00:00Z', is_active: true, archived: false, user_id: 'user-1', updated_at: '2024-01-02T00:00:00Z' },
      ];

      const relatedMissions: DbMission[] = [
        { id: 'm-1', request_id: 'r-1', title: 'Mission 1', status: 'en_cours', start_date: null, end_date: null, progress: 50, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z', user_id: 'user-1' },
        { id: 'm-2', request_id: 'r-1', title: 'Mission 2', status: 'en_cours', start_date: null, end_date: null, progress: 75, notes: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z', user_id: 'user-1' },
      ];

      const result = mapContact(dbContact, relatedRequests, relatedMissions);

      expect(result.totalMissions).toBe(2);
    });

    it('dérive activeRequestId depuis la demande active', () => {
      const dbContact: DbContact = {
        id: 'c-1',
        first_name: 'Jean',
        last_name: 'Dupont',
        company: null,
        email: null,
        phone: null,
        notes: null,
        relationship: 'client',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const relatedRequests: DbRequest[] = [
        { id: 'r-1', contact_id: 'c-1', title: 'Test 1', description: null, status: 'nouveau', created_at: '2024-01-01T00:00:00Z', last_activity_at: '2024-01-02T00:00:00Z', is_active: true, archived: false, user_id: 'user-1', updated_at: '2024-01-02T00:00:00Z' },
        { id: 'r-2', contact_id: 'c-1', title: 'Test 2', description: null, status: 'nouveau', created_at: '2024-01-01T00:00:00Z', last_activity_at: '2024-01-02T00:00:00Z', is_active: false, archived: false, user_id: 'user-1', updated_at: '2024-01-02T00:00:00Z' },
      ];

      const result = mapContact(dbContact, relatedRequests, []);

      expect(result.activeRequestId).toBe('r-1');
    });

    it('génère avatarSeed déterministe depuis contact.id', () => {
      const dbContact: DbContact = {
        id: 'c-jean-dupont',
        first_name: 'Jean',
        last_name: 'Dupont',
        company: null,
        email: null,
        phone: null,
        notes: null,
        relationship: 'client',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result1 = mapContact(dbContact, [], []);
      const result2 = mapContact(dbContact, [], []);

      expect(result1.avatarSeed).toBe(result2.avatarSeed);
      expect(result1.avatarSeed).toContain('c-jean-dupont');
    });

    it('ignore les demandes archivées pour activeRequestId', () => {
      const dbContact: DbContact = {
        id: 'c-1',
        first_name: 'Jean',
        last_name: 'Dupont',
        company: null,
        email: null,
        phone: null,
        notes: null,
        relationship: 'client',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const relatedRequests: DbRequest[] = [
        { id: 'r-1', contact_id: 'c-1', title: 'Test 1', description: null, status: 'nouveau', created_at: '2024-01-01T00:00:00Z', last_activity_at: '2024-01-02T00:00:00Z', is_active: true, archived: true, user_id: 'user-1', updated_at: '2024-01-02T00:00:00Z' },
        { id: 'r-2', contact_id: 'c-1', title: 'Test 2', description: null, status: 'nouveau', created_at: '2024-01-01T00:00:00Z', last_activity_at: '2024-01-02T00:00:00Z', is_active: false, archived: false, user_id: 'user-1', updated_at: '2024-01-02T00:00:00Z' },
      ];

      const result = mapContact(dbContact, relatedRequests, []);

      expect(result.activeRequestId).toBeUndefined();
    });
  });

  describe('mapNextAction', () => {
    it('convertit snake_case en camelCase', () => {
      const dbAction: DbRequestAction = {
        id: 'na-1',
        request_id: 'r-1',
        type: 'relance',
        label: 'Relancer',
        due_at: '2024-01-01T10:00:00Z',
        completed_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1',
      };

      const result = mapNextAction(dbAction);

      expect(result.id).toBe('na-1');
      expect(result.type).toBe('relance');
      expect(result.label).toBe('Relancer');
      expect(result.dueDate).toBe('2024-01-01T10:00:00Z');
    });

    it('ne calcule pas les flags isOverdue, overdueDays, isToday, isUpcoming', () => {
      const dbAction: DbRequestAction = {
        id: 'na-1',
        request_id: 'r-1',
        type: 'relance',
        label: 'Relancer',
        due_at: '2024-01-01T10:00:00Z',
        completed_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1',
      };

      const result = mapNextAction(dbAction);

      expect(result.isOverdue).toBeUndefined();
      expect(result.overdueDays).toBeUndefined();
      expect(result.isToday).toBeUndefined();
      expect(result.isUpcoming).toBeUndefined();
    });
  });

  describe('mapRequest', () => {
    it('convertit snake_case en camelCase', () => {
      const dbRequest: DbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'Test request',
        description: 'Test description',
        status: 'nouveau',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        is_active: true,
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = mapRequest(dbRequest, null);

      expect(result.id).toBe('r-1');
      expect(result.contactId).toBe('c-1');
      expect(result.title).toBe('Test request');
      expect(result.description).toBe('Test description');
      expect(result.status).toBe('nouveau');
    });

    it('utilise laction ouverte pour nextAction', () => {
      const dbRequest: DbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'Test request',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        is_active: true,
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const openAction: DbRequestAction = {
        id: 'na-1',
        request_id: 'r-1',
        type: 'relance',
        label: 'Relancer',
        due_at: '2024-01-01T10:00:00Z',
        completed_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1',
      };

      const result = mapRequest(dbRequest, openAction);

      expect(result.nextAction).toBeDefined();
      expect(result.nextAction?.id).toBe('na-1');
      expect(result.nextAction?.type).toBe('relance');
    });

    it('ignore les actions complétées', () => {
      const dbRequest: DbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'Test request',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        is_active: true,
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const completedAction: DbRequestAction = {
        id: 'na-1',
        request_id: 'r-1',
        type: 'relance',
        label: 'Relancer',
        due_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T11:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1',
      };

      const result = mapRequest(dbRequest, completedAction);

      expect(result.nextAction).toBeUndefined();
    });

    it('a nextAction undefined sans action ouverte', () => {
      const dbRequest: DbRequest = {
        id: 'r-1',
        contact_id: 'c-1',
        title: 'Test request',
        description: null,
        status: 'nouveau',
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-02T00:00:00Z',
        is_active: true,
        archived: false,
        user_id: 'user-1',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = mapRequest(dbRequest, null);

      expect(result.nextAction).toBeUndefined();
    });
  });

  describe('mapMission', () => {
    it('convertit snake_case en camelCase', () => {
      const dbMission: DbMission = {
        id: 'm-1',
        request_id: 'r-1',
        title: 'Test mission',
        status: 'en_cours',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T00:00:00Z',
        progress: 50,
        notes: 'Test notes',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        user_id: 'user-1',
      };

      const result = mapMission(dbMission, 'c-1');

      expect(result.id).toBe('m-1');
      expect(result.requestId).toBe('r-1');
      expect(result.contactId).toBe('c-1');
      expect(result.title).toBe('Test mission');
      expect(result.status).toBe('en_cours');
      expect(result.startDate).toBe('2024-01-01T00:00:00Z');
      expect(result.endDate).toBe('2024-01-31T00:00:00Z');
      expect(result.progress).toBe(50);
      expect(result.notes).toBe('Test notes');
    });

    it('dérive contactId via requestContactId', () => {
      const dbMission: DbMission = {
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
      };

      const result = mapMission(dbMission, 'c-derived');

      expect(result.contactId).toBe('c-derived');
    });
  });

  describe('mapExchange', () => {
    it('convertit snake_case en camelCase', () => {
      const dbExchange: DbExchange = {
        id: 'e-1',
        request_id: 'r-1',
        type: 'email',
        occurred_at: '2024-01-01T10:00:00Z',
        summary: 'Test summary',
        created_at: '2024-01-01T00:00:00Z',
        user_id: 'user-1',
      };

      const result = mapExchange(dbExchange);

      expect(result.id).toBe('e-1');
      expect(result.requestId).toBe('r-1');
      expect(result.type).toBe('email');
      expect(result.date).toBe('2024-01-01T10:00:00Z');
      expect(result.summary).toBe('Test summary');
    });
  });
});
