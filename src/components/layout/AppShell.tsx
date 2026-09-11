import { useState, type ReactNode, useRef, useCallback, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '../../store/AppStore';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const store = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleToggleSidebar = useCallback(() => {
    setMobileOpen((v) => !v);
  }, []);

  const handleCloseMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseMobile();
        window.setTimeout(() => {
          menuButtonRef.current?.focus({ preventScroll: true });
        }, 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [mobileOpen, handleCloseMobile]);

  return (
    <div className="min-h-full flex bg-bg text-slate-100">
      <Sidebar
        activeNav={store.nav.active}
        onNavigate={store.nav.setActive}
        mobileOpen={mobileOpen}
        onCloseMobile={handleCloseMobile}
        lastMenuFocusRef={menuButtonRef}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onToggleSidebar={handleToggleSidebar} menuButtonRef={menuButtonRef} />
        <main key={store.nav.active} className="flex-1 min-w-0 animate-fadeIn">{children}</main>
      </div>
    </div>
  );
}
