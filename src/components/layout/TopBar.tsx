import { useEffect } from 'react';
import { useAppStore } from '../../store/AppStore';
import { currentUser } from '../../config/appConfig';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const store = useAppStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const el = document.getElementById('global-search');
        if (el) el.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 shrink-0">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center gap-3 md:gap-4 bg-bg/70 backdrop-blur-xl border-b border-white/5">
        <button
          type="button"
          className="btn-ghost md:hidden !p-2"
          onClick={onToggleSidebar}
          aria-label="Ouvrir le menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="relative flex-1 max-w-2xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            id="global-search"
            type="search"
            value={store.search.query}
            onChange={(e) => { store.search.setQuery(e.target.value); }}
            placeholder="Rechercher un contact, une entreprise, une demande…"
            className="w-full h-10 pl-10 pr-24 rounded-xl bg-bg-surface/70 border border-white/5 text-sm text-slate-200 placeholder:text-slate-500
              focus:outline-none focus:ring-2 focus:ring-brand-violet/40 focus:border-brand-violet/40
              transition-all duration-150"
            aria-label="Rechercher"
          />
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1 text-slate-500">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border border-white/10 bg-white/5">
              ⌘
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md border border-white/10 bg-white/5">
              K
            </kbd>
          </div>
        </div>

        <div className="ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-white/5 flex items-center gap-3">
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-sm font-semibold text-white">{currentUser.firstName}</div>
            <div className="text-[11px] text-slate-400">{currentUser.role}</div>
          </div>
          <div className="relative">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-violet to-brand-cyan ring-2 ring-bg-surface flex items-center justify-center font-display font-bold text-white">
              {currentUser.avatarLabel}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-green ring-2 ring-bg-surface" />
          </div>
        </div>
      </div>
    </header>
  );
}
