import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { RequestsPage } from './pages/RequestsPage';
import { MissionsPage } from './pages/MissionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ContactDrawer } from './components/contact/ContactDrawer';
import { AppStoreProvider, useAppStore } from './store/AppStore';
import { ContactCreateModal } from './components/contact/ContactCreateModal';

function Router() {
  const store = useAppStore();
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <AppShell>
      {store.nav.active === 'dashboard' && (
        <DashboardPage
          onOpenContact={setActiveContactId}
          activeContactId={activeContactId}
        />
      )}
      {store.nav.active === 'contacts' && (
        <ContactsPage
          onOpenContact={setActiveContactId}
          activeContactId={activeContactId}
        />
      )}
      {store.nav.active === 'requests' && (
        <RequestsPage onOpenContact={setActiveContactId} />
      )}
      {store.nav.active === 'missions' && (
        <MissionsPage onOpenContact={setActiveContactId} />
      )}
      {store.nav.active === 'settings' && <SettingsPage />}
      <ContactDrawer
        contactId={activeContactId}
        onClose={() => { setActiveContactId(null); }}
      />
      <ContactCreateModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); }}
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
