import type { RequestStatus, RelationshipType } from '../types';

export const designTokens = {
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  },
  motion: {
    micro: '150ms',
    action: '300ms',
    celebration: '650ms',
    ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  spacing: {
    cardTiltMax: 3,
  },
} as const;

export const statusMeta: Record<
  RequestStatus,
  {
    label: string;
    color: string;
    textColor: string;
    chipBg: string;
    borderColor: string;
    ringColor: string;
    iconHint: string;
  }
> = {
  nouveau: {
    label: 'Nouveau',
    color: '#22D3EE',
    textColor: 'text-status-nouveau',
    chipBg: 'bg-status-nouveau/10 text-status-nouveau ring-1 ring-status-nouveau/25',
    borderColor: 'border-status-nouveau/40',
    ringColor: 'ring-status-nouveau/30',
    iconHint: '●',
  },
  a_comprendre: {
    label: 'À comprendre',
    color: '#60A5FA',
    textColor: 'text-brand-blue',
    chipBg: 'bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/25',
    borderColor: 'border-brand-blue/40',
    ringColor: 'ring-brand-blue/30',
    iconHint: '?',
  },
  echange_prevu: {
    label: 'Échange prévu',
    color: '#7C5CFF',
    textColor: 'text-brand-violet',
    chipBg:
      'bg-brand-violet/10 text-brand-violet ring-1 ring-brand-violet/25',
    borderColor: 'border-brand-violet/40',
    ringColor: 'ring-brand-violet/30',
    iconHint: '↔',
  },
  solution_proposee: {
    label: 'Solution proposée',
    color: '#FBBF24',
    textColor: 'text-brand-amber',
    chipBg: 'bg-brand-amber/10 text-brand-amber ring-1 ring-brand-amber/25',
    borderColor: 'border-brand-amber/40',
    ringColor: 'ring-brand-amber/30',
    iconHint: '✓',
  },
  en_attente: {
    label: 'En attente',
    color: '#FB923C',
    textColor: 'text-brand-orange',
    chipBg: 'bg-brand-orange/10 text-brand-orange ring-1 ring-brand-orange/25',
    borderColor: 'border-brand-orange/40',
    ringColor: 'ring-brand-orange/30',
    iconHint: '…',
  },
  mission_confirmee: {
    label: 'Mission confirmée',
    color: '#34D399',
    textColor: 'text-brand-green',
    chipBg: 'bg-brand-green/10 text-brand-green ring-1 ring-brand-green/25',
    borderColor: 'border-brand-green/40',
    ringColor: 'ring-brand-green/30',
    iconHint: '★',
  },
  sans_suite: {
    label: 'Sans suite',
    color: '#64748B',
    textColor: 'text-brand-slate',
    chipBg:
      'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/25',
    borderColor: 'border-slate-500/40',
    ringColor: 'ring-slate-500/30',
    iconHint: '—',
  },
};

export const relationshipMeta: Record<
  RelationshipType,
  { label: string; chipBg: string; dotColor: string }
> = {
  prospect: {
    label: 'Prospect',
    chipBg:
      'bg-brand-violet/15 text-brand-violet ring-1 ring-brand-violet/30',
    dotColor: 'bg-brand-violet',
  },
  client: {
    label: 'Client',
    chipBg: 'bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/30',
    dotColor: 'bg-brand-cyan',
  },
  client_recurrent: {
    label: 'Client récurrent',
    chipBg:
      'bg-brand-green/15 text-brand-green ring-1 ring-brand-green/30',
    dotColor: 'bg-brand-green',
  },
  ancien_client: {
    label: 'Ancien client',
    chipBg:
      'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
    dotColor: 'bg-brand-amber',
  },
};

export const nextActionLabels: Record<string, string> = {
  relance: 'Relancer',
  proposition: 'Envoyer la proposition',
  appel: 'Appeler',
  devis: 'Préparer un devis',
  documents: 'Demander des documents',
  precision: 'Demander une précision',
  echange: 'Organiser un échange',
  autre: 'Action',
};
