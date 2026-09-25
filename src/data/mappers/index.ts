/**
 * Mappers DB → domaine
 * Convertit les types snake_case de la base en types camelCase du domaine.
 * Calcule les champs dérivés (totalRequests, totalMissions, activeRequestId, avatarSeed, etc.).
 */

import type {
  Contact,
  Exchange,
  Mission,
  NextAction,
  Request,
  RelationshipType,
  RequestStatus,
  MissionStatus,
  ExchangeType,
  NextActionType,
} from '../../types';
import type {
  DbContact,
  DbRequest,
  DbMission,
  DbExchange,
  DbRequestAction,
  DbRelationshipType,
  DbRequestStatus,
  DbMissionStatus,
  DbExchangeType,
  DbRequestActionType,
} from '../dbTypes';

// Enum mappings
const RELATIONSHIP_TYPE_MAP: Record<DbRelationshipType, RelationshipType> = {
  prospect: 'prospect',
  client: 'client',
  client_recurrent: 'client_recurrent',
  ancien_client: 'ancien_client',
};

const REQUEST_STATUS_MAP: Record<DbRequestStatus, RequestStatus> = {
  nouveau: 'nouveau',
  a_comprendre: 'a_comprendre',
  echange_prevu: 'echange_prevu',
  solution_proposee: 'solution_proposee',
  en_attente: 'en_attente',
  mission_confirmee: 'mission_confirmee',
  sans_suite: 'sans_suite',
  terminee: 'terminee',
};

const MISSION_STATUS_MAP: Record<DbMissionStatus, MissionStatus> = {
  a_demarrer: 'a_demarrer',
  en_cours: 'en_cours',
  en_attente: 'en_attente',
  terminee: 'terminee',
};

const EXCHANGE_TYPE_MAP: Record<DbExchangeType, ExchangeType> = {
  appel: 'appel',
  email: 'email',
  message: 'message',
  rencontre: 'rencontre',
  note: 'note',
};

const ACTION_TYPE_MAP: Record<DbRequestActionType, NextActionType> = {
  relance: 'relance',
  proposition: 'proposition',
  appel: 'appel',
  devis: 'devis',
  documents: 'documents',
  precision: 'precision',
  echange: 'echange',
  autre: 'autre',
};

/**
 * Génère un avatarSeed déterministe depuis un ID.
 * Utilise un hash simple pour garantir la même seed pour le même ID.
 * Exporté pour réutilisation depuis les repositories qui génèrent
 * des contacts nouveaux (sans DB round-trip) afin d'éviter la duplication.
 */
export function generateAvatarSeed(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hashHex = Math.abs(hash).toString(16).padStart(4, '0');
  return `${id}-${hashHex}`;
}

/**
 * Convertit un contact DB en Contact domaine avec les champs dérivés.
 */
export function mapContact(
  dbContact: DbContact,
  relatedRequests: DbRequest[],
  relatedMissions: DbMission[]
): Contact {
  const totalRequests = relatedRequests.length;
  const totalMissions = relatedMissions.length;
  const activeRequest = relatedRequests.find((r) => r.is_active && !r.archived);
  const activeRequestId = activeRequest?.id;

  return {
    id: dbContact.id,
    firstName: dbContact.first_name,
    lastName: dbContact.last_name,
    company: dbContact.company ?? undefined,
    email: dbContact.email ?? undefined,
    phone: dbContact.phone ?? undefined,
    notes: dbContact.notes ?? undefined,
    relationship: RELATIONSHIP_TYPE_MAP[dbContact.relationship],
    createdAt: dbContact.created_at,
    lastActivityAt: dbContact.last_activity_at,
    archived: dbContact.archived,
    activeRequestId,
    totalRequests,
    totalMissions,
    avatarSeed: generateAvatarSeed(dbContact.id),
  };
}

/**
 * Convertit une action DB en NextAction domaine.
 * Les flags isOverdue, overdueDays, isToday, isUpcoming sont calculés côté application.
 */
export function mapNextAction(dbAction: DbRequestAction): NextAction {
  return {
    id: dbAction.id,
    type: ACTION_TYPE_MAP[dbAction.type],
    label: dbAction.label,
    dueDate: dbAction.due_at,
    // Les flags isOverdue, overdueDays, isToday, isUpcoming sont calculés par hydrateNextAction
  };
}

/**
 * Convertit une demande DB en Request domaine avec la prochaine action.
 * Si openAction a un completed_at défini (action terminée), on l'ignore complètement.
 */
export function mapRequest(
  dbRequest: DbRequest,
  openAction: DbRequestAction | null
): Request {
  const isOpen = openAction?.completed_at === null;
  return {
    id: dbRequest.id,
    contactId: dbRequest.contact_id,
    title: dbRequest.title,
    description: dbRequest.description ?? undefined,
    status: REQUEST_STATUS_MAP[dbRequest.status],
    createdAt: dbRequest.created_at,
    lastActivityAt: dbRequest.last_activity_at,
    nextAction: isOpen ? mapNextAction(openAction) : undefined,
    archived: dbRequest.archived,
  };
}

/**
 * Convertit une mission DB en Mission domaine avec le contactId dérivé.
 * Le contactId est retrouvé via request → contact.
 */
export function mapMission(
  dbMission: DbMission,
  requestContactId: string
): Mission {
  return {
    id: dbMission.id,
    requestId: dbMission.request_id,
    contactId: requestContactId,
    title: dbMission.title,
    status: MISSION_STATUS_MAP[dbMission.status],
    startDate: dbMission.start_date ?? undefined,
    endDate: dbMission.end_date ?? undefined,
    progress: dbMission.progress ?? undefined,
    notes: dbMission.notes ?? undefined,
  };
}

/**
 * Convertit un échange DB en Exchange domaine.
 */
export function mapExchange(dbExchange: DbExchange): Exchange {
  return {
    id: dbExchange.id,
    requestId: dbExchange.request_id,
    type: EXCHANGE_TYPE_MAP[dbExchange.type],
    date: dbExchange.occurred_at,
    summary: dbExchange.summary,
  };
}
