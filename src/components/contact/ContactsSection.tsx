import { useMemo, useState, useEffect } from 'react';
import type { ContactsViewMode, RelationshipType } from '../../types';
import { ContactCard } from './ContactCard';
import { ContactListItem } from './ContactListItem';
import { EmptyState } from '../ui/EmptyState';
import { relationshipMeta } from '../../tokens/design-tokens';
import { useAppStore } from '../../store/AppStore';
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
  { key: 'prospect', label: 'Prospects' },
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
          <h2 className="font-display font-bold text-white text-xl sm:text-2xl leading-none">
            {headingTitle}
          </h2>
          <span className="chip bg-white/5 text-slate-300 ring-1 ring-white/10">
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
            <div className="inline-flex items-center rounded-xl bg-bg-surface/70 ring-1 ring-white/10 p-1">
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
              className={`btn-ghost !py-1.5 !px-3 text-xs ${
                actionOnly
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
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
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
                className="h-9 w-40 sm:w-56 pl-9 pr-3 rounded-xl bg-bg-surface/70 ring-1 ring-white/10 text-sm text-slate-200 placeholder:text-slate-500
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
                  className={`w-1.5 h-1.5 rounded-full ${
                    relationshipMeta[f.key].dotColor
                  }`}
                  aria-hidden="true"
                />
              )}
              {f.label}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState
          title="Aucun contact trouvé"
          description="Modifiez vos filtres ou votre recherche pour afficher plus de résultats."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />
      ) : viewMode === 'cards' ? (
        <div
          className="grid gap-5 sm:gap-6 grid-cols-1"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
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
          {!compact && <NewContactCard onClick={onOpenCreate} />}
        </div>
      ) : (
        <div className="space-y-2.5">
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
    </section>
  );
}

function NewContactCard({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-[270/380] mx-auto w-full rounded-2xl
        border-2 border-dashed border-white/10 hover:border-brand-violet/40
        bg-white/[0.02] hover:bg-brand-violet/[0.04]
        flex flex-col items-center justify-center text-center
        transition-all duration-150 ease-snap
        p-5 gap-3"
      aria-label="Ajouter un nouveau contact"
    >
      <span className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 text-slate-400 group-hover:text-brand-violet group-hover:bg-brand-violet/15 ring-1 ring-white/10 group-hover:ring-brand-violet/25 transition-all">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </span>
      <div>
        <p className="font-display font-semibold text-white text-base">
          Nouveau contact
        </p>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Ajouter une personne dans ton réseau
        </p>
      </div>
    </button>
  );
}
