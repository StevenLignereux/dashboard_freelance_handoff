/**
 * Supabase Repository - Implémentation repository utilisant Supabase.
 * Utilise uniquement le client Supabase et les mappers.
 */

import { supabase } from '../../lib/supabase/client';
import type { Contact, Exchange, Mission, Request } from '../../types';
import type { IRepository } from './interface';
import {
  mapContact,
  mapRequest,
  mapMission,
  mapExchange,
} from '../mappers';
import type {
  DbContact,
  DbRequest,
  DbMission,
  DbExchange,
  DbRequestAction,
  DbRelationshipType,
} from '../dbTypes';

const RELATIONSHIP_TYPE_REVERSE_MAP: Record<string, DbRelationshipType> = {
  prospect: 'prospect',
  client: 'client',
  client_recurrent: 'client_recurrent',
  ancien_client: 'ancien_client',
};

export class SupabaseRepository implements IRepository {
  private ensureSupabaseConfigured(): void {
    if (!supabase) {
      throw new Error(
        'Supabase repository requires Supabase to be configured. Check environment variables.'
      );
    }
  }

  private getSupabase() {
    if (!supabase) {
      throw new Error(
        'Supabase repository requires Supabase to be configured. Check environment variables.'
      );
    }
    return supabase;
  }

  private async getCurrentUserId(): Promise<string> {
    const sb = this.getSupabase();
    const {
      data: { user },
      error,
    } = await sb.auth.getUser();
    if (error || !user) {
      throw new Error(
        'Cannot create contact: no authenticated Supabase user. Sign in before writing data.'
      );
    }
    return user.id;
  }

  async loadContacts(): Promise<Contact[]> {
    this.ensureSupabaseConfigured();

    const { data: contacts, error } = await this.getSupabase()
      .from('contacts')
      .select('*')
      .order('last_activity_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load contacts: ${error.message}`);
    }

    const { data: requests } = await this.getSupabase()
      .from('requests')
      .select('*');

    const { data: missions } = await this.getSupabase()
      .from('missions')
      .select('*');

    const dbContacts = contacts as DbContact[];
    const dbRequests = (requests ?? []) as DbRequest[];
    const dbMissions = (missions ?? []) as DbMission[];

    return dbContacts.map((dbContact) => {
      const relatedRequests = dbRequests.filter(
        (r) => r.contact_id === dbContact.id
      );
      const relatedMissions = dbMissions.filter((m) =>
        relatedRequests.some((r) => r.id === m.request_id)
      );
      return mapContact(dbContact, relatedRequests, relatedMissions);
    });
  }

  async loadRequests(): Promise<Request[]> {
    this.ensureSupabaseConfigured();

    const { data: requests, error } = await this.getSupabase()
      .from('requests')
      .select('*')
      .order('last_activity_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load requests: ${error.message}`);
    }

    const { data: actions } = await this.getSupabase()
      .from('request_actions')
      .select('*')
      .is('completed_at', null);

    const dbRequests = requests as DbRequest[];
    const dbActions = (actions ?? []) as DbRequestAction[];

    const actionsByRequestId = new Map<string, DbRequestAction>();
    for (const action of dbActions) {
      actionsByRequestId.set(action.request_id, action);
    }

    return dbRequests.map((dbRequest) => {
      const openAction = actionsByRequestId.get(dbRequest.id) ?? null;
      return mapRequest(dbRequest, openAction);
    });
  }

  async loadMissions(): Promise<Mission[]> {
    this.ensureSupabaseConfigured();

    const { data: missions, error } = await this.getSupabase()
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load missions: ${error.message}`);
    }

    const { data: requests } = await this.getSupabase()
      .from('requests')
      .select('*');

    const dbMissions = missions as DbMission[];
    const dbRequests = (requests ?? []) as DbRequest[];

    const contactIdByRequestId = new Map<string, string>();
    for (const request of dbRequests) {
      contactIdByRequestId.set(request.id, request.contact_id);
    }

    return dbMissions.map((dbMission) => {
      const contactId = contactIdByRequestId.get(dbMission.request_id) ?? '';
      return mapMission(dbMission, contactId);
    });
  }

  async loadExchanges(): Promise<Exchange[]> {
    this.ensureSupabaseConfigured();

    const { data: exchanges, error } = await this.getSupabase()
      .from('exchanges')
      .select('*')
      .order('occurred_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load exchanges: ${error.message}`);
    }

    const dbExchanges = exchanges as DbExchange[];
    return dbExchanges.map(mapExchange);
  }

  async createContact(
    contact: Omit<
      Contact,
      | 'id'
      | 'createdAt'
      | 'lastActivityAt'
      | 'totalRequests'
      | 'totalMissions'
      | 'avatarSeed'
    >
  ): Promise<Contact> {
    this.ensureSupabaseConfigured();

    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const dbContact = {
      first_name: contact.firstName,
      last_name: contact.lastName,
      company: contact.company ?? null,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      notes: contact.notes ?? null,
      relationship: RELATIONSHIP_TYPE_REVERSE_MAP[contact.relationship],
      created_at: now,
      last_activity_at: now,
      archived: contact.archived,
      user_id: userId,
    };

    const { data, error } = await this.getSupabase()
      .from('contacts')
      .insert(dbContact)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contact: ${error.message}`);
    }

    const createdDbContact = data;
    return mapContact(createdDbContact, [], []);
  }
}
