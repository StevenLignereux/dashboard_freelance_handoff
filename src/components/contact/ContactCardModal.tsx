import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore, useReducedMotion } from '../../store/AppStore';
import { StatusBadge } from '../ui/StatusBadge';
import { RelationshipBadge } from '../ui/RelationshipBadge';
import { NextActionView } from '../ui/NextActionView';
import { formatDueDate, pluralize } from '../../utils/formatting';
import {
  getActiveRequestForContact,
  getExchangesForContact,
  getMissionsForContact,
  hydrateNextAction,
} from '../../selectors/dashboard';
import type { Contact, Exchange, Mission, Request } from '../../types';
import { TradingCard } from './TradingCard';

interface ContactCardModalProps {
  contactId: string | null;
  requestId?: string | null | undefined;
  onClose: () => void;
}

const exchangeMeta: Record<string, { label: string; color: string }> = {
  appel: { label: 'Appel', color: 'text-brand-violet bg-brand-violet/15 ring-brand-violet/25' },
  email: { label: 'Email', color: 'text-brand-cyan bg-brand-cyan/15 ring-brand-cyan/25' },
  message: { label: 'Message', color: 'text-brand-amber bg-brand-amber/15 ring-brand-amber/25' },
  rencontre: { label: 'Rencontre', color: 'text-brand-green bg-brand-green/15 ring-brand-green/25' },
  note: { label: 'Note', color: 'text-slate-400 bg-slate-500/15 ring-slate-500/25' },
};

function getFocusable(root: HTMLElement): HTMLElement[] {
  const sel = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

export function ContactCardModal({ contactId, requestId, onClose }: ContactCardModalProps) {
  const store = useAppStore();
  const reduced = useReducedMotion();
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyInert = useRef<Element[]>([]);

  const contact = store.data.contacts.find((c) => c.id === contactId) ?? null;
  const activeRequest: Request | undefined = contact
    ? (requestId
        ? store.data.requests.find((r) => r.id === requestId)
        : getActiveRequestForContact({
            contactId: contact.id,
            requests: store.data.requests,
          }))
    : undefined;
  const contactMissions: Mission[] = contact
    ? getMissionsForContact({ contactId: contact.id, missions: store.data.missions })
    : [];
  const contactExchanges: Exchange[] = contact
    ? getExchangesForContact({
        contactId: contact.id,
        requests: store.data.requests,
        exchanges: store.data.exchanges,
      })
    : [];

  const nextActionHydrated = hydrateNextAction(activeRequest?.nextAction);

  const isOpen = !!contact;

  useEffect(() => {
    if (!isOpen) return;
    lastFocusedRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const roots: Element[] = [];
    document.querySelectorAll<HTMLElement>('body > *').forEach((el) => {
      if (el.contains(panelRef.current)) return;
      const attr = el.getAttribute('aria-hidden');
      if (attr !== 'true' && el.getAttribute('inert') === null) {
        el.setAttribute('data-inert-saved', '1');
        el.setAttribute('aria-hidden', 'true');
        el.inert = true;
        roots.push(el);
      }
    });
    previouslyInert.current = roots;

    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      const focusables = panelRef.current ? getFocusable(panelRef.current) : [];
      const first = focusables.find((e) => e.dataset.focusInit !== undefined) ?? focusables[0];
      first.focus({ preventScroll: true });
    }, 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = getFocusable(panelRef.current).filter(
        (f) => f.offsetParent !== null || f.tagName === 'INPUT' || f.tagName === 'A'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyInert.current.forEach((el) => {
        el.removeAttribute('data-inert-saved');
        el.removeAttribute('aria-hidden');
        (el as HTMLElement).inert = false;
      });
      previouslyInert.current = [];
      if (lastFocusedRef.current) {
        lastFocusedRef.current.focus({ preventScroll: true });
      }
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyCmdK = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKeyCmdK, true);
    return () => { window.removeEventListener('keydown', onKeyCmdK, true); };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {contact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <motion.div
            key={`backdrop-${contact.id}`}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.3 }}
            aria-hidden="true"
          />

          <motion.aside
            key={`panel-${contact.id}`}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Fiche de ${contact.firstName} ${contact.lastName}`}
            tabIndex={-1}
            className="relative z-10 w-full max-w-[920px] lg:max-w-[950px] max-h-[94vh]
              bg-bg-surface/90 backdrop-blur-xl rounded-3xl
              ring-1 ring-white/10 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.9),0_20px_60px_-10px_rgba(124,92,255,0.2)]
              overflow-hidden
              md:inset-auto
              md:h-[min(820px,90vh)]
              lg:h-[min(860px,90vh)]
              flex flex-col
              lg:flex-row
            "
            initial={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(1000px 400px at -10% -10%, rgba(124,92,255,0.18), transparent 60%), radial-gradient(1000px 400px at 110% 110%, rgba(34,211,238,0.12), transparent 60%)',
              }}
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              data-focus-init
              className="absolute top-3 right-3 z-20 btn-ghost !p-2 rounded-xl bg-black/30 hover:bg-black/60 ring-1 ring-white/10 backdrop-blur"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="relative z-10 w-full lg:w-[410px] shrink-0 p-4 sm:p-5 lg:p-5 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: [
                    'radial-gradient(600px 420px at 50% 20%, rgba(124,92,255,0.16), transparent 55%)',
                    'radial-gradient(500px 380px at 50% 100%, rgba(34,211,238,0.10), transparent 55%)',
                  ].join(','),
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><filter id=%22n%22><feTurbulence baseFrequency=%220.85%22 numOctaves=%222%22 stitchTiles=%22stitch%22/><feColorMatrix values=%220 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 lg:inset-x-5 top-1/2 -translate-y-1/2 h-[86%] rounded-[2rem] transition-all"
                style={{
                  background:
                    'radial-gradient(closest-side at 50% 50%, rgba(255,255,255,0.06), rgba(255,255,255,0.00) 70%)',
                  filter: 'blur(0.5px)',
                }}
              />
              <div className="relative z-10 w-full max-w-[350px] mx-auto drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]">
                <TradingCard
                  layoutId={`card-${contact.id}`}
                  contact={contact}
                  activeRequest={activeRequest}
                  size="lg"
                  staticMode
                />
              </div>
            </div>

            <div className="relative z-10 flex-1 min-h-0 overflow-y-auto">
              <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                <ModalHeader contact={contact} />
                <ContactIdentity contact={contact} />
                {activeRequest && (
                  <RequestBlock
                    request={{
                      ...activeRequest,
                      nextAction: nextActionHydrated,
                    }}
                    isActive={!requestId}
                  />
                )}
                <StatsBlock contact={contact} />
                <MissionsBlock missions={contactMissions} />
                <ExchangesBlock exchanges={contactExchanges.slice(0, 6)} />
                {contact.notes && <NotesBlock notes={contact.notes} />}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function ModalHeader({ contact }: { contact: Contact }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-brand-violet/90">
          Fiche contact
        </p>
        <h2 className="font-display font-bold text-white text-2xl leading-tight mt-1">
          {contact.firstName} {contact.lastName}
        </h2>
        {contact.company && (
          <p className="text-sm text-slate-400 mt-0.5">{contact.company}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RelationshipBadge relationship={contact.relationship} withDot />
        {contact.archived && (
          <span className="chip bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25">
            Archivé
          </span>
        )}
      </div>
    </div>
  );
}

function ContactIdentity({ contact }: { contact: Contact }) {
  return (
    <section className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] ring-1 ring-white/5">
      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-3">
        Coordonnées
      </div>
      <ul className="grid sm:grid-cols-2 gap-2.5">
        {contact.email && (
          <li className="flex items-center gap-2.5 text-sm text-slate-300">
            <span className="w-8 h-8 rounded-xl bg-brand-cyan/10 ring-1 ring-brand-cyan/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-brand-cyan">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <a
              href={`mailto:${contact.email}`}
              className="hover:text-brand-violet transition-colors truncate min-w-0"
            >
              {contact.email}
            </a>
          </li>
        )}
        {contact.phone && (
          <li className="flex items-center gap-2.5 text-sm text-slate-300">
            <span className="w-8 h-8 rounded-xl bg-brand-violet/10 ring-1 ring-brand-violet/20 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-brand-violet">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <a
              href={`tel:${contact.phone}`}
              className="hover:text-brand-violet transition-colors"
            >
              {contact.phone}
            </a>
          </li>
        )}
        {!contact.email && !contact.phone && (
          <li className="text-xs text-slate-500 italic col-span-2">
            Aucune coordonnée renseignée
          </li>
        )}
      </ul>
    </section>
  );
}

function RequestBlock({ request, isActive = true }: { request: Request; isActive?: boolean }) {
  return (
    <section className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white/[0.02] ring-1 ring-white/5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
          {isActive ? 'Demande active' : 'Demande'}
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
        <div>
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

function StatsBlock({ contact }: { contact: Contact }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      <div className="p-4 rounded-2xl bg-bg-surface/60 ring-1 ring-white/5">
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
      <div className="p-4 rounded-2xl bg-bg-surface/60 ring-1 ring-white/5">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">
          Missions
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-display font-bold text-white text-2xl tabular-nums">
            {contact.totalMissions}
          </span>
          <span className="text-xs text-slate-400">
            {pluralize(contact.totalMissions, 'réalisée', 'réalisées')}
          </span>
        </div>
      </div>
    </section>
  );
}

function MissionsBlock({ missions }: { missions: Mission[] }) {
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

function ExchangesBlock({ exchanges }: { exchanges: Exchange[] }) {
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
                  className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-2 ring-bg ${meta.color}`}
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
