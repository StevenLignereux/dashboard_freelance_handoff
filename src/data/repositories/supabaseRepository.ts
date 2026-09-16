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
import type { CreateContactInput, IRepository, UpdateContactInput } from './interface';
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

  async updateContact(contactId: string, input: UpdateContactInput): Promise<Contact> {
    this.ensureSupabaseConfigured();
    const sb = this.getSupabase();

    const patch: Record<string, unknown> = {};
    if (input.firstName !== undefined) patch.first_name = input.firstName;
    if (input.lastName !== undefined) patch.last_name = input.lastName;
    if (input.company !== undefined) patch.company = input.company ?? null;
    if (input.email !== undefined) patch.email = input.email ?? null;
    if (input.phone !== undefined) patch.phone = input.phone ?? null;
    if (input.notes !== undefined) patch.notes = input.notes ?? null;
    if (input.relationship !== undefined) {
      const mapped = RELATIONSHIP_TYPE_REVERSE_MAP[input.relationship];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!mapped) {
        throw new Error(`Cannot update contact: unknown relationship=${input.relationship}`);
      }
      patch.relationship = mapped;
    }

    // Interdiction stricte : jamais user_id, archived, created_at, last_activity_at
    // depuis un input client. RLS + trigger DB gèrent ce qui doit l'être.
    delete patch.user_id;
    delete patch.archived;
    delete patch.created_at;
    delete patch.last_activity_at;

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
    const { data: updatedData, error: updateError } = await (sb.from('contacts') as any)
      .update(patch)
      .eq('id', contactId)
      .select()
      .single();
    /* eslint-enable */

    if (updateError) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new Error(`Failed to update contact id=${contactId}: ${updateError.message}`);
    }
    if (!updatedData) {
      throw new Error(`Failed to update contact: no data returned for id=${contactId}`);
    }

    // Rechargement nécessaire pour garantir totalRequests / totalMissions
    // / activeRequestId cohérents : l'UPDATE seul ne retourne pas ces relations.
    const { data: requests, error: requestsError } = await sb
      .from('requests')
      .select('*');
    if (requestsError) {
      throw new Error(
        `Failed to load requests (dérivés update contact): ${requestsError.message}`
      );
    }
    const { data: missions, error: missionsError } = await sb
      .from('missions')
      .select('*');
    if (missionsError) {
      throw new Error(
        `Failed to load missions (dérivés update contact): ${missionsError.message}`
      );
    }

    const dbRequests = requests as DbRequest[];
    const dbMissions = missions as DbMission[];
    const relatedRequests = dbRequests.filter((r) => r.contact_id === contactId);
    const relatedMissions = dbMissions.filter((m) =>
      relatedRequests.some((r) => r.id === m.request_id)
    );

    return mapContact(updatedData as DbContact, relatedRequests, relatedMissions);
  }

  async archiveContact(contactId: string): Promise<void> {
    this.ensureSupabaseConfigured();
    const sb = this.getSupabase();

    const { error } = await sb
      .from('contacts')
      .update({ archived: true })
      .eq('id', contactId);

    if (error) {
      throw new Error(`Failed to archive contact id=${contactId}: ${error.message}`);
    }
  }
}
