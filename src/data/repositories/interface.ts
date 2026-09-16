/**
 * Interface Repository - Abstraction pour la couche de données.
 * Permet de basculer entre source seed et source Supabase.
 * Contient aussi le contrat d'entrée pour la création d'un contact.
 */

import type { Contact, Exchange, Mission, RelationshipType, Request } from '../../types';

/**
 * Contrat d'entrée d'un nouveau contact tel que fourni par le formulaire.
 * Les repositories se chargent d'initialiser eux-mêmes :
 * - archived = false
 * - les dates (createdAt / lastActivityAt)
 * - id
 * - les dérivés : totalRequests / totalMissions / avatarSeed / activeRequestId
 *
 * archived est volontairement omis : un contact créé dans le formulaire est
 * systématiquement archivé = false à l'initialisation.
 */
export interface CreateContactInput {
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  relationship: RelationshipType;
}

export interface IRepository {
  /**
   * Charge tous les contacts avec leurs données dérivées.
   */
  loadContacts(): Promise<Contact[]>;

  /**
   * Charge toutes les demandes avec leurs actions ouvertes.
   */
  loadRequests(): Promise<Request[]>;

  /**
   * Charge toutes les missions.
   */
  loadMissions(): Promise<Mission[]>;

  /**
   * Charge tous les échanges.
   */
  loadExchanges(): Promise<Exchange[]>;

  /**
   * Crée un nouveau contact à partir du contrat CreateContactInput.
   */
  createContact(input: CreateContactInput): Promise<Contact>;
}
