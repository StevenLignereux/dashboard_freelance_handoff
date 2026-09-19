/**
 * Interface Repository - Abstraction pour la couche de données.
 * Permet de basculer entre source seed et source Supabase.
 * Contient aussi le contrat d'entrée pour la création d'un contact.
 */

import type { Contact, Exchange, Mission, RelationshipType, Request, NextActionType, ExchangeType } from '../../types';
import type { NextAction } from '../../types';

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

export interface CreateRequestInput {
  contactId: string;
  title: string;
  description?: string | null;
}

export interface UpdateRequestInput {
  title?: string;
  description?: string | null;
}

export interface CreateRequestActionInput {
  requestId: string;
  type: NextActionType;
  label: string;
  dueDate: string;
}

export interface UpdateRequestActionInput {
  type?: NextActionType;
  label?: string;
  dueDate?: string;
}

export interface CreateMissionInput {
  requestId: string;
  contactId: string;
  title: string;
  status?: Mission['status'];
  progress?: number;
  notes?: string | null;
}

export interface UpdateMissionInput {
  title?: string;
  status?: Mission['status'];
  progress?: number;
  notes?: string | null;
}

export interface CreateExchangeInput {
  requestId: string;
  type: ExchangeType;
  date: string;
  summary: string;
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
   * Crée une nouvelle action pour une demande existante.
   */
  createRequestAction(input: CreateRequestActionInput): Promise<NextAction>;

  /**
   * Met à jour une action existante.
   */
   updateRequestAction(
    actionId: string,
    input: UpdateRequestActionInput
  ): Promise<NextAction>;


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

  createRequest(input: CreateRequestInput): Promise<Request>;
  updateRequest(requestId: string, input: UpdateRequestInput): Promise<Request>;
  createMission(input: CreateMissionInput): Promise<Mission>;
  updateMission(missionId: string, input: UpdateMissionInput): Promise<Mission>;
  createExchange(input: CreateExchangeInput): Promise<Exchange>;
  archiveRequest(requestId: string): Promise<void>;
}
