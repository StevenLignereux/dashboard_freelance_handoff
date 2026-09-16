/**
 * Supabase Repository - Implémentation repository utilisant Supabase.
 * Utilise uniquement le client Supabase et les mappers.
 *
 * Règles :
 *  - Aucune erreur Supabase n'est ignorée sur les requêtes secondaires.
 *  - Une mission sans request correspondante est une erreur explicite.
 */

import { supabase } from '../../lib/supabase/client';
import type { Contact, Exchange, Mission, Request } from '../../types';
import type { CreateContactInput, IRepository } from './interface';
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
    const sb = this.getSupabase();

    const { data: contacts, error } = await sb
      .from('contacts')
      .select('*')
      .order('last_activity_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load contacts: ${error.message}`);
    }

    const { data: requests, error: requestsError } = await sb
      .from('requests')
      .select('*');

    if (requestsError) {
      throw new Error(
        `Failed to load requests (pour calcul des dérivés contact): ${requestsError.message}`
      );
    }

    const { data: missions, error: missionsError } = await sb
      .from('missions')
      .select('*');

    if (missionsError) {
      throw new Error(
        `Failed to load missions (pour calcul des dérivés contact): ${missionsError.message}`
      );
    }

    const dbContacts = contacts as DbContact[];
    const dbRequests = requests as DbRequest[];
    const dbMissions = missions as DbMission[];

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
    const sb = this.getSupabase();

    const { data: requests, error } = await sb
      .from('requests')
      .select('*')
      .order('last_activity_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load requests: ${error.message}`);
    }

    const { data: actions, error: actionsError } = await sb
      .from('request_actions')
      .select('*')
      .is('completed_at', null);

    if (actionsError) {
      throw new Error(
        `Failed to load request_actions (pour calcul nextAction): ${actionsError.message}`
      );
    }

    const dbRequests = requests as DbRequest[];
    const dbActions = actions as DbRequestAction[];

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
    const sb = this.getSupabase();

    const { data: missions, error } = await sb
      .from('missions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load missions: ${error.message}`);
    }

    const { data: requests, error: requestsError } = await sb
      .from('requests')
      .select('*');

    if (requestsError) {
      throw new Error(
        `Failed to load requests (pour résolution mission.contactId): ${requestsError.message}`
      );
    }

    const dbMissions = missions as DbMission[];
    const dbRequests = requests as DbRequest[];

    const contactIdByRequestId = new Map<string, string>();
    for (const request of dbRequests) {
      contactIdByRequestId.set(request.id, request.contact_id);
    }

    return dbMissions.map((dbMission) => {
      const contactId = contactIdByRequestId.get(dbMission.request_id);
      if (!contactId) {
        throw new Error(
          `Mission ${dbMission.id} réfère request ${dbMission.request_id} introuvable: impossible de résoudre mission.contactId`
        );
      }
      return mapMission(dbMission, contactId);
    });
  }

  async loadExchanges(): Promise<Exchange[]> {
    this.ensureSupabaseConfigured();
    const sb = this.getSupabase();

    const { data: exchanges, error } = await sb
      .from('exchanges')
      .select('*')
      .order('occurred_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load exchanges: ${error.message}`);
    }

    const dbExchanges = exchanges as DbExchange[];
    return dbExchanges.map(mapExchange);
  }

  async createContact(input: CreateContactInput): Promise<Contact> {
    this.ensureSupabaseConfigured();

    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const dbContact = {
      first_name: input.firstName,
      last_name: input.lastName,
      company: input.company ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
      relationship: RELATIONSHIP_TYPE_REVERSE_MAP[input.relationship],
      created_at: now,
      last_activity_at: now,
      archived: false,
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
