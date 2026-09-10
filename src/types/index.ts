export type RelationshipType =
  | 'prospect'
  | 'client'
  | 'client_recurrent'
  | 'ancien_client';

export type RequestStatus =
  | 'nouveau'
  | 'a_comprendre'
  | 'echange_prevu'
  | 'solution_proposee'
  | 'en_attente'
  | 'mission_confirmee'
  | 'sans_suite';

export type MissionStatus =
  | 'a_demarrer'
  | 'en_cours'
  | 'en_attente'
  | 'terminee';

export type ExchangeType = 'appel' | 'email' | 'message' | 'rencontre' | 'note';

export type NextActionType =
  | 'relance'
  | 'proposition'
  | 'appel'
  | 'devis'
  | 'documents'
  | 'precision'
  | 'echange'
  | 'autre';

export interface NextAction {
  id: string;
  type: NextActionType;
  label: string;
  dueDate: string;
  isOverdue?: boolean;
  overdueDays?: number;
  isToday?: boolean;
  isUpcoming?: boolean;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  relationship: RelationshipType;
  createdAt: string;
  lastActivityAt: string;
  archived: boolean;
  activeRequestId?: string;
  totalRequests: number;
  totalMissions: number;
  avatarSeed: string;
}

export interface Request {
  id: string;
  contactId: string;
  title: string;
  description?: string;
  status: RequestStatus;
  createdAt: string;
  lastActivityAt: string;
  nextAction?: NextAction;
  archived: boolean;
}

export interface Exchange {
  id: string;
  requestId: string;
  type: ExchangeType;
  date: string;
  summary: string;
}

export interface Mission {
  id: string;
  requestId: string;
  contactId: string;
  title: string;
  status: MissionStatus;
  startDate?: string;
  endDate?: string;
  progress?: number;
  notes?: string;
}

export type NavItemKey =
  | 'dashboard'
  | 'contacts'
  | 'requests'
  | 'missions'
  | 'settings';

export type ContactsViewMode = 'cards' | 'list';
