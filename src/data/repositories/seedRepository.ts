/**
 * Seed Repository - Implémentation repository utilisant les données seed existantes.
 * Préserve le comportement actuel de l'application.
 *
 * La persistance mémoire utilise une COPIE INTERNE initialisée depuis les seeds
 * afin d'éviter de muter les exports globaux et de polluer d'autres tests.
 */

import type { Contact, Exchange, Mission, NextAction, Request } from '../../types';
import type {
  CreateContactInput,
  CreateMissionInput,
  CreateRequestActionInput,
  CreateRequestInput,
  CreateExchangeInput,
  IRepository,
  UpdateContactInput,
  UpdateMissionInput,
  UpdateRequestActionInput,
  UpdateRequestInput,
} from './interface';

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
      company:
        input.company === undefined
          ? previous.company
          : input.company ?? undefined,
      email:
        input.email === undefined
          ? previous.email
          : input.email ?? undefined,
      phone:
        input.phone === undefined
          ? previous.phone
          : input.phone ?? undefined,
      notes:
        input.notes === undefined
          ? previous.notes
          : input.notes ?? undefined,
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

  // eslint-disable-next-line @typescript-eslint/require-await
  async createRequest(input: CreateRequestInput): Promise<Request> {
    const contactId = input.contactId;
    const contact = this.contacts.find((c) => c.id === contactId);
    if (!contact) {
      throw new Error(`Cannot create request: contact id=${contactId} not found.`);
    }
    if (contact.archived) {
      throw new Error(`Cannot create request: contact id=${contactId} is archived.`);
    }
    const activeReq = this.requests.find(
      (r) => r.contactId === contactId && !r.archived && r.status !== 'sans_suite'
    );
    if (activeReq) {
      throw new Error(`Cannot create request: contact id=${contactId} already has an active request id=${activeReq.id}. Archive it first.`);
    }
    const now = new Date().toISOString();
    const newReq: Request = {
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      contactId: input.contactId,
      title: input.title,
      description: input.description ?? undefined,
      status: 'nouveau',
      createdAt: now,
      lastActivityAt: now,
      nextAction: undefined,
      archived: false,
    };
    this.requests.push(newReq);
    const contactIdx = this.contacts.findIndex((c) => c.id === contactId);
    if (contactIdx !== -1) {
      const existingContact = this.contacts[contactIdx];
      this.contacts[contactIdx] = {
        ...existingContact,
        totalRequests: existingContact.totalRequests + 1,
        activeRequestId: newReq.id,
      };
    }
    return newReq;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async updateRequest(requestId: string, input: UpdateRequestInput): Promise<Request> {
    const idx = this.requests.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      throw new Error(`Cannot update request: id=${requestId} not found.`);
    }
    const previous = this.requests[idx];
    const updated: Request = {
      ...previous,
      title: input.title ?? previous.title,
      description: input.description === undefined ? previous.description : (input.description ?? undefined),
    };
    this.requests[idx] = updated;
    return updated;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async createRequestAction(input: CreateRequestActionInput): Promise<NextAction> {
    const requestIndex = this.requests.findIndex((request) => request.id === input.requestId);

    if (requestIndex === -1) {
      throw new Error(`Cannot create request action: request id=${input.requestId} not found.`);
    }

    const request = this.requests[requestIndex];

    if (request.archived) {
      throw new Error(`Cannot create request action: request id=${input.requestId} is archived.`);
    }

    if (request.nextAction) {
      throw new Error(`Cannot create request action: request id=${input.requestId} already has an open action.`);
    }

    const action: NextAction = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: input.type,
      label: input.label,
      dueDate: input.dueDate,
    };

    this.requests[requestIndex] = {
      ...request,
      nextAction: action,
    };

    return action;
  }


  // eslint-disable-next-line @typescript-eslint/require-await
  async updateRequestAction(
    actionId: string,
    input: UpdateRequestActionInput
  ): Promise<NextAction> {
    const requestIndex = this.requests.findIndex(
      (request) => request.nextAction?.id === actionId
    );

    if (requestIndex === -1) {
      throw new Error(
        `Cannot update request action: action id=${actionId} not found.`
      );
    }

    const request = this.requests[requestIndex];

    if (request.archived) {
      throw new Error(
        `Cannot update request action: request id=${request.id} is archived.`
      );
    }

    const previousAction = request.nextAction;

    if (!previousAction) {
      throw new Error(
        `Cannot update request action: action id=${actionId} not found.`
      );
    }

    const updatedAction: NextAction = {
      ...previousAction,
      type: input.type ?? previousAction.type,
      label: input.label ?? previousAction.label,
      dueDate: input.dueDate ?? previousAction.dueDate,
    };

    this.requests[requestIndex] = {
      ...request,
      nextAction: updatedAction,
    };

    return updatedAction;
  }


  archiveRequest(requestId: string): Promise<void> {
    const idx = this.requests.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      return Promise.reject(new Error(`Cannot archive request: id=${requestId} not found.`));
    }
    const prev = this.requests[idx];
    const archivedVersion = { ...prev, archived: true };
    this.requests[idx] = archivedVersion;
    const contactIdx = this.contacts.findIndex((c) => c.id === prev.contactId);
    if (contactIdx !== -1) {
      const contact = this.contacts[contactIdx];
      if (contact.activeRequestId === requestId) {
        this.contacts[contactIdx] = {
          ...contact,
          activeRequestId: undefined,
        };
      }
    }
    return Promise.resolve();
  }

  async createMission(input: CreateMissionInput): Promise<Mission> {
    const id = `m-new-${Date.now()}`;
    const now = new Date().toISOString();
    const created: Mission = {
      id,
      requestId: input.requestId,
      contactId: input.contactId,
      title: input.title,
      status: input.status ?? 'a_demarrer',
      progress: input.progress ?? 0,
      notes: input.notes ?? undefined,
      startDate: now,
    };
    this.missions.push(created);
    return Promise.resolve(created);
  }

  async updateMission(missionId: string, input: UpdateMissionInput): Promise<Mission> {
    const idx = this.missions.findIndex((m) => m.id === missionId);
    if (idx === -1) throw new Error(`Mission ${missionId} introuvable`);
    const existing = this.missions[idx];
    const updated: Mission = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.progress !== undefined ? { progress: input.progress } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ?? undefined } : {}),
    };
    this.missions[idx] = updated;
    return Promise.resolve(updated);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async createExchange(input: CreateExchangeInput): Promise<Exchange> {
    const requestIndex = this.requests.findIndex((r) => r.id === input.requestId);
    if (requestIndex === -1) {
      throw new Error(`Cannot create exchange: request id=${input.requestId} not found.`);
    }

    const request = this.requests[requestIndex];
    if (request.archived) {
      throw new Error(`Cannot create exchange: request id=${input.requestId} is archived.`);
    }

    const trimmedSummary = input.summary.trim();
    if (trimmedSummary.length === 0) {
      throw new Error(`Cannot create exchange: summary cannot be empty after trimming.`);
    }

    const exchangeId = `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newExchange: Exchange = {
      id: exchangeId,
      requestId: input.requestId,
      type: input.type,
      date: input.date,
      summary: trimmedSummary,
    };

    this.exchanges.push(newExchange);

    if (input.date > request.lastActivityAt) {
      this.requests[requestIndex] = {
        ...request,
        lastActivityAt: input.date,
      };
    }

    const contactIndex = this.contacts.findIndex((c) => c.id === request.contactId);
    if (contactIndex !== -1) {
      const contact = this.contacts[contactIndex];
      if (input.date > contact.lastActivityAt) {
        this.contacts[contactIndex] = {
          ...contact,
          lastActivityAt: input.date,
        };
      }
    }

    return newExchange;
  }
}
