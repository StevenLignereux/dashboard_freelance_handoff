import { useMemo, useState, useEffect } from 'react';
import type { ContactsViewMode, RelationshipType } from '../../types';
import { ContactCard } from './ContactCard';
import { ContactListItem } from './ContactListItem';
import { EmptyState } from '../ui/EmptyState';
import { relationshipMeta } from '../../tokens/design-tokens';
import { useAppStore, useReducedMotion } from '../../store/AppStore';
import {
  getActiveRequestForContact,
  searchContacts,
} from '../../selectors/dashboard';
import type { OpenContactPayload } from '../../App';

interface ContactsSectionProps {
  onOpenContact: (contactId: string | OpenContactPayload) => void;
  activeContactId: string | null;
  compact?: boolean;
  onOpenCreate?: () => void;
}

const RELATIONSHIP_FILTERS: { key: RelationshipType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'prospect', label: 'Premiers contacts' },
  { key: 'client', label: 'Clients' },
  { key: 'client_recurrent', label: 'Récurrents' },
  { key: 'ancien_client', label: 'Anciens' },
];

export function ContactsSection({
  onOpenContact,
  activeContactId,
  compact = false,
  onOpenCreate,
}: ContactsSectionProps) {
  const store = useAppStore();
  const [viewMode, setViewMode] = useState<ContactsViewMode>('cards');
  const [relFilter, setRelFilter] = useState<RelationshipType | 'all'>('all');
  const [localQuery, setLocalQuery] = useState('');
  const [actionOnly, setActionOnly] = useState(false);

  const globalQuery = store.search.query;
  const effectiveQuery = globalQuery || localQuery;

  const filteredContacts = useMemo(() => {
    const afterSearch = searchContacts({
      contacts: store.data.contacts,
      requests: store.data.requests,
      query: effectiveQuery,
    });
    return afterSearch.filter((c) => {
      if (c.archived) return false;
      if (relFilter !== 'all' && c.relationship !== relFilter) return false;
      if (actionOnly) {
        const req = getActiveRequestForContact({
          contactId: c.id,
          requests: store.data.requests,
        });
        if (!req?.nextAction) return false;
      }
      return true;
    });
  }, [store.data.contacts, store.data.requests, effectiveQuery, relFilter, actionOnly]);

  const hasAnyContact = useMemo(
    () => store.data.contacts.some((c) => !c.archived),
    [store.data.contacts]
  );
  const noFiltersApplied =
    relFilter === 'all' && !effectiveQuery && !actionOnly;

  useEffect(() => {
    if (globalQuery && store.nav.active === 'dashboard') {
      setRelFilter('all');
      setActionOnly(false);
    }
  }, [globalQuery, store.nav.active]);

  const headingTitle = compact ? 'Aperçu des contacts' : 'Mes contacts';
  const shown = compact ? filteredContacts.slice(0, 8) : filteredContacts;

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-display font-bold text-slate-900 text-xl sm:text-2xl leading-none">
            {headingTitle}
          </h2>
          <span className="chip bg-brand-violet/10 text-slate-700 ring-1 ring-brand-violet/20">
            {shown.length} contact{shown.length > 1 ? 's' : ''}
            {compact && filteredContacts.length > shown.length && (
              <> / {filteredContacts.length}</>
            )}
          </span>
          {relFilter !== 'all' && (
            <span className={`chip ${relationshipMeta[relFilter].chipBg}`}>
              {relationshipMeta[relFilter].label}
            </span>
          )}
          {globalQuery && (
            <span className="chip bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/25">
              Recherche : « {globalQuery} »
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!compact && (
            <div className="inline-flex items-center rounded-xl bg-bg-surface/70 ring-1 ring-brand-violet/20 p-1">
              <button
                type="button"
                onClick={() => { setViewMode('cards'); }}
                aria-pressed={viewMode === 'cards'}
                aria-label="Vue cartes"
                className={`btn-toggle ${viewMode === 'cards' ? 'btn-toggle-active' : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span className="sr-only sm:not-sr-only sm:inline">Vue cartes</span>
              </button>
              <button
                type="button"
                onClick={() => { setViewMode('list'); }}
                aria-pressed={viewMode === 'list'}
                aria-label="Vue liste"
                className={`btn-toggle ${viewMode === 'list' ? 'btn-toggle-active' : ''}`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span className="sr-only sm:not-sr-only sm:inline">Vue liste</span>
              </button>
            </div>
          )}

          {!compact && (
            <button
              type="button"
              onClick={() => { setActionOnly((v) => !v); }}
              aria-label="À action"
              className={`btn-ghost !py-1.5 !px-3 text-xs ${actionOnly
                  ? 'bg-brand-coral/10 text-brand-coral ring-1 ring-brand-coral/25'
                  : ''
                }`}
              aria-pressed={actionOnly}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="sr-only sm:not-sr-only sm:inline">À action</span>
            </button>
          )}

          {!globalQuery && !compact && (
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="search"
                value={localQuery}
                onChange={(e) => { setLocalQuery(e.target.value); }}
                placeholder="Rechercher…"
                className="h-9 w-40 sm:w-56 pl-9 pr-3 rounded-xl bg-bg-surface/70 ring-1 ring-brand-violet/20 text-sm text-slate-800 placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-brand-violet/40
                  transition-all duration-150"
                aria-label="Rechercher parmi les contacts"
              />
            </div>
          )}

          {!compact && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="btn-primary !py-2 !px-3.5 text-sm inline-flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nouveau contact
            </button>
          )}
        </div>
      </header>

      {!compact && (
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIP_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => { setRelFilter(f.key); }}
              aria-pressed={relFilter === f.key}
              className={`btn-toggle ${relFilter === f.key ? 'btn-toggle-active' : ''}`}
            >
              {f.key !== 'all' && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${relationshipMeta[f.key].dotColor
                    }`}
                  aria-hidden="true"
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Container page classeur premium */}
      <div
        className="rounded-3xl bg-bg-surface2/60 border border-brand-violet/10 shadow-card p-4 sm:p-6 lg:p-7"
      >
        {shown.length === 0 ? (
          !compact && viewMode === 'cards' && !hasAnyContact && noFiltersApplied ? (
            <div
              className="grid gap-6 sm:gap-7 grid-cols-1 justify-items-stretch"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              }}
            >
              <NewContactCard onClick={onOpenCreate} variant="hero" />
            </div>
          ) : (
            <EmptyState
              title={
                !hasAnyContact
                  ? 'Aucun contact pour le moment'
                  : 'Aucun contact trouvé'
              }
              description={
                !hasAnyContact
                  ? 'Commencez votre classeur en créant votre premier contact.'
                  : 'Modifiez vos filtres ou votre recherche pour afficher plus de résultats.'
              }
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
            />
          )
        ) : viewMode === 'cards' ? (
          <div
            className="grid gap-6 sm:gap-7 grid-cols-1"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            }}
          >
            {shown.map((c) => {
              const req = getActiveRequestForContact({
                contactId: c.id,
                requests: store.data.requests,
              });
              return (
                <ContactCard
                  key={c.id}
                  contact={c}
                  activeRequest={req}
                  isActive={activeContactId === c.id}
                  onOpen={onOpenContact}
                />
              );
            })}
            {!compact && <NewContactCard onClick={onOpenCreate} variant="inline" />}
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map((c) => {
              const req = getActiveRequestForContact({
                contactId: c.id,
                requests: store.data.requests,
              });
              return (
                <ContactListItem
                  key={c.id}
                  contact={c}
                  activeRequest={req}
                  isActive={activeContactId === c.id}
                  onOpen={onOpenContact}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

type NewContactCardVariant = 'inline' | 'hero';

function NewContactCard({
  onClick,
  variant = 'inline',
}: {
  onClick?: () => void;
  variant?: NewContactCardVariant;
}) {
  const reduced = useReducedMotion();
  const isHero = variant === 'hero';

  if (!isHero) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative aspect-[270/380] mx-auto w-full rounded-2xl
          border-2 border-dashed border-brand-violet/20 hover:border-brand-violet/40
          bg-brand-violet/5 hover:bg-brand-violet/[0.04]
          flex flex-col items-center justify-center text-center
          transition-all duration-150 ease-snap
          p-5 gap-3"
        aria-label="Ajouter un nouveau contact"
      >
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-brand-violet/10 text-slate-500 group-hover:text-brand-violet group-hover:bg-brand-violet/15 ring-1 ring-brand-violet/20 group-hover:ring-brand-violet/25 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
        <div>
          <p className="font-display font-semibold text-slate-900 text-base">
            Nouveau contact
          </p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Ajouter une personne dans ton réseau
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-[270/380] mx-auto w-full max-w-sm rounded-2xl
        overflow-hidden select-none
        border-[3px] border-brand-violet/40
        bg-bg-surface shadow-card
        hover:border-brand-violet/70 hover:shadow-card-hover
        transition-all duration-150 ease-snap"
      aria-label="Créer mon premier contact"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-80 transition-opacity duration-300"
        style={{
          padding: '1px',
          background: `linear-gradient(${reduced ? 135 : 'var(--hl-angle, 135deg)'} at ${reduced ? '30% 20%' : 'var(--hl-px, 30%)'} ${reduced ? '20%' : 'var(--hl-py, 20%)'}, rgba(124,92,255,0.55), rgba(34,211,238,0.35) 45%, rgba(255,255,255,0.08) 65%)`,
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[28%] opacity-40 group-hover:opacity-75 transition-opacity duration-400 ease-out"
        style={{
          background:
            'radial-gradient(closest-side at 50% 50%, rgba(124,92,255,0.35) 0%, rgba(34,211,238,0.18) 35%, transparent 70%)',
          filter: 'blur(18px)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
        style={{
          background:
            'radial-gradient(600px circle at var(--hl-px, 50%) var(--hl-py, 50%), rgba(255,255,255,0.08), transparent 40%)',
          mixBlendMode: 'screen',
        }}
      />

      <div
        aria-hidden="true"
        className="card-foil pointer-events-none absolute inset-0 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity"
        style={{
          backgroundPosition: reduced
            ? '50% 50%'
            : 'var(--foil-x, 50%) var(--foil-y, 50%)',
        }}
      />

      <div className="relative h-full w-full p-5 flex flex-col gap-3 min-h-0" style={{ zIndex: 2 }}>
        <div className="flex items-start justify-between gap-2 shrink-0">
          <span className="chip bg-brand-violet/15 text-brand-violet ring-1 ring-brand-violet/25 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-violet" />
            Nouveau classeur
          </span>
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{
              background: '#7C5CFF',
              boxShadow: '0 0 14px #7C5CFF, 0 0 4px #7C5CFF',
            }}
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-col items-center text-center shrink-0 min-w-0">
          <div
            className="relative w-24 h-24 rounded-3xl flex items-center justify-center ring-1 ring-brand-violet/20 shadow-card shrink-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,92,255,0.9), rgba(34,211,238,0.9))',
            }}
          >
            <div
              className="absolute inset-0 rounded-3xl opacity-50 mix-blend-overlay"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.55), transparent 45%)',
              }}
            />
            <div
              className="absolute inset-0 rounded-3xl"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><filter id=%22n%22><feTurbulence baseFrequency=%220.9%22 numOctaves=%222%22 stitchTiles=%22stitch%22/><feColorMatrix values=%220 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/></svg>")',
                mixBlendMode: 'overlay',
              }}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative w-10 h-10 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <line x1="12" y1="3" x2="12" y2="11" strokeWidth="1.5" />
              <line x1="8" y1="7" x2="16" y2="7" strokeWidth="1.5" />
            </svg>
          </div>

          <h3 className="mt-3 font-display font-bold text-slate-900 text-xl leading-tight">
            Créer mon premier contact
          </h3>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Commencez votre collection
          </p>
        </div>

        <div className="divider shrink-0" />

        <div className="space-y-2 min-h-0 flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Première carte
            </div>
            <p className="text-[14px] leading-snug font-medium text-slate-800 line-clamp-2">
              Premier contact, client ou simple rencontre : ajoutez une personne.
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-cyan/10 text-brand-cyan ring-1 ring-brand-cyan/25 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
              Carte de départ
            </span>
          </div>
        </div>

        <div className="mt-auto shrink-0 min-w-0">
          <div className="divider mb-3 shrink-0" />
          <div className="flex items-center justify-center gap-2">
            <span className="chip bg-brand-violet/10 text-slate-700 ring-1 ring-brand-violet/20 inline-flex items-center gap-1.5 px-3 py-1 text-xs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ajouter la carte
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
