import { clock } from '../config/clock';
import { applyRelanceRules } from '../data/seedData';
import type {
  Contact,
  Exchange,
  Mission,
  NextAction,
  Request,
} from '../types';

export interface DashboardItem {
  id: string;
  contactId: string;
  requestId?: string;
  label: string;
  sub: string;
  action: NextAction;
  tone: 'danger' | 'info' | 'upcoming';
}

export interface DashboardData {
  overdueActions: DashboardItem[];
  todayActions: DashboardItem[];
  upcomingActions: DashboardItem[];
  activeMissions: Mission[];
  attentionCount: number;
}

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const diffDays = (a: Date, b: Date): number =>
  Math.round(
    (startOfDay(a).getTime() - startOfDay(b).getTime()) / (1000 * 60 * 60 * 24)
  );

export function hydrateNextAction(
  action: NextAction | undefined
): NextAction | undefined {
  if (!action) return undefined;
  const due = new Date(action.dueDate);
  const now = clock.now();
  const diff = diffDays(due, now);
  const overdue = !action.isToday && !action.isUpcoming && diff < 0;
  const today = startOfDay(due).getTime() === startOfDay(now).getTime();
  return {
    ...action,
    isOverdue: action.isOverdue ?? overdue,
    overdueDays:
      action.overdueDays ?? (overdue ? Math.abs(diff) : undefined),
    isToday: action.isToday ?? today,
    isUpcoming: action.isUpcoming ?? diff > 0,
  };
}

export function buildDashboardData({
  requests: rawRequests,
  contacts,
  missions,
}: {
  requests: Request[];
  contacts: Contact[];
  missions: Mission[];
}): DashboardData {
  const requests = applyRelanceRules(rawRequests).map((r) => ({
    ...r,
    nextAction: hydrateNextAction(r.nextAction),
  }));

  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const overdue: DashboardItem[] = [];
  const today: DashboardItem[] = [];
  const upcoming: DashboardItem[] = [];

  for (const r of requests) {
    if (r.archived) continue;
    const na = r.nextAction;
    if (!na) continue;
    const contact = contactById.get(r.contactId);
    const name = contact
      ? `${contact.firstName} ${contact.lastName}`
      : 'Contact inconnu';

    const base: Omit<DashboardItem, 'tone' | 'sub'> = {
      id: `dash-${r.id}-${na.id}`,
      contactId: r.contactId,
      requestId: r.id,
      label: name,
      action: na,
    };

    if (na.isOverdue) {
      const days = na.overdueDays ?? 0;
      overdue.push({
        ...base,
        tone: 'danger',
        sub: `Relance en retard de ${days} jour${days > 1 ? 's' : ''}`,
      });
    } else if (na.isToday) {
      today.push({
        ...base,
        tone: 'info',
        sub: na.label,
      });
    } else if (na.isUpcoming) {
      upcoming.push({
        ...base,
        tone: 'upcoming',
        sub: na.label,
      });
    }
  }

  overdue.sort(
    (a, b) => (b.action.overdueDays ?? 0) - (a.action.overdueDays ?? 0)
  );
  today.sort(
    (a, b) =>
      new Date(a.action.dueDate).getTime() -
      new Date(b.action.dueDate).getTime()
  );
  upcoming.sort(
    (a, b) =>
      new Date(a.action.dueDate).getTime() -
      new Date(b.action.dueDate).getTime()
  );

  const activeMissions = missions.filter(
    (m) => m.status === 'en_cours' || m.status === 'a_demarrer'
  );

  const attentionCount = overdue.length + today.length;

  return {
    overdueActions: overdue,
    todayActions: today,
    upcomingActions: upcoming.slice(0, 6),
    activeMissions,
    attentionCount,
  };
}

export function searchContacts({
  contacts,
  requests,
  query,
}: {
  contacts: Contact[];
  requests: Request[];
  query: string;
}): Contact[] {
  const q = query.trim().toLowerCase();
  if (!q) return contacts;
  const reqsByContact = new Map<string, Request[]>();
  for (const r of requests) {
    const arr = reqsByContact.get(r.contactId) ?? [];
    arr.push(r);
    reqsByContact.set(r.contactId, arr);
  }
  return contacts.filter((c) => {
    const hay = [
      c.firstName,
      c.lastName,
      c.company,
      c.email,
      ...(reqsByContact.get(c.id)?.map((r) => r.title) ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function getActiveRequestForContact({
  contactId,
  requests,
}: {
  contactId: string;
  requests: Request[];
}): Request | undefined {
  const contact = (c: Request) => c.contactId === contactId && !c.archived;
  return (
    requests.find((r) => contact(r) && r.status !== 'sans_suite') ??
    requests.find(contact)
  );
}

export function getExchangesForContact({
  contactId,
  requests,
  exchanges,
}: {
  contactId: string;
  requests: Request[];
  exchanges: Exchange[];
}): Exchange[] {
  const requestIds = new Set(
    requests.filter((r) => r.contactId === contactId).map((r) => r.id)
  );
  return exchanges
    .filter((e) => requestIds.has(e.requestId))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getMissionsForContact({
  contactId,
  missions,
}: {
  contactId: string;
  missions: Mission[];
}): Mission[] {
  return missions.filter((m) => m.contactId === contactId);
}
