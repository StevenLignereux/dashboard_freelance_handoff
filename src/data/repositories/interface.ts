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

/**
 * Contrat d'entrée de la modification d'un contact existant.
 * Seuls les champs réellement modifiables depuis le formulaire sont autorisés.
 * Interdits via updateContact :
 *  - id / user_id / createdAt
 *  - archived (utiliser archiveContact)
 *  - dérivés : totalRequests / totalMissions / activeRequestId / avatarSeed
 *  - lastActivityAt (ne doit pas être modifié par une simple édition)
 */
export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  relationship?: RelationshipType;
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

  /**
   * Met à jour un contact existant via UpdateContactInput.
   * Ne modifie que les champs explicitement autorisés.
   * Retourne le contact mappé avec ses dérivés cohérents.
   */
  updateContact(contactId: string, input: UpdateContactInput): Promise<Contact>;

  /**
   * Archive un contact (archived = true, aucune suppression physique).
   * Levée explicite si le contact est introuvable (via seed) ou si la BDD
   * retourne une erreur (via Supabase).
   */
  archiveContact(contactId: string): Promise<void>;
}
