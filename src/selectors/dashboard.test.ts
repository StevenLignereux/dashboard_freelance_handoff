import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clock } from '../config/clock';
import {
  buildDashboardData,
  hydrateNextAction,
  searchContacts,
} from './dashboard';
import type { Contact, Mission, Request } from '../types';

const FIXED = new Date('2026-09-10T10:00:00Z');

const d = (offsetDays: number, hour = 10): string => {
  const x = new Date(FIXED);
  x.setDate(x.getDate() + offsetDays);
  x.setHours(hour, 0, 0, 0);
  return x.toISOString();
};

const contact = (n: number, extra?: Partial<Contact>): Contact => ({
  id: `c-${n}`,
  firstName: `First${n}`,
  lastName: `Last${n}`,
  company: n % 2 === 0 ? `Studio${n}` : undefined,
  email: `c${n}@example.fr`,
  phone: `+33 6 00 00 00 ${String(n).padStart(2, '0')}`,
  notes: '',
  relationship: n % 3 === 0 ? 'client' : n % 3 === 1 ? 'prospect' : 'client_recurrent',
  createdAt: d(-60),
  lastActivityAt: d(-n),
  archived: false,
  totalRequests: 1,
  totalMissions: n % 2,
  avatarSeed: `seed-${n}`,
  ...extra,
});

const request = (n: number, opts?: Partial<Request>): Request => ({
  id: `r-${n}`,
  contactId: `c-${n}`,
  title: `Demande ${n}`,
  status: 'solution_proposee',
  createdAt: d(-30),
  lastActivityAt: d(-n),
  archived: false,
  ...opts,
});

const mission = (n: number, opts?: Partial<Mission>): Mission => ({
  id: `m-${n}`,
  requestId: `r-${n}`,
  contactId: `c-${n}`,
  title: `Mission ${n}`,
  status: 'en_cours',
  startDate: d(-20),
  endDate: d(40),
  progress: 20 + n * 10,
  ...opts,
});

beforeEach(() => {
  clock.setImplementation(() => new Date(FIXED));
});
afterEach(() => {
  clock.reset();
});

describe('hydrateNextAction', () => {
  it('marque une action passée comme overdue', () => {
    const na = {
      id: 'na-1',
      type: 'relance' as const,
      label: 'Relancer',
      dueDate: d(-2),
    };
    const out = hydrateNextAction(na);
    expect(out?.isOverdue).toBe(true);
    expect(out?.overdueDays).toBe(2);
    expect(out?.isToday).toBe(false);
    expect(out?.isUpcoming).toBe(false);
  });

  it('marque une action du jour comme today', () => {
    const na = {
      id: 'na-2',
      type: 'appel' as const,
      label: 'Appel',
      dueDate: d(0, 14),
    };
    const out = hydrateNextAction(na);
    expect(out?.isOverdue).toBe(false);
    expect(out?.isToday).toBe(true);
    expect(out?.isUpcoming).toBe(false);
  });

  it('marque une action future comme upcoming', () => {
    const na = {
      id: 'na-3',
      type: 'appel' as const,
      label: 'Point',
      dueDate: d(5),
    };
    const out = hydrateNextAction(na);
    expect(out?.isOverdue).toBe(false);
    expect(out?.isToday).toBe(false);
    expect(out?.isUpcoming).toBe(true);
  });

  it('retourne undefined sans action', () => {
    expect(hydrateNextAction(undefined)).toBeUndefined();
  });
});

describe('buildDashboardData', () => {
  it('classe overdue/today/upcoming et ignore les missions <30% pour le compteur attention', () => {
    const contacts = [contact(1), contact(2), contact(3), contact(4), contact(5)];
    const requests: Request[] = [
      request(1, {
        nextAction: {
          id: 'na-1',
          type: 'relance',
          label: 'Relancer',
          dueDate: d(-3),
        },
      }),
      request(2, {
        nextAction: {
          id: 'na-2',
          type: 'appel',
          label: 'Appel à 11h',
          dueDate: d(0, 11),
        },
      }),
      request(3, {
        nextAction: {
          id: 'na-3',
          type: 'proposition',
          label: 'Envoyer proposition',
          dueDate: d(2),
        },
      }),
      request(4, {
        nextAction: {
          id: 'na-4',
          type: 'appel',
          label: 'Point',
          dueDate: d(10),
        },
      }),
      request(5, { status: 'nouveau' }),
    ];
    const missions: Mission[] = [
      mission(1, { progress: 25, status: 'en_cours' }),
      mission(2, { progress: 70, status: 'en_cours' }),
      mission(3, { progress: 100, status: 'terminee' }),
    ];

    const dashboard = buildDashboardData({
      requests,
      contacts,
      missions,
    });

    expect(dashboard.overdueActions).toHaveLength(1);
    expect(dashboard.overdueActions[0].action.overdueDays).toBe(3);
    expect(dashboard.todayActions).toHaveLength(1);
    expect(dashboard.upcomingActions).toHaveLength(2);
    expect(dashboard.activeMissions.map((m) => m.id)).toEqual(['m-1', 'm-2']);

    expect(dashboard.attentionCount).toBe(2);
  });

  it('applique une relance automatique après 5j sans nextAction', () => {
    const contacts = [contact(10)];
    const requests: Request[] = [
      request(10, {
        status: 'solution_proposee',
        lastActivityAt: d(-10),
        nextAction: undefined,
      }),
    ];
    const dashboard = buildDashboardData({
      requests,
      contacts,
      missions: [],
    });
    expect(dashboard.overdueActions).toHaveLength(1);
    expect(dashboard.overdueActions[0].action.label).toMatch(/Relancer/);
  });
});

describe('searchContacts', () => {
  it('recherche dans nom/prénom/entreprise et titres des demandes', () => {
    const contacts = [contact(1), contact(2), contact(3)];
    const requests: Request[] = [
      request(1, { title: 'Site e-commerce café' }),
      request(2, { title: 'Refonte vitrine' }),
      request(3, { title: 'Audit SEO' }),
    ];
    expect(searchContacts({ contacts, requests, query: 'café' })).toHaveLength(1);
    expect(searchContacts({ contacts, requests, query: 'Studio2' })).toHaveLength(1);
    expect(searchContacts({ contacts, requests, query: 'Audit' })).toHaveLength(1);
    expect(searchContacts({ contacts, requests, query: '' })).toHaveLength(3);
  });
});
