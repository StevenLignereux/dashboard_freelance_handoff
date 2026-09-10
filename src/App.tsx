import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ContactDrawer } from './components/contact/ContactDrawer';

import { useReducedMotion } from './hooks/useReducedMotion';

export default function App() {
  useReducedMotion();
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

  return (
    <AppShell>
      <DashboardPage
        onOpenContact={(id: string) => setActiveContactId(id)}
        activeContactId={activeContactId}
      />
      <ContactDrawer
        contactId={activeContactId}
        onClose={() => setActiveContactId(null)}
      />
    </AppShell>
  );
}
