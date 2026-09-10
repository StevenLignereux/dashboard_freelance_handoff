import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { NavItemKey } from '../../types';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [activeNav, setActiveNav] = useState<NavItemKey>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-full flex bg-bg text-slate-100">
      <Sidebar
        activeNav={activeNav}
        onNavigate={setActiveNav}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onToggleSidebar={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 min-w-0 animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}
