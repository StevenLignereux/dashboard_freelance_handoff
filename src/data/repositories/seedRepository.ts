/**
 * Seed Repository - Implémentation repository utilisant les données seed existantes.
 * Préserve le comportement actuel de l'application.
 *
 * La persistance mémoire utilise une COPIE INTERNE initialisée depuis les seeds
 * afin d'éviter de muter les exports globaux et de polluer d'autres tests.
 */

import type { Contact, Exchange, Mission, Request } from '../../types';
import type { CreateContactInput, IRepository, UpdateContactInput } from './interface';
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

  async updateContact(contactId: string, input: UpdateContactInput): Promise<Contact> {
    const idx = this.contacts.findIndex((c) => c.id === contactId);
    if (idx === -1) {
      throw new Error(`Cannot update contact: contact id=${contactId} not found.`);
    }

    const previous = this.contacts[idx];

    const updated: Contact = {
      ...previous,
      firstName: input.firstName ?? previous.firstName,
      lastName: input.lastName ?? previous.lastName,
      company: input.company ?? previous.company,
      email: input.email ?? previous.email,
      phone: input.phone ?? previous.phone,
      notes: input.notes ?? previous.notes,
      relationship: input.relationship ?? previous.relationship,
    };

    this.contacts[idx] = updated;

    return Promise.resolve(updated);
  }

  archiveContact(contactId: string): Promise<void> {
    const idx = this.contacts.findIndex((c) => c.id === contactId);
    if (idx === -1) {
      return Promise.reject(new Error(`Cannot archive contact: id=${contactId} not found`));
    }
    const prev = this.contacts[idx];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!prev) return Promise.reject(new Error(`Cannot archive contact: id=${contactId} missing slot`));
    this.contacts[idx] = {
      ...prev,
      archived: true,
    };
    return Promise.resolve();
  }
}
