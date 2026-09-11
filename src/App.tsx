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
