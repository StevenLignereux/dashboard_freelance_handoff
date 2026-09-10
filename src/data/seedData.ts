import { clock } from '../config/clock';
import type {
  Contact,
  Exchange,
  Mission,
  NextAction,
  Request,
} from '../types';

const iso = (offsetDays: number, hour = 10): string => {
  const x = new Date(clock.now());
  x.setDate(x.getDate() + offsetDays);
  x.setHours(hour, 0, 0, 0);
  return x.toISOString();
};

export const seedNextActions: Record<string, NextAction> = {
  'na-relance-sophie': {
    id: 'na-relance-sophie',
    type: 'relance',
    label: 'Relancer pour la proposition',
    dueDate: iso(-3),
  },
  'na-relance-lucas': {
    id: 'na-relance-lucas',
    type: 'relance',
    label: 'Relancer sur la refonte',
    dueDate: iso(-1),
  },
  'na-relance-jean': {
    id: 'na-relance-jean',
    type: 'relance',
    label: 'Relancer pour le devis',
    dueDate: iso(0, 9),
  },
  'na-echange-lucas': {
    id: 'na-echange-lucas',
    type: 'echange',
    label: 'Appel prévu à 11h',
    dueDate: iso(0, 11),
  },
  'na-echange-camille': {
    id: 'na-echange-camille',
    type: 'echange',
    label: 'Échange prévu à 14h',
    dueDate: iso(0, 14),
  },
  'na-proposition-thomas': {
    id: 'na-proposition-thomas',
    type: 'proposition',
    label: 'Envoyer la proposition',
    dueDate: iso(0, 17),
  },
  'na-suivi-jean': {
    id: 'na-suivi-jean',
    type: 'relance',
    label: 'Relancer dans 2 jours',
    dueDate: iso(2),
  },
  'na-point-antoine': {
    id: 'na-point-antoine',
    type: 'appel',
    label: 'Point de suivi',
    dueDate: iso(76),
  },
  'na-relance-thomas': {
    id: 'na-relance-thomas',
    type: 'relance',
    label: 'Relancer demain',
    dueDate: iso(1),
  },
};

export const seedContacts: Contact[] = [
  {
    id: 'c-jean-dupont',
    firstName: 'Jean',
    lastName: 'Dupont',
    company: 'Dupont Menuiserie',
    email: 'jean.dupont@example.fr',
    phone: '+33 6 12 34 56 78',
    notes: 'Très intéressé par un site vitrine propre et rapide. Budget ~4k€.',
    relationship: 'client',
    createdAt: iso(-90),
    lastActivityAt: iso(-2),
    archived: false,
    activeRequestId: 'r-jean-site',
    totalRequests: 2,
    totalMissions: 1,
    avatarSeed: 'jean-dupont-9a3f',
  },
  {
    id: 'c-sophie-martin',
    firstName: 'Sophie',
    lastName: 'Martin',
    company: 'La Parenthèse Café',
    email: 'sophie.martin@example.fr',
    phone: '+33 6 98 76 54 32',
    notes: 'Veut un site e-commerce pour vendre du café en ligne. Des questions sur les frais de port.',
    relationship: 'prospect',
    createdAt: iso(-15),
    lastActivityAt: iso(-8),
    archived: false,
    activeRequestId: 'r-sophie-ecom',
    totalRequests: 1,
    totalMissions: 0,
    avatarSeed: 'sophie-martin-cb12',
  },
  {
    id: 'c-lucas-bernard',
    firstName: 'Lucas',
    lastName: 'Bernard',
    company: 'Bernard Conseil',
    email: 'lucas.bernard@example.fr',
    phone: '+33 6 45 78 12 90',
    notes: "Refonte complète du site vitrine du cabinet. Laisse parler la créativité.",
    relationship: 'client',
    createdAt: iso(-240),
    lastActivityAt: iso(-6),
    archived: false,
    activeRequestId: 'r-lucas-refonte',
    totalRequests: 1,
    totalMissions: 2,
    avatarSeed: 'lucas-bernard-77e2',
  },
  {
    id: 'c-camille-robert',
    firstName: 'Camille',
    lastName: 'Robert',
    company: 'Studio Bloom',
    email: 'camille.robert@example.fr',
    notes: "Refonte d'identité visuelle + landing page. Premiers échanges très prometteurs.",
    relationship: 'prospect',
    createdAt: iso(-5),
    lastActivityAt: iso(-1),
    archived: false,
    activeRequestId: 'r-camille-identite',
    totalRequests: 1,
    totalMissions: 2,
    avatarSeed: 'camille-robert-44ff',
  },
  {
    id: 'c-antoine-morel',
    firstName: 'Antoine',
    lastName: 'Morel',
    company: 'Atelier Morel',
    email: 'antoine.morel@example.fr',
    phone: '+33 6 11 22 33 44',
    notes: "Client depuis 2 ans. Site vitrine + maintenance annuelle. Toujours très content.",
    relationship: 'client_recurrent',
    createdAt: iso(-730),
    lastActivityAt: iso(-4),
    archived: false,
    activeRequestId: 'r-antoine-maintenance',
    totalRequests: 5,
    totalMissions: 3,
    avatarSeed: 'antoine-morel-22a9',
  },
  {
    id: 'c-thomas-petit',
    firstName: 'Thomas',
    lastName: 'Petit',
    company: 'Le Coin des Livres',
    email: 'thomas.petit@example.fr',
    notes: "Ancien client - mission SEO terminée il y a 10 mois. Bon contact, peut revenir.",
    relationship: 'ancien_client',
    createdAt: iso(-500),
    lastActivityAt: iso(-300),
    archived: false,
    activeRequestId: 'r-thomas-seo',
    totalRequests: 2,
    totalMissions: 1,
    avatarSeed: 'thomas-petit-dc81',
  },
];

export const seedRequests: Request[] = [
  {
    id: 'r-jean-site',
    contactId: 'c-jean-dupont',
    title: 'Création site vitrine',
    description:
      "Site vitrine 4-5 pages pour présenter l'entreprise, les réalisations et les coordonnées.",
    status: 'solution_proposee',
    createdAt: iso(-30),
    lastActivityAt: iso(-7),
    nextAction: seedNextActions['na-suivi-jean'],
    archived: false,
  },
  {
    id: 'r-sophie-ecom',
    contactId: 'c-sophie-martin',
    title: 'Site e-commerce',
    description:
      'Boutique en ligne de café avec gestion des stocks et Stripe. ~50 références.',
    status: 'en_attente',
    createdAt: iso(-15),
    lastActivityAt: iso(-8),
    nextAction: seedNextActions['na-relance-sophie'],
    archived: false,
  },
  {
    id: 'r-lucas-refonte',
    contactId: 'c-lucas-bernard',
    title: 'Refonte site vitrine',
    description:
      "Refonte complète du site du cabinet : plus moderne, plus rapide, plus clair.",
    status: 'echange_prevu',
    createdAt: iso(-40),
    lastActivityAt: iso(-6),
    nextAction: seedNextActions['na-echange-lucas'],
    archived: false,
  },
  {
    id: 'r-camille-identite',
    contactId: 'c-camille-robert',
    title: 'Identité de marque',
    description:
      "Logo + charte graphique + mini style guide pour un studio de création.",
    status: 'a_comprendre',
    createdAt: iso(-5),
    lastActivityAt: iso(-1),
    nextAction: seedNextActions['na-echange-camille'],
    archived: false,
  },
  {
    id: 'r-antoine-maintenance',
    contactId: 'c-antoine-morel',
    title: 'Maintenance annuelle',
    description:
      "Maintenance annuelle du site : mises à jour, sécurité, petite évolution.",
    status: 'mission_confirmee',
    createdAt: iso(-60),
    lastActivityAt: iso(-4),
    nextAction: seedNextActions['na-point-antoine'],
    archived: false,
  },
  {
    id: 'r-thomas-seo',
    contactId: 'c-thomas-petit',
    title: 'Audit SEO',
    description:
      "Audit SEO complet + recommandations pour améliorer le référencement.",
    status: 'solution_proposee',
    createdAt: iso(-400),
    lastActivityAt: iso(-310),
    nextAction: seedNextActions['na-relance-thomas'],
    archived: false,
  },
  {
    id: 'r-jean-devis',
    contactId: 'c-jean-dupont',
    title: 'Devis dépannage',
    status: 'sans_suite',
    createdAt: iso(-180),
    lastActivityAt: iso(-160),
    archived: true,
  },
  {
    id: 'r-antoine-maint-prec',
    contactId: 'c-antoine-morel',
    title: 'Maintenance 2025',
    status: 'mission_confirmee',
    createdAt: iso(-420),
    lastActivityAt: iso(-365),
    archived: true,
  },
];

export const seedExchanges: Exchange[] = [
  {
    id: 'e-1',
    requestId: 'r-sophie-ecom',
    type: 'email',
    date: iso(-11),
    summary: "Envoi du devis e-commerce détaillé (6,8 k€ HT).",
  },
  {
    id: 'e-2',
    requestId: 'r-sophie-ecom',
    type: 'appel',
    date: iso(-13),
    summary: 'Premier appel : découverte du projet et besoins.',
  },
  {
    id: 'e-3',
    requestId: 'r-jean-site',
    type: 'rencontre',
    date: iso(-9),
    summary: "Rendez-vous atelier : présentation des maquettes V1.",
  },
  {
    id: 'e-4',
    requestId: 'r-jean-site',
    type: 'email',
    date: iso(-7),
    summary: "Envoi de la proposition et du planning prévisionnel.",
  },
  {
    id: 'e-5',
    requestId: 'r-lucas-refonte',
    type: 'message',
    date: iso(-6),
    summary: "Lucas confirme l'appel du jour à 11h.",
  },
  {
    id: 'e-6',
    requestId: 'r-camille-identite',
    type: 'email',
    date: iso(-2),
    summary: "Camille envoie 3 inspirations qu'elle aime bien.",
  },
];

export const seedMissions: Mission[] = [
  {
    id: 'm-antoine-vitrine',
    requestId: 'r-antoine-maintenance',
    contactId: 'c-antoine-morel',
    title: 'Site vitrine - Atelier Morel',
    status: 'en_cours',
    startDate: iso(-20),
    endDate: iso(25),
    progress: 70,
    notes: "Intégration du site en cours. Attente des dernières photos.",
  },
  {
    id: 'm-lucas-refonte-mission',
    requestId: 'r-lucas-refonte',
    contactId: 'c-lucas-bernard',
    title: 'Refonte site - Bernard Conseil',
    status: 'en_cours',
    startDate: iso(-40),
    endDate: iso(45),
    progress: 45,
    notes: "Design validé. Phase d'intégration en cours.",
  },
  {
    id: 'm-camille-identite',
    requestId: 'r-camille-identite',
    contactId: 'c-camille-robert',
    title: 'Maintenance - Studio Bloom',
    status: 'en_cours',
    startDate: iso(-10),
    endDate: iso(50),
    progress: 20,
    notes: "Correctifs de sécurité appliqués.",
  },
  {
    id: 'm-jean-ancienne',
    requestId: 'r-jean-devis',
    contactId: 'c-jean-dupont',
    title: 'Dépannage informatique',
    status: 'terminee',
    startDate: iso(-180),
    endDate: iso(-170),
    progress: 100,
  },
];

/** Relances auto : demande "Solution proposée" sans prochaine action et +5j depuis dernière activité. */
export function applyRelanceRules(
  requests: Request[]
): Request[] {
  const now = clock.now().getTime();
  return requests.map((r) => {
    if (r.status !== 'solution_proposee') return r;
    if (r.nextAction) return r;
    const daysSince = Math.floor(
      (now - new Date(r.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < 5) return r;
    return {
      ...r,
      nextAction: {
        id: `auto-relance-${r.id}`,
        type: 'relance',
        label: `Relancer ${
          seedContacts.find((c) => c.id === r.contactId)?.lastName ?? ''
        } — ${r.title}`,
        dueDate: new Date(r.lastActivityAt).toISOString(),
        isOverdue: true,
        overdueDays: daysSince - 5,
      },
    };
  });
}
