import type { Contact, Request } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { RelationshipBadge } from '../ui/RelationshipBadge';
import { NextActionView } from '../ui/NextActionView';
import { getInitials, pluralize, useAvatarGradient } from '../../utils/formatting';
import { statusMeta } from '../../tokens/design-tokens';
import type { OpenContactPayload } from '../../App';

interface ContactListItemProps {
  contact: Contact;
  activeRequest?: Request;
  isActive?: boolean;
  onOpen: (contactId: string | OpenContactPayload) => void;
}

export function ContactListItem({
  contact,
  activeRequest,
  isActive = false,
  onOpen,
}: ContactListItemProps) {
  const status = activeRequest?.status ?? 'sans_suite';
  const meta = statusMeta[status];
  const initials = getInitials(contact.firstName, contact.lastName);
  const gradient = useAvatarGradient(contact.avatarSeed);

  return (
    <button
      type="button"
      onClick={() => { onOpen(contact.id); }}
      aria-label={`Ouvrir la fiche de ${contact.firstName} ${contact.lastName}`}
      className={[
        'group w-full text-left p-3 sm:p-4 rounded-2xl transition-all duration-150 ease-snap',
        'bg-bg-surface border',
        meta.borderColor,
        'hover:bg-bg-surface2 hover:shadow-card active:scale-[0.99]',
        isActive ? 'ring-2 ring-offset-2 ring-offset-bg ' + meta.ringColor : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
        <div
          className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl flex items-center justify-center ring-1 ring-brand-violet/20"
          style={gradient}
        >
          <span className="font-display font-bold text-white text-base sm:text-lg">
            {initials}
          </span>
        </div>

        <div className="min-w-0 flex-1 flex flex-col 2xl:flex-row 2xl:items-start gap-3 2xl:gap-6">
          <div className="min-w-0 2xl:min-w-[220px] 2xl:flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-slate-900 text-base truncate">
                {contact.firstName} {contact.lastName}
              </h3>
              <RelationshipBadge relationship={contact.relationship} />
            </div>
            {contact.company && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {contact.company}
              </p>
            )}
          </div>

          <div className="min-w-0 2xl:min-w-[240px] 2xl:flex-1">
            {activeRequest ? (
              <div className="space-y-1.5">
                <p className="text-sm text-slate-800 truncate">
                  <span className="text-slate-400 mr-2 text-xs uppercase tracking-wide font-semibold">
                    Demande
                  </span>
                  {activeRequest.title}
                </p>
                <StatusBadge status={status} />
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Aucune demande active
              </p>
            )}
          </div>

          <div className="min-w-0 2xl:min-w-[260px] 2xl:flex-1">
            {activeRequest?.nextAction && (
              <NextActionView action={activeRequest.nextAction} variant="compact" />
            )}
          </div>

          <div className="hidden 2xl:flex shrink-0 items-center gap-4 pl-4 border-l border-brand-violet/10">
            <div className="text-right space-y-1">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Historique
              </div>
              <div className="text-xs text-slate-700 font-medium whitespace-nowrap">
                <span className="font-bold text-slate-900 tabular-nums">
                  {contact.totalRequests}
                </span>{' '}
                {pluralize(contact.totalRequests, 'demande')} ·{' '}
                <span className="font-bold text-slate-900 tabular-nums">
                  {contact.totalMissions}
                </span>{' '}
                {pluralize(contact.totalMissions, 'mission')}
              </div>
            </div>
            <span
              className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
