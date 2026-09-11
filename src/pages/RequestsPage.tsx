import { useMemo } from 'react';
import { useAppStore } from '../store/AppStore';
import { searchContacts } from '../selectors/dashboard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { NextActionView } from '../components/ui/NextActionView';
import { EmptyState } from '../components/ui/EmptyState';
import { hydrateNextAction } from '../selectors/dashboard';
import type { Request } from '../types';
import type { OpenContactPayload } from '../App';

interface RequestsPageProps {
  onOpenContact: (payload: string | OpenContactPayload) => void;
}

function RequestRow({ r, contactName, onOpenContact }: { r: Request; contactName: string; onOpenContact: (payload: OpenContactPayload) => void }) {
  const action = hydrateNextAction(r.nextAction);
  return (
    <button
      onClick={() => { onOpenContact({ contactId: r.contactId, requestId: r.id }); }}
      className="group w-full surface p-4 text-left hover:ring-brand-violet/30 transition-all active:scale-[0.998]"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-white truncate">{r.title}</h3>
            <StatusBadge status={r.status} />
            {r.archived && <span className="chip bg-white/10 text-slate-400 ring-1 ring-white/10">Archivée</span>}
          </div>
          <p className="text-sm text-slate-400 mt-1 truncate">{contactName}</p>
        </div>
        <div className="md:w-[45%] lg:w-[40%] shrink-0">
          {action ? (
            <NextActionView action={action} variant="compact" />
          ) : (
            <p className="text-xs text-slate-500">Aucune action prévue</p>
          )}
        </div>
      </div>
    </button>
  );
}

export function RequestsPage({ onOpenContact }: RequestsPageProps) {
  const store = useAppStore();

  const list = useMemo(() => {
    const { contacts, requests } = store.data;
    const contactById = new Map(contacts.map((c) => [c.id, c]));
    const query = store.search.query.trim().toLowerCase();
    const filtered = requests.filter((r) => {
      if (!query) return true;
      const contact = contactById.get(r.contactId);
      const hay = [r.title, r.description, contact?.firstName, contact?.lastName, contact?.company]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    });
    return filtered
      .filter((r) => !r.archived)
      .concat(filtered.filter((r) => r.archived));
  }, [store.data.requests, store.data.contacts, store.search.query]);

  const contactsForSearch = useMemo(() => {
    const searchContactIds = new Set(searchContacts({
      contacts: store.data.contacts,
      requests: store.data.requests,
      query: store.search.query,
    }).map((c) => c.id));
    return list.filter((r) => searchContactIds.has(r.contactId) || !store.search.query);
  }, [list, store.search.query, store.data]);

  const items = store.search.query ? contactsForSearch : list;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-[1600px] mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight">
            Demandes
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Suivi de toutes les demandes entrantes et de leurs prochaines actions.
          </p>
        </div>
        <div className="chip bg-brand-violet/15 text-brand-violet ring-1 ring-brand-violet/25">
          {items.length} au total
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune demande trouvée"
          description="Modifiez votre recherche ou créez une demande depuis un contact."
        />
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const c = store.data.contacts.find((cc) => cc.id === r.contactId);
            const contactName = c
              ? `${c.firstName} ${c.lastName}${c.company ? ` · ${c.company}` : ''}`
              : 'Contact inconnu';
            return (
              <RequestRow
                key={r.id}
                r={r}
                contactName={contactName}
                onOpenContact={(p) => { onOpenContact(p); }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
