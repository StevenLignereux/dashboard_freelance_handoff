/**
 * Seed Repository - Implémentation repository utilisant les données seed existantes.
 * Préserve le comportement actuel de l'application.
 *
 * La persistance mémoire utilise une COPIE INTERNE initialisée depuis les seeds
 * afin d'éviter de muter les exports globaux et de polluer d'autres tests.
 */

import type { Contact, Exchange, Mission, Request } from '../../types';
import type { CreateContactInput, IRepository } from './interface';
import {
  seedContacts,
  seedRequests,
  seedMissions,
  seedExchanges,
} from '../seedData';
import { generateAvatarSeed } from '../mappers';

export class SeedRepository implements IRepository {
  private readonly contacts: Contact[];
  private readonly requests: Request[];
  private readonly missions: Mission[];
  private readonly exchanges: Exchange[];

  constructor() {
    this.contacts = [...seedContacts];
    this.requests = [...seedRequests];
    this.missions = [...seedMissions];
    this.exchanges = [...seedExchanges];
  }

  async loadContacts(): Promise<Contact[]> {
    return Promise.resolve([...this.contacts]);
  }

  async loadRequests(): Promise<Request[]> {
    return Promise.resolve([...this.requests]);
  }

  async loadMissions(): Promise<Mission[]> {
    return Promise.resolve([...this.missions]);
  }

  async loadExchanges(): Promise<Exchange[]> {
    return Promise.resolve([...this.exchanges]);
  }

  async createContact(input: CreateContactInput): Promise<Contact> {
    const now = new Date().toISOString();
    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const newContact: Contact = {
      firstName: input.firstName,
      lastName: input.lastName,
      company: input.company,
      email: input.email,
      phone: input.phone,
      notes: input.notes,
      relationship: input.relationship,
      archived: false,
      id,
      createdAt: now,
      lastActivityAt: now,
      totalRequests: 0,
      totalMissions: 0,
      avatarSeed: generateAvatarSeed(id),
    };

    this.contacts.push(newContact);

    return Promise.resolve(newContact);
  }
}
