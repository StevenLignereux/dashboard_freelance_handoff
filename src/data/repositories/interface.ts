/**
 * Interface Repository - Abstraction pour la couche de données.
 * Permet de basculer entre source seed et source Supabase.
 */

import type { Contact, Exchange, Mission, Request } from '../../types';

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
   * Crée un nouveau contact.
   */
  createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'lastActivityAt' | 'totalRequests' | 'totalMissions' | 'avatarSeed'>): Promise<Contact>;
}