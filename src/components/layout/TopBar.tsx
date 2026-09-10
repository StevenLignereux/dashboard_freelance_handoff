interface TopBarProps {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
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
            type="search"
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

        <div className="flex items-center gap-1 sm:gap-2">
          <button className="btn-ghost !p-2" aria-label="Basculer le thème">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </button>

          <button className="relative btn-ghost !p-2" aria-label="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-coral shadow-[0_0_10px_rgba(255,122,89,0.8)]" />
          </button>

          <div className="ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-white/5 flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-sm font-semibold text-white">Manon</div>
              <div className="text-[11px] text-slate-400">Freelance Web</div>
            </div>
            <div className="relative">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-violet to-brand-cyan ring-2 ring-bg-surface flex items-center justify-center font-display font-bold text-white">
                M
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-green ring-2 ring-bg-surface" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
