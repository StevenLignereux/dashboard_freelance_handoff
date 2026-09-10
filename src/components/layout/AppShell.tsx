import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '../../store/AppStore';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const store = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-full flex bg-bg text-slate-100">
      <Sidebar
        activeNav={store.nav.active}
        onNavigate={store.nav.setActive}
        mobileOpen={mobileOpen}
        onCloseMobile={() => { setMobileOpen(false); }}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onToggleSidebar={() => { setMobileOpen((v) => !v); }} />
        <main key={store.nav.active} className="flex-1 min-w-0 animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}
