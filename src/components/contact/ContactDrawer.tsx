import { useEffect } from 'react';
import {
  contacts,
  exchanges,
  missions,
  requests,
} from '../../data/mockData';
import { StatusBadge } from '../ui/StatusBadge';
import { RelationshipBadge } from '../ui/RelationshipBadge';
import { NextActionView } from '../ui/NextActionView';
import { getInitials, useAvatarGradient, formatDueDate } from '../../utils/formatting';

interface ContactDrawerProps {
  contactId: string | null;
  onClose: () => void;
}

const exchangeMeta: Record<string, { label: string; color: string }> = {
  appel: { label: 'Appel', color: 'text-brand-violet bg-brand-violet/15 ring-brand-violet/25' },
  email: { label: 'Email', color: 'text-brand-cyan bg-brand-cyan/15 ring-brand-cyan/25' },
  message: { label: 'Message', color: 'text-brand-amber bg-brand-amber/15 ring-brand-amber/25' },
  rencontre: { label: 'Rencontre', color: 'text-brand-green bg-brand-green/15 ring-brand-green/25' },
  note: { label: 'Note', color: 'text-slate-400 bg-slate-500/15 ring-slate-500/25' },
};

export function ContactDrawer({ contactId, onClose }: ContactDrawerProps) {
  useEffect(() => {
    if (!contactId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [contactId, onClose]);

  const contact = contacts.find((c) => c.id === contactId);
  const contactRequests = requests.filter((r) => r.contactId === contactId && !r.archived);
  const activeRequest = contactRequests.find((r) => r.id === contact?.activeRequestId) ?? contactRequests[0];
  const contactMissions = missions.filter((m) => m.contactId === contactId);
  const relatedExchangeIds = contactRequests.map((r) => r.id);
  const contactExchanges = exchanges
    .filter((e) => relatedExchangeIds.includes(e.requestId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const isOpen = !!contact;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-snap ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={contact ? `Fiche de ${contact.firstName} ${contact.lastName}` : undefined}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:max-w-md lg:max-w-lg
          bg-bg border-l border-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)]
          transition-transform duration-300 ease-snap
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {!contact ? null : (
          <>
            <DrawerHeader contact={contact} onClose={onClose} />
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 sm:p-6 space-y-6">
                <ContactIdentity contact={contact} />
                {activeRequest && (
                  <RequestBlock request={activeRequest} />
                )}
                <StatsBlock contact={contact} />
                <MissionsBlock missions={contactMissions} />
                <ExchangesBlock exchanges={contactExchanges} />
                {contact.notes && <NotesBlock notes={contact.notes} />}
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function DrawerHeader({
  contact,
  onClose,
}: {
  contact: (typeof contacts)[number];
  onClose: () => void;
}) {
  return (
    <div className="relative shrink-0 px-5 sm:px-6 py-4 border-b border-white/5 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
          Fiche contact
        </p>
        <h2 className="font-display font-bold text-white text-lg leading-tight truncate mt-0.5">
          {contact.firstName} {contact.lastName}
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="btn-ghost !p-2 hover:bg-white/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function ContactIdentity({ contact }: { contact: (typeof contacts)[number] }) {
  const initials = getInitials(contact.firstName, contact.lastName);
  const gradient = useAvatarGradient(contact.avatarSeed);

  return (
    <section>
      <div className="flex items-start gap-4">
        <div
          className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl flex items-center justify-center ring-1 ring-white/10 shadow-card"
          style={gradient}
        >
          <div
            className="absolute inset-0 rounded-2xl opacity-30 mix-blend-overlay"
            aria-hidden="true"
            style={{
              backgroundImage:
                'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 40%)',
            }}
          />
          <span className="relative font-display font-bold text-white text-2xl sm:text-3xl tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <RelationshipBadge relationship={contact.relationship} withDot />
            {contact.archived && (
              <span className="chip bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25">
                Archivé
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Coordonnées
          </div>
          <ul className="space-y-1.5">
            {contact.email && (
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-500 shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:text-brand-violet transition-colors truncate"
                >
                  {contact.email}
                </a>
              </li>
            )}
            {contact.phone && (
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-500 shrink-0">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <a
                  href={`tel:${contact.phone}`}
                  className="hover:text-brand-violet transition-colors"
                >
                  {contact.phone}
                </a>
              </li>
            )}
            {!contact.email && !contact.phone && (
              <li className="text-xs text-slate-500 italic">
                Aucune coordonnée renseignée
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

function RequestBlock({ request }: { request: (typeof requests)[number] }) {
  return (
    <section className="space-y-3 p-4 rounded-2xl bg-white/[0.02] ring-1 ring-white/5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
          Demande active
        </p>
        <StatusBadge status={request.status} />
      </div>
      <h3 className="font-display font-semibold text-white text-lg">
        {request.title}
      </h3>
      {request.description && (
        <p className="text-sm text-slate-300 leading-relaxed">
          {request.description}
        </p>
      )}
      {request.nextAction && (
        <div className="mt-2">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
            Prochaine action
          </p>
          <NextActionView action={request.nextAction} variant="standard" />
        </div>
      )}
      <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
        <span>Créée le {formatDueDate(request.createdAt).dateLabel}</span>
      </div>
    </section>
  );
}

function StatsBlock({ contact }: { contact: (typeof contacts)[number] }) {
  return (
    <section>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-bg-surface/50 ring-1 ring-white/5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
            Demandes
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-white text-2xl tabular-nums">
              {contact.totalRequests}
            </span>
            <span className="text-xs text-slate-400">au total</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-bg-surface/50 ring-1 ring-white/5">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
            Missions
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display font-bold text-white text-2xl tabular-nums">
              {contact.totalMissions}
            </span>
            <span className="text-xs text-slate-400">réalisées</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionsBlock({ missions }: { missions: (typeof import('../../data/mockData').missions) }) {
  if (missions.length === 0) return null;
  return (
    <section>
      <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-3">
        Missions
      </h4>
      <ul className="space-y-2">
        {missions.slice(0, 4).map((m) => (
          <li
            key={m.id}
            className="p-3 rounded-xl bg-white/[0.02] ring-1 ring-white/5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-100 truncate">
                {m.title}
              </p>
              <span className="chip bg-brand-green/15 text-brand-green ring-1 ring-brand-green/25 text-[10px]">
                {m.status === 'terminee' ? 'Terminée' : m.status === 'en_cours' ? 'En cours' : m.status === 'a_demarrer' ? 'À démarrer' : 'En attente'}
              </span>
            </div>
            {typeof m.progress === 'number' && (
              <div className="mt-2.5">
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand-cyan"
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExchangesBlock({ exchanges }: { exchanges: typeof import('../../data/mockData').exchanges }) {
  return (
    <section>
      <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-3">
        Historique récent
      </h4>
      {exchanges.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-white/[0.02] ring-1 ring-white/5">
          Aucun échange enregistré
        </p>
      ) : (
        <ol className="relative border-l border-white/10 ml-2 space-y-4">
          {exchanges.map((e) => {
            const meta = exchangeMeta[e.type] ?? exchangeMeta.note;
            const { dateLabel, hour } = formatDueDate(e.date);
            return (
              <li key={e.id} className="pl-4 relative">
                <span
                  className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-2 ring-bg ${meta.color} ring`}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`chip ${meta.color} text-[10px]`}>
                    {meta.label}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {dateLabel}
                    {hour && ` · ${hour}`}
                  </span>
                </div>
                <p className="text-sm text-slate-200 mt-1 leading-relaxed">
                  {e.summary}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function NotesBlock({ notes }: { notes: string }) {
  return (
    <section>
      <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
        Notes
      </h4>
      <p className="p-3 rounded-xl bg-brand-violet/5 ring-1 ring-brand-violet/10 text-sm text-slate-200 leading-relaxed">
        {notes}
      </p>
    </section>
  );
}
