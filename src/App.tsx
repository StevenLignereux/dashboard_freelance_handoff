import { useCallback, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { RequestsPage } from './pages/RequestsPage';
import { MissionsPage } from './pages/MissionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ContactCardModal } from './components/contact/ContactCardModal';
import { AppStoreProvider, useAppStore } from './store/AppStore';
import { ContactCreateModal } from './components/contact/ContactCreateModal';

export interface OpenContactPayload {
  contactId: string;
  requestId?: string;
}

function DataLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement des données"
      className="flex flex-col items-center justify-center py-24 gap-3 text-slate-300"
    >
      <div className="w-8 h-8 rounded-full border-2 border-brand-violet/40 border-t-brand-violet animate-spin" aria-hidden="true" />
      <p className="text-sm">Chargement des données…</p>
    </div>
  );
}

interface DataErrorFallbackProps {
  message?: string;
  onRetry: () => void;
}

function DataErrorFallback({ message, onRetry }: DataErrorFallbackProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mx-auto mt-16 max-w-lg w-full p-5 rounded-2xl bg-bg-surface/70 border border-white/10"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-brand-coral/15 border border-brand-coral/20 flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-brand-coral">
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-semibold text-white text-base leading-tight">
            Impossible de charger les données.
          </h2>
          {message && (
            <p className="mt-1 text-xs text-slate-400">{message}</p>
          )}
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary mt-3 !py-2 !px-3.5 inline-flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            Réessayer
          </button>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const store = useAppStore();
  const [activeContact, setActiveContact] = useState<OpenContactPayload | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCloseContact = useCallback(() => {
    setActiveContact(null);
  }, []);

  const handleOpenContact = useCallback((payload: string | OpenContactPayload) => {
    if (typeof payload === 'string') {
      setActiveContact({ contactId: payload });
    } else {
      setActiveContact(payload);
    }
  }, []);

  const handleCloseCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  return (
    <AppShell>
      {store.data.loading ? (
        <DataLoadingFallback />
      ) : store.data.error ? (
        <DataErrorFallback
          message={store.data.error}
          onRetry={() => { void store.data.reload(); }}
        />
      ) : (
        <>
          {store.nav.active === 'dashboard' && (
            <DashboardPage
              onOpenContact={handleOpenContact}
              activeContactId={activeContact?.contactId ?? null}
            />
          )}
          {store.nav.active === 'contacts' && (
            <ContactsPage
              onOpenContact={handleOpenContact}
              activeContactId={activeContact?.contactId ?? null}
              onOpenCreate={handleOpenCreate}
            />
          )}
          {store.nav.active === 'requests' && (
            <RequestsPage onOpenContact={handleOpenContact} />
          )}
          {store.nav.active === 'missions' && (
            <MissionsPage onOpenContact={handleOpenContact} />
          )}
          {store.nav.active === 'settings' && <SettingsPage />}
          <ContactCardModal
            contactId={activeContact?.contactId ?? null}
            requestId={activeContact?.requestId}
            onClose={handleCloseContact}
          />
          <ContactCreateModal
            open={createOpen}
            onClose={handleCloseCreate}
          />
        </>
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <Router />
    </AppStoreProvider>
  );
}
